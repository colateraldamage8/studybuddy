// ============================================================
//  StudyBuddy — Safety Filter
//  Screens incoming messages for inappropriate or blocked
//  content before sending to the AI model.
//  All redirect messages are child-friendly and encouraging.
// ============================================================

import { REDIRECT_MESSAGES } from './prompts';

// ============================================================
//  Keyword / phrase lists by category
//  All patterns are lower-cased for case-insensitive matching
// ============================================================

/** Adult / sexual content keywords */
const ADULT_SEXUAL_PATTERNS: string[] = [
  'porn',
  'pornography',
  'pornographic',
  'nude',
  'naked',
  'sex ',
  'sexual',
  'sexuality',
  'erotic',
  'fetish',
  'masturbat',
  'intercourse',
  'genitals',
  'penis',
  'vagina',
  'breasts',
  'boobs',
  'hooker',
  'prostitut',
  'escort service',
  'stripper',
  'strip club',
  'adult website',
  'onlyfans',
  'cam girl',
  'cam boy',
  'hentai',
  'xxx',
];

/** Violence / harm keywords */
const VIOLENCE_HARM_PATTERNS: string[] = [
  'kill myself',
  'want to die',
  'suicide',
  'self harm',
  'self-harm',
  'cut myself',
  'hurt myself',
  'end my life',
  'overdose',
  'blow up',
  'bomb',
  'make a bomb',
  'build a gun',
  'shoot someone',
  'stab someone',
  'how to hurt',
  'how to kill',
  'murder',
  'assassinat',
  'torture',
  'genocide',
  'school shooting',
  'mass shooting',
];

/** Dangerous / illegal activity keywords */
const DANGEROUS_ILLEGAL_PATTERNS: string[] = [
  'how to hack',
  'hacking tutorial',
  'crack a password',
  'bypass security',
  'ddos',
  'ransomware',
  'make drugs',
  'synthesise drugs',
  'synthesize drugs',
  'cook meth',
  'drug recipe',
  'how to steal',
  'how to shoplift',
  'pick a lock',
  'hotwire a car',
  'credit card fraud',
  'identity theft',
  'fake id',
  'phishing',
  'darkweb',
  'dark web',
];

/** Medical diagnosis / professional advice keywords */
const MEDICAL_PROFESSIONAL_PATTERNS: string[] = [
  'diagnose me',
  'do i have',
  'what disease',
  'medical advice',
  'legal advice',
  'lawyer advice',
  'investment advice',
  'financial advice',
  'stock tips',
  'should i invest',
  'is this illegal',
  'write me a will',
  'write me a contract',
];

/** Political / ideological debate keywords */
const POLITICAL_PATTERNS: string[] = [
  'vote for',
  'best political party',
  'is labour better',
  'is conservative better',
  'tory',
  'is trump',
  'is biden',
  'best religion',
  'worst religion',
  'islam is',
  'christianity is',
  'atheism is',
  'jihad',
  'right wing',
  'left wing',
  'communist manifesto is',
  'fascism is good',
  'nazi',
  'white supremac',
];

/** Cheating / do-my-homework requests */
const CHEATING_PATTERNS: string[] = [
  'write my essay',
  'write an essay for me',
  'do my homework',
  'do my assignment',
  'complete my homework',
  'finish my homework',
  'complete this assignment',
  'finish this assignment',
  'give me the answers',
  'just give me the answer',
  'tell me the answers',
  'write the whole',
  'write it for me',
  'just do it for me',
  'write my coursework',
  'write my report for me',
  'write this for me',
  'answer all the questions',
  'solve all of these',
  'do all of these for me',
  'cheat on my exam',
  'cheat on my test',
  'write my story for me',
  'copy this for me',
];

/** Inappropriate contact / personal info requests */
const PERSONAL_INFO_PATTERNS: string[] = [
  "what's your phone number",
  'what is your phone number',
  'give me your number',
  'where do you live',
  'what is your address',
  'meet me',
  'come to my house',
  'add me on',
  'follow me on',
  'my instagram is',
  'my snapchat is',
  'my tiktok is',
  'my phone number is',
  'my address is',
];

// ============================================================
//  Category-to-redirect mapping
//  Provides targeted but child-friendly messages per category
// ============================================================

interface BlockedCategory {
  patterns: string[];
  redirectMessage: string;
}

