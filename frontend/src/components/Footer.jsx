import React from 'react';

export default function Footer() {
  return (
    <footer className="clinical-footer">
      <div className="footer-container">
        {/* Medical Disclaimer */}
        <p className="footer-disclaimer">
          <strong>Clinical Scope &amp; Medical Disclaimer:</strong> MindVision is an AI-assisted screening platform designed for early distress detection and decision support to assist qualified healthcare professionals. It is not an autonomous medical diagnostic tool. All clinical diagnoses and treatment decisions must be made by licensed healthcare clinicians following standard clinical evaluations and validated psychiatric batteries.
        </p>

        {/* Bottom Row */}
        <div className="footer-bottom-row">
          <div className="compliance-badges">
            <div className="compliance-badge">
              <span className="compliance-badge-dot"></span>
              <span>100% Client-Side RAM Inference</span>
            </div>
            <div className="compliance-badge">
              <span className="compliance-badge-dot"></span>
              <span>Zero-Knowledge Telemetry</span>
            </div>
            <div className="compliance-badge">
              <span className="compliance-badge-dot"></span>
              <span>HIPAA-Oriented Architecture</span>
            </div>
            <div className="compliance-badge">
              <span className="compliance-badge-dot"></span>
              <span>PyFeat + MediaPipe FACS</span>
            </div>
          </div>

          <div className="copyright-text">
            © 2026 MindVision Systems • Research-Grade Clinical Web Platform
          </div>
        </div>
      </div>
    </footer>
  );
}
