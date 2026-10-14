import { DoctorAuthService } from '../services/doctorAuthService.js';
import { generateToken } from '../middleware/auth.js';

export const DoctorController = {
  getDoctors(req, res) {
    const doctors = DoctorAuthService.getDoctors();
    return res.json({ success: true, count: doctors.length, data: doctors });
  },

  getVerifiedDoctors(req, res) {
    const verified = DoctorAuthService.getAvailableVerifiedDoctors();
    return res.json({ success: true, count: verified.length, data: verified });
  },

  login(req, res) {
    const { email, doctorId, role } = req.body || {};

    // Admin login
    if (role === 'ADMIN' || (email && email.toLowerCase() === 'admin@mindvision.ai')) {
      const token = generateToken({
        id: 'admin_root',
        name: 'Clinical Verification Admin',
        role: 'ADMIN',
        email: email || 'admin@mindvision.ai'
      });
      return res.json({
        success: true,
        message: 'Admin authenticated successfully',
        token,
        user: { id: 'admin_root', name: 'Clinical Verification Admin', role: 'ADMIN' }
      });
    }

    // Doctor login by ID or Email
    let doctor = null;
    if (doctorId) {
      doctor = DoctorAuthService.getDoctorById(doctorId);
    } else if (email) {
      doctor = DoctorAuthService.getDoctors().find(d => d.email && d.email.toLowerCase() === email.toLowerCase());
    } else {
      // Demo doctor fallback
      doctor = DoctorAuthService.getDoctors()[0];
    }

    if (!doctor) {
      return res.status(401).json({ success: false, message: 'Doctor account not found' });
    }

    const token = generateToken({
      id: doctor.id,
      name: doctor.fullName || doctor.name,
      role: 'DOCTOR',
      email: doctor.email
    });

    return res.json({
      success: true,
      message: 'Authenticated successfully',
      token,
      user: doctor
    });
  },

  approveDoctor(req, res) {
    const { doctorId } = req.params;
    const doc = DoctorAuthService.approveDoctor(doctorId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    return res.json({ success: true, message: 'Doctor registration approved', data: doc });
  },

  rejectDoctor(req, res) {
    const { doctorId } = req.params;
    const doc = DoctorAuthService.rejectDoctor(doctorId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    return res.json({ success: true, message: 'Doctor registration rejected', data: doc });
  },

  register(req, res) {
    try {
      const doc = DoctorAuthService.registerDoctor(req.body);
      return res.status(201).json({ success: true, message: 'Registration submitted successfully', data: doc });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  requestConsultation(req, res) {
    const { patientInfo, doctorId, telemetrySnapshot } = req.body;
    const doctor = DoctorAuthService.getDoctorById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const consultation = DoctorAuthService.createConsultationRequest(patientInfo, doctor, telemetrySnapshot);
    return res.status(201).json({ success: true, data: consultation });
  },

  getConsultations(req, res) {
    const consultations = DoctorAuthService.getConsultations();
    return res.json({ success: true, count: consultations.length, data: consultations });
  }
};
