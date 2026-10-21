/**
 * MindVision Clinical AI - Dynamic, Adaptive Conversational Questioning Engine
 * 
 * Features:
 * - 24 dynamic question variants grouped across 6 core themes (mood, sleep, stress, energy, social_connection, coping).
 * - Multi-session memory (persisted in localStorage) rotating variants so users never see identical scripts back-to-back.
 * - In-session adaptive branching prioritized by patient verbal cues and stress indicators.
 * - Soft pacing messages without rigid "Question X of Y" counters.
 * - Empathetic, content-aware acknowledgments with rotation to avoid repetitive feedback.
 */

const STORAGE_KEY_RECENT_QUESTIONS = 'mindvision_recent_questions_v2';
const MAX_SAVED_SESSIONS = 5;

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

// ---------------------------------------------------------------------------
// Comprehensive Question Bank: 6 Themes x 4 Phrasing Variants = 24 Variants
// ---------------------------------------------------------------------------
export const THEMATIC_QUESTION_BANK = {
  mood: [
    {
      id: 'mood_v1',
      theme: 'mood',
      prompt: "How have you been feeling in your mind and body lately?",
      shortPrompt: "Recent emotional state & mood",
      placeholder: "e.g., Things have been a bit up and down, but generally holding steady..."
    },
    {
      id: 'mood_v2',
      theme: 'mood',
      prompt: "How has your emotional headspace felt over the past couple of days?",
      shortPrompt: "Current headspace & outlook",
      placeholder: "e.g., My mind has felt a bit crowded, taking things one day at a time..."
    },
    {
      id: 'mood_v3',
      theme: 'mood',
      prompt: "When you pause and check in with yourself right now, what stands out most?",
      shortPrompt: "What stands out right now",
      placeholder: "e.g., I'm noticing some tension in my shoulders, but feeling peaceful otherwise..."
    },
    {
      id: 'mood_v4',
      theme: 'mood',
      prompt: "How has your mood been feeling day-to-day throughout this week?",
      shortPrompt: "Day-to-day mood balance",
      placeholder: "e.g., Mostly calm, though I felt a dip mid-week with everything going on..."
    }
  ],

  sleep: [
    {
      id: 'sleep_v1',
      theme: 'sleep',
      prompt: "How has your sleep been recently? Have you been able to truly rest and recharge?",
      shortPrompt: "Sleep quality & restfulness",
      placeholder: "e.g., I fall asleep okay, but wake up feeling like I need two more hours..."
    },
    {
      id: 'sleep_v2',
      theme: 'sleep',
      prompt: "Tell me about your sleep lately. Are you finding it easy or difficult to unwind at night?",
      shortPrompt: "Evening wind-down & sleep ease",
      placeholder: "e.g., My mind races before bed, so it takes a while to drift off..."
    },
    {
      id: 'sleep_v3',
      theme: 'sleep',
      prompt: "How are your mornings feeling when you wake up? Are you feeling restored or still drained?",
      shortPrompt: "Morning recovery & waking energy",
      placeholder: "e.g., Mornings feel a bit sluggish, takes me a while to get going..."
    },
    {
      id: 'sleep_v4',
      theme: 'sleep',
      prompt: "Have you noticed any changes in your sleep patterns or waking up during the night?",
      shortPrompt: "Nighttime sleep continuity",
      placeholder: "e.g., Waking up around 3 AM thinking about tasks, then drifting back off..."
    }
  ],

  stress: [
    {
      id: 'stress_v1',
      theme: 'stress',
      prompt: "What has been taking up the most emotional space or causing you tension lately?",
      shortPrompt: "Sources of tension & mental weight",
      placeholder: "e.g., Work expectations and family responsibilities piling up together..."
    },
    {
      id: 'stress_v2',
      theme: 'stress',
      prompt: "Have there been situations at work or home that have felt particularly overwhelming?",
      shortPrompt: "Overwhelming moments or demands",
      placeholder: "e.g., Balancing tight timelines with everyday chores has felt heavy..."
    },
    {
      id: 'stress_v3',
      theme: 'stress',
      prompt: "When stress comes up for you right now, where do you feel it most in your day?",
      shortPrompt: "When and where stress appears",
      placeholder: "e.g., Mid-afternoon when messages stack up, my neck tightens up..."
    },
    {
      id: 'stress_v4',
      theme: 'stress',
      prompt: "Is there anything specific weighing on your shoulders this week that feels heavy to hold?",
      shortPrompt: "Current emotional burdens",
      placeholder: "e.g., Worrying about upcoming changes and trying to manage everything alone..."
    }
  ],

  energy: [
    {
      id: 'energy_v1',
      theme: 'energy',
      prompt: "How has your energy held up through the day? Are you running on empty or steady?",
      shortPrompt: "Daily energy & stamina",
      placeholder: "e.g., I start okay in the morning, but hit a wall around 2 PM..."
    },
    {
      id: 'energy_v2',
      theme: 'energy',
      prompt: "Have you felt physically or mentally depleted during your everyday routine lately?",
      shortPrompt: "Physical and mental depletion",
      placeholder: "e.g., Getting through routine tasks feels like walking through water sometimes..."
    },
    {
      id: 'energy_v3',
      theme: 'energy',
      prompt: "Are you finding enough fuel to get through what you need to do, or does simple stuff feel tiring?",
      shortPrompt: "Fuel for everyday routine",
      placeholder: "e.g., Simple errands feel like a chore by the time evening comes..."
    },
    {
      id: 'energy_v4',
      theme: 'energy',
      prompt: "How has your stamina felt when tackling your everyday responsibilities this week?",
      shortPrompt: "Pacing and stamina",
      placeholder: "e.g., Steady enough, taking short pauses between meetings helps..."
    }
  ],

  social_connection: [
    {
      id: 'social_v1',
      theme: 'social_connection',
      prompt: "How supported do you feel by the people around you lately? Have you felt connected or a bit isolated?",
      shortPrompt: "Sense of connection & support",
      placeholder: "e.g., I have good friends, but haven't had the energy to reach out recently..."
    },
    {
      id: 'social_v2',
      theme: 'social_connection',
      prompt: "Have you had someone you can talk openly and honestly with when you need to vent?",
      shortPrompt: "Open communication & sounding board",
      placeholder: "e.g., My partner listens, but I sometimes try not to burden them..."
    },
    {
      id: 'social_v3',
      theme: 'social_connection',
      prompt: "Do you find yourself withdrawing into your shell, or has connecting with others felt natural?",
      shortPrompt: "Social openness vs withdrawal",
      placeholder: "e.g., I've been keeping to myself more than usual after long days..."
    },
    {
      id: 'social_v4',
      theme: 'social_connection',
      prompt: "How has your sense of connection with friends or family been feeling this week?",
      shortPrompt: "Connection with family & friends",
      placeholder: "e.g., Had a nice phone call yesterday that helped me feel grounded..."
    }
  ],

  coping: [
    {
      id: 'coping_v1',
      theme: 'coping',
      prompt: "What has been giving you a sense of comfort or calm when things feel like a lot?",
      shortPrompt: "Comfort & calming anchors",
      placeholder: "e.g., Evening walks without my phone, listening to ambient music, reading..."
    },
    {
      id: 'coping_v2',
      theme: 'coping',
      prompt: "Are there little moments or habits in your day that help you feel more grounded?",
      shortPrompt: "Grounding habits & moments",
      placeholder: "e.g., Making coffee slowly in the morning and sitting in the sunlight..."
    },
    {
      id: 'coping_v3',
      theme: 'coping',
      prompt: "When everything gets loud, what is one thing you do that helps you breathe a bit easier?",
      shortPrompt: "Breathing space & release",
      placeholder: "e.g., Stepping outside for 5 minutes, deep breathing, chatting with my sister..."
    },
    {
      id: 'coping_v4',
      theme: 'coping',
      prompt: "What helps you recharge or protect your peace when your plate is full?",
      shortPrompt: "Protecting peace & recharging",
      placeholder: "e.g., Setting boundaries with work emails and going to bed earlier..."
    }
  ]
};

