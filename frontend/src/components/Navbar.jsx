import React from 'react';

export default function Navbar({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  onEmergencyConnect,
  onOpenAuth,
  currentSession,
  userRole = 'PATIENT',
  setUserRole
}) {
  const currentRole = userRole || currentSession?.role || 'PATIENT';
  const doctorName = currentSession?.user?.fullName || currentSession?.user?.name;

  const handleRoleChange = (role) => {
    if (setUserRole) setUserRole(role);
    if (role === 'PATIENT') {
      setActiveTab('home');
    } else if (role === 'DOCTOR' || role === 'CLINICIAN') {
      setActiveTab('portal');
    } else if (role === 'ADMIN' || role === 'TECHNICAL') {
      setActiveTab('demo');
    }
  };

  return (
    <header className="nav-header">
      <div className="nav-container">
        {/* Branding (Left) */}
        <div className="brand-section" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
          <div className="brand-logo-hex">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17" opacity="0.3" />
              <path d="M12 6v12M6 12h12" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title">MindVision</span>
            <span className="brand-subtitle">
              {currentRole === 'DOCTOR' || currentRole === 'CLINICIAN'
                ? 'Clinical Decision Support Workstation'
                : currentRole === 'ADMIN' || currentRole === 'TECHNICAL'
                ? 'Multimodal Telemetry & Research'
                : 'Your Wellness Check-in Companion'}
            </span>
          </div>
        </div>

        {/* Dynamic Navigation Tabs based on Role */}
        <nav className="nav-links" aria-label="Main Navigation">
          {/* PATIENT ROLE NAVIGATION */}
          {(currentRole === 'PATIENT') && (
            <>
              <button
                className={`nav-link-btn ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                Overview
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'assessment' ? 'active' : ''}`}
                onClick={() => setActiveTab('assessment')}
              >
                Check-in
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => setActiveTab('results')}
              >
                My Results
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'doctors' ? 'active' : ''}`}
                onClick={() => setActiveTab('doctors')}
              >
                Talk to a Clinician
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'docs' ? 'active' : ''}`}
                onClick={() => setActiveTab('docs')}
              >
                Help &amp; FAQ
              </button>
            </>
          )}

          {/* CLINICIAN ROLE NAVIGATION */}
          {(currentRole === 'DOCTOR' || currentRole === 'CLINICIAN') && (
            <>
              <button
                className={`nav-link-btn ${activeTab === 'portal' ? 'active' : ''}`}
                onClick={() => setActiveTab('portal')}
              >
                Clinician Portal
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => setActiveTab('results')}
              >
                Patient History
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'assessment' ? 'active' : ''}`}
                onClick={() => setActiveTab('assessment')}
              >
                Clinical Intake
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'doctors' ? 'active' : ''}`}
                onClick={() => setActiveTab('doctors')}
              >
                Provider Network
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'demo' ? 'active' : ''}`}
                onClick={() => setActiveTab('demo')}
              >
                Simulator
              </button>
            </>
          )}

          {/* ADMIN / TECHNICAL ROLE NAVIGATION */}
          {(currentRole === 'ADMIN' || currentRole === 'TECHNICAL') && (
            <>
              <button
                className={`nav-link-btn ${activeTab === 'demo' ? 'active' : ''}`}
                onClick={() => setActiveTab('demo')}
              >
                Telemetry Sandbox
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                Admin Audit
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'portal' ? 'active' : ''}`}
                onClick={() => setActiveTab('portal')}
              >
                Clinician Portal
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                Patient View
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'docs' ? 'active' : ''}`}
                onClick={() => setActiveTab('docs')}
              >
                System Docs
              </button>
            </>
          )}
        </nav>

        {/* System Telemetry & Control Actions */}
        <div className="nav-actions">
          {/* 3-Role View Switcher */}
          <div style={{
            display: 'inline-flex',
            padding: '2px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-color)',
            alignItems: 'center'
          }} title="Switch between Patient, Clinician, and Technical research views">
            <button
              type="button"
              onClick={() => handleRoleChange('PATIENT')}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: currentRole === 'PATIENT' ? 'var(--accent-teal)' : 'transparent',
                color: currentRole === 'PATIENT' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.74rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              👤 Patient
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('DOCTOR')}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: (currentRole === 'DOCTOR' || currentRole === 'CLINICIAN') ? 'var(--accent-teal)' : 'transparent',
                color: (currentRole === 'DOCTOR' || currentRole === 'CLINICIAN') ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.74rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🩺 Clinician
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: (currentRole === 'ADMIN' || currentRole === 'TECHNICAL') ? 'var(--accent-teal)' : 'transparent',
                color: (currentRole === 'ADMIN' || currentRole === 'TECHNICAL') ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.74rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🔬 Technical
            </button>
          </div>

          {/* Clinician Account / Sign-in */}
          <button
            className="btn-account-switch"
            onClick={onOpenAuth}
            title="Clinician Account Details &amp; Registration"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="account-role-label">
              {currentRole === 'DOCTOR' ? (doctorName || 'Dr. Account') : currentRole === 'ADMIN' ? 'Admin console' : 'Account'}
            </span>
          </button>

          {/* On-Device Privacy Badge (Plain language) */}
          <div className="wasm-badge" title="All voice and facial signal processing runs privately on your device. Zero audio or video leaves your browser.">
            <span className="pulse-dot"></span>
            <span>🔒 PRIVATE ON-DEVICE</span>
          </div>

          {/* Immediate Assistance Action Button */}
          <button
            className="btn-emergency-action"
            onClick={onEmergencyConnect}
            title="Immediate connection to an on-call mental health clinician"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Immediate Support</span>
          </button>

          {/* Theme Switcher */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            title={theme === 'dark' ? 'Switch to Clinical Daylight Mode' : 'Switch to Clinical Night / Command Center Mode'}
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
