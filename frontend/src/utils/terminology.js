/**
 * MindVision Clinical AI - Human-Friendly Terminology & Progressive Disclosure Layer
 * 
 * Maps internal clinical/engineering concepts to understandable, non-alarming
 * language for patients while preserving technical definitions for clinicians and researchers.
 */

export const TERMINOLOGY_MAP = {
  // Biometrics & Facial FACS
  au4: {
    technical: 'AU04 Eyebrow Furrow Stress (Corrugator)',
    human: 'Facial tension (brow)',
    description: 'Subtle tension around the brow area, often associated with concentration, stress, or emotional conflict.'
  },
  au15: {
    technical: 'AU15 Lip Corner Depressor (DAO)',
    human: 'Facial expression change (mouth)',
    description: 'Subtle downward pull of the mouth corners, commonly linked to fatigue, sadness, or discouragement.'
  },
  acousticJitter: {
    technical: 'Acoustic Pitch Tremor / F0 Jitter (wav2vec2)',
    human: 'Voice variation',
    description: 'Micro-fluctuations in vocal stability and pitch rhythm during speaking.'
  },
  prosody: {
    technical: 'Prosodic Energy Flattening',
    human: 'Changes in speaking pattern',
    description: 'Changes in the natural melodic rhythm, volume, and pacing of speech.'
  },
  sentiment: {
    technical: 'Linguistic Sentiment Polarity (DeBERTa-v3)',
    human: 'What you reported',
    description: 'Words and emotional themes expressed in your verbal or written statements.'
  },
  incongruence: {
    technical: 'Cross-Modal Incongruence (Somatic Masking)',
    human: 'Difference between verbal and physical signals',
    description: 'When spoken words suggest one feeling while voice or facial micro-expressions suggest another.'
  },
  compositeRisk: {
    technical: 'Composite Risk Indicator (0.0 - 10.0)',
    human: 'Overall stress indicators',
    description: 'Combined pattern score derived across voice, facial expressions, and written answers.'
  },
  confidence: {
    technical: 'Bayesian Model Confidence / Tensor Quality',
    human: 'Result confidence',
    description: 'Indicates how strongly the available signals support this assessment pattern.'
  },
  dataQuality: {
    technical: 'Hardware Signal-to-Noise Ratio & Tracking Stability',
    human: 'Signal quality',
    description: 'Indicates how clear your camera lighting and microphone audio were during the check-in.'
  },
  wasmStatus: {
    technical: 'Client-Side WASM Privacy Sandbox',
    human: 'Private on-device processing',
    description: 'All audio and video analysis runs completely inside your browser. No biometric recordings leave your device.'
  }
};

/**
 * Maps a risk level and score to reassuring, non-alarming human status.
 */
