import React, { useState } from 'react';
import { INITIAL_CLINICIANS } from '../data/clinicians';

export default function DoctorDirectoryModal({
  isOpen,
  onClose,
  onStartSession,
  highRiskTelemetry
}) {
  const [maxRateFilter, setMaxRateFilter] = useState('ALL');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [languageFilter, setLanguageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter clinicians by max rate, specialty, language, and search query
  const filteredClinicians = INITIAL_CLINICIANS.filter((doc) => {
    let matchesRate = true;
    if (maxRateFilter === 'FREE') matchesRate = doc.ratePerMinute === 0;
    else if (maxRateFilter === '10') matchesRate = doc.ratePerMinute <= 10;
    else if (maxRateFilter === '15') matchesRate = doc.ratePerMinute <= 15;

    let matchesSpecialty =
      specialtyFilter === 'ALL' ||
      doc.specialties.some((s) => s.toLowerCase().includes(specialtyFilter.toLowerCase()));

    let matchesLanguage =
      languageFilter === 'ALL' ||
      (doc.languages && doc.languages.some((l) =>
        l.toLowerCase().includes(languageFilter.toLowerCase()) ||
        (languageFilter === 'HI' && l.toLowerCase().includes('hindi')) ||
        (languageFilter === 'EN' && l.toLowerCase().includes('english'))
      ));

    return matchesRate && matchesSpecialty && matchesLanguage && matchesQuery;
  });

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-dialog" style={{ maxWidth: '880px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header" style={{ background: 'var(--status-severe-bg)', borderBottom: '1px solid var(--status-severe-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="pulse-dot" style={{ backgroundColor: 'var(--status-severe-dot)', width: '10px', height: '10px' }}></span>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.05rem', color: 'var(--status-severe-text)' }}>
                🚨 High-Risk Telemetry Detected — Choose an On-Call Clinician
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Composite Risk Score: <strong>{highRiskTelemetry?.compositeRisk || '7.8'} / 10</strong> • Incongruence Index: <strong>{highRiskTelemetry?.incongruenceIndex || '0.58'}</strong>
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', gap: '1.1rem' }}>
          {/* Directory Controls & Filter Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '0.65rem', background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <input
              type="text"
              placeholder="Search clinician name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />

            <select
              value={maxRateFilter}
              onChange={(e) => setMaxRateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Max Rate (All)</option>
              <option value="FREE">Pro-Bono / FREE (₹0)</option>
              <option value="10">&le; ₹10 / min</option>
              <option value="15">&le; ₹15 / min</option>
            </select>

            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Specialization (All)</option>
              <option value="Affective">Affective Disorders</option>
              <option value="Crisis">Crisis Intervention</option>
              <option value="Somatic">Somatic Suppression</option>
            </select>

            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Language (English/Hindi)</option>
              <option value="EN">English</option>
              <option value="HI">Hindi</option>
            </select>
          </div>

          {/* Clinician Directory Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
            {filteredClinicians.map((doc) => (
              <div className="patient-record-card" key={doc.id} style={{ cursor: 'default', padding: '1.1rem' }}>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <img
                    src={doc.avatarUrl}
                    alt={doc.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{doc.name}</h4>
                      <span style={{ fontSize: '0.68rem', color: 'var(--status-minimal-text)', background: 'var(--status-minimal-bg)', padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--status-minimal-border)' }}>
                        ✓ Verified
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{doc.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{doc.institution}</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: doc.ratePerMinute === 0 ? '#10b981' : 'var(--text-primary)' }}>
                      {doc.ratePerMinute === 0 ? 'FREE / Pro-Bono' : `₹${doc.consultationFee || 299} (₹${doc.ratePerMinute}/m)`}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>★ {doc.rating}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.85rem' }}>
                  {doc.specialties.map((spec, i) => (
                    <span className="channel-tag" key={i}>
                      {spec}
                    </span>
                  ))}
                </div>

                <button
                  className="btn-emergency-accept"
                  style={{ width: '100%', borderRadius: 'var(--radius-pill)', justifyContent: 'center' }}
                  onClick={() => onStartSession(doc)}
                >
                  <span>📞</span>
                  <span>{doc.ratePerMinute === 0 ? 'Start Free Pro-Bono Session' : `Connect Video Session (₹${doc.consultationFee || 299})`}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
