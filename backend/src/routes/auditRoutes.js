import { AuditController } from '../controllers/auditController.js';

/**
 * Clinical Audit Trail Routes
 */
export function registerAuditRoutes(router) {
  router.get('/api/audit', AuditController.getAuditTrail);
  router.post('/api/audit', AuditController.logEvent);
  router.post('/api/audit/clear', AuditController.clearAuditTrail);
}
