import React, { useState } from 'react';
import { getHumanStatus, CLINICAL_DISCLAIMER } from '../utils/terminology';

/**
 * HomeOverview - Patient-Centered Wellness Home Screen
 * 
 * Production-grade, reassuring, calm interface modeled after Headspace, Calm, and Teladoc.
 * Zero clinical jargon, zero AU codes, zero biometric signal breakdowns.
 * One clear primary action, supportive secondary cards, and warm encouragement.
 */
export default function HomeOverview({
  setActiveTab,
  latestRecord = null,
  records = [],
  userRole = 'PATIENT',
  setUserRole
}) {
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Derive latest record or realistic baseline
  const activeRecord = latestRecord || (records && records.length > 0 ? records[0] : {
    riskLevel: 'MINIMAL',
    compositeRisk: 1.2,
    timestamp: 'Today'
  });

  // Human-friendly status mapping
  const humanStatus = getHumanStatus(activeRecord.riskLevel, activeRecord.compositeRisk);

  // Determine supportive message based on risk level
  const isElevated = activeRecord.riskLevel === 'ELEVATED' || activeRecord.riskLevel === 'SEVERE';
  const statusHeadline = isElevated ? "It might help to talk with someone" : "Steady & calm pattern reported";
  const statusEncouragement = isElevated
    ? "Your recent check-in showed subtle signs that things might feel a bit heavy right now. Taking a moment for gentle support can make a big difference."
    : "Your recent check-in reflected a steady, calm pattern based on your self-reported responses. Remember to take small pauses throughout your day to nourish yourself.";
  const statusNextStep = isElevated
    ? "Would you like to connect with a caring counselor who can listen?"
    : "Want to do a quick 2-minute reflection on how you're feeling today?";

  return (
    <div className="patient-view-shell">
      
      {/* 1. Welcoming Hero Banner with One Obvious Primary CTA */}
      <div className="patient-hero-card">
        <div className="patient-hero-kicker">
          <span>🌿 MindVision Wellness</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.78rem' }}>🔒 Private &amp; Secure</span>
        </div>

        <h1 className="patient-hero-title">
          Hi there, how are you feeling today?
        </h1>

        <p className="patient-hero-subtitle">
          Take a quiet moment for yourself. Our gentle, voice-guided check-in takes just 2 minutes and helps you understand how you're really doing.
        </p>

        {/* The One Clear Primary Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-patient-primary"
            onClick={() => setActiveTab('assessment')}
          >
            <span>Start Check-in</span>
            <span style={{ fontSize: '1.2rem' }}>›</span>
          </button>
          <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            ⏱️ Takes only 2–3 minutes
          </span>
        </div>
      </div>

      {/* 2. Previous Result (Human, Warm, Simple — No Biometric Breakdown) */}
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          padding: '1.75rem 2rem',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: isElevated ? 'var(--status-elevated-bg)' : 'var(--status-minimal-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                flexShrink: 0
              }}
            >
              {isElevated ? '🧡' : '🌱'}
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Your Latest Check-in Summary
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {statusHeadline}
              </h2>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-secondary)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-pill)'
            }}
          >
            {activeRecord.timestamp || 'Recent reflection'}
          </span>
        </div>

        {/* Soft Sentence of Encouragement */}
        <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {statusEncouragement}
        </p>

        {/* One Simple Next-Step Suggestion */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--accent-teal-soft-bg)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--accent-teal-border)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.2rem' }}>💡</span>
            <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              {statusNextStep}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(isElevated ? 'doctors' : 'assessment')}
            style={{
              backgroundColor: 'var(--accent-teal)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '0.45rem 1rem',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isElevated ? 'Explore Support Options' : 'Take a Check-in'}
          </button>
        </div>
      </div>

      {/* 3. Secondary Actions as Friendly, Beautiful Cards (Not Dense Buttons) */}
      <div className="patient-cards-grid">
        {/* Card A: My Past Check-ins */}
        <div
          className="patient-action-card"
          onClick={() => setActiveTab('results')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') setActiveTab('results'); }}
        >
          <div>
            <div className="patient-action-card-icon">
              <span>📅</span>
            </div>
            <h2 className="patient-action-card-title">
              See my past check-ins
            </h2>
            <p className="patient-action-card-desc">
              View your personal timeline of previous check-ins and notice how your energy and mood evolve over time.
            </p>
          </div>
          <div className="patient-action-card-link">
            <span>View your history</span>
            <span>›</span>
          </div>
        </div>

        {/* Card B: Talk to a Counselor */}
        <div
          className="patient-action-card"
          onClick={() => setActiveTab('doctors')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') setActiveTab('doctors'); }}
        >
          <div>
            <div className="patient-action-card-icon" style={{ backgroundColor: 'var(--accent-warm-soft)', color: 'var(--crisis-title-color)' }}>
              <span>💬</span>
            </div>
            <h2 className="patient-action-card-title">
              Talk to someone
            </h2>
            <p className="patient-action-card-desc">
              Connect in a safe, confidential space with verified healthcare professionals who listen without judgment.
            </p>
          </div>
          <div className="patient-action-card-link" style={{ color: 'var(--crisis-title-color)' }}>
            <span>Find a counselor</span>
            <span>›</span>
          </div>
        </div>
      </div>

      {/* 4. Reassuring, Calm "Need Help Now?" Crisis Support Card (Not Alarming Red) */}
      <div className="patient-crisis-banner">
        <div className="patient-crisis-text">
          <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>💛</span>
          <div>
            <h2 className="patient-crisis-title">
              Need immediate support or someone to talk to right now?
            </h2>
            <p className="patient-crisis-subtitle">
              Free, confidential help is available 24/7. Call or text <strong>988</strong> to reach the Suicide &amp; Crisis Lifeline, or text <strong>HOME</strong> to <strong>741741</strong>.
            </p>
          </div>
        </div>
        <a
          href="tel:988"
          className="patient-crisis-cta"
        >
          <span>📞</span>
          <span>Call or Text 988</span>
        </a>
      </div>

      {/* 5. Quiet, Non-Alarming Disclaimer */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          padding: '0 1rem'
        }}
      >
        🔒 <strong>Your privacy is protected:</strong> All check-in reflections are kept confidential and are never shared without your permission. MindVision is designed as a wellness self-reflection companion and does not replace professional medical diagnosis or psychiatric care.
      </div>

    </div>
  );
}
