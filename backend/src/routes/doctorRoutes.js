import { DoctorController } from '../controllers/doctorController.js';

/**
 * Doctor & Clinical Authentication Routes
 */
export function registerDoctorRoutes(router) {
  router.get('/api/doctors', DoctorController.getDoctors);
  router.get('/api/doctors/verified', DoctorController.getVerifiedDoctors);
  router.post('/api/doctors/register', DoctorController.register);
  router.post('/api/doctors/login', DoctorController.login);
  router.put('/api/doctors/:doctorId/approve', DoctorController.approveDoctor);
  router.put('/api/doctors/:doctorId/reject', DoctorController.rejectDoctor);
  router.post('/api/doctors/consultations', DoctorController.requestConsultation);
  router.get('/api/doctors/consultations', DoctorController.getConsultations);
}