// Flattened lookup map for legacy or direct access
export const CONVERSATION_QUESTION_BANK = {
  initial: THEMATIC_QUESTION_BANK.mood[0],
  fatigue: THEMATIC_QUESTION_BANK.energy[0],
  sleep: THEMATIC_QUESTION_BANK.sleep[0],
  stress: THEMATIC_QUESTION_BANK.stress[0],
  concentration: THEMATIC_QUESTION_BANK.energy[1],
  mood: THEMATIC_QUESTION_BANK.mood[1],
  positive: THEMATIC_QUESTION_BANK.coping[1],
  coping: THEMATIC_QUESTION_BANK.coping[0]
};

// ---------------------------------------------------------------------------
// Recent Session Question Memory (localStorage persistence)
// ---------------------------------------------------------------------------
export function getRecentQuestionHistory() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT_QUESTIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[MindVision] Failed to read recent question history:', err);
    return [];
  }
}

export function recordSessionCompleted(sessionQuestionIds = [], themes = []) {
  if (typeof localStorage === 'undefined') return;
  try {
    const currentHistory = getRecentQuestionHistory();
    const entry = {
      date: new Date().toISOString(),
      questionIds: sessionQuestionIds,
      themes: themes
    };
    const updated = [entry, ...currentHistory].slice(0, MAX_SAVED_SESSIONS);
    localStorage.setItem(STORAGE_KEY_RECENT_QUESTIONS, JSON.stringify(updated));
  } catch (err) {
    console.warn('[MindVision] Failed to persist recent question history:', err);
  }
}

