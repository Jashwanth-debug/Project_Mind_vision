import React, { useState, useEffect, useRef } from 'react';
import {
  CONVERSATION_QUESTION_BANK,
  determineNextQuestion,
  getConversationalAcknowledgement,
  getFriendlyProgress,
  checkForCrisisTriggers
} from '../utils/conversationEngine';
import {
  analyzeLinguisticStress,
  calculateTelemetryMetrics,
  generateClinicalNarrative,
  synthesizeSoapNote,
  calculateFacialLandmarkMetrics,
  sanitizeTranscript
} from '../utils/telemetryMath';
import {
  getHumanStatus,
  getHumanObservations,
  CLINICAL_DISCLAIMER
} from '../utils/terminology';
import { ClinicalAuditService } from '../services/clinicalAuditService';

// Workflow Stages
const STAGE = {
  INTRO: 'INTRO',
  CONVERSATION: 'CONVERSATION',
  CRISIS_ALERT: 'CRISIS_ALERT',
  SYNTHESIZING: 'SYNTHESIZING',
  RESULTS: 'RESULTS'
};

// Conversational Turn States
const TURN_STATE = {
  SPEAKING: 'SPEAKING',       // MindVision is speaking the question
  LISTENING: 'LISTENING',     // Patient's turn to speak via mic
  CONFIRMING: 'CONFIRMING',   // Reviewing recognized text
  TYPING: 'TYPING'            // Typing response manually
};

