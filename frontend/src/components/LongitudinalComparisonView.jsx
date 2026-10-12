import React, { useState } from 'react';
import { TelemetryTimelineService } from '../services/telemetryTimelineService';

/**
 * MindVision Clinical AI - Longitudinal Patient Profile & Session Comparison
 * 
 * Provides:
 * - Patient longitudinal timeline (Session 01, Session 02, Session 03, Current Session)
 * - Side-by-side comparison: PREVIOUS SESSION vs CURRENT SESSION
 * - Metric deltas (Indicator, Signal Quality, AU04, Prosody, Incongruence)
 * - Strictly neutral non-diagnostic clinical language
 */

export default function LongitudinalComparisonView({ currentRecord = null }) {
  const longitudinalSessions = TelemetryTimelineService.getLongitudinalSessions();
  const [selectedHistoricalId, setSelectedHistoricalId] = useState(longitudinalSessions.slice(-1)[0]?.sessionId || 'sess_hist_03');

  const selectedHistorical = longitudinalSessions.find((s) => s.sessionId === selectedHistoricalId) || longitudinalSessions[0];

  const currentMetrics = currentRecord || {
    compositeRisk: 6.3,
    signalQuality: 86,
    au4: 0.55,
    acousticJitter: 0.42,
    incongruenceIndex: 0.28
  };

  const comparison = TelemetryTimelineService.compareSessions(currentMetrics, selectedHistorical);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Patient Profile Header Strip */}
      <div className="command-bar" style={{ marginBottom: 0 }}>
        <div className="command-left">
          <div className="command-title-row">
            <span className="command-kicker">Longitudinal Triage</span>
            <h2 className="command-heading" style={{ fontSize: '1.15rem' }}>Patient Profile: MV-882109</h2>
          </div>
          <div className="command-meta">
            <span>Primary Clinician: <strong>Dr. Ananya Sharma, MD (NIMHANS)</strong></span>
            <span className="meta-separator">•</span>
            <span>Intake Protocol: <strong>Serial Multimodal Telemetry</strong></span>
            <span className="meta-separator">•</span>
            <span>Total Completed Sessions: <strong>{longitudinalSessions.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Feature 5: Patient Timeline */}
      <div className="clinical-card">
        <div className="card-header">
          <div className="card-title-group">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h3 className="card-title">LONGITUDINAL SESSION HISTORY (SERIAL TELEMETRY)</h3>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            CHRONOLOGICAL COMPARISON
          </span>
        </div>

        <div className="card-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${longitudinalSessions.length + 1}, 1fr)`,
            gap: '0.85rem'
          }}>
            {longitudinalSessions.map((sess) => {
              const isSelected = sess.sessionId === selectedHistoricalId;
              return (
                <div
                  key={sess.sessionId}
                  onClick={() => setSelectedHistoricalId(sess.sessionId)}
                  style={{
                    padding: '0.85rem',
                    backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--bg-surface)',
                    border: `1.5px solid ${isSelected ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {sess.sessionNumber}
                    </span>
                    <span className="clinical-status-pill minimal" style={{ fontSize: '0.62rem', padding: '0.15rem 0.4rem' }}>
                      {sess.consultationStatus}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {sess.date}
                  </div>

                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {sess.compositeIndicator.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ 10</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Indicator Trend Baseline
                  </span>

                  <div style={{ marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Quality: <strong>{sess.signalQuality}%</strong> • AU04: <strong>{sess.metrics.au4}</strong>
                  </div>
                </div>
              );
            })}

            {/* Current Session Tile */}
            <div style={{
              padding: '0.85rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1.5px solid var(--accent-teal)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>
                  Current Session
                </span>
                <span className="clinical-status-pill" style={{ fontSize: '0.62rem', padding: '0.15rem 0.4rem', backgroundColor: 'var(--accent-teal)', color: '#fff' }}>
                  ACTIVE
                </span>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Today (Live Triage)
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--status-elevated-text)' }}>
                {comparison.current.indicator.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ 10</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Current Prototype Indicator
              </span>

              <div style={{ marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Quality: <strong>{comparison.current.signalQuality}%</strong> • AU04: <strong>{comparison.current.au4}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 6: Session Comparison (Current vs Selected Historical) */}
      <div className="clinical-card">
        <div className="card-header">
          <div className="card-title-group">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-icon">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
            <h3 className="card-title">SESSION COMPARISON: {comparison.previous.sessionNumber} ({comparison.previous.date}) vs. CURRENT SESSION</h3>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            DELTA ANALYSIS
          </span>
        </div>

        <div className="card-body">
          {/* Comparison Matrix Table */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
            gap: '0.75rem',
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.76rem'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>METRIC PARAMETER</div>
            <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              PREVIOUS ({comparison.previous.date})
            </div>
            <div style={{ fontWeight: 700, color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)' }}>
              CURRENT SESSION
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              CHANGE (DELTA)
            </div>

            {/* Row 1: Composite Indicator */}
            <div style={{ fontWeight: 600 }}>Composite Stress Indicator</div>
            <div style={{ fontFamily: 'var(--font-mono)' }}>{comparison.previous.indicator} / 10</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{comparison.current.indicator} / 10</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: comparison.deltas.indicator.startsWith('+') ? 'var(--status-elevated-text)' : 'var(--status-minimal-text)' }}>
              {comparison.deltas.indicator}
            </div>

            {/* Row 2: Signal Quality */}
            <div style={{ fontWeight: 600 }}>Hardware Signal Quality</div>
            <div style={{ fontFamily: 'var(--font-mono)' }}>{comparison.previous.signalQuality}%</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{comparison.current.signalQuality}%</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{comparison.deltas.quality}</div>

            {/* Row 3: AU04 Brow Furrow */}
            <div style={{ fontWeight: 600 }}>AU04 Corrugator Brow Furrow</div>
            <div style={{ fontFamily: 'var(--font-mono)' }}>{comparison.previous.au4}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{comparison.current.au4}</div>
            <div style={{ fontFamily: 'var(--font-mono)' }}>{comparison.deltas.au4}</div>

            {/* Row 4: Voice Prosody */}
            <div style={{ fontWeight: 600 }}>Acoustic Prosody Tremor</div>
            <div style={{ fontFamily: 'var(--font-mono)' }}>{comparison.previous.prosody}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{comparison.current.prosody}</div>
            <div style={{ fontFamily: 'var(--font-mono)' }}>{comparison.deltas.prosody}</div>

            {/* Row 5: Incongruence Index */}
            <div style={{ fontWeight: 600 }}>Somatic-Verbal Incongruence</div>
            <div style={{ fontFamily: 'var(--font-mono)' }}>{comparison.previous.incongruence}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{comparison.current.incongruence}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{comparison.deltas.incongruence}</div>
          </div>

          {/* Contextual Clinical Notes */}
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.76rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5
          }}>
            <strong>Previous Clinician Consultation Note ({comparison.previous.date} - {selectedHistorical.doctorName}):</strong>
            <p style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
              "{selectedHistorical.clinicianNotes}"
            </p>
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)', color: 'var(--text-primary)' }}>
              <strong>Delta Summary:</strong> {comparison.summaryText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