export function getHumanStatus(riskLevel = 'MINIMAL', compositeScore = 1.0) {
  const score = typeof compositeScore === 'number' ? compositeScore : parseFloat(compositeScore) || 0;
  const level = (riskLevel || '').toUpperCase();

  if (level === 'SEVERE' || score >= 7.0) {
    return {
      statusKey: 'ATTENTION',
      icon: '🔴',
      title: 'Immediate support recommended',
      subtitle: 'We detected noticeable patterns of distress across your check-in signals.',
      color: 'var(--status-severe-text, #ef4444)',
      bgColor: 'var(--status-severe-bg, rgba(239, 68, 68, 0.12))',
      borderColor: 'var(--status-severe-border, rgba(239, 68, 68, 0.3))',
      actionText: 'Connect with an On-Call Clinician',
      urgency: 'HIGH'
    };
  }

  if (level === 'ELEVATED' || score >= 5.0) {
    return {
      statusKey: 'ELEVATED',
      icon: '🟠',
      title: 'Elevated stress indicators',
      subtitle: 'We noticed patterns across your voice, facial signals, and answers that suggest ongoing stress.',
      color: 'var(--status-elevated-text, #f97316)',
      bgColor: 'var(--status-elevated-bg, rgba(249, 115, 22, 0.12))',
      borderColor: 'var(--status-elevated-border, rgba(249, 115, 22, 0.3))',
      actionText: 'Review Support Options with a Clinician',
      urgency: 'MODERATE'
    };
  }

  if (level === 'MODERATE' || score >= 3.0) {
    return {
      statusKey: 'MODERATE',
      icon: '🟡',
      title: 'Some signs of stress',
      subtitle: 'We noticed a few subtle patterns in your voice or facial tension that may be associated with stress or fatigue.',
      color: 'var(--status-moderate-text, #eab308)',
      bgColor: 'var(--status-moderate-bg, rgba(234, 179, 8, 0.12))',
      borderColor: 'var(--status-moderate-border, rgba(234, 179, 8, 0.3))',
      actionText: 'Explore Self-Care & Follow-up Guidance',
      urgency: 'MILD'
    };
  }

  return {
    statusKey: 'STEADY',
    icon: '🟢',
    title: 'Steady pattern reported',
    subtitle: 'Your self-reported answers and estimated signals reflect a steady, calm pattern today.',
    color: 'var(--status-minimal-text, #10b981)',
    bgColor: 'var(--status-minimal-bg, rgba(16, 185, 129, 0.12))',
    borderColor: 'var(--status-minimal-border, rgba(16, 185, 129, 0.3))',
    actionText: 'Keep Up Your Wellness Routine',
    urgency: 'LOW'
  };
}

/**
 * Generate 3 clean, human-understandable "What We Noticed" observation cards.
 */
export function getHumanObservations(metrics = {}) {
  const au4 = metrics.au4 !== undefined ? metrics.au4 : 0.4;
  const au15 = metrics.au15 !== undefined ? metrics.au15 : 0.3;
  const jitter = metrics.acousticJitter !== undefined ? metrics.acousticJitter : 0.3;
  const sentiment = metrics.sentiment !== undefined ? metrics.sentiment : 0.3;
  const incongruence = metrics.incongruence !== undefined ? metrics.incongruence : 0.2;

  // Voice observation
  let voiceNote = 'Your voice sounded steady and consistent with a relaxed baseline.';
  if (jitter > 0.6) {
    voiceNote = 'We noticed noticeable fluctuations in vocal pitch stability, which often accompany emotional fatigue or anxiety.';
  } else if (jitter > 0.35) {
    voiceNote = 'Some slight variations in voice tone were observed, which can occur with tiredness or mild stress.';
  }

  // Response / Language observation
  let responseNote = 'Your written statements reflect comfortable coping and balanced daily function.';
  if (sentiment > 0.6) {
    responseNote = 'Your responses suggest you may be carrying significant emotional burden or high workload pressure.';
  } else if (sentiment > 0.3) {
    responseNote = 'Your responses mention feelings of fatigue, work pressure, or reduced energy.';
  }

  // Facial signals observation
  let facialNote = 'Your facial expressions appeared relaxed without significant forehead or jaw tension.';
  if (au4 > 0.6 || au15 > 0.6) {
    facialNote = 'We noticed elevated tension around the brow and mouth, which can reflect subconscious stress or emotional suppression.';
  } else if (au4 > 0.35 || au15 > 0.35) {
    facialNote = 'Subtle signs of brow or facial engagement were observed during check-in questions.';
  }

  // Differences between signals
  let signalDivergence = null;
  if (incongruence > 0.45) {
    signalDivergence = 'Your spoken answers sounded calm, but your facial tension and voice patterns suggested you might be holding back stress.';
  }

  return {
    voice: voiceNote,
    responses: responseNote,
    facial: facialNote,
    divergence: signalDivergence
  };
}

/**
 * Standard ethical disclaimer required across the platform.
 */
export const CLINICAL_DISCLAIMER = 'MindVision provides clinical decision-support and stress indicator tracking. These results are indicators to support awareness and clinician discussion, not an autonomous medical diagnosis.';

export const SIMULATION_NOTICE = 'SIMULATION MODE: These demonstration values use simulated telemetry to illustrate how multimodal indicators respond.';
