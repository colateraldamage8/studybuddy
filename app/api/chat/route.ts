import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/prompts';
import { checkSafety } from '@/lib/safety';

// Initialise the Anthropic client — picks up ANTHROPIC_API_KEY from the env automatically
const anthropic = new Anthropic();

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  age: number;
  yearGroup: string;
  subject: string;
}

export async function POST(request: NextRequest) {
  try {
    // -------------------------------------------------------
    // 1. Parse and validate request body
    // -------------------------------------------------------
    let body: ChatRequestBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body.' },
        { status: 400 }
      );
    }

    const { messages, age, yearGroup, subject } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required and must not be empty.' },
        { status: 400 }
      );
    }

    if (typeof age !== 'number' || age < 5 || age > 18) {
      return NextResponse.json(
        { error: 'age must be a number between 5 and 18.' },
        { status: 400 }
      );
    }

    if (!yearGroup || typeof yearGroup !== 'string') {
      return NextResponse.json(
        { error: 'yearGroup is required.' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string') {
      return NextResponse.json(
        { error: 'subject is required.' },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // 2. Run safety filter on the latest user message
    // -------------------------------------------------------
    const latestUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');

    if (latestUserMessage) {
      const safetyResult = checkSafety(latestUserMessage.content);

      if (!safetyResult.safe) {
        // Return a safe redirect message instead of calling the AI
        return new Response(safetyResult.redirectMessage, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Safety-Redirect': 'true',
          },
        });
      }
    }

    // -------------------------------------------------------
    // 3. Build the system prompt
    // -------------------------------------------------------
    const systemPrompt = buildSystemPrompt(age, yearGroup, subject);

    // -------------------------------------------------------
    // 4. Sanitise messages for the Anthropic API
    //    The API requires alternating user/assistant turns and
    //    the conversation must start with a user message.
    // -------------------------------------------------------
    const sanitisedMessages = messages
      .filter(
        (m) =>
          m.role === 'user' || m.role === 'assistant'
      )
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).trim(),
      }))
      .filter((m) => m.content.length > 0);

    // Anthropic requires conversations to start with a user message.
    // Strip any leading assistant messages (e.g. the welcome message).
    const firstUserIndex = sanitisedMessages.findIndex((m) => m.role === 'user');

    if (firstUserIndex === -1) {
      return NextResponse.json(
        { error: 'No user message found in conversation.' },
        { status: 400 }
      );
    }

    const trimmedMessages = sanitisedMessages.slice(firstUserIndex);

    // -------------------------------------------------------
    // 5. Call Anthropic API — collect full response first
    //    so any API errors (billing, auth, etc.) are caught
    //    cleanly before we start streaming to the client.
    // -------------------------------------------------------
    const aiResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: trimmedMessages,
    });

    const responseText =
      aiResponse.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text)
        .join('') || "I'm not sure about that one. Could you try asking it a different way? 😊";

    // -------------------------------------------------------
    // 6. Return the response
    // -------------------------------------------------------
    return new Response(responseText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    console.error('[StudyBuddy] API route error:', error);

    // Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      const status = error.status ?? 500;

      if (status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your ANTHROPIC_API_KEY.' },
          { status: 401 }
        );
      }

      if (status === 429) {
        return NextResponse.json(
          {
            error:
              'StudyBuddy is very busy right now! Please try again in a moment. 😊',
          },
          { status: 429 }
        );
      }

      if (status >= 500) {
        return NextResponse.json(
          {
            error:
              'StudyBuddy is having a little nap. Please try again shortly!',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `API error: ${error.message}` },
        { status }
      );
    }

    return NextResponse.json(
      {
        error:
          'Something went wrong. Please refresh the page and try again.',
      },
      { status: 500 }
    );
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
