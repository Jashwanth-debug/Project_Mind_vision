# MindVision Clinical AI — Research Datasets & Benchmark Corpora Specification

This document provides a formal inventory of all ground-truth datasets, foundational acoustic/vision training corpora, clinical psychometric batteries, and runtime evaluation cohorts utilized in the research, training, calibration, and evaluation of the **MindVision Clinical AI Decision-Support Platform**.

---

## Summary Matrix

| # | Dataset / Corpus Name | Modality | Primary Institution / Origin | Role in MindVision Architecture | Sample Size / Volume |
|---|----------------------|----------|------------------------------|---------------------------------|----------------------|
| **1** | **DISFA** | Facial FACS Video | University of Denver | Ground-truth calibration for Action Units AU04 & AU15 | 130,000 stereo video frames (27 subjects) |
| **2** | **CK+ (Extended Cohn-Kanade)** | Facial Micro-Expressions | Carnegie Mellon Univ. / Univ. of Pittsburgh | Antagonistic Action Unit co-activation (AU12 vs. AU04) | 593 FACS-coded sequences (123 subjects) |
| **3** | **Google MediaPipe Face Mesh** | 3D Spatial Landmarks | Google Research | Real-time 30 FPS client-side 468 3D landmark tracking | 30,000+ in-the-wild diverse facial crops |
| **4** | **RAF-DB** | Real-World Facial Expressions | Wuhan University | Robust calibration against lighting and head pose rotation variance | 29,672 real-world facial images |
| **5** | **FER-2013** | Facial Expressions | ICML 2013 / Kaggle | Downsampled webcam frame fallback calibration | 35,887 grayscale 48x48 pixel images |
| **6** | **DAIC-WOZ** | Clinical Audio & Video | USC Institute for Creative Technologies | Acoustic prosody, vocal tremor & speech latency benchmark | 189 clinical semi-structured interviews |
| **7** | **E-DAIC (AVEC 2019)** | Extended Multimodal Depression | USC ICT / AVEC Challenge | Longitudinal risk threshold calibration & acoustic eGeMAPS features | 275 clinical interview sessions |
| **8** | **RAVDESS** | Audio-Visual Emotional Speech | Ryerson University | Vocal tremor micro-jitter F0 frequency fluctuation baseline | 7,356 speech & song files (24 actors) |
| **9** | **CREMA-D** | Multimodal Actor Speech | Bryn Mawr / Univ. of Pennsylvania | Algorithmic fairness and demographic bias mitigation | 7,442 clips from 91 ethnically diverse actors |
| **10** | **EmoDB (Berlin)** | Emotional Speech | TU Berlin | Acoustic envelope variance & vocal stress harmonics reference | 535 German emotional speech utterances |
| **11** | **LibriSpeech & AudioSet** | 16kHz Speech Audio | Meta AI / LibriVox | Foundation self-supervised audio weights (`wav2vec2-base`) | 60,000+ continuous speech hours |
| **12** | **CC-100 & BookCorpus** | Clinical NLP & Semantics | Microsoft Research | Disentangled attention language embeddings (`deberta-v3`) | 160 GB multi-genre text corpus |
| **13** | **CMU-MOSEI** | Multimodal Sentiment | Carnegie Mellon Univ. LTI | Benchmarking cross-modal incongruence algorithms | 23,257 annotated video snippets |
| **14** | **MELD** | Multimodal Conversational Dialogue | NTU / NUS | Context-aware conversational sentiment for intake SOAP notes | 13,000+ dialogue utterances |
| **15** | **MIMIC-III / MIMIC-IV** | Clinical NLP Notes | MIT / PhysioNet | Clinical SOAP structure (Subjective, Objective, Assessment, Plan) | 50,000+ ICU & psychiatric consult records |
| **16** | **Standard Psychometric Scales** | Diagnostic Questionnaires | APA / Columbia University / NIMH | Reference anchors for severity triage (PHQ-9, GAD-7, HAM-D) | Clinically standardized scoring rubrics |
| **17** | **BDI-II & MADRS** | Clinician Inventories | Beck Institute / Karolinska Inst. | Validated risk scoring cross-walks for clinician triage | 21-item & 10-item clinician rating inventories |
| **18** | **PhysioNet Biometric Telemetry** | ECG & Autonomic Stress | PhysioNet | Autonomic stress indicators & signal quality index validation | 40,000+ continuous biometric recordings |
| **19** | **MindVision Longitudinal Cohort** | Serial Biometric Sessions | MindVision Clinical / NIMHANS Protocol | Runtime session comparison & immutable audit validation | Multi-session serial evaluation ledger |

---

## Detailed Dataset Specifications

### 1. DISFA (Denver Intensity of Spontaneous Facial Action Database)
* **Category:** Facial Ground-Truth Intensity Benchmark
* **Origin:** Affect Analysis Group, University of Denver (Mavadati et al., 2013)
* **Modalities:** High-resolution video, 12 FACS Action Units coded frame-by-frame on a 0–5 intensity scale.
* **Role in System:** Provides the ground-truth Action Unit intensity calibration for the on-device Py-Feat head. Specifically, it grounds **AU04** (*Corrugator supercilii* / brow lowerer) and **AU15** (*Depressor anguli oris* / lip corner depressor) so that values represent physiological muscle contraction rather than arbitrary heuristics.
* **Citation:** 
  > Mavadati, S. M., Mahoor, M. H., Bartlett, K., Trinh, P., & Cohn, J. F. (2013). *DISFA: A spontaneous facial action intensity database.* IEEE Transactions on Affective Computing, 4(2), 151–160.

---

