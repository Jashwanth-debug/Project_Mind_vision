import { TelemetryTimelineService } from '../services/telemetryTimelineService.js';

export const TelemetryController = {
  getActiveTimeline(req, res) {
    const buffer = TelemetryTimelineService.getActiveTimeline();
    return res.json({ success: true, count: buffer.length, data: buffer });
  },

  recordPoint(req, res) {
    try {
      const point = TelemetryTimelineService.recordTimelinePoint(req.body);
      return res.status(201).json({ success: true, data: point });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  getLongitudinalSessions(req, res) {
    const sessions = TelemetryTimelineService.getLongitudinalSessions();
    return res.json({ success: true, count: sessions.length, data: sessions });
  },

  getDelta(req, res) {
    const delta = TelemetryTimelineService.calculateDelta();
    return res.json({ success: true, data: delta });
  },

  resetActiveSession(req, res) {
    TelemetryTimelineService.resetSession();
    return res.json({ success: true, message: 'Active telemetry session reset' });
  }
};
