import React, { useState, useMemo } from 'react';
import { getHumanStatus } from '../utils/terminology';
import {
  IconSparkles,
  IconCalendar,
  IconShieldCheck,
  IconHeartPulse,
  IconLeaf,
  IconDownload,
  IconRefreshCw,
  IconCheck,
  IconTrash,
  IconClock,
  IconEye
} from './Icons';
import {
  InteractiveButton,
  ConfirmDialog,
  ReportPreview,
  EmptyState
} from './primitives';
import { generateCheckInPdf } from '../utils/pdfReportGenerator';

/**
 * PatientHistoryView - Production-Grade Interactive Patient History
 * 
 * Features:
 * - Timeline View & Dense List View with accessible toggle
 * - Date range and status filter pills
 * - Chronological sorting (Newest first / Oldest first)
 * - Accessible detail panel with keyboard navigation (Up/Down / Prev/Next)
 * - Safe ReportPreview modal & validated PDF download pipeline
 * - Safe Delete with ConfirmDialog
 * - Comparative reflection panel between two check-ins (no ungrounded clinical trends)
 * - Transparent local storage notice
 */
export default function PatientHistoryView({
  records = [],
  setActiveTab,
  onShowToast,
  onDeleteRecord
}) {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'list'
  const [filterRange, setFilterRange] = useState('all'); // 'all' | '7days' | '30days'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'MINIMAL' | 'MODERATE' | 'ELEVATED' | 'SEVERE'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  // Selected entry for inline detail inspection
  const [selectedIndex, setSelectedIndex] = useState(0);

  // PDF generation and preview state
  const [generatingId, setGeneratingId] = useState(null);
  const [downloadedId, setDownloadedId] = useState(null);
  const [previewReport, setPreviewReport] = useState(null);

  // Deletion confirmation state
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Comparative view toggle
  const [showComparison, setShowComparison] = useState(false);

  // Filter & sort records
  const filteredRecords = useMemo(() => {
    let list = [...records];

    // Filter by date range
    if (filterRange !== 'all') {
      const now = Date.now();
      const cutoffDays = filterRange === '7days' ? 7 : 30;
      const cutoffMs = cutoffDays * 24 * 60 * 60 * 1000;
      list = list.filter((rec) => {
        const time = rec.dateIso ? new Date(rec.dateIso).getTime() : new Date(rec.timestamp).getTime();
        return !isNaN(time) && now - time <= cutoffMs;
      });
    }

    // Filter by wellness status
    if (filterStatus !== 'all') {
      list = list.filter((rec) => rec.riskLevel === filterStatus);
    }

    // Sort order
    list.sort((a, b) => {
      const timeA = a.dateIso ? new Date(a.dateIso).getTime() : new Date(a.timestamp).getTime() || 0;
      const timeB = b.dateIso ? new Date(b.dateIso).getTime() : new Date(b.timestamp).getTime() || 0;
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [records, filterRange, filterStatus, sortOrder]);

  const safeSelectedIndex = filteredRecords.length > 0 ? Math.min(selectedIndex, filteredRecords.length - 1) : 0;
  const activeRecord = filteredRecords[safeSelectedIndex] || null;
  const compareRecord = filteredRecords[safeSelectedIndex + 1] || null;

  // Keyboard navigation for active item
  const handleKeyDown = (e) => {
    if (!filteredRecords.length) return;
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(filteredRecords.length - 1, prev + 1));
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleDownloadReport = async (record, idx) => {
    const key = record.id || idx;
    if (generatingId === key) return;
    setGeneratingId(key);
    try {
      const result = await generateCheckInPdf(record, { save: true });
      setDownloadedId(key);
      onShowToast?.(`Wellness report downloaded: ${result.filename}`);
      setTimeout(() => {
        setDownloadedId(null);
      }, 3500);
    } catch (err) {
      console.error('[MindVision] Failed to generate PDF report from history:', err);
      onShowToast?.("We couldn't generate your report — please try again");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    onDeleteRecord?.(recordToDelete.id || recordToDelete.timestamp);
    setRecordToDelete(null);
    if (selectedIndex >= filteredRecords.length - 1) {
      setSelectedIndex(Math.max(0, filteredRecords.length - 2));
    }
  };

  return (
    <div className="patient-view-shell" onKeyDown={handleKeyDown} tabIndex={0} style={{ outline: 'none' }}>
      {/* Top Header */}
      <div className="animate-enter-1">
        <div className="patient-hero-kicker">
          <span className="badge-hero-primary">
            <IconSparkles size={14} />
            <span>Your Wellness Journey</span>
          </span>
        </div>
        <h1 className="patient-hero-title" style={{ fontSize: '1.9rem', marginBottom: '0.4rem' }}>
          My Check-in History
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Review your recent wellness reflections. Taking regular moments to pause helps you stay grounded in how you feel.
        </p>
      </div>

      {/* Start New Check-in Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--accent-teal-soft-bg) 100%)',
          border: '1px solid var(--accent-teal-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.35rem 1.5rem',
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
            Take 2 quiet minutes to check in with your mind and body.
          </p>
        </div>
        <InteractiveButton
          variant="primary"
          onClick={() => setActiveTab('assessment')}
          aria-label="Start today's check-in"
        >
          <span>Take Check-in</span>
          <span>›</span>
        </InteractiveButton>
      </div>

      {/* Interactive Controls Bar: View Toggle, Filters, Sorting */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.85rem 1rem',
          backgroundColor: 'var(--card-bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-subtle)'
        }}
      >
        {/* Left: View Mode Toggle */}
        <div style={{ display: 'inline-flex', gap: '0.35rem', backgroundColor: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
          <InteractiveButton
            id="btn-view-mode-timeline"
            variant={viewMode === 'timeline' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('timeline')}
            aria-pressed={viewMode === 'timeline'}
          >
            Timeline View
          </InteractiveButton>
          <InteractiveButton
            id="btn-view-mode-list"
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
          >
            List View
          </InteractiveButton>
        </div>

        {/* Right: Filters & Sorting */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          {/* Date Range Filter */}
          <select
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
            aria-label="Filter check-ins by date range"
          >
            <option value="all">All Dates</option>
            <option value="7days">Past 7 Days</option>
            <option value="30days">Past 30 Days</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
            aria-label="Filter check-ins by status"
          >
            <option value="all">All Patterns</option>
            <option value="MINIMAL">Calm & Steady</option>
            <option value="MODERATE">Mild Stress</option>
            <option value="ELEVATED">Support Encouraged</option>
            <option value="SEVERE">Care Recommended</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
            aria-label="Sort check-ins by date"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main Content Area: Master List / Timeline & Detail Panel */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          icon={<IconCalendar size={32} />}
          title={records.length === 0 ? "No check-ins recorded yet" : "No matching check-ins"}
          description={
            records.length === 0
              ? "Your completed check-ins and reflection summaries will appear here."
              : "Try adjusting your filters above to view your reflections."
          }
          action={
            records.length === 0 ? (
              <InteractiveButton
                variant="primary"
                onClick={() => setActiveTab('assessment')}
              >
                Start First Check-in
              </InteractiveButton>
            ) : (
              <InteractiveButton
                variant="secondary"
                onClick={() => {
                  setFilterRange('all');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
              </InteractiveButton>
            )
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
          
          {/* Master View: Timeline or List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {filteredRecords.length} {filteredRecords.length === 1 ? 'Reflection' : 'Reflections'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Use ↑ / ↓ keys to navigate
              </span>
            </div>

            {filteredRecords.map((rec, idx) => {
              const status = getHumanStatus(rec.riskLevel, rec.compositeRisk);
              const isSelected = selectedIndex === idx;
              const isLatest = idx === 0 && sortOrder === 'newest';

              if (viewMode === 'list') {
                return (
                  <div
                    key={rec.id || idx}
                    onClick={() => setSelectedIndex(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedIndex(idx);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1.1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      boxShadow: isSelected ? 'var(--shadow-card)' : 'var(--shadow-subtle)',
                      transition: 'all var(--motion-fast) var(--motion-ease-out)'
                    }}
                    aria-label={`Select check-in on ${rec.timestamp}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{status.icon}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                            {status.title}
                          </span>
                          {isLatest && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'var(--accent-teal-subtle)', color: 'var(--accent-teal)', padding: '2px 6px', borderRadius: 'var(--radius-pill)' }}>
                              Latest
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {rec.timestamp}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: status.bgColor,
                        color: status.color
                      }}
                    >
                      {rec.riskLevel === 'MINIMAL' ? 'Calm' : rec.riskLevel === 'MODERATE' ? 'Mild Stress' : 'Elevated'}
                    </span>
                  </div>
                );
              }

              // Timeline view card
              return (
                <div
                  key={rec.id || idx}
                  onClick={() => setSelectedIndex(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedIndex(idx);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    border: isSelected
                      ? '2px solid var(--color-primary)'
                      : isLatest
                      ? `1.5px solid ${status.borderColor}`
                      : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem 1.35rem',
                    boxShadow: isSelected ? 'var(--shadow-card)' : 'var(--shadow-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all var(--motion-fast) var(--motion-ease-out)'
                  }}
                  aria-label={`Select check-in on ${rec.timestamp}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{status.icon}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: status.color }}>
                            {status.title}
                          </span>
                          {isLatest && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'var(--accent-teal-subtle)', color: 'var(--accent-teal)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                              Latest Check-in
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {rec.timestamp}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.65rem',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: status.bgColor,
                        color: status.color
                      }}
                    >
                      {rec.riskLevel === 'MINIMAL' ? 'Calm & Steady' : rec.riskLevel === 'MODERATE' ? 'Mild Stress' : 'Support Encouraged'}
                    </span>
                  </div>

                  {/* Summary excerpt */}
                  <p style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {rec.text ? rec.text.replace(/\(High somatic.*?\)/g, '') : "Check-in completed calmly."}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Detail Inspection Panel */}
          {activeRecord && (() => {
            const status = getHumanStatus(activeRecord.riskLevel, activeRecord.compositeRisk);
            const isLatest = selectedIndex === 0 && sortOrder === 'newest';

            return (
              <div
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.75rem',
                  boxShadow: 'var(--shadow-card)',
                  position: 'sticky',
                  top: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1.6rem' }}>{status.icon}</span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {status.title}
                      </h3>
                      {isLatest && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'var(--accent-teal-subtle)', color: 'var(--accent-teal)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                          Most Recent
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <IconClock size={13} />
                      <span>{activeRecord.timestamp}</span>
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
                    {activeRecord.riskLevel === 'MINIMAL' ? 'Calm & Steady' : activeRecord.riskLevel === 'MODERATE' ? 'Mild Stress' : 'Support Encouraged'}
                  </span>
                </div>

                {/* Patient's shared reflection */}
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                    What You Shared
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.15rem',
                      fontSize: '0.94rem',
                      color: 'var(--text-primary)',
                      lineHeight: 1.55,
                      fontStyle: 'italic'
                    }}
                  >
                    "{activeRecord.text ? activeRecord.text.replace(/\(High somatic.*?\)/g, '') : "Check-in completed calmly."}"
                  </div>
                </div>

                {/* Observation cues (genuine cues only) */}
                {activeRecord.cues && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Observed Wellness Cues
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {activeRecord.cues.speakingRhythm && (
                        <div><strong>Speaking rhythm:</strong> {activeRecord.cues.speakingRhythm}</div>
                      )}
                      {activeRecord.cues.gentleExpressions && (
                        <div><strong>Expression tone:</strong> {activeRecord.cues.gentleExpressions}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Optional Two-Session Comparison Toggle */}
                {compareRecord && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                    <InteractiveButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowComparison(!showComparison)}
                      style={{ fontSize: '0.84rem', padding: '0.4rem 0.6rem' }}
                    >
                      {showComparison ? 'Hide comparison with previous check-in' : 'Compare with previous check-in'}
                    </InteractiveButton>

                    {showComparison && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.85rem',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                          Previous check-in ({compareRecord.timestamp}):
                        </div>
                        <div>
                          Pattern was <strong>{compareRecord.riskLevel === 'MINIMAL' ? 'Calm & Steady' : 'Mild Stress'}</strong>.
                          {activeRecord.riskLevel === compareRecord.riskLevel
                            ? " Your self-reported reflections show a consistent pattern across these two check-ins."
                            : " Noticeable variations in daily rhythm and energy were reflected between these sessions."}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                          Note: Subtle day-to-day shifts are natural and do not indicate a medical diagnosis.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons: Preview, Download, Delete */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <InteractiveButton
                    id="btn-history-preview-report"
                    variant="primary"
                    size="sm"
                    onClick={() => setPreviewReport(activeRecord)}
                    aria-label="Preview Wellness Report"
                  >
                    <IconEye size={14} />
                    <span>Preview Report</span>
                  </InteractiveButton>

                  <InteractiveButton
                    id="btn-history-download-pdf"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownloadReport(activeRecord, selectedIndex)}
                    disabled={generatingId === (activeRecord.id || selectedIndex)}
                    aria-label="Download Wellness Report PDF"
                  >
                    {generatingId === (activeRecord.id || selectedIndex) ? (
                      <>
                        <IconRefreshCw size={13} className="spinning" />
                        <span>Generating...</span>
                      </>
                    ) : downloadedId === (activeRecord.id || selectedIndex) ? (
                      <>
                        <IconCheck size={13} style={{ color: 'var(--accent-teal)' }} />
                        <span>Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <IconDownload size={13} />
                        <span>Download PDF</span>
                      </>
                    )}
                  </InteractiveButton>

                  <InteractiveButton
                    id="btn-history-delete-record"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRecordToDelete(activeRecord)}
                    aria-label="Delete this check-in record"
                    style={{ color: '#ef4444', marginLeft: 'auto' }}
                  >
                    <IconTrash size={14} />
                    <span>Delete</span>
                  </InteractiveButton>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* Local Storage Privacy Note */}
      <div
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--card-bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <IconShieldCheck size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
        <span>
          <strong>Private on this device:</strong> Your check-in history is stored in your browser's private local storage. Clearing your browser cookies or browsing data will remove this history. MindVision does not share your private notes with third parties.
        </span>
      </div>

      {/* Report Preview Modal */}
      <ReportPreview
        isOpen={Boolean(previewReport)}
        report={previewReport}
        onClose={() => setPreviewReport(null)}
        onDownload={(rpt) => handleDownloadReport(rpt, selectedIndex)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(recordToDelete)}
        title="Remove this check-in?"
        description="This will permanently delete this check-in reflection from your device. This action cannot be reversed."
        confirmLabel="Delete Record"
        cancelLabel="Keep Record"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setRecordToDelete(null)}
      />
    </div>
  );
}
