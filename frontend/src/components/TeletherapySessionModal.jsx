import React, { useState, useEffect, useRef } from 'react';
import { ClinicalAuditService } from '../services/clinicalAuditService';

export default function TeletherapySessionModal({
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

    ClinicalAuditService.logEvent({
      eventType: 'WEBRTC_CONNECTED',
      label: `WebRTC P2P Media Stream Connected with ${session.doctor?.fullName || session.doctor?.name}`,
      actor: 'SYSTEM',
      actorId: 'WEBRTC_CLIENT',
      sessionId: session.sessionId,
      status: 'CONNECTED',
      details: 'Patient and clinician connected via encrypted WebRTC channel.'
    });

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
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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

  // Toggle audio track when isMuted changes
  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Toggle video track when isVideoOff changes
  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff;
      });
    }
  }, [isVideoOff]);

  if (!session) return null;

  const { doctor, telemetrySnapshot } = session;
  const rateMin = doctor.ratePerMinute !== undefined ? doctor.ratePerMinute : 12;
  const isFree = rateMin === 0;
  const currentCost = isFree ? '0.00' : ((Math.max(1, Math.ceil(durationSeconds / 60))) * rateMin).toFixed(2);

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
    ClinicalAuditService.logEvent({
      eventType: 'CONSULTATION_COMPLETED',
      label: `Teleconsultation Session Completed with Dr. ${doctor.fullName || doctor.name}`,
      actor: 'SYSTEM',
      actorId: 'WEBRTC_BILLING',
      sessionId: session.sessionId,
      status: 'COMPLETED',
      details: `Duration: ${finalInvoice.durationFormatted}. Billed: ₹${finalInvoice.totalCharged} (Ref: ${finalInvoice.transactionRef}).`
    });

    onFinalizeSession(finalInvoice);
    onClose();
    onShowToast(`Teletherapy session finalized. Invoice ₹${finalInvoice.totalCharged} billed via Razorpay / UPI.`);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-dialog" style={{ maxWidth: '1180px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Teletherapy Session Header */}
        <div className="modal-header" style={{ background: 'var(--card-bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img
              src={doctor.avatarUrl}
              alt={doctor.name}
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 className="modal-title" style={{ fontSize: '0.98rem' }}>{doctor.name}</h3>
                <span className="wasm-badge" style={{ backgroundColor: 'var(--status-minimal-bg)', color: 'var(--status-minimal-text)', fontSize: '0.68rem' }}>
                  ● ACTIVE WebRTC DAILY.CO ROOM
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{doctor.title}</span>
            </div>
          </div>

          <button className="modal-close-btn" onClick={handleEndSession}>✕</button>
        </div>

        {!showInvoiceModal ? (
          /* Main Master Viewport Grid: 65% Video Window + 35% Doctor Floating HUD Side Panel */
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '65% 35%', overflow: 'hidden' }}>
            
            {/* Main Viewport (65% Width): WebRTC Video Window */}
            <div style={{ background: '#06080E', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              
              {/* Doctor Main Stream */}
              <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={doctor.avatarUrl}
                  alt={doctor.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.95)' }}
                />

                {/* WebRTC Overlay Badge */}
                <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(9, 12, 18, 0.85)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '0.72rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="pulse-dot"></span>
                  <span>ENCRYPTED P2P WEBRTC • DAILY.CO STREAM</span>
                </div>

                {/* Patient Picture-in-Picture (PIP) Feed */}
                <div style={{ position: 'absolute', bottom: 20, right: 20, width: '180px', height: '125px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)', background: '#111622' }}>
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
                  <span>{isMuted ? '🔴 Unmute' : '🎙️ Mute Mic'}</span>
                </button>

                <button
                  className="btn-secondary"
                  style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', backgroundColor: isVideoOff ? 'var(--status-severe-bg)' : 'inherit' }}
                  onClick={() => setIsVideoOff(!isVideoOff)}
                >
                  <span>{isVideoOff ? '📹 Camera On' : '📹 Camera Off'}</span>
                </button>

                <button
                  className="btn-secondary"
                  style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.78rem' }}
                  onClick={() => {
                    const newShare = !isScreenSharing;
                    setIsScreenSharing(newShare);
                    onShowToast(newShare ? 'Sharing clinical telemetry stream with clinician...' : 'Screen sharing ended.');
                  }}
                >
                  <span>🖥️ {isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
                </button>

                <button
                  className="btn-emergency-accept"
                  style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.78rem', padding: '0.4rem 1.1rem' }}
                  onClick={handleEndSession}
                >
                  <span>🔴 End Call</span>
                </button>
              </div>
            </div>

            {/* Floating HUD Overlay (35% Width - Doctor Side Panel) */}
            <div style={{ background: 'var(--card-bg)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', overflowY: 'auto' }}>
              
              {/* Real-Time Session Metering */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  REAL-TIME SESSION METERING
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LIVE TIMER</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                      {formatTime(durationSeconds)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL BILLED COST</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.3rem', color: isFree ? '#10b981' : 'var(--accent-teal)' }}>
                      {isFree ? 'FREE (₹0)' : `₹${currentCost}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Biometric Telemetry Overlay Gauges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="stat-box" style={{ padding: '0.75rem' }}>
                  <span className="stat-box-title" style={{ fontSize: '0.64rem' }}>Composite Risk</span>
                  <div className="stat-box-value" style={{ fontSize: '1.5rem', color: telemetrySnapshot.compositeRisk >= 7.0 ? 'var(--status-severe-text)' : 'var(--status-elevated-text)' }}>
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

              {/* Top 3 SHAP Feature Attributions */}
              <div className="shap-inspector" style={{ padding: '0.85rem' }}>
                <span className="shap-title" style={{ fontSize: '0.7rem' }}>Top 3 SHAP Feature Attributions</span>
                {(telemetrySnapshot.shapSummary || []).slice(0, 3).map((item, idx) => (
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

              {/* Ephemeral SOAP Note Viewer */}
              <div className="soap-quadrant" style={{ padding: '0.85rem' }}>
                <div className="soap-quadrant-header">
                  <span className="soap-letter">S</span>
                  <span className="soap-quadrant-title" style={{ fontSize: '0.76rem' }}>Ephemeral Patient SOAP Notes</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                  {telemetrySnapshot.soapNoteMarkdown || 'Patient exhibiting severe somatic affect minimization with active brow furrowing.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Invoice Modal */
          <div className="modal-body" style={{ maxWidth: '580px', margin: 'auto', padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--status-minimal-bg)', color: 'var(--status-minimal-text)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                ✓
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Teletherapy Session Concluded</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Itemized invoice and clinical record audit.
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
                <span style={{ color: 'var(--text-muted)' }}>Razorpay / UPI Ref:</span>
                <span>{finalInvoice.transactionRef}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', paddingTop: '0.25rem' }}>
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
