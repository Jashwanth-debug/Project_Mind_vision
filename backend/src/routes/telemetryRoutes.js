import { TelemetryController } from '../controllers/telemetryController.js';

/**
 * Telemetry Timeline & Longitudinal Session Routes
 */
export function registerTelemetryRoutes(router) {
  router.get('/api/telemetry/timeline', TelemetryController.getActiveTimeline);
  router.post('/api/telemetry/timeline', TelemetryController.recordPoint);
  router.get('/api/telemetry/longitudinal', TelemetryController.getLongitudinalSessions);
  router.get('/api/telemetry/delta', TelemetryController.getDelta);
  router.post('/api/telemetry/reset', TelemetryController.resetActiveSession);
}
