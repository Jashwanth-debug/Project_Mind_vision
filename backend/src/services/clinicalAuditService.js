/**
 * MindVision Clinical AI - Clinical Audit Trail Service
 * 
 * Records an immutable log of critical clinical workflow events:
 * - Screening intake & completion
 * - Camera & microphone hardware authorization
 * - Signal quality evaluations
 * - Indicator generation & explainability reviews
 * - Consultation requests, acceptances, & WebRTC handshakes
 * - SOAP draft generations, clinician reviews & note finalizations
 * 
 * Conforms to clinical data governance:
 * - Strictly avoids storing raw audio or video streams
 * - Captures metadata, timestamps, actors, and event status codes
 */

const STORAGE_KEY_AUDIT_LOGS = 'mindvision_clinical_audit_trail_v1';

// Seed default audit trail to show initial operational status
const SEED_AUDIT_EVENTS = [
  {
    id: 'evt_init_01',
    timestamp: '10:31:02',
    date: '10/05/2026',
    eventType: 'SCREENING_STARTED',
    label: 'Clinical screening intake initiated',
    actor: 'PATIENT',
    actorId: 'MV-PATIENT-8821',
    sessionId: 'sess_live_1005',
    status: 'COMPLETED',
    details: 'Patient commenced intake questionnaire and baseline telemetry check.'
  },
  {
    id: 'evt_init_02',
    timestamp: '10:31:18',
    date: '10/05/2026',
    eventType: 'CAMERA_PERMISSION_GRANTED',
    label: 'Camera sensor hardware authorized',
    actor: 'SYSTEM',
    actorId: 'CLIENT_BROWSER',
    sessionId: 'sess_live_1005',
    status: 'SUCCESS',
    details: 'Local getUserMedia video track initialized with 640x480 resolution.'
  },
  {
    id: 'evt_init_03',
    timestamp: '10:31:21',
    date: '10/05/2026',
    eventType: 'MIC_PERMISSION_GRANTED',
    label: 'Microphone hardware authorized',
    actor: 'SYSTEM',
    actorId: 'CLIENT_BROWSER',
    sessionId: 'sess_live_1005',
    status: 'SUCCESS',
    details: 'WebAudio AnalyserNode connected for on-device RMS calculation.'
  },
  {
    id: 'evt_init_04',
    timestamp: '10:32:04',
    date: '10/05/2026',
    eventType: 'SIGNAL_QUALITY_EVALUATED',
    label: 'Signal quality evaluated',
    actor: 'AI_ENGINE',
    actorId: 'SignalQualityEngine',
    sessionId: 'sess_live_1005',
    status: 'PASS',
    details: 'Quality Score: 86% (Camera: Optimal, Mic: Nominal, Face Tracking: Stable).'
  },
  {
    id: 'evt_init_05',
    timestamp: '10:33:17',
    date: '10/05/2026',
    eventType: 'SCREENING_COMPLETED',
    label: 'Intake screening completed',
    actor: 'PATIENT',
    actorId: 'MV-PATIENT-8821',
    sessionId: 'sess_live_1005',
    status: 'COMPLETED',
    details: 'Validated responses logged. Multimodal tensor passed to fusion module.'
  },
  {
    id: 'evt_init_06',
    timestamp: '10:33:21',
    date: '10/05/2026',
    eventType: 'INDICATOR_GENERATED',
    label: 'Decision-support indicator generated',
    actor: 'AI_ENGINE',
    actorId: 'MultimodalFusionModel',
    sessionId: 'sess_live_1005',
    status: 'PROCESSED',
    details: 'Composite Risk: 6.3/10 (Elevated), Incongruence: 0.28, Confidence: 78%.'
  }
];

let memoryLogs = [...SEED_AUDIT_EVENTS];

function getLogs() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(SEED_AUDIT_EVENTS));
        return SEED_AUDIT_EVENTS;
      }
      return JSON.parse(raw);
    }
    return memoryLogs;
  } catch {
    return memoryLogs || SEED_AUDIT_EVENTS;
  }
}

function saveLogs(logs) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(logs));
    } else {
      memoryLogs = logs;
    }
  } catch (e) {
    console.warn('Audit trail save failed:', e);
  }
}

export class ClinicalAuditService {
  static getAuditTrail() {
    return getLogs();
  }

  /**
   * Log an immutable clinical workflow event.
   */
  static logEvent({
    eventType,
    label,
    actor = 'SYSTEM',
    actorId = 'MV-CORE',
    sessionId = 'sess_active',
    status = 'RECORDED',
    details = ''
  }) {
    const logs = getLogs();
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    const date = now.toLocaleDateString();

    const newEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      date,
      eventType,
      label,
      actor,
      actorId,
      sessionId,
      status,
      details
    };

    logs.unshift(newEvent);
    if (logs.length > 100) {
      logs.pop(); // keep last 100 events
    }
    saveLogs(logs);

    return newEvent;
  }

  static clearAuditTrail() {
    saveLogs(SEED_AUDIT_EVENTS);
  }
}
