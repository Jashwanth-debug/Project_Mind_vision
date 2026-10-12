/**
 * MindVision Clinical AI - Conversational Patient Screening State & Adaptive Questioning Engine
 * 
 * Manages adaptive dialogue flow, empathetic acknowledgements, safety screening,
 * and progress tracking without exposing technical telemetry to patients.
 */

// Crisis / Immediate Safety Trigger Keywords
const CRISIS_KEYWORDS = [
  'suicide',
  'suicidal',
  'kill myself',
  'end my life',
  'hurt myself',
  'harm myself',
  'want to die',
  'better off dead',
  'no reason to live',
  'end it all',
  'hang myself',
  'take all my pills',
  'overdose'
];

/**
 * Checks if a patient statement contains potential safety / self-harm triggers.
 */
export function checkForCrisisTriggers(text = '') {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

// Adaptive Question Bank
export const CONVERSATION_QUESTION_BANK = {
  initial: {
    id: 'q_initial',
    category: 'general',
    prompt: "How have you been feeling lately?",
    shortPrompt: "How have you been feeling lately?",
    placeholder: "e.g., I've been feeling a bit stressed with work lately, but managing day-to-day..."
  },
  
  // Follow-ups based on Fatigue / Energy
  fatigue: {
    id: 'q_fatigue',
    category: 'fatigue',
    prompt: "How has that tiredness or low energy affected your daily activities and routine?",
    shortPrompt: "Impact of fatigue on daily routine",
    placeholder: "e.g., It's harder to get out of bed in the morning, and I lose focus by afternoon..."
  },
  
  // Follow-ups based on Sleep
  sleep: {
    id: 'q_sleep',
    category: 'sleep',
    prompt: "How has your sleep been recently? Are you having trouble falling asleep, staying asleep, or feeling rested?",
    shortPrompt: "Recent sleep quality and patterns",
    placeholder: "e.g., I wake up several times during the night and feel unrefreshed..."
  },
  
  // Follow-ups based on Stress / Overwhelm
  stress: {
    id: 'q_stress',
    category: 'stress',
    prompt: "What has been causing you the most pressure or emotional weight recently?",
    shortPrompt: "Primary sources of stress or pressure",
    placeholder: "e.g., Work deadlines have piled up, and I haven't had time to decompress..."
  },
  
  // Follow-ups based on Concentration / Focus
  concentration: {
    id: 'q_concentration',
    category: 'concentration',
    prompt: "How often has this been affecting your ability to focus, make decisions, or concentrate on tasks?",
    shortPrompt: "Impact on concentration and focus",
    placeholder: "e.g., I find myself getting distracted easily and taking twice as long on simple tasks..."
  },

  // Follow-ups based on Low Mood / Sadness
  mood: {
    id: 'q_mood',
    category: 'mood',
    prompt: "When you feel that way, are there particular moments or situations that make it harder to get through the day?",
    shortPrompt: "Patterns in mood and coping",
    placeholder: "e.g., Evenings are the hardest, especially when I'm alone with my thoughts..."
  },

  // Branch for feeling good / fine
  positive: {
    id: 'q_positive',
    category: 'positive',
    prompt: "That's good to hear. Over the past couple of weeks, have you noticed any changes in your energy, sleep, mood, or ability to enjoy things?",
    shortPrompt: "Any subtle changes in energy or mood",
    placeholder: "e.g., Mostly steady, maybe a bit of tiredness on Thursdays, but generally fine..."
  },

  // General Coping & Support branch (Closing question)
  coping: {
    id: 'q_coping',
    category: 'coping',
    prompt: "What has been helping you cope or unwind when things feel like a lot?",
    shortPrompt: "What helps you unwind or cope",
    placeholder: "e.g., Going for walks, talking to my partner, listening to music..."
  }
};

/**
 * Determine the next adaptive question based on patient's response and conversation history.
 */
export function determineNextQuestion(latestAnswer = '', askedQuestionIds = []) {
  const text = (latestAnswer || '').toLowerCase();
  
  // Rule 1: Check keywords in latest response
  if (!askedQuestionIds.includes('q_fatigue') && (text.includes('tired') || text.includes('fatigue') || text.includes('exhaust') || text.includes('drained') || text.includes('sluggish') || text.includes('low energy'))) {
    return CONVERSATION_QUESTION_BANK.fatigue;
  }
  
  if (!askedQuestionIds.includes('q_sleep') && (text.includes('sleep') || text.includes('insomnia') || text.includes('awake') || text.includes('waking up') || text.includes('nightmare') || text.includes('restless'))) {
    return CONVERSATION_QUESTION_BANK.sleep;
  }
  
  if (!askedQuestionIds.includes('q_stress') && (text.includes('stress') || text.includes('pressure') || text.includes('overwhelm') || text.includes('deadline') || text.includes('anxious') || text.includes('burnout') || text.includes('heavy'))) {
    return CONVERSATION_QUESTION_BANK.stress;
  }

  if (!askedQuestionIds.includes('q_concentration') && (text.includes('focus') || text.includes('concentrat') || text.includes('brain fog') || text.includes('distract') || text.includes('memory') || text.includes('forgetting'))) {
    return CONVERSATION_QUESTION_BANK.concentration;
  }

  if (!askedQuestionIds.includes('q_mood') && (text.includes('sad') || text.includes('depress') || text.includes('cry') || text.includes('down') || text.includes('hopeless') || text.includes('lonely') || text.includes('unhappy'))) {
    return CONVERSATION_QUESTION_BANK.mood;
  }

  if (!askedQuestionIds.includes('q_positive') && (text.includes('fine') || text.includes('good') || text.includes('great') || text.includes('okay') || text.includes('well') || text.includes('normal') || text.includes('not bad'))) {
    return CONVERSATION_QUESTION_BANK.positive;
  }

  // Fallback to coping closing question if we've asked at least 2 questions
  if (askedQuestionIds.length >= 2 && !askedQuestionIds.includes('q_coping')) {
    return CONVERSATION_QUESTION_BANK.coping;
  }

  // Final fallback to sleep or coping if not yet asked
  if (!askedQuestionIds.includes('q_sleep')) {
    return CONVERSATION_QUESTION_BANK.sleep;
  }

  if (!askedQuestionIds.includes('q_coping')) {
    return CONVERSATION_QUESTION_BANK.coping;
  }

  return null; // Indicates conversation has gathered sufficient signals
}

/**
 * Empathetic, supportive acknowledgement prefix before asking the next question.
 */
export function getConversationalAcknowledgement(questionCount = 1, isFinal = false) {
  if (isFinal) {
    return "Thank you for sharing that. I have gathered enough to complete your check-in summary.";
  }

  const acknowledgements = [
    "Thank you for sharing that.",
    "I understand. That makes sense.",
    "That's helpful context. Let's look at another aspect.",
    "Thanks. I'd like to ask you one more question about how that feels."
  ];

  return acknowledgements[(questionCount - 1) % acknowledgements.length];
}

/**
 * Reassuring, calming progress message.
 */
export function getFriendlyProgress(questionIndex = 1, maxQuestions = 4) {
  if (questionIndex === 1) return "Beginning your check-in";
  if (questionIndex === 2) return "You're making good progress.";
  if (questionIndex === 3) return "About halfway through";
  if (questionIndex >= 4) return "Almost done — wrapping up";
  return "In progress";
}
