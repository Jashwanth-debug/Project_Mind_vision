import React, { useState } from 'react';
import { DoctorAuthService } from '../services/doctorAuthService';

export default function DoctorAuthModal({
  isOpen,
  onClose,
  onSessionUpdated,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState('DOCTOR'); // 'PATIENT' | 'DOCTOR' | 'ADMIN'

  // Login form state
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // Doctor Registration Form State
  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialization: 'Affective Disorders',
    qualification: 'MD Psychiatry',
    medicalRegistrationNumber: '',
    experienceYears: '8',
    hospital: 'NIMHANS / Private Clinic',
    consultationRate: '150',
    bio: ''
  });

  if (!isOpen) return null;

  const doctors = DoctorAuthService.getDoctors();

  const handleRegister = (e) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.email || !regForm.medicalRegistrationNumber) {
      onShowToast('Please fill in all mandatory registration fields.');
      return;
    }

    const newDoctor = DoctorAuthService.registerDoctor(regForm);
    onShowToast(`Registration submitted for ${newDoctor.fullName}! Account status set to PENDING admin verification.`);
    DoctorAuthService.setCurrentSession('DOCTOR', newDoctor);
    if (onSessionUpdated) onSessionUpdated();
    onClose();
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (selectedRole === 'PATIENT') {
      DoctorAuthService.setCurrentSession('PATIENT', null);
      onShowToast('Logged in as Patient.');
    } else if (selectedRole === 'ADMIN') {
      DoctorAuthService.setCurrentSession('ADMIN', { id: 'admin_root', name: 'Clinical Verification Admin' });
      onShowToast('Logged in as System Admin (Doctor Verification Portal active).');
    } else {
      const doc = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
      DoctorAuthService.setCurrentSession('DOCTOR', doc);
      onShowToast(`Logged in as ${doc.fullName || doc.name}.`);
    }
    if (onSessionUpdated) onSessionUpdated();
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1300 }} onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-teal)' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div>
              <h3 className="modal-title" style={{ fontSize: '0.98rem' }}>
                Account Authentication &amp; Clinician Onboarding
              </h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Role-based access verification (Patient • Clinician • Auditor)
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tab Switcher: Login vs Register Doctor */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg-subtle)' }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.7rem',
              background: activeTab === 'login' ? 'var(--card-bg)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2px solid var(--accent-teal)' : 'none',
              color: activeTab === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 650,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('login')}
          >
            Role Login
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.7rem',
              background: activeTab === 'register' ? 'var(--card-bg)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'register' ? '2px solid var(--accent-teal)' : 'none',
              color: activeTab === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 650,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('register')}
          >
            Register Practitioner Profile
          </button>
        </div>

        <div className="modal-body" style={{ gap: '1rem' }}>
          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 650, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Operating Role
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn-secondary ${selectedRole === 'PATIENT' ? 'active' : ''}`}
                    style={{
                      justifyContent: 'center',
                      fontSize: '0.76rem'
                    }}
                    onClick={() => setSelectedRole('PATIENT')}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${selectedRole === 'DOCTOR' ? 'active' : ''}`}
                    style={{
                      justifyContent: 'center',
                      fontSize: '0.76rem'
                    }}
                    onClick={() => setSelectedRole('DOCTOR')}
                  >
                    Clinician
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${selectedRole === 'ADMIN' ? 'active' : ''}`}
                    style={{
                      justifyContent: 'center',
                      fontSize: '0.76rem'
                    }}
                    onClick={() => setSelectedRole('ADMIN')}
                  >
                    Auditor / Admin
                  </button>
                </div>
              </div>

              {selectedRole === 'DOCTOR' && (
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 650, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Select Practitioner Profile
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="select-field"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select registered profile...</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName || d.name} [{d.verificationStatus}] • {d.isDemo ? 'DEMO SEED' : 'REGISTERED'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRole === 'ADMIN' && (
                <div className="narrative-inset" style={{ borderLeftColor: 'var(--status-severe-dot)' }}>
                  <span className="inset-heading" style={{ color: 'var(--status-severe-text)' }}>Admin Verification Privileges</span>
                  <p className="inset-body" style={{ fontSize: '0.78rem' }}>
                    Administrator privileges enable inspecting pending clinician credentials, verifying registration identifiers, and approving or rejecting doctor applications.
                  </p>
                </div>
              )}

              <div className="modal-actions-footer">
                <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary">Confirm Session Switch</button>
              </div>
            </form>
          ) : (
            /* Doctor Registration Form */
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div className="narrative-inset">
                <span className="inset-heading">Credentialing Disclosure</span>
                <p className="inset-body" style={{ fontSize: '0.76rem' }}>
                  Newly registered clinician accounts are initiated in <code>PENDING</code> status and require administrator review before appearing in the public directory.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Full Name"
                    value={regForm.fullName}
                    onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                    className="search-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="practitioner@hospital.org"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="search-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Qualification *</label>
                  <input
                    type="text"
                    required
                    placeholder="MD Psychiatry"
                    value={regForm.qualification}
                    onChange={(e) => setRegForm({ ...regForm, qualification: e.target.value })}
                    className="search-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>NMC / MCI Reg No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="NMC-IND-XXXXX"
                    value={regForm.medicalRegistrationNumber}
                    onChange={(e) => setRegForm({ ...regForm, medicalRegistrationNumber: e.target.value })}
                    className="search-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Experience (Years)</label>
                  <input
                    type="number"
                    value={regForm.experienceYears}
                    onChange={(e) => setRegForm({ ...regForm, experienceYears: e.target.value })}
                    className="search-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Specialization</label>
                  <input
                    type="text"
                    placeholder="Affective Disorders"
                    value={regForm.specialization}
                    onChange={(e) => setRegForm({ ...regForm, specialization: e.target.value })}
                    className="search-field"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Standard Rate (₹ / Min)</label>
                  <input
                    type="number"
                    placeholder="150"
                    value={regForm.consultationRate}
                    onChange={(e) => setRegForm({ ...regForm, consultationRate: e.target.value })}
                    className="search-field"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Affiliated Hospital / Clinic</label>
                <input
                  type="text"
                  placeholder="NIMHANS / AIIMS / Academic Medical Center"
                  value={regForm.hospital}
                  onChange={(e) => setRegForm({ ...regForm, hospital: e.target.value })}
                  className="search-field"
                />
              </div>

              <div className="modal-actions-footer">
                <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Application for Audit</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
