import { DoctorController } from '../controllers/doctorController.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Doctor & Clinical Authentication Routes
 */
export function registerDoctorRoutes(router) {
  // Public directory and intake routes
  router.get('/api/doctors', DoctorController.getDoctors);
  router.get('/api/doctors/verified', DoctorController.getVerifiedDoctors);
  router.post('/api/doctors/register', DoctorController.register);
  router.post('/api/doctors/login', DoctorController.login);
  router.post('/api/doctors/consultations', DoctorController.requestConsultation);

  // Protected Admin-only routes
  router.put('/api/doctors/:doctorId/approve', requireAuth(['ADMIN']), DoctorController.approveDoctor);
  router.put('/api/doctors/:doctorId/reject', requireAuth(['ADMIN']), DoctorController.rejectDoctor);

  // Protected Clinician/Admin routes (contains sensitive patient names and intake telemetry)
  router.get('/api/doctors/consultations', requireAuth(['DOCTOR', 'ADMIN']), DoctorController.getConsultations);
}
