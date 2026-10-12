import { ClinicalAuditService } from '../services/clinicalAuditService.js';

export const AuditController = {
  getAuditTrail(req, res) {
    const logs = ClinicalAuditService.getAuditTrail();
    return res.json({ success: true, count: logs.length, data: logs });
  },

  logEvent(req, res) {
    try {
      const event = ClinicalAuditService.logEvent(req.body);
      return res.status(201).json({ success: true, data: event });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  clearAuditTrail(req, res) {
    ClinicalAuditService.clearAuditTrail();
    return res.json({ success: true, message: 'Audit trail reset to initial seed state' });
  }
};
