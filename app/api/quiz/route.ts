import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { age, yearGroup, subject } = body;

    if (!age || !yearGroup || !subject) {
      return NextResponse.json({ error: 'age, yearGroup and subject are required.' }, { status: 400 });
    }

    const seed = Math.floor(Math.random() * 100000);
    const prompt = `You are a UK school quiz generator. Generate exactly 5 multiple-choice quiz questions for a ${age}-year-old student in ${yearGroup} studying ${subject}. Randomisation seed: ${seed}.

Rules:
- Questions must match the UK National Curriculum for ${yearGroup}
- Each question must have exactly 4 options labelled A, B, C, D
- Only one option is correct
- Keep language simple and age-appropriate for age ${age}
- Questions should be fun and encouraging
- IMPORTANT: Cover 5 DIFFERENT and VARIED sub-topics within ${subject} — do NOT repeat similar themes
- IMPORTANT: Vary the question style each time (facts, calculations, definitions, fill-in-the-blank, "which of these", etc.)
- IMPORTANT: Shuffle the position of the correct answer — do not always put it in the same position
- Never repeat questions from previous quizzes — always generate fresh, unique questions

Respond with ONLY valid JSON in this exact format, no extra text:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["A) option one", "B) option two", "C) option three", "D) option four"],
      "correctIndex": 0,
      "explanation": "Brief friendly explanation of why the answer is correct."
    }
  ]
}

correctIndex is 0-based (0=A, 1=B, 2=C, 3=D).`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    // Extract JSON from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate quiz questions.' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('[StudyBuddy] Quiz API error:', error);
    return NextResponse.json({ error: 'Failed to generate quiz. Please try again.' }, { status: 500 });
  }
}