/**
 * Selects an optimal phrasing variant for a given theme, rotating away
 * from variants used in recent sessions (last 3-5 sessions).
 */
export function selectVariantForTheme(theme, recentlyUsedIds = []) {
  const variants = THEMATIC_QUESTION_BANK[theme] || THEMATIC_QUESTION_BANK.mood;
  
  // Find variants not used in recent sessions
  const unusedVariants = variants.filter((v) => !recentlyUsedIds.includes(v.id));

  if (unusedVariants.length > 0) {
    // Pick randomly among unused variants
    const randomIndex = Math.floor(Math.random() * unusedVariants.length);
    return unusedVariants[randomIndex];
  }

  // If all variants were used in history, pick the least recently used
  for (let i = recentlyUsedIds.length - 1; i >= 0; i--) {
    const match = variants.find((v) => v.id === recentlyUsedIds[i]);
    if (match) return match;
  }

  return variants[0];
}

/**
 * Retrieves recently asked question IDs across the last 3-5 sessions.
 */
function getRecentQuestionIdSet() {
  const history = getRecentQuestionHistory();
  const ids = [];
  history.forEach((session) => {
    if (Array.isArray(session.questionIds)) {
      session.questionIds.forEach((id) => ids.push(id));
    }
  });
  return ids;
}

/**
 * Selects an initial question for a new session, varying the mood phrasing
 * to ensure repeat users get fresh openers.
 */
export function getInitialQuestion() {
  const recentIds = getRecentQuestionIdSet();
  return selectVariantForTheme('mood', recentIds);
}

// ---------------------------------------------------------------------------
// In-Session Adaptive Selection Logic
// ---------------------------------------------------------------------------

/**
 * Analyzes prior response content and stress markers to adaptively determine
 * the next question theme and variant.
 * 
 * @param {string} latestAnswer - Patient's latest response text
 * @param {Array<string>} askedQuestionIds - Question IDs already asked in current session
 * @param {number} questionCount - Number of questions asked so far (1-indexed)
 * @param {number} maxQuestions - Target session length (defaults to 4)
 */
