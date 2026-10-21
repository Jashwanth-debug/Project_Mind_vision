import React from 'react';
import { IconLifeBuoy, IconRefreshCw, IconPhone } from './Icons';

/**
 * ErrorBoundary - Protects the patient application from blank screens.
 * Especially critical around Crisis Support & Intake flows: if any rendering error
 * occurs, it displays a graceful, calming fallback with clickable crisis hotline links.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[MindVision ErrorBoundary] Caught render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="patient-view-shell"
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            margin: '0 auto',
            maxWidth: '680px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: '2.5rem 2rem',
              boxShadow: 'var(--shadow-subtle)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--status-support-bg)',
                color: 'var(--status-support-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconLifeBuoy size={28} />
            </div>

            <div>
              <h1
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.5rem 0'
                }}
              >
                {this.props.fallbackTitle || "We're here for you — Help is always available"}
              </h1>
              <p
                style={{
                  fontSize: '0.96rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0
                }}
              >
                We encountered an unexpected display hiccup, but your safety and wellness remain our highest priority.
              </p>
            </div>

            {/* Direct Emergency Call Button (Accessible even during UI failures) */}
            <div
              style={{
                width: '100%',
                backgroundColor: 'var(--accent-warm-soft, #FFF8F5)',
                border: '1px solid var(--accent-warm-border, rgba(232, 168, 124, 0.4))',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                alignItems: 'center'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--crisis-title-color, #8C3B24)', fontWeight: 600 }}>
                Need immediate listening support or free crisis help?
              </div>
              <a
                href="tel:988"
                className="patient-crisis-cta"
                style={{ textDecoration: 'none' }}
                aria-label="Call 988 Suicide and Crisis Lifeline"
              >
                <IconPhone size={16} />
                <span>Call or Text 988 Lifeline (24/7)</span>
              </a>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Free • Confidential • 24/7 Support in English &amp; Spanish
              </div>
            </div>

            {/* Reset / Return Controls */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-patient-primary"
                onClick={this.handleReset}
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}
              >
                <IconRefreshCw size={15} />
                <span>Try Reloading View</span>
              </button>
              {this.props.onReturn && (
                <button
                  type="button"
                  onClick={this.props.onReturn}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0.65rem 1.4rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Return to Home
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