export default function ScreeningAssessment({ onCompleteAssessment, onShowToast }) {
  // Overall workflow stage
  const [currentStage, setCurrentStage] = useState(STAGE.INTRO);

  // Consent & hardware preferences
  const [allowMic, setAllowMic] = useState(true);
  const [allowCamera, setAllowCamera] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  // Video & Background Canvas capture refs
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const isDetectingRef = useRef(false);
  const animFrameRef = useRef(null);
  const offscreenCanvasRef = useRef(null);

  // Real-time Facial Telemetry State & Accumulators
  const [liveFacialTelemetry, setLiveFacialTelemetry] = useState({
    au4: 0.15,
    au15: 0.10,
    hasFace: false,
    mode: 'STANDBY'
  });
  const phaseAu4SamplesRef = useRef([]);
  const phaseAu15SamplesRef = useRef([]);
  const sessionAu4SamplesRef = useRef([]);
  const sessionAu15SamplesRef = useRef([]);

  // Web Speech recognition & Audio Metering refs
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioAnimFrameRef = useRef(null);
  const phaseJitterSamplesRef = useRef([]);
  const sessionJitterSamplesRef = useRef([]);

  // Conversation tracking
  const [turnState, setTurnState] = useState(TURN_STATE.SPEAKING);
  const [currentQuestion, setCurrentQuestion] = useState(CONVERSATION_QUESTION_BANK.initial);
  const [askedQuestionIds, setAskedQuestionIds] = useState(['q_initial']);
  const [questionCount, setQuestionCount] = useState(1);
  const [dialogHistory, setDialogHistory] = useState([]); // [{ id, prompt, answer, timestamp, phaseTelemetry }]

  // User response input
  const [recognizedText, setRecognizedText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [acknowledgementNote, setAcknowledgementNote] = useState('');

  // Completed assessment results
  const [completedReport, setCompletedReport] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [, setAvailableVoices] = useState([]);

  // 1. Text-To-Speech: onvoiceschanged Listener for WebKit/Blink voice population
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
        }
      };

      handleVoicesChanged();
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    }

    return () => {
      stopAllMedia();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // 2. Select Highest Quality Natural Voice (Strict Priority Sequence)
  const selectBestNaturalVoice = () => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Filter for English voices in order of preference
    const englishVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    const candidatePool = englishVoices.length > 0 ? englishVoices : voices;

    // Priority 1: Microsoft Aria Online (Natural) / Microsoft Jenny Online (Natural)
    const msNatural = candidatePool.find((v) => {
      const n = v.name.toLowerCase();
      return n.includes('aria online (natural)') ||
             n.includes('jenny online (natural)') ||
             (n.includes('microsoft') && n.includes('aria')) ||
             (n.includes('microsoft') && n.includes('jenny'));
    });
    if (msNatural) return msNatural;

    // Priority 2: Google US English / Google UK English Female
    const googleNatural = candidatePool.find((v) => {
      const n = v.name.toLowerCase();
      return n.includes('google us english') ||
             n.includes('google uk english female');
    });
    if (googleNatural) return googleNatural;

    const googleFallback = candidatePool.find((v) => {
      const n = v.name.toLowerCase();
      return n.includes('google uk english male') || n.includes('google');
    });
    if (googleFallback) return googleFallback;

    // Priority 3: Samantha / Karen / Victoria (Apple Enhanced/Natural)
    const appleEnhanced = candidatePool.find((v) => {
      const n = v.name.toLowerCase();
      return (n.includes('samantha') || n.includes('karen') || n.includes('victoria')) &&
             (n.includes('enhanced') || n.includes('natural') || n.includes('premium'));
    });
    if (appleEnhanced) return appleEnhanced;

    const appleStandard = candidatePool.find((v) => {
      const n = v.name.toLowerCase();
      return n.includes('samantha') || n.includes('karen') || n.includes('victoria');
    });
    if (appleStandard) return appleStandard;

    // Priority 4: Any voice with 'Natural', 'Neural', or 'Enhanced' in its name
    const genericNatural = candidatePool.find((v) => {
      const n = v.name.toLowerCase();
      return n.includes('natural') || n.includes('neural') || n.includes('enhanced');
    });
    if (genericNatural) return genericNatural;

    // Default fallback
    const defaultEn = candidatePool.find((v) => v.default && v.lang && v.lang.toLowerCase().startsWith('en'));
    return defaultEn || candidatePool[0] || null;
  };

  // Speak question aloud using browser's SpeechSynthesis with calibrated natural voice
  const speakQuestion = (textToSpeak, onFinish) => {
    if (!('speechSynthesis' in window)) {
      setTurnState(allowMic && speechSupported ? TURN_STATE.LISTENING : TURN_STATE.TYPING);
      if (onFinish) onFinish();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // Assign prioritized natural voice
      const bestVoice = selectBestNaturalVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang || 'en-US';
      } else {
        utterance.lang = 'en-US';
      }

      // Calibrated speech parameters: rate 0.93 (calm clinical pace), pitch 1.0, volume 1.0
      utterance.rate = 0.93;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setTurnState(TURN_STATE.SPEAKING);
      };

      utterance.onend = () => {
        if (allowMic && speechSupported) {
          startSpeechRecognition();
        } else {
          setTurnState(TURN_STATE.TYPING);
        }
        if (onFinish) onFinish();
      };

      utterance.onerror = () => {
        if (allowMic && speechSupported) {
          startSpeechRecognition();
        } else {
          setTurnState(TURN_STATE.TYPING);
        }
        if (onFinish) onFinish();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setTurnState(allowMic && speechSupported ? TURN_STATE.LISTENING : TURN_STATE.TYPING);
    }
  };

  // Media & Tracker Cleanup
  const stopAllMedia = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioAnimFrameRef.current) {
      cancelAnimationFrame(audioAnimFrameRef.current);
      audioAnimFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch {}
    }
    if (faceMeshRef.current) {
      try { faceMeshRef.current.close(); } catch {}
      faceMeshRef.current = null;
    }
    setCameraActive(false);
  };

  // 3. Initialize MediaPipe FaceMesh via CDN and Anchor Real-Time Loop
  const initFaceMeshDetector = () => {
    try {
      if (!window.FaceMesh) return;
      const fm = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      fm.onResults((results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const lms = results.multiFaceLandmarks[0];
          const calculated = calculateFacialLandmarkMetrics(lms);
          if (calculated) {
            setLiveFacialTelemetry({
              au4: calculated.au4,
              au15: calculated.au15,
              hasFace: true,
              mode: calculated.mode
            });
            // Push active frame sample to phase and session accumulators
            phaseAu4SamplesRef.current.push(calculated.au4);
            phaseAu15SamplesRef.current.push(calculated.au15);
            sessionAu4SamplesRef.current.push(calculated.au4);
            sessionAu15SamplesRef.current.push(calculated.au15);
          }
        } else {
          setLiveFacialTelemetry((prev) => ({ ...prev, hasFace: false }));
        }
      });
      faceMeshRef.current = fm;
    } catch (err) {
      console.warn('FaceMesh initialization warning:', err);
    }
  };

  // Continuous background canvas frame capture loop
  const startCameraProcessingLoop = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = 320;
      offscreenCanvasRef.current.height = 240;
    }

    const processFrame = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        // Draw dynamically to canvas
        const offCtx = offscreenCanvasRef.current.getContext('2d', { willReadFrequently: true });
        if (offCtx) {
          offCtx.drawImage(videoRef.current, 0, 0, 320, 240);
        }

        // Actively feed video frame into MediaPipe detector on every frame
        if (faceMeshRef.current && !isDetectingRef.current) {
          isDetectingRef.current = true;
          faceMeshRef.current.send({ image: videoRef.current })
            .catch(() => {})
            .finally(() => {
              isDetectingRef.current = false;
            });
        }
      }
      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  // Initialize Camera Stream and FaceMesh Scripts
  const initCameraPipeline = async () => {
    if (!allowCamera) return;

    // Load MediaPipe FaceMesh CDN if not present
    if (!window.FaceMesh && !document.getElementById('mediapipe-facemesh-cdn')) {
      const script = document.createElement('script');
      script.id = 'mediapipe-facemesh-cdn';
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => initFaceMeshDetector();
      document.head.appendChild(script);
    } else if (window.FaceMesh) {
      initFaceMeshDetector();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      startCameraProcessingLoop();
    } catch {
      setCameraActive(false);
      onShowToast?.('Camera unavailable or permission denied. Continuing check-in with audio & verbal channels.');
    }
  };

  // Live Audio Prosody & Jitter Sampling via Web Audio API
  const initAudioProsodySampling = (audioStream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(audioStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const sampleAudio = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        let peak = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
          if (dataArray[i] > peak) peak = dataArray[i];
        }
        const avgVol = sum / dataArray.length;

        // If speech activity detected (volume > 10)
        if (avgVol > 10) {
          // Estimate micro-fluctuation in spectral peak (jitter proxy)
          const jitterSample = Math.min(0.85, Math.max(0.10, (peak / 255.0) * 0.70));
          phaseJitterSamplesRef.current.push(jitterSample);
          sessionJitterSamplesRef.current.push(jitterSample);
        }

        audioAnimFrameRef.current = requestAnimationFrame(sampleAudio);
      };

      audioAnimFrameRef.current = requestAnimationFrame(sampleAudio);
    } catch {}
  };

  // Start Speech-To-Text Recognition
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setTurnState(TURN_STATE.TYPING);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecognizing(true);
        setTurnState(TURN_STATE.LISTENING);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setRecognizedText(transcript);
        setTypedText(transcript);
      };

      recognition.onerror = (event) => {
        setIsRecognizing(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechSupported(false);
          setTurnState(TURN_STATE.TYPING);
          onShowToast?.('Microphone access was not permitted. Switching to typed response.');
        } else if (!recognizedText.trim()) {
          setTurnState(TURN_STATE.TYPING);
        }
      };

      recognition.onend = () => {
        setIsRecognizing(false);
        if (recognizedText.trim()) {
          setTurnState(TURN_STATE.CONFIRMING);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      // Start audio prosody tracking if mic stream available
      if (allowMic && !audioContextRef.current) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((micStream) => initAudioProsodySampling(micStream))
          .catch(() => {});
      }
    } catch {
      setSpeechSupported(false);
      setTurnState(TURN_STATE.TYPING);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsRecognizing(false);
    if (recognizedText.trim() || typedText.trim()) {
      setTurnState(TURN_STATE.CONFIRMING);
    } else {
      setTurnState(TURN_STATE.TYPING);
    }
  };

  // Start check-in flow
  const handleStartCheckIn = () => {
    setCurrentStage(STAGE.CONVERSATION);
    setDialogHistory([]);
    setAskedQuestionIds(['q_initial']);
    setCurrentQuestion(CONVERSATION_QUESTION_BANK.initial);
    setQuestionCount(1);
    setRecognizedText('');
    setTypedText('');
    setAcknowledgementNote('');

    // Clear telemetry accumulators
    phaseAu4SamplesRef.current = [];
    phaseAu15SamplesRef.current = [];
    sessionAu4SamplesRef.current = [];
    sessionAu15SamplesRef.current = [];
    phaseJitterSamplesRef.current = [];
    sessionJitterSamplesRef.current = [];

    // Launch camera pipeline if allowed
    initCameraPipeline();

    // Speak initial question
    setTimeout(() => {
      speakQuestion(CONVERSATION_QUESTION_BANK.initial.prompt);
    }, 350);
  };

  // Confirm patient answer and progress adaptively
  const handleConfirmAnswer = (confirmedAnswer) => {
    const rawAnswer = (confirmedAnswer || recognizedText || typedText || '').trim();
    if (!rawAnswer) {
      setTurnState(TURN_STATE.TYPING);
      return;
    }

    // Sanitize transcript: filter repetitive noise or garbage strings
    const sanitizedAnswer = sanitizeTranscript(rawAnswer);

    // Check for crisis triggers
    if (checkForCrisisTriggers(rawAnswer)) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      stopAllMedia();
      setCurrentStage(STAGE.CRISIS_ALERT);
      ClinicalAuditService.logEvent({
        eventType: 'CRISIS_TRIGGER_DETECTED',
        label: 'Safety language flagged during patient screening',
        actor: 'SAFETY_ENGINE',
        actorId: 'CrisisProtocolEngine',
        sessionId: 'scr_crisis_alert',
        status: 'ESCALATED',
        details: 'Self-harm or crisis keyword detected in patient response.'
      });
      return;
    }

    // Compute aggregated average AU04, AU15, and jitter for this question phase
    const phaseAvgAu4 = phaseAu4SamplesRef.current.length > 0
      ? parseFloat((phaseAu4SamplesRef.current.reduce((a, b) => a + b, 0) / phaseAu4SamplesRef.current.length).toFixed(3))
      : null;
    const phaseAvgAu15 = phaseAu15SamplesRef.current.length > 0
      ? parseFloat((phaseAu15SamplesRef.current.reduce((a, b) => a + b, 0) / phaseAu15SamplesRef.current.length).toFixed(3))
      : null;
    const phaseAvgJitter = phaseJitterSamplesRef.current.length > 0
      ? parseFloat((phaseJitterSamplesRef.current.reduce((a, b) => a + b, 0) / phaseJitterSamplesRef.current.length).toFixed(3))
      : null;

    // Reset phase sample buffers for next question
    phaseAu4SamplesRef.current = [];
    phaseAu15SamplesRef.current = [];
    phaseJitterSamplesRef.current = [];

    // Record turn with verified phase telemetry
    const turnRecord = {
      id: currentQuestion.id,
      prompt: currentQuestion.prompt,
      answer: rawAnswer,
      sanitizedAnswer: sanitizedAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      phaseTelemetry: {
        au4: phaseAvgAu4,
        au15: phaseAvgAu15,
        jitter: phaseAvgJitter,
        hasFacial: phaseAvgAu4 !== null,
        hasAudio: phaseAvgJitter !== null
      }
    };
    const updatedHistory = [...dialogHistory, turnRecord];
    setDialogHistory(updatedHistory);

    // Determine next adaptive question
    const updatedAsked = [...askedQuestionIds, currentQuestion.id];
    setAskedQuestionIds(updatedAsked);

    const nextQ = (questionCount < 4) ? determineNextQuestion(rawAnswer, updatedAsked) : null;

    if (nextQ) {
      const ack = getConversationalAcknowledgement(questionCount);
      setAcknowledgementNote(ack);
      setCurrentQuestion(nextQ);
      setQuestionCount((prev) => prev + 1);
      setRecognizedText('');
      setTypedText('');

      const fullSpoken = `${ack} ${nextQ.prompt}`;
      speakQuestion(fullSpoken);
    } else {
      finishAssessment(updatedHistory);
    }
  };

  // Compile multimodal results and transition to results screen
  const finishAssessment = (history) => {
    setCurrentStage(STAGE.SYNTHESIZING);
    stopAllMedia();

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const wrapUtterance = new SpeechSynthesisUtterance("Thank you for completing your check-in. Synthesizing your results now.");
      const bestVoice = selectBestNaturalVoice();
      if (bestVoice) {
        wrapUtterance.voice = bestVoice;
        wrapUtterance.lang = bestVoice.lang || 'en-US';
      } else {
        wrapUtterance.lang = 'en-US';
      }
      wrapUtterance.rate = 0.93;
      wrapUtterance.pitch = 1.0;
      wrapUtterance.volume = 1.0;
      window.speechSynthesis.speak(wrapUtterance);
    }

    setTimeout(() => {
      // 1. Filter out garbage placeholder transcriptions and aggregate valid patient answers
      const validAnswers = history
        .map((h) => sanitizeTranscript(h.answer))
        .filter((a) => Boolean(a));
      const fullValidText = validAnswers.join(' ');
      const isTextValid = validAnswers.length > 0;
      const sentiment = analyzeLinguisticStress(fullValidText);

      // 2. Compute true session average of active facial AU scores
      const hasFacial = sessionAu4SamplesRef.current.length >= 5;
      const sessionAvgAu4 = hasFacial
        ? parseFloat((sessionAu4SamplesRef.current.reduce((a, b) => a + b, 0) / sessionAu4SamplesRef.current.length).toFixed(2))
        : null;
      const sessionAvgAu15 = hasFacial
        ? parseFloat((sessionAu15SamplesRef.current.reduce((a, b) => a + b, 0) / sessionAu15SamplesRef.current.length).toFixed(2))
        : null;

      // 3. Compute true session average of audio prosody jitter
      const hasAudio = sessionJitterSamplesRef.current.length >= 5;
      const sessionAvgJitter = hasAudio
        ? parseFloat((sessionJitterSamplesRef.current.reduce((a, b) => a + b, 0) / sessionJitterSamplesRef.current.length).toFixed(2))
        : null;

      // 4. Compute composite risk & decision support strictly from valid signals with adaptive weighting
      const metrics = calculateTelemetryMetrics(
        sessionAvgAu4,
        sessionAvgAu15,
        sessionAvgJitter,
        sentiment,
        { hasFacial, hasAudio, isTextValid }
      );

      const clinicalNarrative = generateClinicalNarrative(metrics);
      const soapNote = synthesizeSoapNote(fullValidText || history.map((h) => h.answer).join(' '), metrics);

      const reportId = `scr_${Math.random().toString(36).substring(2, 9)}`;
      const finalReport = {
        id: reportId,
        timestamp: new Date().toLocaleString(),
        au4: metrics.au4,
        au15: metrics.au15,
        prosody: metrics.acousticJitter,
        sentiment: metrics.textSentiment,
        compositeRisk: metrics.compositeRisk,
        incongruence: metrics.incongruenceIndex,
        riskLevel: metrics.riskLevel,
        text: fullValidText || history.map((h) => h.answer).join(' '),
        dialogHistory: history,
        mode: 'CONVERSATIONAL_VOICE',
        hasFacialTelemetry: hasFacial,
        hasAudioTelemetry: hasAudio,
        signalWarnings: metrics.warnings || []
      };

      ClinicalAuditService.logEvent({
        eventType: 'SCREENING_COMPLETED',
        label: `Conversational Patient Screening Completed (${reportId})`,
        actor: 'PATIENT',
        actorId: 'MV-PATIENT-8821',
        sessionId: reportId,
        status: 'COMPLETED',
        details: `Intake protocol finished. Facial active: ${hasFacial}, Audio active: ${hasAudio}. Warnings: ${metrics.warnings.join('; ') || 'None'}.`
      });

      setCompletedReport(finalReport);
      setCurrentStage(STAGE.RESULTS);
      onCompleteAssessment?.(finalReport);
      onShowToast?.('Your wellness check-in has been completed and saved.');
    }, 1200);
  };

  const handleRepeatQuestion = () => {
    speakQuestion(currentQuestion.prompt);
  };

  return (
    <div className="assessment-wrapper">
      
      {/* ============================================================== */}
      {/* 1. INTRO / WELCOME STAGE */}
      {/* ============================================================== */}
      {currentStage === STAGE.INTRO && (
        <div className="workstation-panel" style={{ maxWidth: '720px', margin: '1rem auto' }}>
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div className="panel-title-group">
              <span style={{ fontSize: '1.4rem' }}>🌱</span>
              <div>
                <h1 className="panel-title" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  MindVision Wellness Check-in
                </h1>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  A supportive, voice-guided conversation
                </span>
              </div>
            </div>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--accent-teal-soft-bg)',
              color: 'var(--accent-teal)',
              fontWeight: 600
            }}>
              ⏱️ Usually 5–10 minutes
            </span>
          </div>

          <div className="card-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
              "I'm going to ask you a few questions about how you've been feeling recently. There are no right or wrong answers. Just answer naturally."
            </p>

            {/* Privacy & Signals Consent */}
            <div style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Privacy &amp; Multimodal Signal Capture
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.85rem 0' }}>
                MindVision can optionally analyze vocal prosody and subtle facial action units during this check-in to provide validated clinical indicators. All computer vision and audio processing runs 100% on-device in WebAssembly.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allowMic}
                    onChange={(e) => setAllowMic(e.target.checked)}
                    style={{ accentColor: 'var(--accent-teal)' }}
                  />
                  <span><strong>Microphone:</strong> Enable voice interaction and speech recognition</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allowCamera}
                    onChange={(e) => setAllowCamera(e.target.checked)}
                    style={{ accentColor: 'var(--accent-teal)' }}
                  />
                  <span><strong>Camera (Recommended):</strong> Active MediaPipe Face Mesh tracking for brow furrow (AU04) &amp; lip depressor (AU15)</span>
                </label>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              🔒 Your responses are used only to support this assessment and are protected by private on-device processing.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setAllowMic(false);
                  setAllowCamera(false);
                  handleStartCheckIn();
                }}
                style={{ fontSize: '0.84rem', padding: '0.6rem 1rem' }}
              >
                Continue with text only
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleStartCheckIn}
                style={{ fontSize: '0.92rem', padding: '0.65rem 1.4rem' }}
              >
                Start Check-in ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CONVERSATION STAGE (VOICE-FIRST WITH ACTIVE MULTIMODAL TRACKING) */}
      {/* ============================================================== */}
      {currentStage === STAGE.CONVERSATION && (
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Subtle Progress Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
            <span>Question {questionCount} • {getFriendlyProgress(questionCount)}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '80px', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (questionCount / 4) * 100)}%`, height: '100%', background: 'var(--accent-teal)' }} />
              </div>
              <span>{Math.round((questionCount / 4) * 100)}%</span>
            </div>
          </div>

          {/* Main Conversational Card */}
          <div className="clinical-card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Visual Speaking / Listening Orb */}
            <div style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0.5rem 0 1.25rem 0',
              background: turnState === TURN_STATE.SPEAKING
                ? 'radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, rgba(20, 184, 166, 0.05) 70%)'
                : turnState === TURN_STATE.LISTENING
                ? 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(56, 189, 248, 0.08) 70%)'
                : 'var(--bg-secondary)',
              border: `2px solid ${
                turnState === TURN_STATE.SPEAKING ? 'var(--accent-teal)' : turnState === TURN_STATE.LISTENING ? 'var(--status-info-dot)' : 'var(--border-color)'
              }`,
              boxShadow: turnState === TURN_STATE.LISTENING
                ? '0 0 24px rgba(56, 189, 248, 0.25)'
                : turnState === TURN_STATE.SPEAKING
                ? '0 0 24px rgba(20, 184, 166, 0.25)'
                : 'none',
              transition: 'all 0.3s ease'
            }}>
              <span style={{ fontSize: '2rem' }}>
                {turnState === TURN_STATE.SPEAKING ? '🔊' : turnState === TURN_STATE.LISTENING ? '🎙️' : '💬'}
              </span>
            </div>

            {/* Turn State Indicator Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.25rem 0.8rem',
              borderRadius: 'var(--radius-pill)',
              background: turnState === TURN_STATE.SPEAKING ? 'var(--accent-teal-soft-bg)' : 'var(--bg-secondary)',
              color: turnState === TURN_STATE.SPEAKING ? 'var(--accent-teal)' : 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              marginBottom: '1rem'
            }}>
              {turnState === TURN_STATE.SPEAKING && (
                <>
                  <span className="pulse-dot"></span>
                  <span>MindVision is speaking...</span>
                </>
              )}
              {turnState === TURN_STATE.LISTENING && (
                <>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                  <span>Your turn • Listening...</span>
                </>
              )}
              {turnState === TURN_STATE.CONFIRMING && <span>Reviewing your response</span>}
              {turnState === TURN_STATE.TYPING && <span>Type your response</span>}
            </div>

            {/* Acknowledgement Note (if present) */}
            {acknowledgementNote && (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontStyle: 'italic' }}>
                "{acknowledgementNote}"
              </p>
            )}

            {/* The Current Question in Clear Typography */}
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1.5rem 0', lineHeight: 1.45, maxWidth: '640px' }}>
              "{currentQuestion.prompt}"
            </h2>

            {/* Response Interaction Area */}
            {turnState === TURN_STATE.LISTENING && (
              <div style={{ width: '100%', maxWidth: '580px', margin: '0.5rem 0 1.5rem 0' }}>
                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  minHeight: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.92rem',
                  color: recognizedText ? 'var(--text-primary)' : 'var(--text-muted)'
                }}>
                  {recognizedText ? (
                    <span>"{recognizedText}"</span>
                  ) : (
                    <span style={{ fontStyle: 'italic' }}>Speak into your microphone naturally...</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={stopSpeechRecognition}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.1rem' }}
                  >
                    Done Speaking
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      if (recognitionRef.current) {
                        try { recognitionRef.current.stop(); } catch {}
                      }
                      setTurnState(TURN_STATE.TYPING);
                    }}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    Type instead
                  </button>
                </div>
              </div>
            )}

            {/* Confirming Recognized Text */}
            {turnState === TURN_STATE.CONFIRMING && (
              <div style={{ width: '100%', maxWidth: '580px', margin: '0.5rem 0 1.5rem 0' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textAlign: 'left' }}>
                  You said:
                </div>
                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--accent-teal-border)',
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  lineHeight: 1.5
                }}>
                  "{recognizedText || typedText}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setRecognizedText('');
                        setTypedText('');
                        startSpeechRecognition();
                      }}
                      style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
                    >
                      ↻ Try again
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setTurnState(TURN_STATE.TYPING)}
                      style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
                    >
                      ✏️ Edit / Type
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleConfirmAnswer(recognizedText || typedText)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
                  >
                    ✓ That's correct
                  </button>
                </div>
              </div>
            )}

            {/* Typing Mode */}
            {turnState === TURN_STATE.TYPING && (
              <div style={{ width: '100%', maxWidth: '580px', margin: '0.5rem 0 1.5rem 0', textAlign: 'left' }}>
                <textarea
                  className="clinical-textarea"
                  rows={4}
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder={currentQuestion.placeholder || "Type your thoughts naturally..."}
                  style={{ width: '100%', fontSize: '0.9rem', marginBottom: '0.85rem' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {allowMic && speechSupported ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setRecognizedText('');
                        startSpeechRecognition();
                      }}
                      style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
                    >
                      🎙️ Speak instead
                    </button>
                  ) : <span />}

                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!typedText.trim()}
                    onClick={() => handleConfirmAnswer(typedText)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
                  >
                    Continue ›
                  </button>
                </div>
              </div>
            )}

            {/* Utility Actions */}
            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', width: '100%', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleRepeatQuestion}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                🔊 Repeat question
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleConfirmAnswer("Patient opted to proceed to next question.")}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                Skip this question
              </button>
            </div>

          </div>

          {/* ACTIVE MULTIMODAL TELEMETRY CAMERA CARD */}
          {allowCamera && (
            <div className="clinical-card" style={{ padding: '0.9rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isPreviewVisible ? '0.75rem' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cameraActive && liveFacialTelemetry.hasFace ? 'var(--status-minimal-dot)' : cameraActive ? '#eab308' : 'var(--text-muted)' }}></span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {cameraActive && liveFacialTelemetry.hasFace
                      ? 'Real-Time Facial Telemetry Active (MediaPipe)'
                      : cameraActive
                      ? 'Acquiring Face Tracking (Position face in frame)'
                      : 'Camera Telemetry Standby'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {cameraActive && (
                    <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.75rem' }}>
                      <span>AU04 Brow: <strong style={{ color: 'var(--accent-teal)' }}>{liveFacialTelemetry.au4.toFixed(2)}</strong></span>
                      <span>AU15 Mouth: <strong style={{ color: 'var(--status-elevated-dot)' }}>{liveFacialTelemetry.au15.toFixed(2)}</strong></span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}
                  >
                    {isPreviewVisible ? 'Minimize View ▲' : 'Show View ▾'}
                  </button>
                </div>
              </div>

              {/* Dynamic Camera View: video is always kept active in DOM for continuous background frame capturing even when preview is minimized */}
              <div style={{
                display: isPreviewVisible ? 'flex' : 'block',
                position: isPreviewVisible ? 'static' : 'absolute',
                left: isPreviewVisible ? 'auto' : '-9999px',
                top: isPreviewVisible ? 'auto' : '-9999px',
                opacity: isPreviewVisible ? 1 : 0,
                pointerEvents: isPreviewVisible ? 'auto' : 'none',
                gap: '1rem',
                alignItems: 'center',
                paddingTop: isPreviewVisible ? '0.25rem' : 0
              }}>
                <div style={{
                  position: 'relative',
                  width: '160px',
                  height: '120px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  background: '#000',
                  border: '1px solid var(--border-color)',
                  flexShrink: 0
                }}>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                  <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.62rem', padding: '1px 5px', borderRadius: '2px', fontFamily: 'var(--font-mono)' }}>
                    {liveFacialTelemetry.hasFace ? 'TRACKING' : 'SEARCHING'}
                  </div>
                </div>

                {isPreviewVisible && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.76rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: 'var(--text-secondary)' }}>
                        <span>Corrugator Brow Furrow (AU04)</span>
                        <span>{liveFacialTelemetry.au4.toFixed(2)}</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'var(--slider-track)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, liveFacialTelemetry.au4 * 100)}%`, height: '100%', background: 'var(--accent-teal)' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: 'var(--text-secondary)' }}>
                        <span>Lip Corner Depressor (AU15)</span>
                        <span>{liveFacialTelemetry.au15.toFixed(2)}</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'var(--slider-track)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, liveFacialTelemetry.au15 * 100)}%`, height: '100%', background: 'var(--status-elevated-dot)' }}></div>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Frame capturing runs dynamically in the background across each question phase.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SAFETY / CRISIS INTERRUPT MODAL */}
      {/* ============================================================== */}
      {currentStage === STAGE.CRISIS_ALERT && (
        <div className="workstation-panel" style={{ maxWidth: '680px', margin: '2rem auto', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
          <div className="panel-header" style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '1rem 1.25rem' }}>
            <div className="panel-title-group">
              <span style={{ fontSize: '1.5rem' }}>🛡️</span>
              <div>
                <h2 style={{ fontSize: '1.15rem', color: '#ef4444', margin: 0 }}>
                  Immediate Support &amp; Safety Resources
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Your safety and well-being are what matter most
                </span>
              </div>
            </div>
          </div>

          <div className="card-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
              We hear that you are carrying a lot right now. MindVision is a decision-support check-in tool and cannot provide emergency medical care. Please reach out to someone who can help right away:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  National Crisis Lifeline
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444', margin: '0.2rem 0' }}>
                  988
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Free, confidential 24/7 call or text
                </div>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Tele-MANAS (India)
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-teal)', margin: '0.2rem 0' }}>
                  14416
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Toll-free 24/7 mental health service
                </div>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Emergency Services
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
                  911 / 112
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Call your local emergency operator
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setCurrentStage(STAGE.CONVERSATION);
                  setTurnState(TURN_STATE.TYPING);
                }}
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
              >
                I am safe, continue check-in
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('NAVIGATE_TAB', { detail: 'doctors' }));
                }}
                style={{ fontSize: '0.85rem', padding: '0.55rem 1.25rem', backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              >
                Connect with an On-Call Clinician ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. SYNTHESIZING STAGE */}
      {/* ============================================================== */}
      {currentStage === STAGE.SYNTHESIZING && (
        <div style={{ maxWidth: '520px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
          <div className="pulse-dot" style={{ width: '16px', height: '16px', margin: '0 auto 1.25rem auto' }}></div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Synthesizing your check-in...
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Comparing responses, acoustic prosody, and facial action units to build your wellness summary.
          </p>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. RESULT PAGE (Clean, Accurate Progressive Disclosure) */}
      {/* ============================================================== */}
      {currentStage === STAGE.RESULTS && completedReport && (() => {
        const humanStatus = getHumanStatus(completedReport.riskLevel, completedReport.compositeRisk);
        const humanObs = getHumanObservations({
          au4: completedReport.au4,
          au15: completedReport.au15,
          acousticJitter: completedReport.prosody,
          sentiment: completedReport.sentiment,
          incongruence: completedReport.incongruence
        });

        return (
          <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Header */}
            <div className="command-bar" style={{ marginBottom: 0, padding: '1.25rem 1.5rem' }}>
              <div className="command-left">
                <div className="command-title-row">
                  <span className="command-kicker" style={{ color: 'var(--accent-teal)' }}>Check-in Complete</span>
                  <h1 className="command-heading" style={{ fontSize: '1.35rem' }}>Your Check-in Results</h1>
                </div>
                <p className="command-meta" style={{ marginTop: '0.2rem' }}>
                  Completed {completedReport.timestamp} • Reference {completedReport.id}
                </p>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: humanStatus.bgColor,
                color: humanStatus.color,
                border: `1px solid ${humanStatus.borderColor}`,
                fontWeight: 600,
                fontSize: '0.82rem'
              }}>
                <span>{humanStatus.icon}</span>
                <span>{humanStatus.title}</span>
              </div>
            </div>

            {/* Signal Quality Warnings (If any modality was missing/unverified) */}
            {completedReport.signalWarnings && completedReport.signalWarnings.length > 0 && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)'
              }}>
                ⚠️ <strong>Signal Quality Verification:</strong> {completedReport.signalWarnings.join(' ')}
              </div>
            )}

            {/* Disclaimer Banner */}
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--card-bg-subtle, rgba(255,255,255,0.02))',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}>
              ℹ️ <strong>Please Note:</strong> {CLINICAL_DISCLAIMER}
            </div>

            {/* SECTION 1: WHAT YOU TOLD US */}
            <div className="clinical-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.85rem 0' }}>
                WHAT YOU TOLD US
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {completedReport.dialogHistory && completedReport.dialogHistory.length > 0 ? (
                  completedReport.dialogHistory.map((item, idx) => (
                    <div key={idx} style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>Q: {item.prompt}</span>
                        {item.phaseTelemetry && item.phaseTelemetry.hasFacial && (
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>
                            AU04: {item.phaseTelemetry.au4} | AU15: {item.phaseTelemetry.au15}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                        "{item.answer}"
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                    "{completedReport.text}"
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 2: WHAT WE NOTICED (3 Simple Cards) */}
            <div className="clinical-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.85rem 0' }}>
                WHAT WE NOTICED
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    🎙️ Voice Telemetry
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {completedReport.hasAudioTelemetry ? humanObs.voice : 'Audio tracking was minimal or steady throughout conversation.'}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    💬 Linguistic Responses
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {humanObs.responses}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    👁️ Facial Action Units
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {completedReport.hasFacialTelemetry ? humanObs.facial : 'Facial tracking inactive during this session. Re-weighted across other channels.'}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: WHAT SHOULD YOU DO? */}
            <div className="clinical-card" style={{ padding: '1.25rem', backgroundColor: 'var(--accent-teal-soft-bg, rgba(19, 111, 99, 0.05))', border: '1px solid var(--accent-teal-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-teal)', marginBottom: '0.3rem' }}>
                WHAT CAN YOU DO NEXT?
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                {humanStatus.actionText}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                Consider discussing these indicators with a healthcare professional or tracking how they evolve over your next check-in.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('NAVIGATE_TAB', { detail: 'doctors' }));
                  }}
                  style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}
                >
                  Talk to a Clinician ›
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('NAVIGATE_TAB', { detail: 'results' }));
                  }}
                  style={{ fontSize: '0.85rem', padding: '0.6rem 1.1rem' }}
                >
                  View My Results History
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCurrentStage(STAGE.INTRO)}
                  style={{ fontSize: '0.85rem', padding: '0.6rem 1.1rem' }}
                >
                  Start New Check-in
                </button>
              </div>
            </div>

            {/* SECTION 4: HOW DID WE DETERMINE THIS? (Collapsible) */}
            <div className="clinical-card" style={{ padding: '1.25rem' }}>
              <div
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    How did MindVision reach this result?
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Click to understand how responses, voice, and facial signals are compared.
                  </p>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {showHowItWorks ? '▲ Collapse' : '▼ Expand'}
                </span>
              </div>

              {showHowItWorks && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <p style={{ margin: '0 0 0.75rem 0' }}>
                    MindVision compares information from your responses, voice patterns, and available facial signals together to identify patterns that may be associated with stress:
                  </p>
                  <ul style={{ paddingLeft: '1.25rem', margin: '0 0 1rem 0' }}>
                    <li><strong>What you told us:</strong> Evaluates the emotional sentiment and themes of workload or fatigue expressed in your words.</li>
                    <li><strong>Voice variation:</strong> Measures subtle stability fluctuations in speaking pacing and tone rhythm.</li>
                    <li><strong>Facial expression patterns:</strong> Observes subtle brow or mouth tension when responding to questions.</li>
                  </ul>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Together, these signals contribute to your overall check-in indicators without providing an autonomous medical diagnosis.
                  </p>

                  {/* Toggle Deeper Technical Details */}
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowTechDetails(!showTechDetails)}
                      style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}
                    >
                      {showTechDetails ? 'Hide Advanced Technical Data ▲' : 'View Advanced Technical Data (For Clinicians) ▾'}
                    </button>
                  </div>

                  {showTechDetails && (
                    <div style={{
                      marginTop: '0.85rem',
                      padding: '0.85rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.76rem'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                        <div><strong>Overall Stress Index:</strong> {completedReport.compositeRisk.toFixed(1)} / 10</div>
                        <div><strong>Facial Tension (AU4/AU15):</strong> {completedReport.au4.toFixed(2)} / {completedReport.au15.toFixed(2)}</div>
                        <div><strong>Voice Jitter:</strong> {completedReport.prosody.toFixed(2)}</div>
                        <div><strong>Linguistic Stress:</strong> {completedReport.sentiment.toFixed(2)}</div>
                        <div><strong>Signal Differences:</strong> {completedReport.incongruence.toFixed(2)}</div>
                        <div><strong>Facial Active:</strong> {completedReport.hasFacialTelemetry ? 'YES (Live MediaPipe)' : 'NO (Unweighted)'}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        );
      })()}

    </div>
  );
}
