import React, { useState, useRef, useEffect } from 'react';
import { synthesizeSoapNote } from '../utils/telemetryMath';
import { ClinicalAuditService } from '../services/clinicalAuditService';
import { crosswalkRiskToPsychometrics } from '../data/datasets';
import { getHumanStatus, getHumanObservations, CLINICAL_DISCLAIMER } from '../utils/terminology';

export default function ClinicianCopilotView({
  currentRecord = null,
  activeDoctor = null,
  onShowToast
}) {
  const record = currentRecord || {
    id: 'sess_live_current',
    text: "Patient states: 'Work pressure has been high; feeling slightly worn down by the end of the week.'",
    compositeRisk: 6.3,
    incongruence: 0.28,
    riskLevel: 'ELEVATED',
    au4: 0.55,
    au15: 0.45,
    prosody: 0.42,
    sentiment: 0.32,
    timestamp: 'Today, 10:15 AM'
  };

  const doctorName = activeDoctor ? (activeDoctor.fullName || activeDoctor.name) : 'Dr. Ananya Sharma, MD';
  const psychometrics = crosswalkRiskToPsychometrics(record.compositeRisk ?? 6.3);
  const humanStatus = getHumanStatus(record.riskLevel, record.compositeRisk);

  // Progressive disclosure state for technical metrics
  const [showTechnicalMetrics, setShowTechnicalMetrics] = useState(false);

  // Custom Clinician Notes state
  const [clinicianNotes, setClinicianNotes] = useState([
    {
      id: 'cn_1',
      author: doctorName,
      timestamp: 'Today, 10:20 AM',
      text: 'Patient appeared engaged but guarded. Expressed verbal confidence while facial micro-tensions suggest underlying fatigue.'
    }
  ]);
  const [newNoteText, setNewNoteText] = useState('');

  // SOAP Draft state
  const [draftSoap, setDraftSoap] = useState(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [isNoteFinalized, setIsNoteFinalized] = useState(false);

  // Editable draft fields
  const [editSubjective, setEditSubjective] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editAssessment, setEditAssessment] = useState('');
  const [editPlan, setEditPlan] = useState('');

  // Interactive Chatbot State
  const [messages, setMessages] = useState([
    {
      id: 'msg_welcome',
      sender: 'ai',
      timestamp: 'Just now',
      text: `Hello ${doctorName}. I have analyzed Session ${record.id}. The primary finding is an Incongruence Index of ${(record.incongruence ?? 0.28).toFixed(2)} between the patient's verbal statements and involuntary facial/vocal tension. How would you like to proceed?`,
      chips: [
        'Analyze Somatic Discrepancy',
        'Generate Structured SOAP Draft',
        'Diagnostic Inquiries Guide',
        'Evaluate Crisis & Safety Protocol'
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiTyping]);

  // Handle adding custom clinician note
  const handleAddClinicianNote = () => {
    if (!newNoteText.trim()) return;
    const note = {
      id: `cn_${Date.now()}`,
      author: doctorName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: newNoteText.trim()
    };
    setClinicianNotes((prev) => [note, ...prev]);
    setNewNoteText('');
    ClinicalAuditService.logEvent({
      eventType: 'CLINICIAN_NOTE_ADDED',
      label: `Clinician Note added by ${doctorName}`,
      actor: 'DOCTOR',
      actorId: activeDoctor?.id || 'doc_ananya_sharma',
      sessionId: record.id,
      details: note.text
    });
    onShowToast?.('Clinician note recorded and attached to patient record.');
  };

  // Generate Grounded Draft SOAP Note
  const handleGenerateDraftSoap = () => {
    const metrics = {
      au4: record.au4 ?? 0.55,
      au15: record.au15 ?? 0.45,
      acousticJitter: record.prosody ?? 0.42,
      textSentiment: record.sentiment ?? 0.32,
      physicalStress: ((record.au4 ?? 0.55) + (record.au15 ?? 0.45) + (record.prosody ?? 0.42)) / 3.0,
      compositeRisk: record.compositeRisk ?? 6.3,
      incongruenceIndex: record.incongruence ?? 0.28,
      riskLevel: record.riskLevel ?? 'ELEVATED'
    };

    const initialSoap = synthesizeSoapNote(record.text || 'Routine screening self-report', metrics, record.id);

    const groundedSubjective = `${initialSoap.subjective}\n\n• Reported Chief Complaint: "${record.text || 'Situational fatigue & persistent work stress'}"\n• Medical History: Non-contributory; no active psychiatric hospitalizations reported in intake.\n• Current Medications: None documented during automated telemetry phase.`;
    
    const groundedObjective = `${initialSoap.objective}\n• Behavioral Attributions: Facial Corrugator (AU04: ${(record.au4 ?? 0.55).toFixed(2)}) + Lip Depressor (AU15: ${(record.au15 ?? 0.45).toFixed(2)})\n• Vocal Dynamics: Fundamental frequency tremor at ${(record.prosody ?? 0.42).toFixed(2)} with subtle prosodic flattening.\n• Standardized Psychometric Estimates: PHQ-9 ~${psychometrics.phq9Score} (${psychometrics.phq9Band}) | GAD-7 ~${psychometrics.gad7Score} (${psychometrics.gad7Band})`;
    
    const groundedAssessment = `DRAFT FOR CLINICAL VERIFICATION:\nMindVision Composite Distress Risk: ${(record.compositeRisk ?? 6.3).toFixed(1)}/10 [${record.riskLevel ?? 'ELEVATED'}].\nIncongruence Index: ${(record.incongruence ?? 0.28).toFixed(2)}.\n\nClinical Synthesis: Telemetry demonstrates moderate-to-high somatic-linguistic divergence. Patient verbalizes coping compliance ("managing fine"), but involuntary bilateral brow furrowing and pitch jitter indicate unvoiced distress or emotional masking.\nDifferential Diagnoses to Evaluate: Major Depressive Disorder (Mild to Moderate), Generalized Anxiety with Somatic Suppression, Adjustment Disorder with Anxious Mood.`;
    
    const groundedPlan = `PROPOSED INTERVENTION PLAN:\n1. Conduct focused 30-minute clinical interview probing discrepancy between verbal optimism and facial micro-tensions.\n2. Administer formal clinician-rated HAM-D or BDI-II battery to confirm diagnostic severity.\n3. Explore sleep latency, early morning awakenings, and somatic muscle tensions.\n4. Introduce psychoeducational cognitive reframing (CBT) and diaphragmatic breathing for autonomic stabilization.\n5. Schedule longitudinal follow-up telemetry check within 14 days.`;

    setDraftSoap(initialSoap);
    setEditSubjective(groundedSubjective);
    setEditObjective(groundedObjective);
    setEditAssessment(groundedAssessment);
    setEditPlan(groundedPlan);
    setIsEditingDraft(true);
    setIsNoteFinalized(false);

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_soap_${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `I have synthesized the structured DRAFT SOAP Note for Session ${record.id} with psychometric cross-walks (PHQ-9 ~${psychometrics.phq9Score}, GAD-7 ~${psychometrics.gad7Score}). The note is displayed in the clinical editor below for your review, amendment, and authorization.`,
        chips: ['Review Discrepancy Findings', 'Safety Protocol Assessment']
      }
    ]);

    ClinicalAuditService.logEvent({
      eventType: 'SOAP_DRAFT_CREATED',
      label: 'Draft Clinical SOAP Note Generated by AI Copilot',
      actor: 'AI_COPILOT',
      actorId: 'ClinicalCopilotModel',
      sessionId: record.id,
      status: 'DRAFT',
      details: 'Structured SOAP note generated with clinical grounding.'
    });

    onShowToast?.('Draft SOAP note generated. Please review and authorize below.');
  };

  // Doctor Approves & Finalizes Note
  const handleApproveFinalNote = () => {
    setIsNoteFinalized(true);
    setIsEditingDraft(false);

    ClinicalAuditService.logEvent({
      eventType: 'CLINICIAN_FINALIZED_NOTE',
      label: `Clinical SOAP Note Finalized by ${doctorName}`,
      actor: 'DOCTOR',
      actorId: activeDoctor?.id || 'doc_ananya_sharma',
      sessionId: record.id,
      status: 'APPROVED',
      details: `Clinician authored and authorized final SOAP note for session ${record.id}.`
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_approved_${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `✓ Clinical documentation for Session ${record.id} has been formally authorized by ${doctorName} and committed to the immutable clinical audit ledger.`,
        chips: []
      }
    ]);

    onShowToast?.('SOAP note verified and saved to patient record!');
  };

  // Doctor Discards Draft
  const handleRejectDraft = () => {
    setDraftSoap(null);
    setIsEditingDraft(false);
    setIsNoteFinalized(false);

    ClinicalAuditService.logEvent({
      eventType: 'SOAP_DRAFT_REJECTED',
      label: 'Draft SOAP Note Discarded by Clinician',
      actor: 'DOCTOR',
      actorId: activeDoctor?.id || 'doc_ananya_sharma',
      sessionId: record.id,
      status: 'DISCARDED',
      details: 'Clinician discarded AI draft proposal.'
    });

    onShowToast?.('Draft discarded.');
  };

  // Chat message submission
  const handleSendMessage = (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAiTyping(true);

    setTimeout(() => {
      let aiResponseText = '';
      let returnChips = [];

      const qLower = query.toLowerCase();

      if (qLower.includes('discrepancy') || qLower.includes('somatic') || qLower.includes('divergence')) {
        aiResponseText = `### Key Discrepancy Findings for Session ${record.id}\n\n` +
          `• **Verbal Report:** "${record.text || 'Patient reports managing everyday stressors.'}" (Linguistic Stress: ${(record.sentiment ?? 0.32).toFixed(2)})\n` +
          `• **Physical Telemetry:** Facial tension is elevated at ${(record.au4 ?? 0.55).toFixed(2)} and Vocal Jitter is ${(record.prosody ?? 0.42).toFixed(2)}.\n` +
          `• **Mathematical Divergence:** Incongruence Index is ${(record.incongruence ?? 0.28).toFixed(2)}. This reflects affective suppression where somatic stress channels remain activated despite composed verbal delivery.`;
        returnChips = ['Generate Structured SOAP Draft', 'Diagnostic Inquiries Guide'];
      } else if (qLower.includes('soap') || qLower.includes('draft') || qLower.includes('generate')) {
        handleGenerateDraftSoap();
        setIsAiTyping(false);
        return;
      } else if (qLower.includes('inquir') || qLower.includes('guide') || qLower.includes('question') || qLower.includes('interview')) {
        aiResponseText = `### Recommended Clinician Interview Inquiries:\n\n` +
          `1. **Explore Somatic Tensions:** "I notice some subtle physical tension around your brow and speech pacing when discussing work. How does your body feel when you describe 'managing fine'?"\n` +
          `2. **Screen for Sleep & Fatigue:** "Are you experiencing difficulty falling asleep, middle-of-the-night awakenings, or feeling unrefreshed in the morning?"\n` +
          `3. **Assess Affect Masking:** "Do you often feel like you have to put on a brave or cheerful face for coworkers or family even when exhausted inside?"\n` +
          `4. **Evaluate Coping Capacity:** "What activities currently provide genuine decompression vs feeling like obligations?"`;
        returnChips = ['Evaluate Crisis & Safety Protocol', 'Generate Structured SOAP Draft'];
      } else if (qLower.includes('crisis') || qLower.includes('suicide') || qLower.includes('safety')) {
        const isSevere = (record.compositeRisk ?? 6.3) >= 7.0 || (record.incongruence ?? 0.28) >= 0.45;
        aiResponseText = `### Crisis & Safety Evaluation (C-SSRS Protocol):\n\n` +
          `• **Risk Stratification:** Composite Risk ${(record.compositeRisk ?? 6.3).toFixed(1)}/10 (${record.riskLevel ?? 'ELEVATED'}).\n` +
          `• **Suicidality Assessment:** ${isSevere ? '⚠️ Elevated affective discordance detected. Recommend direct inquiry regarding passive suicidal ideation and hopelessness.' : 'No overt acute suicidal crisis indicators detected in automated linguistic analysis. Patient presents with situational fatigue and somatic tension.'}\n` +
          `• **Recommended Safety Protocol:** Verify local emergency contact, establish a 24/7 crisis resource lifeline (e.g. Tele-MANAS 14416 / Vandrevala Foundation), and confirm access to supportive coping anchors.`;
        returnChips = ['Generate Structured SOAP Draft', 'Analyze Somatic Discrepancy'];
      } else {
        aiResponseText = `Regarding your inquiry on Session ${record.id}:\n\n` +
          `The patient exhibits an Incongruence Index of ${(record.incongruence ?? 0.28).toFixed(2)} with an estimated PHQ-9 of ${psychometrics.phq9Score} (${psychometrics.phq9Band}) and GAD-7 of ${psychometrics.gad7Score} (${psychometrics.gad7Band}). Facial dynamics indicate persistent tension. Would you like to generate a grounded SOAP draft or review interview questions?`;
        returnChips = ['Generate Structured SOAP Draft', 'Analyze Somatic Discrepancy', 'Diagnostic Inquiries Guide'];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: aiResponseText,
          chips: returnChips
        }
      ]);
      setIsAiTyping(false);
    }, 650);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Executive Workstation Header */}
      <div className="command-bar" style={{ marginBottom: 0, padding: '1.25rem 1.6rem' }}>
        <div className="command-left">
          <div className="command-title-row">
            <span className="command-kicker" style={{ color: 'var(--accent-teal)' }}>Clinician Decision Support</span>
            <h2 className="command-heading" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Clinical Evaluation Dashboard
            </h2>
          </div>
          <div className="command-meta" style={{ gap: '0.65rem' }}>
            <span>Patient Record: <strong>{record.id}</strong></span>
            <span className="meta-separator">•</span>
            <span>Clinician: <strong>{doctorName}</strong></span>
            <span className="meta-separator">•</span>
            <span className="clinical-status-pill minimal" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
              ● Decision Support Active
            </span>
          </div>
        </div>

        <div className="command-actions">
          {!draftSoap ? (
            <button className="btn-primary" onClick={handleGenerateDraftSoap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Generate Draft SOAP Note</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={handleRejectDraft}>
                ✕ Discard
              </button>
              {!isNoteFinalized && (
                <button className="btn-primary" onClick={handleApproveFinalNote}>
                  ✓ Authorize Note
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION: RECOMMENDED ACTION (Clear, immediate action per Section 6) */}
      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--accent-teal-soft-bg, rgba(19, 111, 99, 0.08))',
        border: '1px solid var(--accent-teal-border, rgba(19, 111, 99, 0.3))',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🎯</span>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-teal)' }}>
              RECOMMENDED CLINICAL ACTION
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              Schedule a focused 30-minute interview probing discrepancy between verbal optimism and facial micro-tension.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleSendMessage('Diagnostic Inquiries Guide')}
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
          >
            📋 Interview Guide
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleGenerateDraftSoap}
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
          >
            📝 Open SOAP Draft
          </button>
        </div>
      </div>

      {/* SECTION: PATIENT SUMMARY (Organized per Section 6) */}
      <div className="clinical-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', pb: '0.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            PATIENT SUMMARY
          </h3>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: humanStatus.bgColor,
            color: humanStatus.color,
            border: `1px solid ${humanStatus.borderColor}`,
            fontSize: '0.74rem',
            fontWeight: 600
          }}>
            <span>{humanStatus.icon}</span>
            <span>{record.riskLevel ?? 'ELEVATED'} CONCERN LEVEL</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Primary Observations */}
          <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Primary Observations
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Patient reports managing fine verbally, but exhibits elevated involuntary brow furrowing and pitch tremor indicating masked stress.
            </div>
          </div>

          {/* Recent Changes */}
          <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Recent Changes
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              +1.2 pt elevation in somatic tension compared to Session 02 baseline. Verbal coping sentiment remains positive.
            </div>
          </div>

          {/* Psychometric Estimates */}
          <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Psychometric Cross-Walk
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Estimated PHQ-9: <strong>{psychometrics.phq9Score}</strong> ({psychometrics.phq9Band})<br />
              Estimated GAD-7: <strong>{psychometrics.gad7Score}</strong> ({psychometrics.gad7Band})
            </div>
          </div>

          {/* Recommended Follow-up */}
          <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Recommended Follow-up
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Schedule teleconsultation within <strong>7 to 14 days</strong> to evaluate sleep stability and autonomic stress recovery.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: SUPPORTING SIGNALS & WHY THIS RESULT? (Organized per Section 6) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        
        {/* SUPPORTING SIGNALS CARD */}
        <div className="clinical-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              SUPPORTING SIGNALS
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Multi-Channel Intake</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Facial */}
            <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>👁️ Facial Signals</span>
                <span className="channel-tag" style={{ fontSize: '0.68rem' }}>Tension Detected</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Subtle micro-tension observed around the brow and mouth during check-in responses, typical of suppressed concern.
              </div>
            </div>

            {/* Voice */}
            <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>🎙️ Voice Signals</span>
                <span className="channel-tag" style={{ fontSize: '0.68rem' }}>Mild Fluctuation</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Micro-fluctuations in pitch stability and slight vocal flattening detected during emotionally charged questions.
              </div>
            </div>

            {/* Language */}
            <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>💬 Language / Responses</span>
                <span className="channel-tag" style={{ fontSize: '0.68rem' }}>Reported Fatigue</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Statement content notes work fatigue but attempts to downplay severity: <em>"{record.text || 'Managing fine.'}"</em>
              </div>
            </div>
          </div>
        </div>

        {/* WHY THIS RESULT? CARD (Visual Contributions & Technical Metrics Toggle) */}
        <div className="clinical-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              WHY THIS RESULT?
            </h3>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowTechnicalMetrics(!showTechnicalMetrics)}
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
            >
              {showTechnicalMetrics ? 'Hide Technical Metrics ▲' : 'View Technical Metrics ▾'}
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
            Feature contribution weights showing how different behavioral channels influenced this assessment:
          </p>

          {/* Visual Contribution Bars with Human-Readable Descriptions First */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Facial signals 40% */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Facial signals</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-teal)' }}>40% Contribution</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--slider-track)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '40%', height: '100%', backgroundColor: 'var(--accent-teal)' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Involuntary brow tension and mouth corner depression
              </div>
            </div>

            {/* Voice 25% */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Voice</span>
                <span style={{ fontWeight: 700, color: 'var(--status-info-dot)' }}>25% Contribution</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--slider-track)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', backgroundColor: 'var(--status-info-dot)' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Acoustic pitch stability variation and pacing shifts
              </div>
            </div>

            {/* Reported responses 20% */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Reported responses</span>
                <span style={{ fontWeight: 700, color: 'var(--status-elevated-dot)' }}>20% Contribution</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--slider-track)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '20%', height: '100%', backgroundColor: 'var(--status-elevated-dot)' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Self-reported fatigue and workload burdens
              </div>
            </div>

            {/* Language 15% */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Language</span>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>15% Contribution</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--slider-track)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '15%', height: '100%', backgroundColor: 'var(--text-secondary)' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Semantic tone polarity and cognitive minimizing markers
              </div>
            </div>
          </div>

          {/* Progressive Disclosure: Technical Metrics Layer */}
          {showTechnicalMetrics && (
            <div style={{
              marginTop: '1.25rem',
              padding: '0.85rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Raw Biometric &amp; Algorithmic Values
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.76rem' }}>
                <div><strong>AU04 Brow Furrow:</strong> {(record.au4 ?? 0.55).toFixed(2)} (Ref &lt;0.25)</div>
                <div><strong>AU15 Lip Depressor:</strong> {(record.au15 ?? 0.45).toFixed(2)} (Ref &lt;0.20)</div>
                <div><strong>Acoustic Jitter:</strong> {(record.prosody ?? 0.42).toFixed(2)} (Ref &lt;0.25)</div>
                <div><strong>Linguistic Sentiment:</strong> {(record.sentiment ?? 0.32).toFixed(2)}</div>
                <div><strong>Incongruence Index:</strong> {(record.incongruence ?? 0.28).toFixed(2)}</div>
                <div><strong>Composite Risk:</strong> {(record.compositeRisk ?? 6.3).toFixed(1)} / 10</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION: CLINICAL NOTES (Organized per Section 6) */}
      <div className="clinical-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              CLINICAL NOTES
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Practitioner observations, consultation notes, and plan adjustments
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {clinicianNotes.length} Note{clinicianNotes.length !== 1 ? 's' : ''} recorded
          </span>
        </div>

        {/* Note Input Field */}
        <div style={{ marginBottom: '1rem' }}>
          <textarea
            className="clinical-textarea"
            rows={3}
            placeholder="Add clinician note (e.g. affect observations, follow-up decisions, medication considerations)..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            style={{ width: '100%', fontSize: '0.82rem', marginBottom: '0.5rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="preset-pill"
                onClick={() => setNewNoteText((prev) => (prev ? prev + ' ' : '') + 'Affect masking noted during interview.')}
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              >
                + Masking Noted
              </button>
              <button
                type="button"
                className="preset-pill"
                onClick={() => setNewNoteText((prev) => (prev ? prev + ' ' : '') + 'Follow-up scheduled in 10 days.')}
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              >
                + Follow-up 10d
              </button>
              <button
                type="button"
                className="preset-pill"
                onClick={() => setNewNoteText((prev) => (prev ? prev + ' ' : '') + 'Advised sleep hygiene & relaxation exercises.')}
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              >
                + Sleep Hygiene
              </button>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleAddClinicianNote}
              disabled={!newNoteText.trim()}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
            >
              Save Clinician Note
            </button>
          </div>
        </div>

        {/* Notes Timeline List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {clinicianNotes.map((note) => (
            <div key={note.id} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{note.author}</span>
                <span>{note.timestamp}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {note.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: CLINICAL COPILOT CHAT & SOAP DOCUMENTATION */}
      <div className="copilot-chat-container">
        <div className="copilot-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-teal-soft-bg)', color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
              🩺
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>Clinician Copilot AI</span>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--status-minimal-dot)' }}></span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Decision-Support Assistant • Ask about differential diagnoses, interview inquiries, or notes
              </div>
            </div>
          </div>

          <button
            className="btn-secondary"
            style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
            onClick={() => setMessages([
              {
                id: 'msg_reset',
                sender: 'ai',
                timestamp: 'Just now',
                text: `Session ${record.id} active. Ask any clinical question, evaluate discrepancy findings, or generate SOAP documentation.`,
                chips: ['Analyze Somatic Discrepancy', 'Generate Structured SOAP Draft', 'Diagnostic Inquiries Guide']
              }
            ])}
          >
            Clear Chat
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="copilot-messages-scroll">
          {messages.map((m) => (
            <div key={m.id} className={`copilot-msg-row ${m.sender}`}>
              <div className={`copilot-avatar ${m.sender}`}>
                {m.sender === 'ai' ? '🩺' : '👨‍⚕️'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: m.sender === 'user' ? 'right' : 'left' }}>
                  {m.sender === 'ai' ? 'Copilot AI' : doctorName} • {m.timestamp}
                </div>

                <div className={`copilot-bubble ${m.sender}`}>
                  <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                </div>

                {m.chips && m.chips.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {m.chips.map((chip, idx) => (
                      <button
                        key={idx}
                        className="copilot-chip-btn"
                        onClick={() => handleSendMessage(chip)}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isAiTyping && (
            <div className="copilot-msg-row ai">
              <div className="copilot-avatar ai">🩺</div>
              <div className="copilot-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                <span className="pulse-dot" style={{ width: '6px', height: '6px' }}></span>
                <span>Copilot is reasoning across multimodal telemetry...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Strip */}
        <div className="copilot-chips-strip">
          <button className="copilot-chip-btn" onClick={() => handleSendMessage('Analyze Somatic Discrepancy')}>
            🔍 Discrepancy Analysis
          </button>
          <button className="copilot-chip-btn" onClick={() => handleSendMessage('Generate Structured SOAP Draft')}>
            📝 Generate SOAP Draft
          </button>
          <button className="copilot-chip-btn" onClick={() => handleSendMessage('Diagnostic Inquiries Guide')}>
            🩺 Clinical Interview Guide
          </button>
          <button className="copilot-chip-btn" onClick={() => handleSendMessage('Evaluate Crisis & Safety Protocol')}>
            🚨 Crisis &amp; Safety Review
          </button>
        </div>

        {/* Input Bar */}
        <div className="copilot-input-area">
          <input
            type="text"
            className="copilot-input-field"
            placeholder="Ask Copilot about behavioral indicators, differential diagnoses, or notes..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />
          <button
            className="btn-primary"
            style={{ padding: '0.55rem 1rem' }}
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim()}
          >
            <span>Ask Copilot</span>
          </button>
        </div>
      </div>

      {/* Structured DRAFT SOAP Note Generator */}
      {draftSoap && (
        <div className="soap-card copilot-watermark-overlay">
          <div className="card-header" style={{ background: isNoteFinalized ? 'var(--status-minimal-bg)' : 'var(--card-header-bg)', borderBottom: `1px solid ${isNoteFinalized ? 'var(--status-minimal-border)' : 'var(--border-color)'}` }}>
            <div className="card-title-group">
              <span className="card-icon">{isNoteFinalized ? '✅' : '📋'}</span>
              <div>
                <h3 className="card-title" style={{ fontSize: '0.98rem', color: isNoteFinalized ? 'var(--status-minimal-text)' : 'inherit' }}>
                  {isNoteFinalized ? 'AUTHORIZED CLINICAL SOAP DOCUMENTATION' : 'STRUCTURED DRAFT SOAP CLINICAL DOCUMENTATION'}
                </h3>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Patient ID: <strong>{record.id}</strong> • Evaluation Protocol: MindVision Multimodal On-Device Engine
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span className={`clinical-status-pill ${isNoteFinalized ? 'minimal' : 'elevated'}`} style={{ fontSize: '0.72rem' }}>
                {isNoteFinalized ? '✓ VERIFIED BY CLINICIAN' : 'DRAFT • REQUIRES APPROVAL'}
              </span>
            </div>
          </div>

          <div className="card-body" style={{ padding: '1.25rem' }}>
            {!isNoteFinalized && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--status-elevated-bg)',
                border: '1px solid var(--status-elevated-border)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.78rem',
                color: 'var(--status-elevated-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <strong>Clinician Review Requirement:</strong> This SOAP documentation is a machine-generated draft. Review, edit, and authorize before committing as a permanent medical record.
                </div>
                <span className="channel-tag" style={{ whiteSpace: 'nowrap', backgroundColor: '#fff' }}>
                  WATERMARKED DRAFT
                </span>
              </div>
            )}

            {/* 4-Quadrant SOAP Grid */}
            <div className="soap-grid" style={{ padding: 0 }}>
              {/* S - SUBJECTIVE */}
              <div className="soap-quadrant">
                <div className="soap-quadrant-header">
                  <span className="soap-letter">S</span>
                  <span className="soap-quadrant-title" style={{ fontWeight: 700 }}>Subjective Patient Report</span>
                </div>
                <div className="soap-content">
                  {isNoteFinalized ? (
                    <p style={{ whiteSpace: 'pre-line', fontSize: '0.8rem', lineHeight: 1.55 }}>{editSubjective}</p>
                  ) : (
                    <textarea
                      rows={6}
                      className="clinical-textarea"
                      value={editSubjective}
                      onChange={(e) => setEditSubjective(e.target.value)}
                      style={{ fontSize: '0.8rem', lineHeight: 1.5 }}
                    />
                  )}
                </div>
              </div>

              {/* O - OBJECTIVE */}
              <div className="soap-quadrant">
                <div className="soap-quadrant-header">
                  <span className="soap-letter">O</span>
                  <span className="soap-quadrant-title" style={{ fontWeight: 700 }}>Objective Telemetry &amp; Attributions</span>
                </div>
                <div className="soap-content">
                  {isNoteFinalized ? (
                    <p style={{ whiteSpace: 'pre-line', fontSize: '0.8rem', lineHeight: 1.55 }}>{editObjective}</p>
                  ) : (
                    <textarea
                      rows={6}
                      className="clinical-textarea"
                      value={editObjective}
                      onChange={(e) => setEditObjective(e.target.value)}
                      style={{ fontSize: '0.8rem', lineHeight: 1.5 }}
                    />
                  )}
                </div>
              </div>

              {/* A - ASSESSMENT */}
              <div className="soap-quadrant">
                <div className="soap-quadrant-header">
                  <span className="soap-letter">A</span>
                  <span className="soap-quadrant-title" style={{ fontWeight: 700 }}>Clinical Assessment &amp; Discrepancy</span>
                </div>
                <div className="soap-content">
                  {isNoteFinalized ? (
                    <p style={{ whiteSpace: 'pre-line', fontSize: '0.8rem', lineHeight: 1.55 }}>{editAssessment}</p>
                  ) : (
                    <textarea
                      rows={6}
                      className="clinical-textarea"
                      value={editAssessment}
                      onChange={(e) => setEditAssessment(e.target.value)}
                      style={{ fontSize: '0.8rem', lineHeight: 1.5 }}
                    />
                  )}
                </div>
              </div>

              {/* P - PLAN */}
              <div className="soap-quadrant">
                <div className="soap-quadrant-header">
                  <span className="soap-letter">P</span>
                  <span className="soap-quadrant-title" style={{ fontWeight: 700 }}>Plan &amp; Recommendations</span>
                </div>
                <div className="soap-content">
                  {isNoteFinalized ? (
                    <p style={{ whiteSpace: 'pre-line', fontSize: '0.8rem', lineHeight: 1.55 }}>{editPlan}</p>
                  ) : (
                    <textarea
                      rows={6}
                      className="clinical-textarea"
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value)}
                      style={{ fontSize: '0.8rem', lineHeight: 1.5 }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Approval Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              {!isNoteFinalized ? (
                <>
                  <button className="btn-secondary" onClick={handleRejectDraft}>
                    Discard Draft
                  </button>
                  <button className="btn-primary" onClick={handleApproveFinalNote}>
                    ✓ Authorize &amp; Save Final Clinical Record
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--status-minimal-text)', fontWeight: 600 }}>
                    ✓ Record committed to immutable clinical audit trail
                  </span>
                  <button className="btn-secondary" onClick={() => setIsNoteFinalized(false)}>
                    ✏️ Reopen for Amendments
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Standard Disclaimer at Bottom of Clinician View */}
      <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {CLINICAL_DISCLAIMER}
      </div>

    </div>
  );
}
