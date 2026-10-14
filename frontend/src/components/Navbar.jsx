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
                Home
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => setActiveTab('results')}
              >
                My Check-ins
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'doctors' ? 'active' : ''}`}
                onClick={() => setActiveTab('doctors')}
              >
                Talk to Someone
              </button>
              <button
                className={`nav-link-btn ${activeTab === 'docs' || activeTab === 'help' ? 'active' : ''}`}
                onClick={() => setActiveTab('docs')}
              >
                Help
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

        {/* System & Navigation Actions */}
        <div className="nav-actions">
          {/* Internal Role Switcher - Gated strictly for Clinician/Technical Staff */}
          {(currentRole !== 'PATIENT') && (
            <div style={{
              display: 'inline-flex',
              padding: '2px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-color)',
              alignItems: 'center'
            }} title="Switch workstation perspective">
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
                  cursor: 'pointer'
                }}
              >
                👤 Patient View
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
                  cursor: 'pointer'
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
                  cursor: 'pointer'
                }}
              >
                🔬 Technical
              </button>
            </div>
          )}

          {/* Simple, Non-Alarming Privacy Reassurance for Patients */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.8rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--accent-teal-soft-bg)',
            color: 'var(--color-primary)',
            fontSize: '0.78rem',
            fontWeight: 600
          }}>
            <span>🔒</span>
            <span>Your information is private and secure.</span>
          </div>

          {/* Gentle, Calm Immediate Support Option */}
          <button
            type="button"
            onClick={onEmergencyConnect}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'var(--status-support-bg)',
              color: 'var(--status-support-text)',
              border: '1px solid var(--status-support-border)',
              borderRadius: 'var(--radius-pill)',
              padding: '0.4rem 0.95rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Need immediate listening support or free crisis resources?"
          >
            <span>💬</span>
            <span>Need help now?</span>
          </button>

          {/* Clinician Access Link (Discreetly placed, not an overwhelming toggle) */}
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              padding: '0.3rem 0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title="Clinician / Provider sign in"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{currentRole === 'PATIENT' ? 'Provider login' : (doctorName || 'Staff Console')}</span>
          </button>

          {/* Theme Switcher */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            title={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to evening theme'}
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
