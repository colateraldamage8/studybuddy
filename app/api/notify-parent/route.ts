import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { parentEmail } = await req.json();

  if (!parentEmail) {
    return NextResponse.json({ error: 'No parent email provided' }, { status: 400 });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    // Log only — email will work once RESEND_API_KEY is added to env
    console.log(`[StudyBuddy] Homework alert: ${parentEmail} — child did not complete homework by 5pm`);
    return NextResponse.json({ sent: false, reason: 'RESEND_API_KEY not configured' });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'StudyBuddy <noreply@studybuddy.cabreraai.com>',
      to: parentEmail,
      subject: 'Homework not completed today',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(to right, #3b82f6, #2563eb); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h2 style="color: white; margin: 0; font-size: 20px;">📚 StudyBuddy — Homework Alert</h2>
          </div>
          <p style="font-size: 16px; color: #374151;">Your child did not complete daily homework before <strong>5:00 pm</strong> today.</p>
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">Gaming session tomorrow should be cancelled.</p>
          </div>
          <p style="font-size: 14px; color: #6b7280;">
            The StudyBuddy Responsibility System has recorded this as a late or missed homework session.
            Strike counts have been updated in the app.
          </p>
          <hr style="border: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">StudyBuddy Responsibility System · studybuddy.cabreraai.com</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[StudyBuddy] Email failed:', err);
    return NextResponse.json({ sent: false, error: err }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}
