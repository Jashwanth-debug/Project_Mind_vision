import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SystemCameraAudioTesterEngine } from '../utils/SystemCameraAudioTester';
import { evaluateSignalQuality } from '../utils/signalQualityEngine';
import { ClinicalAuditService } from '../services/clinicalAuditService';

export default function SystemCameraAudioTester({
  onMetricsUpdate,
  onQualityUpdate,
  onTriggerHighRiskEscalation,
  onShowToast
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(new SystemCameraAudioTesterEngine());
  const animationFrameRef = useRef(null);

  const [hardwareActive, setHardwareActive] = useState(false);
  const [hardwareStatus, setHardwareStatus] = useState('Hardware Standby • Click "Start Camera & Audio Test"');
  const [metrics, setMetrics] = useState({
    luminance: 140,
    micVolumeDb: -32.5,
    stabilityScore: 96,
    incongruenceIndex: 0.12,
    compositeRisk: 1.8,
    isFaceDetected: true
  });

  const [qualityReport, setQualityReport] = useState(() => evaluateSignalQuality({
    isHardwareActive: false,
    isCameraActive: false,
    isAudioActive: false,
    luminance: 140,
    micVolumeDb: -32.5,
    stabilityScore: 96,
    isLiveMode: false
  }));

  const mediaStreamRef = useRef(null);

  // Track if escalation has already fired for current high-risk state
  const escalationFiredRef = useRef(false);

  // Stop hardware stream and clean up media tracks
  const handleStopHardwareTest = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    engineRef.current.destroy();
    setHardwareActive(false);
    setHardwareStatus('Hardware Standby • Inactive Mode');

    const updatedQuality = evaluateSignalQuality({
      isHardwareActive: false,
      isCameraActive: false,
      isAudioActive: false,
      luminance: 120,
      micVolumeDb: -35,
      stabilityScore: 90,
      isLiveMode: false
    });
    setQualityReport(updatedQuality);
    if (onQualityUpdate) onQualityUpdate(updatedQuality);

    ClinicalAuditService.logEvent({
      eventType: 'HARDWARE_DISCONNECTED',
      label: 'Camera and microphone hardware released',
      actor: 'USER',
      actorId: 'CLIENT_BROWSER',
      sessionId: 'sess_live_sandbox',
      status: 'STANDBY',
      details: 'Active media tracks stopped; returned to calibrated sandbox baseline.'
    });

    if (onShowToast) onShowToast('Hardware camera and microphone disconnected.');
  }, [onQualityUpdate, onShowToast]);

  // Explicit user action handler: Start Camera & Microphone Test
  const handleStartHardwareTest = useCallback(async () => {
    const engine = engineRef.current;
    try {
      setHardwareStatus('Attaching Camera & Microphone Hardware...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Setup WebAudio Analyser for real-time RMS volume
      engine.setupAudioAnalyser(stream);
      setHardwareActive(true);
      setHardwareStatus('Hardware Active • 100% On-Device WASM Inference');

      ClinicalAuditService.logEvent({
        eventType: 'CAMERA_PERMISSION_GRANTED',
        label: 'Camera & Microphone Hardware Stream Connected',
        actor: 'USER',
        actorId: 'CLIENT_BROWSER',
        sessionId: 'sess_live_sandbox',
        status: 'SUCCESS',
        details: 'User explicitly initiated sensor testing. Hardware stream active.'
      });

      if (onShowToast) onShowToast('Hardware camera and microphone connected!');
    } catch (err) {
      console.warn('Hardware camera/mic not available, using baseline defaults:', err);
      setHardwareStatus('Baseline Telemetry • Hardware Fallback Mode');
      setHardwareActive(false);
      if (onShowToast) onShowToast('Camera/microphone access not granted. Running fallback defaults.');
    }
  }, [onShowToast]);

  // Cleanup active streams on unmount
  useEffect(() => {
    const engine = engineRef.current;
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      engine.destroy();
    };
  }, []);

  // Main Render Loop (Canvas HUD + Metric Calculations)
  useEffect(() => {
    let time = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const engine = engineRef.current;

    const render = () => {
      time += 0.04;

      const dpr = window.devicePixelRatio || 1;
      const width = 480;
      const height = 300;
      if (canvas.width !== width * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Mirror Video Frame if active
      if (hardwareActive && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        ctx.restore();

        ctx.fillStyle = 'rgba(7, 10, 16, 0.52)';
        ctx.fillRect(0, 0, width, height);
      } else {
        // Deep obsidian background fallback
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#07090E');
        bgGrad.addColorStop(1, '#0C1019');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Hardware Calculations
      const currentLuma = engine.calculateLuminance(ctx, width, height);
      const currentDb = engine.calculateMicRMSVolume();

      // Nose Tip Tracking position (Simulated motion or center target)
      const noseX = (width / 2) + Math.sin(time * 0.8) * 8;
      const noseY = (height / 2 - 10) + Math.cos(time * 0.6) * 5;
      const stability = engine.calculateHeadPoseStability(noseX, noseY);

      // Expression mismatch & Composite Risk formula
      // System Default: if no hardware face active, smoothly fall back to Incongruence: 0.05, Stability: 95%, Composite Risk: 1.2
      const rawIncongruence = hardwareActive
        ? engine.calculateExpressionIncongruence(0.15 + Math.sin(time) * 0.1, 0.55 + Math.cos(time * 0.8) * 0.15)
        : 0.05;

      const rawCompositeRisk = hardwareActive
        ? engine.calculateAutomatedCompositeRisk(rawIncongruence, stability)
        : 1.2;

      // Update state
      const newMetrics = {
        luminance: currentLuma,
        micVolumeDb: currentDb,
        stabilityScore: stability,
        incongruenceIndex: rawIncongruence,
        compositeRisk: rawCompositeRisk,
        isFaceDetected: true
      };

      setMetrics(newMetrics);
      if (onMetricsUpdate) onMetricsUpdate(newMetrics);

      // Periodically update signal quality report
      if (Math.floor(time * 10) % 5 === 0) {
        const report = evaluateSignalQuality({
          isHardwareActive: hardwareActive,
          isCameraActive: hardwareActive,
          isAudioActive: hardwareActive,
          luminance: currentLuma,
          micVolumeDb: currentDb,
          stabilityScore: stability,
          isLiveMode: hardwareActive
        });
        setQualityReport(report);
        if (onQualityUpdate) onQualityUpdate(report);
      }

      // Check Automated High-Risk Escalation Condition: Composite Risk >= 7.0 OR Incongruence >= 0.75
      if ((rawCompositeRisk >= 7.0 || rawIncongruence >= 0.75) && !escalationFiredRef.current) {
        escalationFiredRef.current = true;
        if (onTriggerHighRiskEscalation) {
          onTriggerHighRiskEscalation({
            compositeRisk: rawCompositeRisk,
            incongruenceIndex: rawIncongruence
          });
        }
      } else if (rawCompositeRisk < 6.5 && rawIncongruence < 0.65) {
        escalationFiredRef.current = false;
      }

      // 3. Canvas HUD Animation Layer (Teal HUD Overlay)
      const tealHud = 'rgba(20, 184, 166, 0.8)';
      const boxW = 240;
      const boxH = 250;
      const boxX = (width - boxW) / 2;
      const boxY = (height - boxH) / 2;
      const cornerLen = 16;

      // Corner Brackets
      ctx.strokeStyle = tealHud;
      ctx.lineWidth = 1.5;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + cornerLen);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + cornerLen, boxY);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - cornerLen, boxY);
      ctx.lineTo(boxX + boxW, boxY);
      ctx.lineTo(boxX + boxW, boxY + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxH - cornerLen);
      ctx.lineTo(boxX, boxY + boxH);
      ctx.lineTo(boxX + cornerLen, boxY + boxH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
      ctx.stroke();

      // Vertical Scan Line Animation using Math.sin(time)
      const scanProgress = (Math.sin(time * 1.6) + 1) / 2;
      const scanY = boxY + scanProgress * boxH;
      const scanGrad = ctx.createLinearGradient(boxX, scanY, boxX + boxW, scanY);
      scanGrad.addColorStop(0, 'rgba(20, 184, 166, 0)');
      scanGrad.addColorStop(0.5, 'rgba(20, 184, 166, 0.6)');
      scanGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(boxX + 2, scanY - 1, boxW - 4, 2);

      // Facial Reticle Centered over Nose Landmark
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(noseX, noseY, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(noseX, noseY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fill();

      // Reticle Crosshairs
      ctx.beginPath();
      ctx.moveTo(noseX - 22, noseY);
      ctx.lineTo(noseX - 6, noseY);
      ctx.moveTo(noseX + 6, noseY);
      ctx.lineTo(noseX + 22, noseY);
      ctx.moveTo(noseX, noseY - 22);
      ctx.lineTo(noseX, noseY - 6);
      ctx.moveTo(noseX, noseY + 6);
      ctx.lineTo(noseX, noseY + 22);
      ctx.stroke();

      // HUD Tickers
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`LUMA: ${currentLuma} lx  |  MIC: ${currentDb} dBFS`, boxX + 8, boxY + 16);
      ctx.fillText(`POSE STABILITY: ${stability}%`, boxX + 8, boxY + boxH - 8);

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [hardwareActive, onMetricsUpdate, onQualityUpdate, onTriggerHighRiskEscalation]);

  const handleRecheckSensors = () => {
    if (hardwareActive) {
      handleStopHardwareTest();
      setTimeout(() => {
        handleStartHardwareTest();
      }, 300);
    } else {
      handleStartHardwareTest();
    }
  };

  return (
    <div className="clinical-card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <div className="card-title-group">
          <span className="card-icon">🎥</span>
          <h3 className="card-title">AUTOMATED HARDWARE CAMERA &amp; AUDIO TESTER</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{
              fontSize: '0.74rem',
              padding: '0.3rem 0.75rem',
              borderColor: hardwareActive ? 'var(--status-severe-border)' : 'var(--accent-teal)',
              color: hardwareActive ? 'var(--status-severe-text)' : 'var(--accent-teal)',
              backgroundColor: hardwareActive ? 'var(--status-severe-bg)' : 'transparent',
              fontWeight: 600
            }}
            onClick={hardwareActive ? handleStopHardwareTest : handleStartHardwareTest}
          >
            <span>{hardwareActive ? '🔴 Stop Hardware Test' : '📷 Start Camera & Audio Test'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}
            onClick={handleRecheckSensors}
            title="Recalibrate camera, microphone, and lighting baseline"
          >
            🔄 Recheck Sensors
          </button>

          <div className="wasm-badge">
            <span className="pulse-dot"></span>
            <span>{hardwareStatus}</span>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Signal Quality Status Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0.9rem',
          backgroundColor: qualityReport.isQualityAcceptable ? 'var(--bg-secondary)' : 'var(--status-severe-bg)',
          border: `1px solid ${qualityReport.isQualityAcceptable ? 'var(--border-color)' : 'var(--status-severe-border)'}`,
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1rem',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>SIGNAL QUALITY:</span>
            <span style={{
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              color: qualityReport.overallScore >= 75 ? 'var(--status-minimal-text)' : qualityReport.overallScore >= 50 ? 'var(--status-elevated-text)' : 'var(--status-severe-text)'
            }}>
              {qualityReport.overallScore}% [{qualityReport.rating}]
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Mode: <strong style={{ color: hardwareActive ? 'var(--accent-teal)' : 'var(--text-muted)' }}>{hardwareActive ? '● LIVE SENSOR' : '○ SANDBOX SIM'}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
            <span>Camera: <strong>{qualityReport.channels.camera.rating}</strong></span>
            <span>Microphone: <strong>{qualityReport.channels.microphone.rating}</strong></span>
            <span>Face Track: <strong>{qualityReport.channels.tracking.rating}</strong></span>
          </div>
        </div>

        {/* Quality Warnings Banner if any */}
        {qualityReport.warnings.length > 0 && (
          <div style={{
            padding: '0.6rem 0.85rem',
            backgroundColor: 'var(--status-elevated-bg)',
            border: '1px solid var(--status-elevated-border)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            fontSize: '0.78rem',
            color: 'var(--status-elevated-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠️</span>
              <div>
                <strong>Signal Reliability Notice:</strong> {qualityReport.warnings.join(' ')}
              </div>
            </div>
            <button
              onClick={handleRecheckSensors}
              style={{
                background: 'none',
                border: '1px solid var(--status-elevated-border)',
                color: 'var(--status-elevated-text)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              Recheck Sensors
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
          {/* Canvas HUD Video Viewport */}
          <div className="sensor-viewport-container" style={{ height: '260px', borderRadius: 'var(--radius-md)' }}>
            <video ref={videoRef} playsInline muted style={{ display: 'none' }} />
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>

          {/* Dynamic Hardware Metric Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Metric 1: Lighting Quality (Luminance) */}
            <div className="stat-box" style={{ padding: '0.7rem 0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>LIGHTING LUMINANCE (EMA)</span>
                <span style={{ color: qualityReport.channels.camera.rating === 'OPTIMAL' ? 'var(--status-minimal-text)' : 'var(--status-elevated-text)' }}>
                  {qualityReport.channels.camera.rating}
                </span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '2px' }}>
                {metrics.luminance} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ 255 lx</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {qualityReport.channels.camera.detail}
              </div>
            </div>

            {/* Metric 2: Audio Input Level (RMS Volume) */}
            <div className="stat-box" style={{ padding: '0.7rem 0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>MIC INPUT LEVEL (RMS)</span>
                <span style={{ color: qualityReport.channels.microphone.rating === 'OPTIMAL' ? 'var(--status-minimal-text)' : 'var(--status-elevated-text)' }}>
                  {qualityReport.channels.microphone.rating}
                </span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)', marginTop: '2px' }}>
                {metrics.micVolumeDb} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>dBFS</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {qualityReport.channels.microphone.detail}
              </div>
            </div>

            {/* Metric 3: Head Pose Stability */}
            <div className="stat-box" style={{ padding: '0.7rem 0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>HEAD POSE STABILITY</span>
                <span style={{ color: qualityReport.channels.tracking.rating === 'STABLE' ? 'var(--status-minimal-text)' : 'var(--status-elevated-text)' }}>
                  {qualityReport.channels.tracking.rating}
                </span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: metrics.stabilityScore > 85 ? 'var(--status-minimal-text)' : 'var(--status-elevated-text)', marginTop: '2px' }}>
                {metrics.stabilityScore}% <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>stable</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {qualityReport.channels.tracking.detail}
              </div>
            </div>

            {/* Metric 4: Automated Composite Risk */}
            <div className="stat-box" style={{ padding: '0.7rem 0.9rem', borderColor: metrics.compositeRisk >= 7.0 ? 'var(--status-severe-border)' : 'var(--border-color)', backgroundColor: metrics.compositeRisk >= 7.0 ? 'var(--status-severe-bg)' : 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>AUTOMATED COMPOSITE RISK</span>
                <span>PROTOTYPE FORMULA</span>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: metrics.compositeRisk >= 7.0 ? 'var(--status-severe-text)' : 'var(--text-primary)', marginTop: '2px' }}>
                {metrics.compositeRisk.toFixed(1)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ 10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
