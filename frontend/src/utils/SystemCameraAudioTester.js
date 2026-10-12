/**
 * MindVision Clinical AI - Automated Camera & Audio Tester Engine
 * Dynamically computes Luminance, Mic RMS Volume, Incongruence, Pose Stability, and Composite Risk.
 */

export class SystemCameraAudioTesterEngine {
  constructor() {
    this.emaLuminance = 120; // Default baseline luminance (0-255)
    this.previousNosePos = null;
    this.stabilityHistory = [];
    this.audioContext = null;
    this.analyser = null;
    this.freqData = new Uint8Array(64);
  }

  // 1. Calculate Frame Brightness (Luminance) via Canvas sampling with Exponential Moving Average (EMA)
  calculateLuminance(ctx, width, height) {
    if (!ctx || width === 0 || height === 0) return 120;

    try {
      // Sample 32x32 center grid for efficiency
      const sampleW = Math.min(32, width);
      const sampleH = Math.min(32, height);
      const imgData = ctx.getImageData((width - sampleW) / 2, (height - sampleH) / 2, sampleW, sampleH);
      const data = imgData.data;

      let totalLuma = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Standard ITU-R BT.601 perceived luminance formula
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuma += luma;
        count++;
      }

      const currentLuma = count > 0 ? totalLuma / count : 120;
      // Exponential Moving Average (EMA alpha = 0.15) to prevent visual flickering
      this.emaLuminance = 0.85 * this.emaLuminance + 0.15 * currentLuma;
      return Math.round(this.emaLuminance);
    } catch {
      return 120;
    }
  }

  // 2. Calculate Real-Time Audio Input Level (RMS Volume) via WebAudio AnalyserNode
  setupAudioAnalyser(audioStream) {
    if (!audioStream) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(audioStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);
    } catch (e) {
      console.warn('Audio analyser setup fallback:', e);
    }
  }

  calculateMicRMSVolume() {
    if (!this.analyser) return -35; // Default quiet background

    this.analyser.getByteFrequencyData(this.freqData);
    let sumSquares = 0;
    for (let i = 0; i < this.freqData.length; i++) {
      const norm = this.freqData[i] / 255;
      sumSquares += norm * norm;
    }
    const rms = Math.sqrt(sumSquares / this.freqData.length);
    // Convert RMS to approximate dBFS (-60 to 0 dBFS)
    const db = -60 + rms * 60;
    return Math.max(-60, Math.min(0, parseFloat(db.toFixed(1))));
  }

  // 3. Head Pose Stability (tracking nose tip spatial variance across frames)
  calculateHeadPoseStability(currentNoseX, currentNoseY) {
    if (currentNoseX === undefined || currentNoseY === undefined) {
      return 95; // Default system baseline stability
    }

    if (!this.previousNosePos) {
      this.previousNosePos = { x: currentNoseX, y: currentNoseY };
      return 95;
    }

    const deltaX = Math.abs(currentNoseX - this.previousNosePos.x);
    const deltaY = Math.abs(currentNoseY - this.previousNosePos.y);
    const displacement = Math.hypot(deltaX, deltaY);

    this.previousNosePos = { x: currentNoseX, y: currentNoseY };

    // Convert spatial shift into stability percentage (0-100%)
    const rawStability = 100 - Math.min(60, displacement * 2.5);
    this.stabilityHistory.push(rawStability);
    if (this.stabilityHistory.length > 20) this.stabilityHistory.shift();

    const avgStability = this.stabilityHistory.reduce((a, b) => a + b, 0) / this.stabilityHistory.length;
    return Math.max(40, Math.min(100, Math.round(avgStability)));
  }

  // 4. Incongruence Index (Expression Mismatch: Math.max(0, avgSmile - eyeSquint))
  calculateExpressionIncongruence(avgSmile = 0.1, eyeSquint = 0.6) {
    const rawDiff = avgSmile - eyeSquint;
    return parseFloat(Math.max(0, Math.min(1.0, rawDiff)).toFixed(2));
  }

  // 5. Automated Composite Risk Calculation Formula
  // Composite Risk = 1.0 + (IncongruenceIndex * 6.0) + ((100 - StabilityScore) / 20)
  calculateAutomatedCompositeRisk(incongruenceIndex, stabilityScore) {
    const risk = 1.0 + (incongruenceIndex * 6.0) + ((100 - stabilityScore) / 20);
    return Math.min(10.0, Math.max(1.0, parseFloat(risk.toFixed(1))));
  }

  destroy() {
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {
        // Ignored
      }
    }
  }
}
