import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Aura Desk Fatal Root Crash]:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            background: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#F1F5F9' }}>
              Aura Desk Startup Error
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              An unexpected exception interrupted the application initialization.
            </p>
            <pre style={{
              background: '#020617',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              padding: '1rem',
              color: '#F87171',
              fontSize: '0.75rem',
              textAlign: 'left',
              overflowX: 'auto',
              maxHeight: '200px',
              marginBottom: '1.5rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {this.state.error?.message || String(this.state.error)}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
