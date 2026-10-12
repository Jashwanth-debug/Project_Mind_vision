/**
 * MindVision Clinical AI - Signal Quality & Data Reliability Engine
 * 
 * Provides rigorous hardware input quality analysis:
 * - Camera illumination (ITU-R BT.601 luminance)
 * - Microphone level & saturation (dBFS dynamic range)
 * - Facial landmark / head pose tracking stability
 * - Modality presence & provenance (LIVE vs SANDBOX)
 * 
 * IMPORTANT: Separates Prototype Analytical Indicators from Data Reliability & Confidence.
 * Never claims medical diagnosis or uncalibrated statistical probabilities.
 */

export const SIGNAL_THRESHOLDS = {
  LUMINANCE: {
    UNDEREXPOSED: 60,
    OPTIMAL_MIN: 60,
    OPTIMAL_MAX: 210,
    GLARE: 210
  },
  MIC_DBFS: {
    SILENCE: -48,
    NOMINAL_MIN: -48,
    NOMINAL_MAX: -8,
    CLIPPING: -8
  },
  STABILITY: {
    STABLE: 85,
    MODERATE: 65
  }
};

/**
 * Evaluates individual signal channels and produces an overall Signal Quality & Reliability Report.
 */
export function evaluateSignalQuality({
  isHardwareActive = false,
  isCameraActive = false,
  isAudioActive = false,
  luminance = 120,
  micVolumeDb = -32.5,
  stabilityScore = 95,
  hasQuestionnaire = true,
  isLiveMode = false
} = {}) {
  // 1. Camera Illumination / Quality
  let lightingStatus = 'OPTIMAL';
  let lightingScore = 95;
  let lightingDetail = 'Illumination within nominal range (60–210 luma).';

  if (!isHardwareActive && !isLiveMode) {
    lightingStatus = 'SANDBOX_SIM';
    lightingScore = 80;
    lightingDetail = 'Simulated lighting baseline in Sandbox mode.';
  } else if (luminance < SIGNAL_THRESHOLDS.LUMINANCE.UNDEREXPOSED) {
    lightingStatus = 'UNDEREXPOSED';
    lightingScore = Math.max(30, Math.round((luminance / 60) * 55));
    lightingDetail = 'Insufficient ambient lighting. May reduce reliability of facial action unit extraction.';
  } else if (luminance > SIGNAL_THRESHOLDS.LUMINANCE.GLARE) {
    lightingStatus = 'GLARE';
    lightingScore = Math.max(40, Math.round(95 - ((luminance - 210) / 45) * 40));
    lightingDetail = 'High surface glare/overexposure detected on facial landmarks.';
  } else {
    lightingStatus = 'OPTIMAL';
    lightingScore = 95;
    lightingDetail = 'Illumination optimal for facial feature tracking.';
  }

  // 2. Microphone Input Level / Audio Quality
  let audioStatus = 'OPTIMAL';
  let audioScore = 92;
  let audioDetail = 'Audio RMS level within nominal dynamic range (-48 to -8 dBFS).';

  if (!isHardwareActive && !isLiveMode) {
    audioStatus = 'SANDBOX_SIM';
    audioScore = 85;
    audioDetail = 'Calibrated acoustic parameters in Sandbox mode.';
  } else if (micVolumeDb < SIGNAL_THRESHOLDS.MIC_DBFS.SILENCE) {
    audioStatus = 'LOW_SIGNAL';
    audioScore = Math.max(35, Math.round(35 + ((micVolumeDb + 60) / 12) * 25));
    audioDetail = 'Microphone signal near noise floor. Prosody & vocal tremor analysis degraded.';
  } else if (micVolumeDb > SIGNAL_THRESHOLDS.MIC_DBFS.CLIPPING) {
    audioStatus = 'CLIPPING';
    audioScore = 55;
    audioDetail = 'Audio clipping/saturation risk detected. Pitch harmonics may be clipped.';
  } else {
    audioStatus = 'OPTIMAL';
    audioScore = 94;
    audioDetail = 'Microphone input clear with balanced signal-to-noise ratio.';
  }

  // 3. Facial Landmark & Head Pose Stability
  let trackingStatus = 'STABLE';
  let trackingScore = 95;
  let trackingDetail = 'Head pose variance within steady calibration boundaries.';

  if (!isHardwareActive && !isLiveMode) {
    trackingStatus = 'SANDBOX_SIM';
    trackingScore = 90;
    trackingDetail = 'Synthesized landmark stability baseline.';
  } else if (stabilityScore >= SIGNAL_THRESHOLDS.STABILITY.STABLE) {
    trackingStatus = 'STABLE';
    trackingScore = stabilityScore;
    trackingDetail = 'Face landmarks securely locked with minimal spatial jitter.';
  } else if (stabilityScore >= SIGNAL_THRESHOLDS.STABILITY.MODERATE) {
    trackingStatus = 'MODERATE';
    trackingScore = stabilityScore;
    trackingDetail = 'Moderate head motion or frame displacement observed.';
  } else {
    trackingStatus = 'UNSTABLE';
    trackingScore = Math.max(35, stabilityScore);
    trackingDetail = 'High rotational displacement. Facial movement vectors may exhibit artifacting.';
  }

  // Camera stream availability
  const cameraAvailable = isLiveMode ? isCameraActive : true;
  const micAvailable = isLiveMode ? isAudioActive : true;

  // 4. Overall Signal Quality Score (0-100%)
  // Weighted: Lighting (30%), Audio (35%), Tracking (35%)
  let compositeQuality = Math.round(
    (lightingScore * 0.30) + (audioScore * 0.35) + (trackingScore * 0.35)
  );

  // If live mode is on but hardware stream is dropped, penalty applies
  if (isLiveMode && (!cameraAvailable || !micAvailable)) {
    compositeQuality = Math.min(compositeQuality, 42);
  }

  let qualityRating = 'OPTIMAL';
  if (compositeQuality < 50) {
    qualityRating = 'DEGRADED';
  } else if (compositeQuality < 75) {
    qualityRating = 'MODERATE';
  } else {
    qualityRating = 'GOOD';
  }

  // 5. Clinical Quality Warnings
  const warnings = [];
  if (lightingStatus === 'UNDEREXPOSED') {
    warnings.push('Insufficient lighting may reduce reliability of facial movement analysis.');
  }
  if (lightingStatus === 'GLARE') {
    warnings.push('High specular glare may distort landmark coordinates around brow and mouth.');
  }
  if (audioStatus === 'LOW_SIGNAL') {
    warnings.push('Low microphone input level; acoustic prosody & tremor metrics have reduced precision.');
  }
  if (audioStatus === 'CLIPPING') {
    warnings.push('Acoustic clipping detected; vocal dynamics may be artificially compressed.');
  }
  if (trackingStatus === 'UNSTABLE') {
    warnings.push('Frequent head movements or frame drops detected; re-center subject in viewport.');
  }

  // 6. Signal-Derived Prototype Confidence (0-100%)
  // Confidence depends on:
  // - Signal quality
  // - Multi-channel availability (Face + Voice + Questionnaire)
  // - Mode provenance (Live hardware telemetry vs sandbox test values)
  let activeModalitiesCount = 0;
  if (cameraAvailable) activeModalitiesCount++;
  if (micAvailable) activeModalitiesCount++;
  if (hasQuestionnaire) activeModalitiesCount++;

  const modalityCoverageFactor = activeModalitiesCount / 3; // 0.33, 0.66, or 1.00
  const baseConfidence = compositeQuality * 0.85;
  const analysisConfidence = Math.min(
    95,
    Math.max(30, Math.round(baseConfidence * modalityCoverageFactor + (isLiveMode ? 8 : 4)))
  );

  return {
    overallScore: compositeQuality,
    rating: qualityRating, // GOOD, MODERATE, DEGRADED
    confidenceScore: analysisConfidence,
    confidenceLabel: 'Signal-derived prototype confidence',
    mode: isLiveMode ? 'LIVE' : 'SANDBOX',
    channels: {
      camera: {
        status: isHardwareActive || !isLiveMode ? 'ACTIVE' : 'INACTIVE',
        rating: lightingStatus,
        score: lightingScore,
        metric: `${luminance} Luma`,
        detail: lightingDetail
      },
      microphone: {
        status: isHardwareActive || !isLiveMode ? 'ACTIVE' : 'INACTIVE',
        rating: audioStatus,
        score: audioScore,
        metric: `${micVolumeDb} dBFS`,
        detail: audioDetail
      },
      tracking: {
        status: isHardwareActive || !isLiveMode ? 'LOCKED' : 'SYNTHETIC',
        rating: trackingStatus,
        score: trackingScore,
        metric: `${stabilityScore}% Stability`,
        detail: trackingDetail
      }
    },
    warnings,
    isQualityAcceptable: compositeQuality >= 60,
    timestamp: new Date().toISOString()
  };
}
