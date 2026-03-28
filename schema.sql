-- ============================================================
--  StudyBuddy — Supabase / PostgreSQL Database Schema
--
--  Run this in the Supabase SQL editor or via psql to set up
--  the complete database schema, including:
--    • Tables with appropriate column types and constraints
--    • Row Level Security (RLS) policies
--    • Indexes for performance
--    • Triggers for automatic progress tracking
--    • Comments explaining the purpose of each table
--
--  Requires: Supabase project with auth.users table (standard).
-- ============================================================

-- Enable the pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
--  1. PROFILES
--  Stores child/parent profile information.
--  Each profile links to a Supabase auth user.
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  age            INTEGER NOT NULL CHECK (age >= 5 AND age <= 18),
  year_group     TEXT NOT NULL,
  display_name   TEXT,
  is_parent      BOOLEAN NOT NULL DEFAULT FALSE,
  -- Parent profiles can manage child profiles
  parent_id      UUID REFERENCES profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE profiles IS
  'Stores user profile data for both children and their parents/carers. '
  'Each row corresponds to one Supabase auth user. The is_parent flag '
  'distinguishes parent accounts from child accounts.';

COMMENT ON COLUMN profiles.age IS 'Age in years (5–18). Used to adapt AI language complexity.';
COMMENT ON COLUMN profiles.year_group IS 'UK year group, e.g. Y1-2, Y3-4, Y5-6, Y7-8, Y9-11 / GCSE.';
COMMENT ON COLUMN profiles.is_parent IS 'TRUE if this is a parent/carer account managing child profiles.';
COMMENT ON COLUMN profiles.parent_id IS 'Optional FK to the parent profile that manages this child profile.';

-- Index for quick lookup of a user's profile
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
-- Index for parent → children relationship
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON profiles(parent_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
--  2. SESSIONS
--  Represents one study session (start of chat to end).
--  A session belongs to one profile and covers one subject.
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject       TEXT NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  -- Duration in seconds, computed on session end
  duration_secs INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN ended_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
      ELSE NULL
    END
  ) STORED
);

COMMENT ON TABLE sessions IS
  'Records each homework help session. A session starts when the child '
  'sends their first message and ends when they close the chat or the '
  'session times out. Useful for analytics and progress dashboards.';

COMMENT ON COLUMN sessions.subject IS 'The subject studied in this session, e.g. Maths, English, Science.';
COMMENT ON COLUMN sessions.ended_at IS 'NULL while the session is active; set when the session ends.';
COMMENT ON COLUMN sessions.duration_secs IS 'Auto-computed session length in seconds once ended_at is set.';

-- Index for fetching all sessions by a profile
CREATE INDEX IF NOT EXISTS idx_sessions_profile_id ON sessions(profile_id);
-- Index for filtering by subject
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON sessions(subject);
-- Index for time-range queries
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);

-- ============================================================
--  3. MESSAGES
--  Stores every chat message in a session.
--  role is 'user' (child) or 'assistant' (StudyBuddy AI).
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- flagged is set to TRUE if the safety filter triggered on this message
  flagged      BOOLEAN NOT NULL DEFAULT FALSE,
  -- Optional: store which safety category triggered the flag
  flag_reason  TEXT
);

COMMENT ON TABLE messages IS
  'Stores every message exchanged in a session. Both the child''s questions '
  '(role = user) and StudyBuddy''s responses (role = assistant) are stored. '
  'The flagged column records whether the safety filter was triggered.';

