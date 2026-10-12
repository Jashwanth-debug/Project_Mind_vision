import React, { useState, useEffect, useRef } from 'react';

export default function TeletherapyRoomModal({
  session,
  onClose,
  onFinalizeSession,
  onShowToast
}) {
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [finalInvoice, setFinalInvoice] = useState(null);

  const patientVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Live session timer & cost calculation
  useEffect(() => {
    if (!session || showInvoiceModal) return;

    const timer = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [session, showInvoiceModal]);

  // Start patient webcam for Picture-in-Picture feed
  useEffect(() => {
    if (!session) return;

    const initPatientCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        mediaStreamRef.current = stream;
        if (patientVideoRef.current) {
          patientVideoRef.current.srcObject = stream;
          patientVideoRef.current.play();
        }
      } catch (err) {
        console.warn('Patient webcam not available for teletherapy PIP:', err);
      }
    };

    initPatientCam();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [session]);

  if (!session) return null;

  const { doctor, telemetrySnapshot } = session;
  const rateMin = doctor.ratePerMinute !== undefined ? doctor.ratePerMinute : 12;
  const isFree = rateMin === 0;
  const currentCost = isFree ? '0.00' : (Math.max(1, Math.ceil(durationSeconds / 60)) * rateMin).toFixed(2);

  // Format seconds into MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // End Session & Finalize Billing
  const handleEndSession = () => {
    const invoice = {
      sessionId: session.sessionId,
      doctorName: doctor.name,
      doctorTitle: doctor.title,
      ratePerMinute: rateMin,
      durationFormatted: formatTime(durationSeconds),
      totalSeconds: durationSeconds,
      totalCharged: isFree ? '0.00' : (Math.max(1, Math.ceil(durationSeconds / 60)) * rateMin).toFixed(2),
      transactionRef: `pay_inr_${Math.random().toString(36).substring(2, 12)}`,
      timestamp: new Date().toLocaleString(),
      telemetrySnapshot
    };
    setFinalInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleCloseInvoice = () => {
    onFinalizeSession(finalInvoice);
    onClose();
    onShowToast(`Teletherapy session finalized. Invoice ₹${finalInvoice.totalCharged} billed via Razorpay / UPI.`);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-dialog" style={{ maxWidth: '1080px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Teletherapy Room Header & Metering Bar */}
        <div className="modal-header" style={{ background: 'var(--card-bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img
              src={doctor.avatarUrl}
              alt={doctor.name}
              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 className="modal-title" style={{ fontSize: '0.95rem' }}>{doctor.name}</h3>
                <span className="wasm-badge" style={{ backgroundColor: 'var(--status-minimal-bg)', color: 'var(--status-minimal-text)', fontSize: '0.68rem' }}>
                  ● ACTIVE 1080p WebRTC
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{doctor.title}</span>
            </div>
          </div>

          {/* Real-time Metering & Cost Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                CALL DURATION
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {formatTime(durationSeconds)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ACCUMULATED CHARGE ({isFree ? 'PRO-BONO' : `₹${rateMin.toFixed(0)}/MIN`})
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.15rem', color: isFree ? '#10b981' : 'var(--accent-teal)' }}>
                {isFree ? 'FREE (₹0)' : `₹${currentCost}`}
              </span>
            </div>

            <button className="modal-close-btn" onClick={handleEndSession}>✕</button>
          </div>
        </div>

        {!showInvoiceModal ? (
          /* Main Video Call Grid (Video Feed + Telemetry HUD Side-Dock) */
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.8fr 1fr', overflow: 'hidden' }}>
            
            {/* Left: Dual WebRTC Video Stream */}
            <div style={{ background: '#06080E', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              
              {/* Doctor Main Stream Simulation */}
              <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={doctor.avatarUrl}
                  alt={doctor.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.95)' }}
                />

                {/* Encrypted Room Overlay Badge */}
                <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(9, 12, 18, 0.82)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.72rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="pulse-dot"></span>
                  <span>P2P ENCRYPTED WEBRTC • DAILY.CO API STREAM</span>
                </div>

                {/* Patient Picture-in-Picture (PIP) Feed */}
                <div style={{ position: 'absolute', bottom: 20, right: 20, width: '170px', height: '120px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)', background: '#111622' }}>
                  {isVideoOff ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                      Camera Off
                    </div>
                  ) : (
                    <video
                      ref={patientVideoRef}
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                    />
                  )}
                  <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: '0.66rem', color: '#FFF', textShadow: '0 1px 3px #000', fontWeight: 600 }}>
                    You (Patient)
                  </div>
                </div>
              </div>

              {/* Call Control Bar */}
              <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.65rem', background: 'rgba(10, 14, 22, 0.88)', backdropFilter: 'blur(12px)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <button
                  className="btn-secondary"
                  style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', backgroundColor: isMuted ? 'var(--status-severe-bg)' : 'inherit', borderColor: isMuted ? 'var(--status-severe-border)' : 'inherit' }}
                  onClick={() => setIsMuted(!isMuted)}
                >
                  <span>{isMuted ? '🔴 Unmute' : '🎙️ Mute'}</span>
                </button>

                <button
                  className="btn-secondary"
                  style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', backgroundColor: isVideoOff ? 'var(--status-severe-bg)' : 'inherit' }}
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  <span>{isVideoOff ? '📹 Video On' : '📹 Video Off'}</span>
                </button>

                <button
                  className="btn-secondary"
                  style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.78rem' }}
                  onClick={() => {
                    setIsScreenSharing(!isScreenSharing);
                    onShowToast(isScreenSharing ? 'Screen sharing ended' : 'Sharing clinical telemetry screen...');
                  }}
                >
                  <span>🖥️ {isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
                </button>

                <button
                  className="btn-emergency-accept"
                  style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', padding: '0.4rem 1.1rem' }}
                  onClick={handleEndSession}
                >
                  <span>🔴 End Session</span>
                </button>
              </div>
            </div>

            {/* Right: Shared Patient Telemetry HUD Side-Dock */}
            <div style={{ background: 'var(--card-bg)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', overflowY: 'auto' }}>
              <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  SHARED PATIENT TELEMETRY HUD
                </span>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Real-time synced WASM metrics visible to clinician.
                </p>
              </div>

              {/* Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="stat-box" style={{ padding: '0.75rem' }}>
                  <span className="stat-box-title" style={{ fontSize: '0.64rem' }}>Composite Risk</span>
                  <div className="stat-box-value" style={{ fontSize: '1.5rem', color: 'var(--status-elevated-text)' }}>
                    {telemetrySnapshot.compositeRisk} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 10</span>
                  </div>
                </div>

                <div className="stat-box" style={{ padding: '0.75rem' }}>
                  <span className="stat-box-title" style={{ fontSize: '0.64rem' }}>Incongruence</span>
                  <div className="stat-box-value" style={{ fontSize: '1.5rem' }}>
                    {telemetrySnapshot.incongruenceIndex}
                  </div>
                </div>
              </div>

              {/* SHAP Attributions */}
              <div className="shap-inspector" style={{ padding: '0.85rem' }}>
                <span className="shap-title" style={{ fontSize: '0.7rem' }}>SHAP Feature Attributions</span>
                {telemetrySnapshot.shapSummary.map((item, idx) => (
                  <div className="shap-item" key={idx}>
                    <div className="shap-item-label-row" style={{ fontSize: '0.7rem' }}>
                      <span className="shap-item-name">{item.name}</span>
                      <span className="shap-item-weight">{item.weight}%</span>
                    </div>
                    <div className="shap-bar-track" style={{ height: '3px' }}>
                      <div className="shap-bar-fill" style={{ width: `${item.weight}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Automated SOAP Summary */}
              <div className="soap-quadrant" style={{ padding: '0.85rem' }}>
                <div className="soap-quadrant-header">
                  <span className="soap-letter">S</span>
                  <span className="soap-quadrant-title" style={{ fontSize: '0.76rem' }}>Clinical Notes &amp; Impression</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {telemetrySnapshot.soapNoteMarkdown || 'Patient exhibiting somatic affect minimization with active brow furrowing.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Post-Session Invoice Receipt Modal */
          <div className="modal-body" style={{ maxWidth: '600px', margin: 'auto', padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--status-minimal-bg)', color: 'var(--status-minimal-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                ✓
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Teletherapy Session Finalized</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Official invoice receipt and clinical summary audit.
              </p>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Clinician:</span>
                <strong>{finalInvoice.doctorName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Session ID:</span>
                <span>{finalInvoice.sessionId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Duration Billed:</span>
                <span>{finalInvoice.durationFormatted} ({finalInvoice.totalSeconds}s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rate per Minute:</span>
                <span>₹{finalInvoice.ratePerMinute.toFixed(0)}/min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Razorpay / UPI Transaction:</span>
                <span>{finalInvoice.transactionRef}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', paddingTop: '0.25rem' }}>
                <span>TOTAL BILLED:</span>
                <span style={{ color: finalInvoice.totalCharged === '0.00' ? '#10b981' : 'var(--accent-teal)' }}>
                  {finalInvoice.totalCharged === '0.00' ? '₹0.00 (Pro-Bono)' : `₹${finalInvoice.totalCharged}`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" onClick={handleCloseInvoice} style={{ width: '100%', justifyContent: 'center' }}>
                Close &amp; Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