export function determineNextQuestion(
  latestAnswer = '',
  askedQuestionIds = [],
  questionCount = 1,
  maxQuestions = 4
) {
  // If we've reached the target question count, close the session
  if (questionCount >= maxQuestions) {
    return null;
  }

  const text = (latestAnswer || '').toLowerCase();
  const recentIds = getRecentQuestionIdSet();
  const allUsedIds = [...askedQuestionIds, ...recentIds];

  // Determine which themes have already been explored in this session
  const askedThemes = [];
  Object.keys(THEMATIC_QUESTION_BANK).forEach((theme) => {
    const themeVariants = THEMATIC_QUESTION_BANK[theme];
    if (themeVariants.some((v) => askedQuestionIds.includes(v.id))) {
      askedThemes.push(theme);
    }
  });

  // FINAL QUESTION RULE: Always conclude on Coping & Grounding strengths
  if (questionCount === maxQuestions - 1) {
    if (!askedThemes.includes('coping')) {
      return selectVariantForTheme('coping', allUsedIds);
    }
  }

  // 1. STRESS & OVERWHELM BRANCH
  const hasStressSignals =
    text.includes('stress') ||
    text.includes('pressure') ||
    text.includes('overwhelm') ||
    text.includes('deadline') ||
    text.includes('burnout') ||
    text.includes('anxious') ||
    text.includes('heavy') ||
    text.includes('too much') ||
    text.includes('burden');

  if (hasStressSignals && !askedThemes.includes('stress')) {
    return selectVariantForTheme('stress', allUsedIds);
  }

  // 2. SLEEP & RESTLESSNESS BRANCH
  const hasSleepSignals =
    text.includes('sleep') ||
    text.includes('insomnia') ||
    text.includes('awake') ||
    text.includes('waking') ||
    text.includes('nightmare') ||
    text.includes('restless') ||
    text.includes('bed');

  if (hasSleepSignals && !askedThemes.includes('sleep')) {
    return selectVariantForTheme('sleep', allUsedIds);
  }

  // 3. FATIGUE & LOW ENERGY BRANCH
  const hasEnergySignals =
    text.includes('tired') ||
    text.includes('fatigue') ||
    text.includes('exhaust') ||
    text.includes('drained') ||
    text.includes('sluggish') ||
    text.includes('no energy') ||
    text.includes('low energy') ||
    text.includes('nap');

  if (hasEnergySignals && !askedThemes.includes('energy')) {
    return selectVariantForTheme('energy', allUsedIds);
  }

  // 4. SOCIAL ISOLATION / LONELINESS BRANCH
  const hasSocialSignals =
    text.includes('lonely') ||
    text.includes('alone') ||
    text.includes('isolated') ||
    text.includes('nobody') ||
    text.includes('disconnect') ||
    text.includes('friend') ||
    text.includes('family') ||
    text.includes('relationship');

  if (hasSocialSignals && !askedThemes.includes('social_connection')) {
    return selectVariantForTheme('social_connection', allUsedIds);
  }

  // 5. CALM / STEADY BRANCH (Inquire about energy balance or coping anchors)
  const isSteady =
    text.includes('fine') ||
    text.includes('good') ||
    text.includes('great') ||
    text.includes('okay') ||
    text.includes('steady') ||
    text.includes('normal') ||
    text.includes('peaceful');

  if (isSteady) {
    if (!askedThemes.includes('energy')) {
      return selectVariantForTheme('energy', allUsedIds);
    }
    if (!askedThemes.includes('social_connection')) {
      return selectVariantForTheme('social_connection', allUsedIds);
    }
  }

  // 6. DEFAULT ADAPTIVE ROTATION (Pick an unasked theme with preference to Sleep / Energy / Stress)
  const candidateThemes = ['sleep', 'stress', 'energy', 'social_connection', 'coping']
    .filter((t) => !askedThemes.includes(t));

  if (candidateThemes.length > 0) {
    const chosenTheme = candidateThemes[0];
    return selectVariantForTheme(chosenTheme, allUsedIds);
  }

  // If all themes were somehow asked, return null to complete
  return null;
}