COMMENT ON COLUMN messages.role IS '''user'' for the child''s messages; ''assistant'' for AI responses.';
COMMENT ON COLUMN messages.flagged IS 'TRUE if the safety filter blocked or redirected this message.';
COMMENT ON COLUMN messages.flag_reason IS 'The safety category that triggered the flag, e.g. cheating, adult_sexual.';

-- Index for fetching all messages in a session (ordered by time)
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
-- Index for time-based pagination
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
-- Index to quickly find flagged messages for moderation
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(flagged) WHERE flagged = TRUE;

-- ============================================================
--  4. PROGRESS
--  Aggregated subject progress per profile.
--  Automatically updated by a trigger when messages are inserted.
-- ============================================================

CREATE TABLE IF NOT EXISTS progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject          TEXT NOT NULL,
  questions_count  INTEGER NOT NULL DEFAULT 0,
  last_active      TIMESTAMPTZ,
  -- Ensure one row per profile+subject combination
  UNIQUE (profile_id, subject)
);

COMMENT ON TABLE progress IS
  'Tracks how many questions each child has asked per subject, and when they '
  'were last active. Automatically maintained by a database trigger — do not '
  'update this table directly in application code.';

COMMENT ON COLUMN progress.questions_count IS 'Total number of user messages (questions) sent in this subject.';
COMMENT ON COLUMN progress.last_active IS 'Timestamp of the most recent user message for this subject.';

-- Index for fetching all subjects for a profile
CREATE INDEX IF NOT EXISTS idx_progress_profile_id ON progress(profile_id);
-- Index for leaderboard / top-subjects queries
CREATE INDEX IF NOT EXISTS idx_progress_questions_count ON progress(questions_count DESC);

-- ────────────────────────────────────────────────────────────
--  Trigger: auto-update progress when a user message is inserted
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_progress_on_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_profile_id UUID;
  v_subject    TEXT;
BEGIN
  -- Only act on user messages (not assistant responses)
  IF NEW.role <> 'user' THEN
    RETURN NEW;
  END IF;

  -- Fetch the profile_id and subject from the session
  SELECT s.profile_id, s.subject
    INTO v_profile_id, v_subject
    FROM sessions s
   WHERE s.id = NEW.session_id;

  -- Upsert the progress row
  INSERT INTO progress (profile_id, subject, questions_count, last_active)
  VALUES (v_profile_id, v_subject, 1, NOW())
  ON CONFLICT (profile_id, subject)
  DO UPDATE SET
    questions_count = progress.questions_count + 1,
    last_active     = NOW();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_progress_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION fn_update_progress_on_message();

-- ============================================================
--  5. QUIZ_ATTEMPTS
--  Records each quiz attempt a child makes, with score.
-- ============================================================

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  score        INTEGER NOT NULL CHECK (score >= 0),
  total        INTEGER NOT NULL CHECK (total > 0),
  -- Percentage is a virtual column for convenience
  percentage   NUMERIC(5, 2) GENERATED ALWAYS AS (
    (score::NUMERIC / total::NUMERIC) * 100
  ) STORED,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE quiz_attempts IS
  'Records each quiz or self-test attempt a child completes. '
  'Tracks score out of total to measure progress over time and '
  'identify subjects where the child needs more support.';

COMMENT ON COLUMN quiz_attempts.score IS 'Number of correct answers.';
COMMENT ON COLUMN quiz_attempts.total IS 'Total number of questions in the quiz.';
COMMENT ON COLUMN quiz_attempts.percentage IS 'Auto-computed score percentage (0.00–100.00).';

-- Index for fetching all attempts by a profile
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_profile_id ON quiz_attempts(profile_id);
-- Index for subject-level analytics
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_subject ON quiz_attempts(subject);
-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_attempted_at ON quiz_attempts(attempted_at DESC);

-- ============================================================
--  6. REMINDERS
--  Stores daily study reminder settings per profile.
-- ============================================================

CREATE TABLE IF NOT EXISTS reminders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_time  TIME NOT NULL,
  -- days_of_week: array of day abbreviations, e.g. {'Mon','Tue','Wed','Thu','Fri'}
  days_of_week   TEXT[] NOT NULL DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One reminder row per profile (can be extended to multiple if needed)
  UNIQUE (profile_id)
);

COMMENT ON TABLE reminders IS
  'Stores study reminder preferences for each profile. A parent or child can '
  'set a daily reminder time and which days of the week the reminder should fire. '
  'The enabled flag allows toggling without deleting the row.';

COMMENT ON COLUMN reminders.reminder_time IS 'Time of day for the reminder in the user''s local timezone (stored as UTC TIME).';
COMMENT ON COLUMN reminders.days_of_week IS 'Array of day abbreviations: Mon, Tue, Wed, Thu, Fri, Sat, Sun.';
COMMENT ON COLUMN reminders.enabled IS 'If FALSE, the reminder is paused but settings are preserved.';

-- Index for fetching reminder by profile
CREATE INDEX IF NOT EXISTS idx_reminders_profile_id ON reminders(profile_id);
-- Index for the reminder scheduler (find all enabled reminders at a given time)
CREATE INDEX IF NOT EXISTS idx_reminders_time_enabled ON reminders(reminder_time) WHERE enabled = TRUE;

-- Auto-update updated_at
CREATE TRIGGER trg_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
--
--  We use Supabase Auth. The authenticated user's UUID is
--  available via auth.uid(). Each child/user can only access
--  their own data. Parents can also access their children's data.
-- ============================================================

-- ── Enable RLS on all tables ─────────────────────────────────

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders      ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
--  PROFILES policies
-- ────────────────────────────────────────────────────────────

-- A user can read their own profile
CREATE POLICY "profiles: own read"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

-- A parent can read their children's profiles
CREATE POLICY "profiles: parent reads children"
  ON profiles FOR SELECT
  USING (
    parent_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- A user can insert their own profile
CREATE POLICY "profiles: own insert"
  ON profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- A user can update their own profile
CREATE POLICY "profiles: own update"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- A user can delete their own profile
CREATE POLICY "profiles: own delete"
  ON profiles FOR DELETE
  USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
--  SESSIONS policies
-- ────────────────────────────────────────────────────────────

-- A user can read sessions belonging to their profile
CREATE POLICY "sessions: own read"
  ON sessions FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- A parent can read their children's sessions
CREATE POLICY "sessions: parent reads children"
  ON sessions FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles
       WHERE parent_id IN (
         SELECT id FROM profiles WHERE user_id = auth.uid()
       )
    )
  );

-- A user can insert sessions for their own profile
CREATE POLICY "sessions: own insert"
  ON sessions FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- A user can update their own sessions (e.g. set ended_at)
CREATE POLICY "sessions: own update"
  ON sessions FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- A user can delete their own sessions
CREATE POLICY "sessions: own delete"
  ON sessions FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
--  MESSAGES policies
-- ────────────────────────────────────────────────────────────

-- A user can read messages from their own sessions
CREATE POLICY "messages: own read"
  ON messages FOR SELECT
  USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN profiles p ON p.id = s.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- A parent can read messages from their children's sessions
CREATE POLICY "messages: parent reads children"
  ON messages FOR SELECT
  USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN profiles child_p ON child_p.id = s.profile_id
      JOIN profiles parent_p ON parent_p.id = child_p.parent_id
      WHERE parent_p.user_id = auth.uid()
    )
  );

-- A user can insert messages into their own sessions
CREATE POLICY "messages: own insert"
  ON messages FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN profiles p ON p.id = s.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Users cannot update or delete messages (immutable history)
-- (No UPDATE or DELETE policies — operations will be denied)

-- ────────────────────────────────────────────────────────────
--  PROGRESS policies
-- ────────────────────────────────────────────────────────────

-- A user can read their own progress
CREATE POLICY "progress: own read"
  ON progress FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- A parent can read their children's progress
CREATE POLICY "progress: parent reads children"
  ON progress FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles
       WHERE parent_id IN (
         SELECT id FROM profiles WHERE user_id = auth.uid()
       )
    )
  );

-- Progress rows are managed by the trigger, not directly by users.
-- Allow the trigger (running as the authenticated user) to insert/update.
CREATE POLICY "progress: own insert"
  ON progress FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "progress: own update"
  ON progress FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
--  QUIZ_ATTEMPTS policies
-- ────────────────────────────────────────────────────────────

-- A user can read their own quiz attempts
CREATE POLICY "quiz_attempts: own read"
  ON quiz_attempts FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- A parent can read their children's quiz attempts
CREATE POLICY "quiz_attempts: parent reads children"
  ON quiz_attempts FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles
       WHERE parent_id IN (
         SELECT id FROM profiles WHERE user_id = auth.uid()
       )
    )
  );

-- A user can insert their own quiz attempts
CREATE POLICY "quiz_attempts: own insert"
  ON quiz_attempts FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Quiz attempts are immutable once recorded
-- (No UPDATE or DELETE policies)

-- ────────────────────────────────────────────────────────────
--  REMINDERS policies
-- ────────────────────────────────────────────────────────────

-- A user can read their own reminders
CREATE POLICY "reminders: own read"
  ON reminders FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- A parent can read their children's reminders
CREATE POLICY "reminders: parent reads children"
  ON reminders FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles
       WHERE parent_id IN (
         SELECT id FROM profiles WHERE user_id = auth.uid()
       )
    )
  );

-- A user can insert their own reminder
CREATE POLICY "reminders: own insert"
  ON reminders FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- A user can update their own reminder
CREATE POLICY "reminders: own update"
  ON reminders FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- A user can delete their own reminder
CREATE POLICY "reminders: own delete"
  ON reminders FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================
--  HELPER VIEWS (read-only, no RLS needed as they inherit)
-- ============================================================

-- View: session summary with message counts
CREATE OR REPLACE VIEW v_session_summary AS
SELECT
  s.id           AS session_id,
  s.profile_id,
  s.subject,
  s.started_at,
  s.ended_at,
  s.duration_secs,
  COUNT(m.id)                                               AS total_messages,
  COUNT(m.id) FILTER (WHERE m.role = 'user')                AS user_messages,
  COUNT(m.id) FILTER (WHERE m.role = 'assistant')           AS assistant_messages,
  COUNT(m.id) FILTER (WHERE m.flagged = TRUE)               AS flagged_messages
FROM sessions s
LEFT JOIN messages m ON m.session_id = s.id
GROUP BY s.id, s.profile_id, s.subject, s.started_at, s.ended_at, s.duration_secs;

COMMENT ON VIEW v_session_summary IS
  'Convenient read-only view of sessions with aggregated message counts. '
  'Inherits RLS from the underlying sessions and messages tables.';

-- View: subject progress leaderboard per profile
CREATE OR REPLACE VIEW v_subject_leaderboard AS
SELECT
  pr.profile_id,
  pr.subject,
  pr.questions_count,
  pr.last_active,
  RANK() OVER (
    PARTITION BY pr.profile_id
    ORDER BY pr.questions_count DESC
  ) AS rank_within_profile
FROM progress pr;

COMMENT ON VIEW v_subject_leaderboard IS
  'Ranks subjects by questions asked per profile. Useful for showing '
  'a child their most-practised subjects.';

-- ============================================================
--  SAMPLE DATA (commented out — uncomment for local testing)
-- ============================================================

/*
-- Insert a test parent profile (requires a corresponding auth.users row)
INSERT INTO profiles (user_id, age, year_group, display_name, is_parent)
VALUES ('00000000-0000-0000-0000-000000000001', 35, 'N/A', 'Test Parent', TRUE);

-- Insert a test child profile linked to the parent
INSERT INTO profiles (user_id, age, year_group, display_name, is_parent, parent_id)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  10,
  'Y5-6',
  'Test Child',
  FALSE,
  (SELECT id FROM profiles WHERE display_name = 'Test Parent' LIMIT 1)
);

-- Insert a test session
INSERT INTO sessions (profile_id, subject)
VALUES (
  (SELECT id FROM profiles WHERE display_name = 'Test Child' LIMIT 1),
  'Maths'
);

-- Insert a test message (will trigger progress update)
INSERT INTO messages (session_id, role, content)
VALUES (
  (SELECT id FROM sessions WHERE subject = 'Maths' LIMIT 1),
  'user',
  'Can you help me with long division?'
);
*/
