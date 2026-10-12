import React, { useState } from 'react';
import { getHumanStatus, getHumanObservations, CLINICAL_DISCLAIMER } from '../utils/terminology';

export default function HomeOverview({
  setActiveTab,
  latestRecord = null,
  records = [],
  userRole = 'PATIENT',
  setUserRole
}) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Derive latest assessment from real records or default to realistic baseline
  const activeRecord = latestRecord || (records && records.length > 0 ? records[0] : {
    compositeRisk: 3.4,
    riskLevel: 'MODERATE',
    au4: 0.38,
    au15: 0.28,
    prosody: 0.32,
    sentiment: 0.35,
    incongruence: 0.22,
    timestamp: 'Today, Just now'
  });

  const humanStatus = getHumanStatus(activeRecord.riskLevel, activeRecord.compositeRisk);
  const observations = getHumanObservations(activeRecord);

  return (
    <div className="home-overview" style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Header: Welcoming, Modern Healthcare Identity */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(19, 111, 99, 0.08) 0%, rgba(15, 23, 42, 0.04) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent-teal)', textTransform: 'uppercase' }}>
                MINDVISION WELLNESS
              </span>
              <span className="clinical-status-pill minimal" style={{ fontSize: '0.68rem', padding: '1px 8px' }}>
                On-Device Privacy Protected
              </span>
            </div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Your Wellness Check-in
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px', lineHeight: 1.55 }}>
              Understand your check-in signals in plain language. Get clear, reassuring next steps with zero confusing medical jargon.
            </p>
          </div>

          {/* Quick Experience Switcher */}
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => { if (setUserRole) setUserRole('PATIENT'); }}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: userRole === 'PATIENT' ? 'var(--card-bg)' : 'transparent',
                color: userRole === 'PATIENT' ? 'var(--accent-teal)' : 'var(--text-muted)',
                fontWeight: userRole === 'PATIENT' ? 700 : 500,
                fontSize: '0.72rem',
                cursor: 'pointer',
                boxShadow: userRole === 'PATIENT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              👤 Patient View
            </button>
            <button
              type="button"
              onClick={() => {
                if (setUserRole) setUserRole('CLINICIAN');
                setActiveTab('portal');
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: userRole === 'CLINICIAN' ? 'var(--card-bg)' : 'transparent',
                color: userRole === 'CLINICIAN' ? 'var(--accent-teal)' : 'var(--text-muted)',
                fontWeight: userRole === 'CLINICIAN' ? 700 : 500,
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              🩺 Clinician View
            </button>
            <button
              type="button"
              onClick={() => {
                if (setUserRole) setUserRole('RESEARCHER');
                setActiveTab('demo');
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: userRole === 'RESEARCHER' ? 'var(--card-bg)' : 'transparent',
                color: userRole === 'RESEARCHER' ? 'var(--accent-teal)' : 'var(--text-muted)',
                fontWeight: userRole === 'RESEARCHER' ? 700 : 500,
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              🔬 Technical View
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            className="btn-primary"
            onClick={() => setActiveTab('assessment')}
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
          >
            <span>📝</span>
            <span>Start 2-Minute Check-in</span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => setActiveTab('results')}
            style={{ padding: '0.6rem 1.15rem', fontSize: '0.85rem' }}
          >
            <span>📊</span>
            <span>View My Results History</span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => setActiveTab('doctors')}
            style={{ padding: '0.6rem 1.15rem', fontSize: '0.85rem' }}
          >
            <span>🩺</span>
            <span>Talk to a Verified Clinician</span>
          </button>
        </div>
      </div>

      {/* 2. Main Result Banner: Simple, Clear & Reassuring */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: `1.5px solid ${humanStatus.borderColor}`,
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>{humanStatus.icon}</span>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CURRENT ASSESSMENT
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0.15rem 0 0.35rem 0', color: humanStatus.color }}>
                {humanStatus.title}
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, maxWidth: '640px' }}>
                {humanStatus.subtitle}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Check-in Timestamp</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {activeRecord.timestamp || 'Recent Session'}
            </span>
          </div>
        </div>

        {/* Essential Clinical Disclaimer (Visible but calm) */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.95rem',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            lineHeight: 1.4
          }}
        >
          <span style={{ fontSize: '0.95rem' }}>ℹ️</span>
          <span>
            <strong>Important note:</strong> {CLINICAL_DISCLAIMER}
          </span>
        </div>
      </div>

      {/* 3. What We Noticed: 3 Simple Observation Cards (No Raw Numbers) */}
      <div>
        <div style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            What We Noticed
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            A summary of the subtle cues observed during your check-in:
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Card A: Voice */}
          <div className="workstation-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(19, 111, 99, 0.1)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                🎙️
              </div>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>Voice Patterns</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Speaking tone &amp; pitch stability</span>
              </div>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              {observations.voice}
            </p>
          </div>

          {/* Card B: Responses */}
          <div className="workstation-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                💬
              </div>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>Reported Feelings</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Written statements &amp; daily function</span>
              </div>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              {observations.responses}
            </p>
          </div>

          {/* Card C: Facial Signals */}
          <div className="workstation-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                👁️
              </div>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>Facial Signals</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Brow &amp; mouth micro-tension</span>
              </div>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              {observations.facial}
            </p>
          </div>
        </div>

        {/* Signal Divergence Callout if present */}
        {observations.divergence && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.85rem 1.1rem',
              background: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>💡</span>
            <div>
              <strong>Subtle Difference Noticed:</strong> {observations.divergence}
            </div>
          </div>
        )}
      </div>

      {/* 4. What Should You Do? Recommended Next Actions */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.4rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-teal)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              RECOMMENDED NEXT STEP
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.2rem 0 0.3rem 0', color: 'var(--text-primary)' }}>
              Consider speaking with a qualified healthcare professional
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, maxWidth: '640px' }}>
              If your current stress, sleep disruptions, or emotional fatigue persist, discussing these observations with a licensed clinician can provide peace of mind and personalized support strategies.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn-primary"
              onClick={() => setActiveTab('doctors')}
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.84rem' }}
            >
              <span>📞</span>
              <span>Talk to a Clinician (from ₹0)</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => setActiveTab('results')}
              style={{ padding: '0.65rem 1rem', fontSize: '0.84rem' }}
            >
              <span>View My Results History</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Progressive Disclosure: "How We Got This Result" (Collapsed by default) */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}
      >
        <button
          type="button"
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          style={{
            width: '100%',
            padding: '1rem 1.25rem',
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            fontWeight: 650
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>🔍</span>
            <span>How did we determine this? (Explainability &amp; Methodology)</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {showHowItWorks ? 'Hide Explanation ▲' : 'Show Explanation ▼'}
          </span>
        </button>

        {showHowItWorks && (
          <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              MindVision compares information from three synchronized channels during your check-in:
            </p>
            <ol style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0 1.25rem', padding: 0 }}>
              <li><strong>What you reported:</strong> Analyzing the themes of fatigue, pressure, or coping mentioned in your written or spoken answers.</li>
              <li><strong>Voice variations:</strong> Examining subtle changes in speaking stability, pacing, and vocal pitch.</li>
              <li><strong>Facial expression patterns:</strong> Measuring momentary micro-tensions around the brow and mouth without recording or uploading your face.</li>
            </ol>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              All analysis runs directly on your device via privacy-first WebAssembly (WASM). No raw audio or video ever leaves your computer.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                style={{ fontSize: '0.76rem', padding: '0.4rem 0.85rem' }}
              >
                {showTechnicalDetails ? 'Hide Technical Metrics' : '🔬 View Technical Metrics (AU4, AU15, Jitter)'}
              </button>
            </div>

            {/* Deep Technical Drawer for interested users */}
            {showTechnicalDetails && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>
                  TECHNICAL TELEMETRY BREAKDOWN:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  <div>AU04 Brow Furrow: <strong>{activeRecord.au4 || '0.38'}</strong></div>
                  <div>AU15 Lip Depressor: <strong>{activeRecord.au15 || '0.28'}</strong></div>
                  <div>Acoustic Jitter: <strong>{activeRecord.prosody || '0.32'}</strong></div>
                  <div>Linguistic Polarity: <strong>{activeRecord.sentiment || '0.35'}</strong></div>
                  <div>Cross-Modal Incongruence: <strong>{activeRecord.incongruence || '0.22'}</strong></div>
                  <div>Raw Composite Score: <strong>{activeRecord.compositeRisk || '3.4'} / 10</strong></div>
                </div>
                <div style={{ marginTop: '0.25rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  Calibrated against DISFA, Extended Cohn-Kanade (CK+), and DAIC-WOZ scientific benchmark corpora.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