const BLOCKED_CATEGORIES: BlockedCategory[] = [
  {
    patterns: ADULT_SEXUAL_PATTERNS,
    redirectMessage:
      "That's not something StudyBuddy can help with — let's keep things school-friendly! 😊 What homework can I help you with today?",
  },
  {
    patterns: VIOLENCE_HARM_PATTERNS,
    redirectMessage:
      "It sounds like things might be tough right now. Please talk to a grown-up you trust — a parent, carer, or teacher. They want to help you. 💙 When you're ready, I'm here to help with your schoolwork.",
  },
  {
    patterns: DANGEROUS_ILLEGAL_PATTERNS,
    redirectMessage:
      "Oops! That's not something I can help with. StudyBuddy is all about homework and learning! 📚 What subject are you working on?",
  },
  {
    patterns: MEDICAL_PROFESSIONAL_PATTERNS,
    redirectMessage:
      "For that kind of question, it's really important to speak to a qualified professional or a trusted adult. I'm best at helping with your school subjects — what are you studying? 😊",
  },
  {
    patterns: POLITICAL_PATTERNS,
    redirectMessage:
      "Politics and religion are big topics that are best discussed with family and trusted teachers! I'm here to help with your schoolwork instead. What subject can I help you with? 🎒",
  },
  {
    patterns: CHEATING_PATTERNS,
    redirectMessage:
      "I can see you want the answer quickly — I totally understand homework can feel overwhelming! But my job is to help YOU figure it out, because that's how your brain actually learns and grows. Let's tackle it together, one step at a time. What part are you stuck on? 🌟",
  },
  {
    patterns: PERSONAL_INFO_PATTERNS,
    redirectMessage:
      "Remember to stay safe online and never share personal information in chat. StudyBuddy is here purely for homework help! 😊 What subject are you working on today?",
  },
];

// ============================================================
//  Helper: get a random redirect message from the general pool
// ============================================================

function getRandomRedirectMessage(): string {
  const index = Math.floor(Math.random() * REDIRECT_MESSAGES.length);
  return REDIRECT_MESSAGES[index];
}

// ============================================================
//  Main export — safety check function
// ============================================================

export interface SafetyCheckResult {
  safe: boolean;
  redirectMessage?: string;
  category?: string;
}

/**
 * Checks a user message for blocked content.
 * Returns { safe: true } if the message passes all filters,
 * or { safe: false, redirectMessage, category } if blocked.
 *
 * The check is intentionally lenient on false positives — it uses
 * substring matching so legitimate homework questions about history
 * (e.g., WWII) are not accidentally blocked. Only clear, unambiguous
 * harmful requests are caught.
 */
export function checkSafety(message: string): SafetyCheckResult {
  if (!message || typeof message !== 'string') {
    return { safe: true };
  }

  const normalised = message.toLowerCase().trim();

  // Empty or very short messages are safe
  if (normalised.length < 2) {
    return { safe: true };
  }

  for (const category of BLOCKED_CATEGORIES) {
    for (const pattern of category.patterns) {
      if (normalised.includes(pattern)) {
        return {
          safe: false,
          redirectMessage: category.redirectMessage,
          category: getCategoryName(category),
        };
      }
    }
  }

  return { safe: true };
}

// ============================================================
//  Helper: returns a human-readable category name for logging
// ============================================================

function getCategoryName(category: BlockedCategory): string {
  if (category.patterns === ADULT_SEXUAL_PATTERNS) return 'adult_sexual';
  if (category.patterns === VIOLENCE_HARM_PATTERNS) return 'violence_harm';
  if (category.patterns === DANGEROUS_ILLEGAL_PATTERNS) return 'dangerous_illegal';
  if (category.patterns === MEDICAL_PROFESSIONAL_PATTERNS) return 'medical_professional';
  if (category.patterns === POLITICAL_PATTERNS) return 'political';
  if (category.patterns === CHEATING_PATTERNS) return 'cheating';
  if (category.patterns === PERSONAL_INFO_PATTERNS) return 'personal_info';
  return 'unknown';
}

// ============================================================
//  Additional export: checks multiple messages (e.g., history)
// ============================================================

export function checkConversationSafety(
  messages: Array<{ role: string; content: string }>
): SafetyCheckResult {
  for (const message of messages) {
    if (message.role === 'user') {
      const result = checkSafety(message.content);
      if (!result.safe) {
        return result;
      }
    }
  }
  return { safe: true };
}

// ============================================================
//  Export the random redirect helper for use in other modules
// ============================================================

export { getRandomRedirectMessage };