// ---------------------------------------------------------------------------
// Rotating, Empathetic Acknowledgments
// ---------------------------------------------------------------------------
const ACKNOWLEDGMENT_POOLS = {
  stress: [
    "I hear how much pressure has been resting on your shoulders. It makes complete sense to feel weighed down by that.",
    "That sounds like a lot to carry all at once. Thank you for acknowledging how heavy it feels.",
    "It takes real self-awareness to notice when things are piling up. I appreciate you sharing that with me.",
    "Carrying that degree of tension is taxing on both mind and body. Let's explore another gentle angle."
  ],

  sleep: [
    "Thank you for opening up about your sleep. Waking up unrefreshed changes how the whole day moves.",
    "Rest is so foundational to how we process our days. It's completely understandable to feel the effects of restless nights.",
    "Navigating disrupted sleep takes a quiet toll on your stamina. Thank you for letting me know.",
    "I hear you. When sleep doesn't restore us, even small things feel like they require extra effort."
  ],

  energy: [
    "Thank you for sharing that. Living with persistent fatigue or low energy takes real patience with yourself.",
    "Feeling drained like that can be deeply frustrating when you have things to do. I hear you.",
    "Recognizing when your battery is low is a crucial step in giving yourself permission to recharge.",
    "It makes total sense that your energy feels depleted given what your routine demands."
  ],

  social: [
    "Thank you for trusting me with that. Feeling distant from those around you can be quiet but heavy.",
    "Connection is deeply tender. It's very human to want space sometimes, and to feel the ache of isolation at other times.",
    "I hear you. Having people around doesn't always mean feeling fully understood, and that's okay to admit.",
    "Thank you for sharing where your relationships and support feel right now."
  ],

  steady: [
    "It's really refreshing to hear there are calmer, steady spaces in your rhythm right now.",
    "I'm glad to hear things have felt relatively manageable. It's nourishing to notice those peaceful pockets.",
    "That steady feeling is wonderful to hold on to. Let's see how the rest of your routine aligns with that.",
    "Noticing when things feel okay is just as important as noticing when they feel hard. Thank you for sharing."
  ],

  general: [
    "Thank you for sharing that with me.",
    "I appreciate your honesty -- that helps us understand your natural rhythm.",
    "That makes total sense. Let's look at another gentle part of your routine.",
    "Thanks for letting me know. Let's explore how that feels in your day.",
    "I hear you clearly. Let's take another mindful step forward together.",
    "Thank you. Giving voice to how things really feel is a generous gift to yourself."
  ]
};

// Keeps track of the last returned acknowledgment to prevent immediate consecutive repeats
let lastUsedAcknowledgment = '';

export function getConversationalAcknowledgement(latestAnswer = '', questionCount = 1, isFinal = false) {
  if (isFinal) {
    return "Thank you so much for taking this time to share with me. I've gathered everything needed for your gentle reflection summary.";
  }

  const text = (typeof latestAnswer === 'string' ? latestAnswer : '').toLowerCase();
  let pool = ACKNOWLEDGMENT_POOLS.general;

  if (text.includes('stress') || text.includes('pressure') || text.includes('overwhelm') || text.includes('deadline') || text.includes('burnout')) {
    pool = ACKNOWLEDGMENT_POOLS.stress;
  } else if (text.includes('sleep') || text.includes('insomnia') || text.includes('awake') || text.includes('restless') || text.includes('waking')) {
    pool = ACKNOWLEDGMENT_POOLS.sleep;
  } else if (text.includes('tired') || text.includes('fatigue') || text.includes('exhaust') || text.includes('drained') || text.includes('energy')) {
    pool = ACKNOWLEDGMENT_POOLS.energy;
  } else if (text.includes('alone') || text.includes('lonely') || text.includes('isolated') || text.includes('friend') || text.includes('family')) {
    pool = ACKNOWLEDGMENT_POOLS.social;
  } else if (text.includes('fine') || text.includes('good') || text.includes('great') || text.includes('steady') || text.includes('okay') || text.includes('peaceful')) {
    pool = ACKNOWLEDGMENT_POOLS.steady;
  }

  // Pick a candidate that isn't identical to the last one used
  const candidates = pool.filter((ack) => ack !== lastUsedAcknowledgment);
  const selected = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : pool[0];

  lastUsedAcknowledgment = selected;
  return selected;
}

// ---------------------------------------------------------------------------
// Soft Progress Messaging (No Rigid "Question X of Y" Counters)
// ---------------------------------------------------------------------------
export function getFriendlyProgress(questionIndex = 1, currentTheme = 'mood') {
  if (currentTheme === 'mood') {
    return "Beginning your reflection • Tuning into your space";
  }
  if (currentTheme === 'sleep') {
    return "Reflecting on your rest and nighttime recovery";
  }
  if (currentTheme === 'stress') {
    return "Noticing what's weighing on your mind";
  }
  if (currentTheme === 'energy') {
    return "Noticing your daily pace and vitality";
  }
  if (currentTheme === 'social_connection') {
    return "Reflecting on your support and connections";
  }
  if (currentTheme === 'coping') {
    return "Noticing your grounding anchors • Wrapping up";
  }

  if (questionIndex === 1) return "Beginning your reflection • In quiet pause";
  if (questionIndex === 2) return "Reflecting on your rest and energy";
  if (questionIndex === 3) return "Exploring what's on your mind";
  return "Noticing your coping strengths • Wrapping up";
}
