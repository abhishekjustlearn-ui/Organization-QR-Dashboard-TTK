import React, { useEffect } from 'react';
import { Smartphone, Play } from 'lucide-react';
import { API_BASE } from '../config';

interface LandingPageProps {
  orgId: string;
  campaignId: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ orgId, campaignId }) => {
  // Format the org name from ID for presentation (e.g. org-iskcon-delhi -> ISKCON Delhi)
  const formatOrgName = (id: string) => {
    return id
      .replace(/^org-/, '')
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const orgName = formatOrgName(orgId);

  // Determine user device type
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  // Automatically log scan event to the database on load
  useEffect(() => {
    const logScan = async () => {
      try {
        await fetch(`${API_BASE}/api/track/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_id: orgId, campaign_id: campaignId })
        });
      } catch (err) {
        console.error('Failed to log QR scan attribution event:', err);
      }
    };
    logScan();
  }, [orgId, campaignId]);

  // Destination URLs
  const playStoreUrl = `https://play.google.com/store/apps/details?id=com.talktokrishna.app&referrer=org_id%3D${orgId}%26campaign_id%3D${campaignId}`;
  const appStoreUrl = `https://apps.apple.com/app/talk-to-krishna/id6775909418`;

  return (
    <div style={styles.container}>
      {/* Background Cosmic Glows */}
      <div style={styles.glowLeft} />
      <div style={styles.glowRight} />

      <div style={styles.card}>
        <div style={styles.badge}>
          <Smartphone size={14} style={{ color: 'var(--accent-gold)' }} />
          <span>DOWNLOAD THE APP</span>
        </div>

        <h1 style={styles.title}>
          Fast Track Your Journey<br />To <span style={styles.highlight}>Enlightenment</span>
        </h1>

        <p style={styles.description}>
          Get access to daily spiritual wisdom, personal guidance, and interactive slokas.
        </p>

        <div style={styles.actions}>
          {/* App Store Button */}
          <a 
            href={appStoreUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              ...styles.btn,
              border: isIOS ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
              animation: isIOS ? 'pulse 2s infinite' : 'none',
              background: isIOS ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)'
            }}
            className="btn-download"
          >
            <div style={styles.btnIcon}>
              {/* Custom SVG Apple Logo */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,22C14.32,22.05 13.89,21.24 12.37,21.24C10.84,21.24 10.37,21.97 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.1,16.67C20.08,16.74 19.67,18.11 18.71,19.5M15.97,4.17C16.63,3.37 17.07,2.28 16.95,1C16,1.04 14.9,1.6 14.24,2.38C13.68,3.04 13.19,4.14 13.34,5.39C14.39,5.47 15.4,4.88 15.97,4.17Z" />
              </svg>
            </div>
            <div style={styles.btnTextWrapper}>
              <span style={styles.btnLabel}>Download on the</span>
              <span style={styles.btnName}>App Store</span>
            </div>
          </a>

          {/* Google Play Button */}
          <a 
            href={playStoreUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              ...styles.btn,
              border: isAndroid ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
              animation: isAndroid ? 'pulse 2s infinite' : 'none',
              background: isAndroid ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)'
            }}
            className="btn-download"
          >
            <div style={styles.btnIcon}>
              <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
            </div>
            <div style={styles.btnTextWrapper}>
              <span style={styles.btnLabel}>GET IT ON</span>
              <span style={styles.btnName}>Google Play</span>
            </div>
          </a>
        </div>

        <div style={styles.footerLine}>
          Talk To Krishna in association with {orgName}
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
    backgroundColor: '#080916',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
    boxSizing: 'border-box',
  },
  glowLeft: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(9, 118, 118, 0.15) 0%, rgba(0,0,0,0) 70%)',
    top: '-10%',
    left: '-10%',
    pointerEvents: 'none',
  },
  glowRight: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(144, 97, 249, 0.1) 0%, rgba(0,0,0,0) 75%)',
    bottom: '-15%',
    right: '-10%',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '24px',
    padding: '40px 32px',
    textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
    zIndex: 2,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    borderRadius: '100px',
    padding: '8px 16px',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.1em',
    color: 'var(--accent-gold)',
    marginBottom: '28px',
  },
  title: {
    fontSize: '2.1rem',
    fontWeight: '700',
    lineHeight: '1.25',
    color: '#ffffff',
    margin: '0 0 16px 0',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.02em',
  },
  highlight: {
    background: 'linear-gradient(90deg, var(--accent-gold), var(--color-teal-start))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  description: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    margin: '0 0 36px 0',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    borderRadius: '16px',
    padding: '12px 28px',
    textDecoration: 'none',
    color: '#ffffff',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  btnIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    color: '#ffffff',
  },
  btnTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  btnLabel: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: '600',
    letterSpacing: '0.05em',
  },
  btnName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    lineHeight: '1.1',
  },
  footerLine: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '28px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '16px',
    fontWeight: '500',
    letterSpacing: '0.02em',
  }
};
