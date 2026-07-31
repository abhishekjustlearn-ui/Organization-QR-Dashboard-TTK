import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff, Lock, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config';

interface LoginProps {
  onLoginSuccess: (
    role: 'super-admin' | 'sub-admin',
    username: string,
    orgId: string,
    displayName: string
  ) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      setIsLoading(false);
      onLoginSuccess(data.role, data.username, data.orgId, data.displayName);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Connection failure. Check backend server.');
    }
  };

  return (
    <div style={styles.container}>
      {/* Background Cosmic Glows */}
      <div style={styles.glowLeft} />
      <div style={styles.glowRight} />

      <div style={styles.card} className="glass-card">
        {/* Logo and Branding Header */}
        <div style={styles.header}>
          <div style={styles.logoCircle}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#ffd700' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096m.813 5.096a18.666 18.666 0 01-5.185-10.089m13.185 10.089A18.666 18.666 0 0115 10.911M12 3c1.38 0 2.5 1.79 2.5 4v3.5c0 2.21-1.12 4-2.5 4S9.5 12.71 9.5 10.5V7c0-2.21 1.12-4 2.5-4z" />
            </svg>
          </div>
          <h1 style={styles.title}>Talk to Krishna</h1>
          <p style={styles.subtitle}>Partner Campaign & Attribution Portal</p>
        </div>

        {/* Error Notice */}
        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group" style={styles.group}>
            <label className="form-label" style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} style={styles.inputIcon} />
              <input
                type="email"
                required
                className="form-input"
                style={styles.input}
                placeholder="email@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group" style={styles.group}>
            <label className="form-label" style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} style={styles.spinner} />
                <span>Authenticating Portal...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Access Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Hint text for evaluation (discreet) */}
        <div style={styles.hintBox}>
          <span style={styles.hintTitle}>Demo Access Details:</span>
          <div style={styles.hintGrid}>
            <span>Admin: abhishek@justlearnindia.in</span>
            <span>Pass: AdminPassword123!</span>
            <span>Sub-Admin: delhi@talktokrishna.com</span>
            <span>Pass: Delhi123!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: '#080916',
    zIndex: 9999,
  },
  glowLeft: {
    position: 'absolute',
    width: '35vw',
    height: '35vw',
    borderRadius: '50%',
    left: '10vw',
    top: '15vh',
    background: 'radial-gradient(circle, rgba(255, 215, 0, 0.06) 0%, transparent 70%)',
    filter: 'blur(100px)',
    pointerEvents: 'none',
  },
  glowRight: {
    position: 'absolute',
    width: '35vw',
    height: '35vw',
    borderRadius: '50%',
    right: '10vw',
    bottom: '15vh',
    background: 'radial-gradient(circle, rgba(15, 118, 110, 0.08) 0%, transparent 70%)',
    filter: 'blur(100px)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px 32px',
    background: 'rgba(18, 20, 48, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(15,118,110,0.2) 100%)',
    border: '1px solid rgba(255, 215, 0, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '4px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '24px',
    fontSize: '0.85rem',
    color: '#fca5a5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  group: {
    marginBottom: 0,
  },
  label: {
    marginBottom: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    paddingLeft: '40px',
    paddingRight: '40px',
    fontSize: '0.9rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    width: '100%',
    justifyContent: 'center',
    marginTop: '10px',
    padding: '13px',
    fontSize: '0.95rem',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  hintBox: {
    marginTop: '28px',
    borderTop: '1px dashed rgba(255,255,255,0.06)',
    paddingTop: '16px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  hintTitle: {
    fontWeight: '600',
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '4px',
  },
  hintGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '2px',
  }
};

// Add rotation animation for spinner directly
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
