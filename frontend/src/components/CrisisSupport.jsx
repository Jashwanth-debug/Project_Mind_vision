import React, { useState } from 'react';
import {
  IconLifeBuoy,
  IconPhone,
  IconMessageSquare,
  IconArrowLeft,
  IconShieldCheck,
  IconLeaf,
  IconAlertTriangle
} from './Icons';
import { InteractiveButton } from './primitives';

/**
 * CrisisSupport - Production-Grade Immediate Crisis & Safety Support
 * 
 * Safety-critical requirements:
 * - Opens immediately from every route without animation delays
 * - Multi-region support: US/Canada, United Kingdom, India, International
 * - Prominent emergency services dispatch notice with clickable emergency tel: links
 * - All telephone numbers are direct clickable tel: links
 * - Never hides critical numbers behind accordions
 * - No game-like elements, timers, celebratory effects, or artificial friction
 * - Clean zero-penalty return-to-app action
 */
export default function CrisisSupport({ onReturn, setActiveTab }) {
  const [selectedRegion, setSelectedRegion] = useState('ALL'); // 'ALL' | 'US_CA' | 'UK' | 'IN' | 'INTL'

  const handleReturn = () => {
    if (onReturn) {
      onReturn();
    } else if (setActiveTab) {
      setActiveTab('home');
    } else {
      window.dispatchEvent(new CustomEvent('NAVIGATE_TAB', { detail: 'home' }));
    }
  };

  const HELPLINES = [
    {
      id: 'us-988',
      region: 'US_CA',
      regionLabel: 'United States & Canada',
      name: '988 Suicide & Crisis Lifeline',
      badge: '24/7 Toll-Free',
      description: 'Free, confidential support for people in distress, prevention and crisis resources for you or your loved ones. English & Spanish.',
      callNumber: '988',
      callDisplay: 'Call 988',
      smsNumber: '988',
      smsDisplay: 'Text 988',
      isPrimary: true
    },
    {
      id: 'us-ctl',
      region: 'US_CA',
      regionLabel: 'United States & Canada',
      name: 'Crisis Text Line',
      badge: '24/7 SMS',
      description: 'Connect with a volunteer crisis counselor via free SMS. Discreet, quiet, and fast response from any mobile phone.',
      smsNumber: '741741',
      smsBody: 'HOME',
      smsDisplay: 'Text HOME to 741741'
    },
    {
      id: 'us-trevor',
      region: 'US_CA',
      regionLabel: 'United States & Canada',
      name: 'The Trevor Project (LGBTQ Youth)',
      badge: '24/7 Confidential',
      description: 'Trained, caring counselors specialized in supporting LGBTQ young people experiencing anxiety, crisis, or thoughts of self-harm.',
      callNumber: '18664887386',
      callDisplay: '1-866-488-7386',
      smsNumber: '678678',
      smsBody: 'START',
      smsDisplay: 'Text START to 678-678'
    },
    {
      id: 'us-veterans',
      region: 'US_CA',
      regionLabel: 'United States & Canada',
      name: 'Veterans Crisis Line',
      badge: '24/7 Specialized',
      description: 'Confidential, toll-free crisis intervention and warm handoff support for US service members, veterans, and their families.',
      callNumber: '988',
      callDisplay: 'Call 988, Press 1',
      smsNumber: '838255',
      smsDisplay: 'Text 838255'
    },
    {
      id: 'uk-samaritans',
      region: 'UK',
      regionLabel: 'United Kingdom',
      name: 'Samaritans UK Helpline',
      badge: '24/7 Freephone',
      description: 'Whatever you are going through, a Samaritan will face it with you. 24 hours a day, 365 days a year, completely free of charge.',
      callNumber: '116123',
      callDisplay: 'Call 116 123 (UK)'
    },
    {
      id: 'uk-shout',
      region: 'UK',
      regionLabel: 'United Kingdom',
      name: 'Shout 85258 Crisis Text',
      badge: '24/7 Free Text',
      description: 'Free, confidential, anonymous text support service available 24/7 for anyone in the UK experiencing a mental health crisis.',
      smsNumber: '85258',
      smsBody: 'SHOUT',
      smsDisplay: 'Text SHOUT to 85258'
    },
    {
      id: 'in-telemanas',
      region: 'IN',
      regionLabel: 'India',
      name: 'Tele-MANAS (Govt of India / NIMHANS)',
      badge: '24/7 Toll-Free',
      description: 'National Tele-Mental Health Programme coordinated by NIMHANS. Free confidential mental health care across 20+ Indian languages.',
      callNumber: '14416',
      callDisplay: 'Call 14416 (Toll-Free)',
      altCallNumber: '18008914416',
      altCallDisplay: '1800 891 4416'
    },
    {
      id: 'in-vandrevala',
      region: 'IN',
      regionLabel: 'India',
      name: 'Vandrevala Foundation Helpline',
      badge: '24/7 Free',
      description: 'Round-the-clock free mental health counseling by qualified clinical psychologists and psychiatrists across India.',
      callNumber: '9999666555',
      callDisplay: 'Call 9999 666 555'
    },
    {
      id: 'intl-befrienders',
      region: 'INTL',
      regionLabel: 'International',
      name: 'Befrienders Worldwide Directory',
      badge: 'Global Directory',
      description: 'Global network of 349 volunteer crisis centers in 32 countries providing compassionate, confidential support.',
      webUrl: 'https://www.befrienders.org',
      webDisplay: 'Visit Befrienders.org Directory'
    },
    {
      id: 'intl-findahelpline',
      region: 'INTL',
      regionLabel: 'International',
      name: 'Find A Helpline (Worldwide)',
      badge: '130+ Countries',
      description: 'Free, confidential support from local crisis centers in your country, searchable by country, region, and language.',
      webUrl: 'https://findahelpline.com',
      webDisplay: 'Browse 130+ Countries Helpline Directory'
    }
  ];

  const displayedHelplines = selectedRegion === 'ALL'
    ? HELPLINES
    : HELPLINES.filter((h) => h.region === selectedRegion);

  return (
    <div className="patient-view-shell" style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      
      {/* Return to App Bar (Immediate, Zero Delay) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <InteractiveButton
          variant="secondary"
          onClick={handleReturn}
          aria-label="Return to MindVision application"
        >
          <IconArrowLeft size={16} />
          <span>Return to MindVision</span>
        </InteractiveButton>
      </div>

      {/* Immediate Physical Danger Emergency Alert */}
      <div
        role="alert"
        style={{
          backgroundColor: '#fef2f2',
          border: '1.5px solid #f87171',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-subtle)'
        }}
      >
        <IconAlertTriangle size={24} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', fontSize: '1rem', color: '#991b1b', marginBottom: '0.25rem' }}>
            In an Immediate Physical Emergency?
          </strong>
          <p style={{ fontSize: '0.92rem', color: '#7f1d1d', margin: '0 0 0.65rem 0', lineHeight: 1.5 }}>
            If you or someone around you is in immediate danger of injury or self-harm, please dial your local emergency services immediately:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
            <a
              href="tel:911"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#dc2626',
                color: '#fff',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}
            >
              <IconPhone size={13} />
              <span>US/Canada: Call 911</span>
            </a>
            <a
              href="tel:999"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#dc2626',
                color: '#fff',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}
            >
              <IconPhone size={13} />
              <span>UK: Call 999</span>
            </a>
            <a
              href="tel:112"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#dc2626',
                color: '#fff',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}
            >
              <IconPhone size={13} />
              <span>India / Europe: Call 112</span>
            </a>
          </div>
        </div>
      </div>

      {/* Warm, Reassuring Support Hero */}
      <div
        style={{
          background: 'linear-gradient(145deg, var(--card-bg) 0%, var(--accent-warm-soft, rgba(232, 168, 124, 0.12)) 100%)',
          border: '1.5px solid var(--accent-warm-border, rgba(232, 168, 124, 0.4))',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem 1.75rem',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: '1.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--status-support-bg)',
              color: 'var(--status-support-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconLifeBuoy size={20} />
          </div>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--crisis-title-color, #8C3B24)'
            }}
          >
            Free &amp; Confidential 24/7 Crisis Support
          </span>
        </div>

        <h1
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 0.75rem 0',
            lineHeight: 1.25
          }}
        >
          You are not alone — caring people are here right now
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 1.5rem 0',
            maxWidth: '680px'
          }}
        >
          If you are having a difficult moment, carrying heavy thoughts, or feeling overwhelmed, please know that caring listeners are ready to support you. These helplines are free, completely confidential, and open 24 hours a day, 7 days a week.
        </p>

        {/* Primary Call / Text CTAs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center' }}>
          <a
            href="tel:988"
            className="patient-crisis-cta"
            style={{
              fontSize: '1.05rem',
              padding: '0.85rem 1.85rem',
              textDecoration: 'none',
              borderRadius: 'var(--radius-pill)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              backgroundColor: 'var(--crisis-cta-bg, #C05638)',
              color: '#ffffff',
              fontWeight: 700
            }}
            aria-label="Call 988 Suicide and Crisis Lifeline now"
          >
            <IconPhone size={20} />
            <span>Call 988 Lifeline (US/CA)</span>
          </a>

          <a
            href="sms:988"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--crisis-cta-bg, #C05638)',
              border: '1.5px solid var(--crisis-cta-bg, #C05638)',
              borderRadius: 'var(--radius-pill)',
              padding: '0.8rem 1.4rem',
              fontWeight: 600,
              fontSize: '0.98rem',
              textDecoration: 'none'
            }}
            aria-label="Text 988 Suicide and Crisis Lifeline"
          >
            <IconMessageSquare size={18} />
            <span>Text 988 (SMS)</span>
          </a>

          <a
            href="tel:14416"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--color-primary)',
              border: '1.5px solid var(--color-primary)',
              borderRadius: 'var(--radius-pill)',
              padding: '0.8rem 1.4rem',
              fontWeight: 600,
              fontSize: '0.98rem',
              textDecoration: 'none'
            }}
            aria-label="Call Tele-MANAS India Toll-Free"
          >
            <IconPhone size={18} />
            <span>Call 14416 (India Tele-MANAS)</span>
          </a>
        </div>
      </div>

      {/* Region Selector Pills */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Select Your Region
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            All phone numbers are direct clickable links
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          {[
            { id: 'ALL', label: 'All Regions' },
            { id: 'US_CA', label: 'United States & Canada' },
            { id: 'UK', label: 'United Kingdom' },
            { id: 'IN', label: 'India' },
            { id: 'INTL', label: 'International / Other' }
          ].map((reg) => (
            <InteractiveButton
              key={reg.id}
              variant={selectedRegion === reg.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedRegion(reg.id)}
              aria-pressed={selectedRegion === reg.id}
            >
              {reg.label}
            </InteractiveButton>
          ))}
        </div>
      </div>

      {/* Helplines Grid (Never Hidden Behind Accordions) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {displayedHelplines.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: 'var(--card-bg)',
              border: item.isPrimary ? '1.5px solid var(--accent-warm-border, rgba(232, 168, 124, 0.4))' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.4rem',
              boxShadow: 'var(--shadow-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {item.name}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: 'var(--status-support-bg)',
                    color: 'var(--status-support-text)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.badge}
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                {item.description}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Region: {item.regionLabel}
              </span>
            </div>

            {/* Direct Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              {item.callNumber && (
                <a
                  href={`tel:${item.callNumber}`}
                  className="btn-patient-primary"
                  style={{
                    fontSize: '0.88rem',
                    padding: '0.55rem 1.15rem',
                    backgroundColor: 'var(--crisis-cta-bg, #C05638)',
                    color: '#fff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                  aria-label={`Call ${item.name} at ${item.callDisplay}`}
                >
                  <IconPhone size={15} />
                  <span>{item.callDisplay}</span>
                </a>
              )}

              {item.altCallNumber && (
                <a
                  href={`tel:${item.altCallNumber}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 0.95rem',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                  aria-label={`Call alternative number ${item.altCallDisplay}`}
                >
                  <IconPhone size={14} />
                  <span>{item.altCallDisplay}</span>
                </a>
              )}

              {item.smsNumber && (
                <a
                  href={item.smsBody ? `sms:${item.smsNumber}?body=${encodeURIComponent(item.smsBody)}` : `sms:${item.smsNumber}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 0.95rem',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                  aria-label={`Text ${item.smsDisplay}`}
                >
                  <IconMessageSquare size={14} />
                  <span>{item.smsDisplay}</span>
                </a>
              )}

              {item.webUrl && (
                <a
                  href={item.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 1.1rem',
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid var(--color-primary)',
                    color: 'var(--color-primary)',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    backgroundColor: 'var(--card-bg)'
                  }}
                >
                  <span>{item.webDisplay}</span>
                  <span>↗</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Gentle Grounding Pause Box */}
      <div
        style={{
          backgroundColor: 'var(--card-bg-subtle)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--accent-teal-subtle)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <IconLeaf size={22} />
        </div>
        <div>
          <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
            Take a gentle breath right now
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Place both feet flat on the floor, gently relax your shoulders, and breathe in slowly for 4 counts, then out for 4 counts. You are safe in this moment.
          </p>
        </div>
      </div>

      {/* Bottom Privacy & Return Notice */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          textAlign: 'center'
        }}
      >
        <InteractiveButton
          variant="primary"
          onClick={handleReturn}
          aria-label="Return to MindVision application"
        >
          <IconArrowLeft size={16} />
          <span>Return to MindVision</span>
        </InteractiveButton>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}
        >
          <IconShieldCheck size={14} style={{ color: 'var(--color-primary)' }} />
          <span>
            Checking crisis support is 100% confidential. Your session history is never tracked or penalized.
          </span>
        </div>
      </div>

    </div>
  );
}
