import React from 'react';
import { CLINICAL_DATASETS, PSYCHOMETRIC_SCORING_CROSSWALK, NORMATIVE_CALIBRATION_DATA } from '../data/datasets';

export default function DocumentationView() {
  return (
    <div className="documentation-wrapper">
      {/* Banner */}
      <div className="header-banner">
        <div className="banner-left">
          <div className="banner-title-row">
            <span className="banner-tag">CLINICAL METHODOLOGY</span>
            <h2 className="banner-title">TECHNICAL &amp; SCIENTIFIC SPECIFICATIONS</h2>
          </div>
          <p className="banner-subtitle">
            Comprehensive reference on on-device FACS Action Units, acoustic feature extraction, cross-attention fusion, and incongruence scoring.
          </p>
        </div>

        <div className="wasm-badge">
          <span>ZERO-KNOWLEDGE ARCHITECTURE</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Section 1: Facial Modality */}
        <div className="clinical-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-icon">👁️</span>
              <h3 className="card-title">1. Local Facial Modality: MediaPipe + PyFeat FACS</h3>
            </div>
            <span className="channel-tag">VISION PIPELINE</span>
          </div>
          <div className="card-body">
            <p style={{ lineHeight: 1.6, marginBottom: '0.75rem' }}>
              The vision subsystem tracks 468 3D facial landmarks at 30 frames per second using MediaPipe. Landmarked coordinates are passed to an on-device lightweight PyFeat linear head to extract standardized Ekman Facial Action Coding System (FACS) intensities:
            </p>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              <li>
                <strong>AU04 (Corrugator Supercilii &amp; Depressor Supercilii — Eyebrow Lowerer/Furrow):</strong> Primary indicator of acute cognitive conflict, psychological distress, and suppressed inner tension. Correlates with activation of the dorsal anterior cingulate cortex.
              </li>
              <li>
                <strong>AU15 (Depressor Anguli Oris — Lip Corner Depressor):</strong> Pulls mouth corners downward, signalling sadness, somatic defeat, and grief. Often repressed during voluntary smiling.
              </li>
              <li>
                <strong>AU12 (Zygomaticus Major — Lip Corner Puller):</strong> Tracked as an antagonist marker to detect false/social smiles (e.g. smiling depression, where AU12 co-activates with AU04 micro-furrows).
              </li>
            </ul>
          </div>
        </div>

        {/* Section 2: Acoustic Modality */}
        <div className="clinical-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-icon">🎙️</span>
              <h3 className="card-title">2. Acoustic Modality: ONNX Quantized wav2vec2-base</h3>
            </div>
            <span className="channel-tag">AUDIO PROSODY PIPELINE</span>
          </div>
          <div className="card-body">
            <p style={{ lineHeight: 1.6, marginBottom: '0.75rem' }}>
              A quantized ONNX export of Hugging Face <code>facebook/wav2vec2-base</code> processes 16kHz discrete PCM audio buffers directly in WebAssembly RAM without streaming audio off-device:
            </p>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              <li>
                <strong>Fundamental Frequency (F0) Tremor &amp; Micro-Jitter:</strong> Quantifies cycle-to-cycle perturbation of vocal cord vibrations caused by autonomic nervous system fight-or-flight sympathetic overdrive.
              </li>
              <li>
                <strong>Prosodic Energy &amp; Pause Ratios:</strong> Analyzes speech flattening and elongated response latency, key objective physical markers of psychomotor deceleration.
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3: Linguistic Modality */}
        <div className="clinical-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-icon">📝</span>
              <h3 className="card-title">3. Linguistic Modality: microsoft/deberta-v3-small</h3>
            </div>
            <span className="channel-tag">NLP EMBEDDINGS</span>
          </div>
          <div className="card-body">
            <p style={{ lineHeight: 1.6, marginBottom: '0.75rem' }}>
              Transcribed verbal reports are embedded using an on-device <code>microsoft/deberta-v3-small</code> model fine-tuned on clinical psychiatric corpora:
            </p>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.7, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              <li>
                <strong>Cognitive Distortion Detection:</strong> Identifies catastrophic thinking, absolutist phrasing ("never", "always", "completely"), and emotional reasoning in patient speech.
              </li>
              <li>
                <strong>Semantic Sentiment Polarity:</strong> Measures the explicit valence of the patient's self-reported psychological state.
              </li>
            </ul>
          </div>
        </div>

        {/* Section 4: Mathematical Fusion & Inconsistency Engine */}
        <div className="clinical-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-icon">🔬</span>
              <h3 className="card-title">4. Cross-Attention Fusion &amp; Cosine Discrepancy Engine</h3>
            </div>
            <span className="channel-tag">INFERENCE MATH</span>
          </div>
          <div className="card-body">
            <p style={{ lineHeight: 1.6, marginBottom: '1rem' }}>
              Features from the physical modalities (facial action units and acoustic prosody) and the verbal text modality are projected through multi-head cross-attention into a shared latent space ($d=256$):
            </p>

            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-teal)' }}>
                <strong>Cosine Discrepancy (Masking Index):</strong>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                Incongruence Score = 1 - [ (e_verbal · e_physical) / (||e_verbal|| * ||e_physical||) ]
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Where e_verbal is the linguistic distortion vector and e_physical is the fused facial-acoustic biomarker embedding.
              </div>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-teal)' }}>
                <strong>Composite Distress Risk Formula:</strong>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                Risk = (AU04 * 3.0) + (AU15 * 2.5) + (Acoustic Jitter * 2.5) + (Text Sentiment * 2.0) [Normalized 0 to 10]
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: HIPAA & Zero-Knowledge Architecture */}
        <div className="clinical-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-icon">🛡️</span>
              <h3 className="card-title">5. HIPAA Compliance &amp; Zero-Knowledge Guarantee</h3>
            </div>
            <span className="channel-tag">PRIVACY &amp; SECURITY</span>
          </div>
          <div className="card-body">
            <p style={{ lineHeight: 1.6 }}>
              MindVision enforces a strict <strong>Zero-Knowledge Client-Side Invariance</strong> architecture. Raw camera frames, audio samples, and patient verbal transcripts are processed strictly in volatile browser RAM and wiped immediately upon metric vector extraction. No biometric data is ever logged to disk, transmitted over public networks, or stored on external cloud infrastructure.
            </p>
          </div>
        </div>

        {/* Section 6: Normative Baselines & Psychometric Cross-Walk */}
        <div className="clinical-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-icon">📐</span>
              <h3 className="card-title">6. Normative Calibration Baselines &amp; Psychometric Cross-Walk</h3>
            </div>
            <span className="channel-tag">STATISTICAL CALIBRATION</span>
          </div>
          <div className="card-body">
            <p style={{ lineHeight: 1.6, marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
              Empirical calibration standards derived from <strong>DISFA, RAVDESS, DAIC-WOZ, and MIMIC-IV</strong> benchmarks, correlating on-device non-verbal telemetry with clinical psychometric batteries:
            </p>

            {/* Threshold Reference Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.85rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-teal)', marginBottom: '0.35rem' }}>
                  AU04 Brow Furrow Cutoffs
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  • Resting / Healthy: &lt; {NORMATIVE_CALIBRATION_DATA.au04.mildTensionThreshold.toFixed(2)}<br />
                  • Moderate Tension: {NORMATIVE_CALIBRATION_DATA.au04.mildTensionThreshold.toFixed(2)} - {NORMATIVE_CALIBRATION_DATA.au04.moderateDistressThreshold.toFixed(2)}<br />
                  • Acute Crisis: &gt; {NORMATIVE_CALIBRATION_DATA.au04.severeCrisisThreshold.toFixed(2)}
                </div>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-teal)', marginBottom: '0.35rem' }}>
                  AU15 Lip Depressor Cutoffs
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  • Resting Tone: &lt; {NORMATIVE_CALIBRATION_DATA.au15.mildTensionThreshold.toFixed(2)}<br />
                  • Mild Dejection: {NORMATIVE_CALIBRATION_DATA.au15.mildTensionThreshold.toFixed(2)} - {NORMATIVE_CALIBRATION_DATA.au15.moderateDistressThreshold.toFixed(2)}<br />
                  • Somatic Collapse: &gt; {NORMATIVE_CALIBRATION_DATA.au15.severeCrisisThreshold.toFixed(2)}
                </div>
              </div>

              <div style={{ padding: '0.85rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-teal)', marginBottom: '0.35rem' }}>
                  Acoustic Micro-Jitter (F0)
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  • Stable Speech: &lt; {NORMATIVE_CALIBRATION_DATA.acousticJitter.mildFatigueThreshold.toFixed(2)}<br />
                  • Sympathetic Surge: {NORMATIVE_CALIBRATION_DATA.acousticJitter.mildFatigueThreshold.toFixed(2)} - {NORMATIVE_CALIBRATION_DATA.acousticJitter.elevatedSympatheticSurge.toFixed(2)}<br />
                  • Vocal Dysregulation: &gt; {NORMATIVE_CALIBRATION_DATA.acousticJitter.acuteDysregulationCrisis.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Psychometric Crosswalk Table */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Distress Risk Band</th>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>PHQ-9 Equivalent</th>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>GAD-7 Equivalent</th>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>HAM-D Equivalent</th>
                    <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700 }}>Clinical Triage Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {PSYCHOMETRIC_SCORING_CROSSWALK.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 1 ? 'var(--bg-surface)' : 'transparent' }}>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.riskBand}</td>
                      <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-secondary)' }}>{row.phq9Equivalent}</td>
                      <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-secondary)' }}>{row.gad7Equivalent}</td>
                      <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-secondary)' }}>{row.hamdEquivalent}</td>
                      <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-muted)' }}>{row.clinicalAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 7: Verified Datasets & Benchmark Corpora Catalog */}
        <div className="clinical-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-icon">📊</span>
              <h3 className="card-title">7. Verified Datasets &amp; Benchmark Corpora Catalog ({CLINICAL_DATASETS.length} Datasets)</h3>
            </div>
            <span className="channel-tag">DATA PROVENANCE REGISTRY</span>
          </div>
          <div className="card-body">
            <p style={{ lineHeight: 1.6, marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
              MindVision integrates ground-truth training benchmarks, foundational self-supervised speech/vision corpora, gold-standard psychometric batteries, and serial clinical runtime cohorts:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
              {CLINICAL_DATASETS.map((ds) => (
                <div
                  key={ds.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {ds.name}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {ds.origin}
                      </span>
                    </div>
                    <span className="channel-tag" style={{ fontSize: '0.66rem', whiteSpace: 'nowrap' }}>
                      {ds.category}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    <strong>Role in MindVision:</strong> {ds.roleInProject}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <strong>Specs:</strong> {ds.specs}
                  </div>

                  {/* Modalities Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: 'auto', paddingTop: '0.4rem' }}>
                    {ds.modalities.map((m, i) => (
                      <span key={i} className="metric-tag" style={{ fontSize: '0.66rem' }}>
                        {m}
                      </span>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                    Citation: {ds.citation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
