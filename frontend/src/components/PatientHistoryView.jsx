import React from 'react';
import { getHumanStatus } from '../utils/terminology';

/**
 * PatientHistoryView - Warm, human check-in history for patients
 * Replaces dense clinical telemetry and raw deltas with calm, reassuring longitudinal summaries.
 */
export default function PatientHistoryView({ records = [], setActiveTab }) {
  return (
    <div className="patient-view-shell">
      {/* Top Header */}
      <div>
        <div className="patient-hero-kicker">
          <span>🌿 Your Wellness Journey</span>
        </div>
        <h1 className="patient-hero-title" style={{ fontSize: '1.9rem', marginBottom: '0.4rem' }}>
          My Check-in History
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Review your recent wellness check-ins. Taking regular moments to pause helps you stay in tune with your feelings.
        </p>
      </div>

      {/* Start New Check-in Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--accent-teal-soft-bg) 100%)',
          border: '1px solid var(--accent-teal-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-subtle)'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
            Ready for today's check-in?
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0 }}>
            It takes just 2 minutes to reflect on how you're feeling right now.
          </p>
        </div>
        <button
          type="button"
          className="btn-patient-primary"
          onClick={() => setActiveTab('assessment')}
          style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem' }}
        >
          <span>Take Check-in</span>
          <span>›</span>
        </button>
      </div>

      {/* History Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.5rem 0 0.25rem 0' }}>
          Past Reflections
        </h2>

        {records && records.length > 0 ? (
          records.map((rec, idx) => {
            const status = getHumanStatus(rec.riskLevel, rec.compositeRisk);
            const isLatest = idx === 0;

            return (
              <div
                key={rec.id || idx}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: isLatest ? `1.5px solid ${status.borderColor}` : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.6rem' }}>{status.icon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: status.color }}>
                          {status.title}
                        </span>
                        {isLatest && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: 'var(--accent-teal-soft-bg)',
                              color: 'var(--accent-teal)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)'
                            }}
                          >
                            Latest Check-in
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {rec.timestamp}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: status.bgColor,
                      color: status.color
                    }}
                  >
                    {rec.riskLevel === 'MINIMAL' ? 'Calm & Steady' : rec.riskLevel === 'MODERATE' ? 'Mild Stress' : rec.riskLevel === 'ELEVATED' ? 'Support Encouraged' : 'Care Recommended'}
                  </span>
                </div>

                {/* Friendly Patient Statement */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1.1rem',
                    fontSize: '0.92rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                    fontStyle: 'italic'
                  }}
                >
                  {rec.text ? rec.text.replace(/\(High somatic.*?\)/g, '') : "Check-in completed calmly."}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {rec.riskLevel === 'SEVERE' || rec.riskLevel === 'ELEVATED'
                      ? '💡 A conversation with a counselor could bring clarity.'
                      : '🌱 Nice work checking in with yourself.'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('doctors')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-teal)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Talk with a counselor ›
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '2.5rem',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📝</span>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>No past check-ins yet</h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>
              Your check-in reflections will appear here as you take them.
            </p>
            <button
              type="button"
              className="btn-patient-primary"
              onClick={() => setActiveTab('assessment')}
              style={{ fontSize: '0.9rem', padding: '0.7rem 1.5rem' }}
            >
              Start First Check-in
            </button>
          </div>
        )}
      </div>

      {/* Reassuring Disclaimer */}
      <div
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--card-bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5
        }}
      >
        🔒 <strong>Your privacy matters:</strong> All check-in reflections are kept confidential and are never shared without your permission. MindVision is a wellness companion and does not provide formal medical diagnoses.
      </div>
    </div>
  );
}
