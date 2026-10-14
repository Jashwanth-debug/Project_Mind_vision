import { TelemetryController } from '../controllers/telemetryController.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Telemetry Timeline & Longitudinal Session Routes
 */
export function registerTelemetryRoutes(router) {
  // Protected Clinician & Admin analytics endpoints
  router.get('/api/telemetry/timeline', requireAuth(['DOCTOR', 'ADMIN']), TelemetryController.getActiveTimeline);
  router.post('/api/telemetry/timeline', requireAuth(['DOCTOR', 'ADMIN', 'PATIENT']), TelemetryController.recordPoint);
  router.get('/api/telemetry/longitudinal', requireAuth(['DOCTOR', 'ADMIN']), TelemetryController.getLongitudinalSessions);
  router.get('/api/telemetry/delta', requireAuth(['DOCTOR', 'ADMIN']), TelemetryController.getDelta);

  // Admin-only session reset
  router.post('/api/telemetry/reset', requireAuth(['ADMIN']), TelemetryController.resetActiveSession);
}