### 2. CK+ (Extended Cohn-Kanade Dataset)
* **Category:** Standardized Facial Micro-Expression & Action Unit Benchmark
* **Origin:** Carnegie Mellon University & University of Pittsburgh (Lucey et al., 2010)
* **Modalities:** Validated digitized image sequences with verified FACS Action Unit peak codes.
* **Role in System:** Serves as the validation baseline for **affect masking and incongruence detection**. Used to verify antagonistic co-activation where genuine smiles (AU12 + AU06) diverge from masked social smiles accompanied by micro-furrows (AU12 + AU04).
* **Citation:**
  > Lucey, P., Cohn, J. F., Kanade, T., Saragih, J., Ambadar, Z., & Matthews, I. (2010). *The Extended Cohn-Kanade Dataset (CK+): A complete dataset for action unit and emotion-specified expression.* IEEE CVPR Workshops, 94–101.

---

### 3. Google MediaPipe 3D Face Mesh Dataset
* **Category:** Real-Time Geometric Facial Landmark Regression
* **Origin:** Google Research (Kartynnik et al., 2019)
* **Modalities:** RGB video, 468 3D spatial coordinate mesh surface.
* **Role in System:** Powers the client-side WebAssembly inference engine. Enables on-device tracking of head pose stability, nose displacement variance, and facial landmark coordinates at 30 FPS with zero cloud data transmission.
* **Citation:**
  > Kartynnik, Y., Ablavatski, A., Grishchenko, I., & Grundmann, M. (2019). *Real-time facial surface geometry from monocular video on mobile devices.* arXiv:1907.06724.

---

### 4. DAIC-WOZ (Distress Analysis Interview Corpus — Wizard of Oz)
* **Category:** Clinical Depression & Anxiety Multimodal Interview Corpus
* **Origin:** University of Southern California Institute for Creative Technologies (Gratch et al., 2014)
* **Modalities:** 16kHz PCM audio, synchronized video, transcribed dialogue, clinical PHQ-8 scores.
* **Role in System:** The primary psychiatric benchmark used to calibrate the Acoustic Prosody Tremor and Jitter formulas. Grounds the relationship between reduced pitch variability, elongated pause latency, and depressive psychomotor deceleration.
* **Citation:**
  > Gratch, J., Artstein, R., Lucas, G. M., Stratou, G., Scherer, S., Nazarian, A., ... & Morency, L. P. (2014). *The Distress Analysis Interview Corpus of human and computer interviews.* LREC, 3123–3128.

---

### 5. LibriSpeech & AudioSet (wav2vec2-base Pre-training Corpus)
* **Category:** Self-Supervised Speech Representation Corpus
* **Origin:** Meta AI Research & LibriVox (Baevski et al., 2020)
* **Modalities:** Discrete 16kHz audio waveform buffers, 768-dimensional latent representations.
* **Role in System:** Foundation pre-training corpus for the quantized ONNX `facebook/wav2vec2-base` audio model. Enables on-device extraction of micro-jitter and prosodic dynamics from discrete speech samples.
* **Citation:**
  > Baevski, A., Zhou, Y., Mohamed, A., & Auli, M. (2020). *wav2vec 2.0: A framework for self-supervised learning of speech representations.* Advances in Neural Information Processing Systems (NeurIPS), 33, 12449–12460.

---

### 6. CC-100 & BookCorpus (DeBERTa-v3 Semantic Corpus)
* **Category:** Disentangled Attention Natural Language Corpus
* **Origin:** Microsoft Research (He et al., 2023)
* **Modalities:** 160 GB multi-genre natural language text.
* **Role in System:** Provides semantic sentence embeddings for the on-device `microsoft/deberta-v3-small` NLP module. Identifies linguistic distortion markers, semantic polarity, and conflict conjunctions (*"I'm fine, but..."*).
* **Citation:**
  > He, P., Gao, J., & Chen, W. (2023). *DeBERTaV3: Improving DeBERTa using ELECTRA-style pre-training with disentangled attention.* ICLR 2023.

---

### 7. Standardized Psychometric Diagnostic Scales
* **Category:** Gold-Standard Clinical Diagnostic Inventories
* **Origin:** American Psychiatric Association & Columbia University
* **Scales Included:**
  * **PHQ-9 (Patient Health Questionnaire-9):** 9-item depression severity inventory (Kroenke et al., 2001).
  * **GAD-7 (Generalized Anxiety Disorder-7):** 7-item anxiety severity scale (Spitzer et al., 2006).
  * **HAM-D (Hamilton Depression Rating Scale):** 17/21-item clinician-administered rating interview.
* **Role in System:** Anchors the decision-support triage thresholding (Minimal < 3.5, Elevated 3.5–6.9, Severe ≥ 7.0) and guides the AI Copilot draft SOAP documentation.

---

### 8. MindVision Longitudinal Evaluation Cohort (Runtime Dataset)
* **Category:** Serial Multi-Session Patient Records & Audit Ledger
* **Code Location:** `src/utils/telemetryTimelineService.js` & `src/data/datasets.js`
* **Modalities:** Multi-session Action Unit vectors, pitch tremors, incongruence indices, clinician progress notes, and immutable transaction audit logs.
* **Role in System:** Enables real-time verification of multi-session delta calculations (`Session 01` through `Current Session`) and validates cross-session clinician triage workflows.

---

## Code References

1. **Source Registry in Code:** [`src/data/datasets.js`](file:///Users/kjaswanth/Desktop/performance%20delta/src/data/datasets.js)
2. **Interactive UI View:** Available in the running web application under **`Documentation` → Section 6 ("Verified Datasets & Benchmark Corpora Catalog")**.
3. **Privacy Assurance:** Conforms to zero-knowledge on-device processing. No raw audio or video files are persisted to disk or transmitted across external networks.
