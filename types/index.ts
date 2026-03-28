// ============================================================
//  StudyBuddy — TypeScript Type Definitions
// ============================================================

// ============================================================
//  Subject Enum
// ============================================================

export enum Subject {
  Maths = 'Maths',
  English = 'English',
  Spanish = 'Spanish',
  Science = 'Science',
  History = 'History',
  Geography = 'Geography',
  Coding = 'Coding',
  General = 'General',
}

// ============================================================
//  Message
// ============================================================

export interface Message {
  /** Unique identifier for this message (UUID or timestamp-based string) */
  id: string;
  /** Who sent the message */
  role: 'user' | 'assistant';
  /** The text content of the message */
  content: string;
  /** ISO 8601 timestamp of when the message was created */
  timestamp: string;
}

// ============================================================
//  Student Profile
// ============================================================

export interface StudentProfile {
  /** Student's age in years (5–16) */
  age: number;
  /**
   * UK year group string, e.g. "Y1-2", "Y3-4", "Y5-6", "Y7-8", "Y9-11"
   * Used to determine Key Stage and adapt language complexity.
   */
  yearGroup: string;
  /** Currently selected subject */
  subject: Subject;
}

// ============================================================
//  Age Range Option (used in AgeSelector component)
// ============================================================

export interface AgeRange {
  /** Display label, e.g. "6–7" */
  label: string;
  /** Minimum age in this range */
  minAge: number;
  /** Maximum age in this range */
  maxAge: number;
  /** Representative age used for system prompt tuning (typically midpoint) */
  representativeAge: number;
  /** UK year group string for this range */
  yearGroup: string;
  /** Key stage label, e.g. "KS1" */
  keyStage: string;
  /** Emoji to display on the card */
  emoji: string;
  /** Tailwind background colour class for the card */
  bgColour: string;
  /** Tailwind border colour class */
  borderColour: string;
  /** Tailwind text colour class for the emoji/accent */
  accentColour: string;
}

// ============================================================
//  Subject Option (used in SubjectPicker component)
// ============================================================

export interface SubjectOption {
  /** The Subject enum value */
  subject: Subject;
  /** Emoji icon for the subject */
  emoji: string;
  /** Short description of what can be helped with */
  description: string;
  /** Tailwind background colour class */
  bgColour: string;
  /** Tailwind hover background colour class */
  hoverBgColour: string;
  /** Tailwind border colour class */
  borderColour: string;
  /** Tailwind text colour class */
  textColour: string;
}

// ============================================================
//  Chat State
// ============================================================

export interface ChatState {
  /** All messages in the current conversation */
  messages: Message[];
  /** The current student's profile (null if onboarding not complete) */
  profile: StudentProfile | null;
  /** Whether the AI is currently generating a response */
  isLoading: boolean;
  /** Error message to display, if any */
  error: string | null;
}

// ============================================================
//  API Request / Response types
// ============================================================

export interface ChatAPIRequest {
  messages: Array<Pick<Message, 'role' | 'content'>>;
  age: number;
  yearGroup: string;
  subject: string;
}

export interface ChatAPIErrorResponse {
  error: string;
}

// ============================================================
//  Onboarding step type
// ============================================================

export type OnboardingStep = 'age' | 'subject' | 'home' | 'complete';

// ============================================================
//  Progress data (for future Supabase integration)
// ============================================================

export interface SubjectProgress {
  subject: Subject;
  questionsCount: number;
  lastActive: string | null;
}

export interface QuizAttempt {
  id: string;
  subject: Subject;
  score: number;
  total: number;
  attemptedAt: string;
}
