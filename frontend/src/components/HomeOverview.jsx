import React, { useState, useEffect, useRef } from 'react';
import { getHumanStatus } from '../utils/terminology';
import { SpecialistStrip } from './DoctorMarketplace';
import {
  IconSparkles,
  IconShieldCheck,
  IconClock,
  IconMic,
  IconLeaf,
  IconHeartPulse,
  IconCalendar,
  IconBookOpen,
  IconLifeBuoy,
  IconPhone,
  IconChevronRight,
  IconChevronDown,
  IconFileText
} from './Icons';
import { ReportPreview, InteractiveButton } from './primitives';
import { generateCheckInPdf } from '../utils/pdfReportGenerator';

/**
 * Interactive SVG Wellness Trend Chart
 * Accessible, responsive line and area chart with keyboard focusable data points,
 * hover tooltips, and screen-reader data table alternative.
 */
function InteractiveWellnessTrend({ records = [], onSelectRecord }) {
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const chartRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(() => {
    try {
      return sessionStorage.getItem('mindvision_chart_animated') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!hasAnimated) {
      try {
        sessionStorage.setItem('mindvision_chart_animated', 'true');
      } catch {
        // Ignored
      }
      setHasAnimated(true);
    }
  }, [hasAnimated]);

  // Take the most recent 7 records (or fallback baseline records in chronological order)
  const chartRecords = records && records.length > 0
    ? [...records].slice(0, 7).reverse()
    : [
        { id: 'base-1', timestamp: '5 days ago', riskLevel: 'MINIMAL', compositeRisk: 1.0, summary: 'Calm & Steady' },
        { id: 'base-2', timestamp: '4 days ago', riskLevel: 'MINIMAL', compositeRisk: 1.2, summary: 'Restful cadence' },
        { id: 'base-3', timestamp: '3 days ago', riskLevel: 'MINIMAL', compositeRisk: 1.1, summary: 'Calm pattern' },
        { id: 'base-4', timestamp: '2 days ago', riskLevel: 'MODERATE', compositeRisk: 3.4, summary: 'Mild tension noted' },
        { id: 'base-5', timestamp: 'Yesterday', riskLevel: 'MINIMAL', compositeRisk: 1.4, summary: 'Steady reflection' },
        { id: 'base-6', timestamp: 'Today', riskLevel: 'MINIMAL', compositeRisk: 1.2, summary: 'Steady & calm' }
      ];

  const width = 360;
  const height = 110;
  const paddingX = 24;
  const paddingY = 20;

  // Map compositeRisk (0 to 10 scale, where lower is calmer) to SVG coordinates
  const points = chartRecords.map((rec, i) => {
    const x = paddingX + (i / Math.max(1, chartRecords.length - 1)) * (width - paddingX * 2);
    // Invert Y so lower stress is closer to the bottom/middle calm zone
    const clampedRisk = Math.min(10, Math.max(0.5, rec.compositeRisk || 1.2));
    const y = height - paddingY - ((10 - clampedRisk) / 10) * (height - paddingY * 2);
    return { x, y, record: rec, index: i };
  });

  // Build SVG path
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';

  const activeIndex = hoveredIndex !== null ? hoveredIndex : focusedIndex;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  return (
    <div
      ref={chartRef}
      className="interactive-trend-container"
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 'var(--space-2)'
      }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>
          WELLNESS CONTINUUM
        </span>
        <span style={{ fontSize: '0.74rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
          {chartRecords.length} recorded check-ins
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          role="img"
          aria-label="Interactive wellness trend line chart across recent check-ins"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-teal)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent-teal)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Calm baseline guide lines */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="var(--border-color)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Area under curve */}
          <path
            d={areaD}
            fill="url(#areaGradient)"
            style={{
              transition: hasAnimated ? 'none' : 'opacity 0.6s ease-out',
              opacity: 1
            }}
          />

          {/* Primary Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--accent-teal)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points */}
          {points.map((pt, i) => {
            const isSelected = activeIndex === i;
            const isElevated = pt.record.riskLevel === 'ELEVATED' || pt.record.riskLevel === 'SEVERE';
            const dotColor = isElevated ? 'var(--status-elevated-dot)' : 'var(--accent-teal)';

            return (
              <g key={pt.record.id || i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#ffffff' : dotColor}
                  stroke={dotColor}
                  strokeWidth={isSelected ? 3 : 2}
                  style={{
                    cursor: 'pointer',
                    transition: 'r var(--motion-fast) var(--motion-ease-out), fill var(--motion-fast) var(--motion-ease-out)'
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Check-in on ${pt.record.timestamp}: ${pt.record.summary || 'Recorded'}`}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setFocusedIndex(i)}
                  onBlur={() => setFocusedIndex(null)}
                  onClick={() => {
                    if (onSelectRecord) onSelectRecord(pt.record);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (onSelectRecord) onSelectRecord(pt.record);
                    }
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Viewport-Clamped Interactive Hover/Focus Tooltip */}
        {activePoint && (
          <div
            style={{
              position: 'absolute',
              top: `${Math.max(0, activePoint.y - 48)}px`,
              left: `${Math.min(Math.max(20, activePoint.x - 60), width - 120)}px`,
              background: 'var(--neutral-900)',
              color: '#ffffff',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.72rem',
              lineHeight: 1.3,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              pointerEvents: 'none',
              zIndex: 10,
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {activePoint.record.timestamp || 'Recorded session'}
            </div>
            <div style={{ color: 'var(--accent-teal-soft-bg)' }}>
              {activePoint.record.summary || (activePoint.record.riskLevel === 'MINIMAL' ? 'Steady & calm pattern' : 'Support recommended')}
            </div>
            {/* Show energy/sleep ONLY if values actually exist */}
            {activePoint.record.energy && (
              <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>
                Energy: {activePoint.record.energy}/10
              </div>
            )}
            {activePoint.record.sleep && (
              <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>
                Sleep: {activePoint.record.sleep} hrs
              </div>
            )}
          </div>
        )}
      </div>

      {/* Screen reader text table alternative - strictly accessible to assistive technology, visually hidden */}
      <div className="sr-only" aria-live="polite">
        <table className="sr-only">
          <caption>Wellness check-in trend data points</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {chartRecords.map((r, i) => (
              <tr key={r.id || i}>
                <td>{r.timestamp}</td>
                <td>{r.summary || r.riskLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * HomeOverview - Production-Grade Patient-Centered Wellness Home Screen
 */
export default function HomeOverview({
  setActiveTab,
  latestRecord = null,
  records = [],
  onConnectDoctor,
  onShowToast
}) {
  const [isReflectionExpanded, setIsReflectionExpanded] = useState(false);
  const [selectedReportForPreview, setSelectedReportForPreview] = useState(null);
  const [hasUnfinishedDraft, setHasUnfinishedDraft] = useState(false);

  // Initial load staggered entrance guard: avoids replaying entrances on every rerender
  const isInitialMount = useRef(true);
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  // Check for unfinished active check-in draft in sessionStorage
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem('mindvision_active_checkin_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && Array.isArray(parsed.dialogHistory) && parsed.dialogHistory.length > 0) {
          setHasUnfinishedDraft(true);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Time-of-day empathetic greeting (derived purely from local client clock, no fake telemetry)
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  // Derive latest record or realistic baseline
  const activeRecord = latestRecord || (records && records.length > 0 ? records[0] : {
    riskLevel: 'MINIMAL',
    compositeRisk: 1.2,
    timestamp: 'Today',
    explanation: 'Your self-reported answers and estimated signals reflect a steady, calm pattern today.',
    text: 'Routine bi-weekly check-in. Restful sleep and steady focus reported.'
  });

  const isElevated = activeRecord.riskLevel === 'ELEVATED' || activeRecord.riskLevel === 'SEVERE';
  const statusHeadline = isElevated ? "Support is here if you need it" : "Steady & calm pattern reported";
  const statusRecap = isElevated
    ? "Your recent responses showed subtle signs of stress. Taking small pauses for yourself can bring gentle relief."
    : "Your recent check-in showed a steady, calm pattern. Taking regular moments to pause helps maintain your well-being.";

  const handleDownloadPdf = async (record) => {
    try {
      const result = await generateCheckInPdf(record, { save: true });
      if (onShowToast) onShowToast(`Wellness report downloaded: ${result.filename}`);
    } catch {
      if (onShowToast) onShowToast("Couldn't generate report — please try again");
    }
  };

  return (
    <div className="patient-view-shell">
      
      {/* 1. TOP FULL-WIDTH HERO: REAL-TIME AI CHECK-IN */}
      <section
        className={`patient-hero-card ${isInitialMount.current ? 'animate-enter-1' : ''}`}
        style={{ width: '100%' }}
        aria-label="Real-Time AI Check-in"
      >
        <div className="patient-hero-kicker">
          <span className="badge-hero-primary">
            <IconSparkles size={14} />
            <span>{timeGreeting} • AI Wellness Companion</span>
          </span>
          <span className="badge-info-tag">
            <IconShieldCheck size={13} />
            <span>100% Private &amp; Secure</span>
          </span>
        </div>

        <h1 className="patient-hero-title">
          {hasUnfinishedDraft
            ? "Continue your check-in right where you paused."
            : "Start your check-in — it only takes a minute."}
        </h1>

        <p className="patient-hero-subtitle">
          {hasUnfinishedDraft
            ? "You have a check-in reflection in progress. Your previous answers are preserved and waiting for you."
            : "Take a quiet pause for yourself. Our gentle, voice-guided companion listens with empathy to help you notice how you're really doing today, with personalized insights and zero judgment."}
        </p>

        {/* Tactile Primary CTA Button with directional hover arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <button
            id="btn-hero-start-checkin"
            type="button"
            className="btn-patient-primary pulse-cta"
            onClick={() => setActiveTab('assessment')}
            aria-label={hasUnfinishedDraft ? "Continue your saved check-in" : "Start Real-Time AI Check-in"}
          >
            <span>{hasUnfinishedDraft ? "Continue Check-in" : "Start Check-in"}</span>
            <IconChevronRight size={18} className="cta-arrow-icon" />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.84rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconClock size={15} style={{ color: 'var(--color-primary)' }} />
              <span>Takes ~1–2 minutes</span>
            </span>
            <span style={{ color: 'var(--border-color-strong)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconMic size={15} style={{ color: 'var(--color-primary)' }} />
              <span>Speak or type freely</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. DUAL-CARD ROW: LATEST REFLECTION & INTERACTIVE WELLNESS CONTINUUM */}
      <section
        className={`patient-dual-cards-row ${isInitialMount.current ? 'animate-enter-2' : ''}`}
        aria-label="Recent Check-in Summary and Wellness Trend"
      >
        {/* Card 1: Latest Reflection */}
        <div className="patient-dashboard-card patient-reflection-card">
          <div className="dashboard-card-body">
            <div className="reflection-card-header">
              <div
                className="reflection-icon-box"
                style={{
                  backgroundColor: isElevated ? 'var(--status-elevated-bg)' : 'var(--status-minimal-bg)',
                  color: isElevated ? 'var(--status-elevated-text)' : 'var(--status-minimal-text)',
                  border: `1px solid ${isElevated ? 'var(--status-elevated-border)' : 'var(--status-minimal-border)'}`
                }}
              >
                {isElevated ? <IconHeartPulse size={22} /> : <IconLeaf size={22} />}
              </div>
              <div>
                <div className="card-kicker-label">
                  Latest Reflection • {activeRecord.timestamp || 'Recent'}
                </div>
                <h2 className="reflection-headline">
                  {statusHeadline}
                </h2>
              </div>
            </div>

            <p className="reflection-subtext">
              {statusRecap}
            </p>

            {/* Expandable Latest Reflection Body */}
            <div
              className="reflection-expanded-drawer"
              style={{
                maxHeight: isReflectionExpanded ? '600px' : '0',
                opacity: isReflectionExpanded ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height var(--motion-normal) var(--motion-ease-out), opacity var(--motion-normal) var(--motion-ease-out)'
              }}
            >
              <div className="reflection-expanded-content">
                {activeRecord.text && (
                  <div className="reflection-quote-box">
                    "{activeRecord.text.replace(/\(High somatic.*?\)/g, '')}"
                  </div>
                )}

                {activeRecord.cues && (
                  <div className="reflection-cues-grid">
                    {activeRecord.cues.words && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Verbal clarity:</strong> {activeRecord.cues.words}
                      </div>
                    )}
                    {activeRecord.cues.speakingRhythm && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Tone &amp; Cadence:</strong> {activeRecord.cues.speakingRhythm}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', paddingTop: 'var(--space-2)' }}>
                  <InteractiveButton
                    variant="secondary"
                    size="sm"
                    icon={<IconFileText size={14} />}
                    onClick={() => setSelectedReportForPreview(activeRecord)}
                  >
                    Preview Report
                  </InteractiveButton>
                  <InteractiveButton
                    variant="outline"
                    size="sm"
                    icon={<IconCalendar size={14} />}
                    onClick={() => setActiveTab('results')}
                  >
                    View in Timeline
                  </InteractiveButton>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom-Aligned Action Link */}
          <div className="dashboard-card-footer">
            <button
              id="btn-expand-reflection"
              type="button"
              className="card-action-link"
              onClick={() => setIsReflectionExpanded((prev) => !prev)}
              aria-expanded={isReflectionExpanded}
            >
              <span>{isReflectionExpanded ? 'Hide reflection details' : 'Expand reflection notes'}</span>
              <IconChevronDown
                size={14}
                style={{
                  transform: isReflectionExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform var(--motion-fast) var(--motion-ease-out)'
                }}
              />
            </button>
          </div>
        </div>

        {/* Card 2: Interactive Wellness Trend Chart */}
        <div className="patient-dashboard-card patient-chart-card">
          <div className="dashboard-card-body">
            <InteractiveWellnessTrend
              records={records}
              onSelectRecord={(rec) => {
                setSelectedReportForPreview(rec);
              }}
            />
          </div>

          {/* Bottom-Aligned Action Link - horizontal baseline aligned with Card 1 */}
          <div className="dashboard-card-footer">
            <button
              id="btn-view-timeline"
              type="button"
              className="card-action-link"
              onClick={() => setActiveTab('results')}
            >
              <span>View full timeline</span>
              <IconChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. SECONDARY ACTION CARDS (Clean Grid, No Nested Buttons) */}
      <section
        className={`patient-cards-grid ${isInitialMount.current ? 'animate-enter-3' : ''}`}
        aria-label="Past History & Supportive Resources"
      >
        {/* Card A: My Past Check-ins */}
        <div
          className="patient-action-card"
          onClick={() => setActiveTab('results')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('results');
            }
          }}
          aria-label="See my past check-ins"
        >
          <div>
            <div className="patient-action-card-icon">
              <IconCalendar size={20} />
            </div>
            <h2 className="patient-action-card-title">
              See my past check-ins
            </h2>
            <p className="patient-action-card-desc">
              Review your personal wellness history and observe how your sleep, energy, and mood evolve over time.
            </p>
          </div>
          <div className="patient-action-card-link">
            <span>View your history</span>
            <IconChevronRight size={16} />
          </div>
        </div>

        {/* Card B: Self-Reflection & Guidance */}
        <div
          className="patient-action-card"
          onClick={() => setActiveTab('docs')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('docs');
            }
          }}
          aria-label="Wellness guidance and privacy FAQs"
        >
          <div>
            <div className="patient-action-card-icon" style={{ backgroundColor: 'var(--status-support-bg)', color: 'var(--status-support-text)' }}>
              <IconBookOpen size={20} />
            </div>
            <h2 className="patient-action-card-title">
              Wellness guidance &amp; FAQs
            </h2>
            <p className="patient-action-card-desc">
              Learn how your gentle check-ins help build self-awareness and how your privacy is rigorously protected.
            </p>
          </div>
          <div className="patient-action-card-link">
            <span>Read guide &amp; privacy</span>
            <IconChevronRight size={16} />
          </div>
        </div>
      </section>

      {/* 4. COMPACT SPECIALIST FOOTER STRIP */}
      <div className={isInitialMount.current ? 'animate-enter-4' : ''}>
        <SpecialistStrip
          onConnectDoctor={onConnectDoctor}
          setActiveTab={setActiveTab}
          onShowToast={onShowToast}
        />
      </div>

      {/* 5. REASSURING CRISIS SUPPORT CARD */}
      <section
        className={`patient-crisis-banner ${isInitialMount.current ? 'animate-enter-4' : ''}`}
        aria-label="Crisis Support Information"
      >
        <div className="patient-crisis-text">
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--status-support-bg)',
            color: 'var(--status-support-text)',
            border: '1px solid var(--status-support-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconLifeBuoy size={22} />
          </div>
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
          aria-label="Call or text 988 Crisis Lifeline"
        >
          <IconPhone size={15} />
          <span>Call or Text 988</span>
        </a>
      </section>

      {/* 6. QUIET CONFIDENTIALITY FOOTNOTE */}
      <footer
        style={{
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <IconShieldCheck size={16} style={{ color: 'var(--color-primary)' }} />
          <strong>Your privacy is protected:</strong>
        </span>
        <span>
          All check-in reflections are kept confidential and are never shared without your permission. MindVision is designed as a wellness companion and does not replace medical diagnosis or psychiatric therapy.
        </span>
      </footer>

      {/* Report Preview Modal */}
      {selectedReportForPreview && (
        <ReportPreview
          isOpen={!!selectedReportForPreview}
          onClose={() => setSelectedReportForPreview(null)}
          record={selectedReportForPreview}
          onDownload={handleDownloadPdf}
        />
      )}

    </div>
  );
}
