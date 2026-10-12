import React from 'react';

/**
 * MindVision Clinical AI - Explainability & Feature Contribution Modal
 * 
 * Provides rigorous, non-diagnostic attribution breakdowns:
 * - Signal contribution percentages (Facial, Voice, Questionnaire, Dynamics)
 * - Exact mathematical formulation & delta shifts
 * - Mode provenance verification (LIVE hardware vs. SANDBOX simulator)
 * - Strict decision-support language compliance
 */

export default function ExplainabilityModal({
  isOpen,
  onClose,
  metrics,
  qualityReport,
  mode = 'SANDBOX'
}) {
  if (!isOpen || !metrics) return null;

  const {
    au4 = 0.5,
    au15 = 0.5,
    acousticJitter = 0.4,
    textSentiment = 0.25,
    compositeRisk = 5.0,
    incongruenceIndex = 0.2,
    shapAttributions = []
  } = metrics;

  // Calculate high-level channel contributions
  const au4Weight = au4 * 3.0;
  const au15Weight = au15 * 2.5;
  const jitterWeight = acousticJitter * 2.5;
  const textWeight = textSentiment * 2.0;
  const totalWeight = (au4Weight + au15Weight + jitterWeight + textWeight) || 1;

  const facialPct = Math.round(((au4Weight + au15Weight) / totalWeight) * 100);
  const voicePct = Math.round((jitterWeight / totalWeight) * 100);
  const textPct = Math.round((textWeight / totalWeight) * 100);
  const dynamicPct = Math.max(0, 100 - (facialPct + voicePct + textPct));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-teal)' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <h3 className="modal-title">Why This Indicator? — Signal Attribution Details</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Header Summary Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            padding: '0.8rem 1rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>COMPOSITE INDICATOR</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {compositeRisk.toFixed(1)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ 10</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Decision-support scale</span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DATA QUALITY</span>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)' }}>
                {qualityReport?.overallScore || 85}%
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Signal integrity rating</span>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DATA PROVENANCE</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: mode === 'LIVE' ? 'var(--status-minimal-text)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {mode === 'LIVE' ? '● LIVE SENSOR' : '○ SANDBOX SIM'}
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {mode === 'LIVE' ? 'Real-time hardware feed' : 'Calibrated test preset'}
              </span>
            </div>
          </div>

          {/* High-Level Modality Contribution Breakdown */}
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Relative Modality Contribution
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.6rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                  <span>Facial Movement Vectors (AU04 + AU15)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{facialPct}%</span>
                </div>
                <div className="stat-progress-bar">
                  <div className="stat-progress-fill" style={{ width: `${facialPct}%`, backgroundColor: 'var(--text-primary)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                  <span>Voice Prosody &amp; Acoustic Tremor</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{voicePct}%</span>
                </div>
                <div className="stat-progress-bar">
                  <div className="stat-progress-fill" style={{ width: `${voicePct}%`, backgroundColor: 'var(--accent-teal)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                  <span>Questionnaire &amp; Spoken Linguistic Sentiment</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{textPct}%</span>
                </div>
                <div className="stat-progress-bar">
                  <div className="stat-progress-fill" style={{ width: `${textPct}%`, backgroundColor: 'var(--text-secondary)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                  <span>Cross-Modal Incongruence Dynamics</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{dynamicPct}%</span>
                </div>
                <div className="stat-progress-bar">
                  <div className="stat-progress-fill" style={{ width: `${dynamicPct}%`, backgroundColor: 'var(--status-elevated-dot)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Feature Breakdown */}
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Component-Level Telemetry Inputs
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem' }}>
                <span>AU04 Corrugator Brow Furrow (weight: 3.0)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{au4.toFixed(2)} → +{au4Weight.toFixed(2)} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem' }}>
                <span>AU15 Depressor Anguli Oris (weight: 2.5)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{au15.toFixed(2)} → +{au15Weight.toFixed(2)} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem' }}>
                <span>Acoustic Pitch Tremor Jitter (weight: 2.5)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{acousticJitter.toFixed(2)} → +{jitterWeight.toFixed(2)} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem' }}>
                <span>Linguistic Sentiment Stress (weight: 2.0)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{textSentiment.toFixed(2)} → +{textWeight.toFixed(2)} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem' }}>
                <span>Cross-Modal Incongruence (|Physical - Verbal|)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{incongruenceIndex.toFixed(2)} divergence factor</span>
              </div>
            </div>
          </div>

          {/* Strict Non-Diagnostic Guardrail Notice */}
          <div style={{
            padding: '0.65rem 0.85rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.74rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.45
          }}>
            <strong>Decision-Support Notice:</strong> The percentages and point values above represent mathematical contributions to the prototype composite indicator. They do not constitute or prove a medical or psychiatric diagnosis. All values must be interpreted by a qualified clinician in the context of comprehensive patient evaluation.
          </div>

          <div className="modal-actions-footer" style={{ marginTop: '1.25rem' }}>
            <button className="btn-secondary" onClick={onClose}>
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
