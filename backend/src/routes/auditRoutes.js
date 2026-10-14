import { AuditController } from '../controllers/auditController.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Clinical Audit Trail Routes
 */
export function registerAuditRoutes(router) {
  // Protected Audit review and logging
  router.get('/api/audit', requireAuth(['DOCTOR', 'ADMIN']), AuditController.getAuditTrail);
  router.post('/api/audit', requireAuth(['DOCTOR', 'ADMIN', 'PATIENT']), AuditController.logEvent);
  router.post('/api/audit/clear', requireAuth(['ADMIN']), AuditController.clearAuditTrail);
}
