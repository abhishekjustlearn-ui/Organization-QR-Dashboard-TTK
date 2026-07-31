import React from 'react';
import { LayoutDashboard, QrCode, Settings, Sparkles, LogOut, ShieldAlert, X } from 'lucide-react';
import { Organization } from '../mockData';

interface SidebarProps {
  organizations: Organization[];
  activeOrgId: string;
  setActiveOrgId: (id: string) => void;
  activeTab: 'analytics' | 'campaigns' | 'settings' | 'system';
  setActiveTab: (tab: 'analytics' | 'campaigns' | 'settings' | 'system') => void;
  userRole: 'super-admin' | 'sub-admin';
  userEmail: string;
  displayName: string;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  organizations,
  activeOrgId,
  setActiveOrgId,
  activeTab,
  setActiveTab,
  userRole,
  userEmail,
  displayName,
  onLogout,
  isOpen = false,
  onClose,
}) => {
  const activeOrg = organizations.find((o) => o.org_id === activeOrgId);

  return (
    <aside className={`sidebar-container ${isOpen ? 'open' : ''}`} style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoCircle}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#ffd700' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096m.813 5.096a18.666 18.666 0 01-5.185-10.089m13.185 10.089A18.666 18.666 0 0115 10.911M12 3c1.38 0 2.5 1.79 2.5 4v3.5c0 2.21-1.12 4-2.5 4S9.5 12.71 9.5 10.5V7c0-2.21 1.12-4 2.5-4z" />
          </svg>
        </div>
        <div style={styles.brandTextContainer}>
          <h1 style={styles.brandTitle}>Talk to Krishna</h1>
          <span style={styles.brandSubtitle}>Org Dashboard</span>
        </div>
        {onClose && (
          <button className="mobile-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Organization Selector / Label */}
      <div style={styles.selectorContainer}>
        <label style={styles.selectorLabel}>Organization Scope</label>
        {userRole === 'super-admin' ? (
          <div style={styles.selectWrapper}>
            <select
              value={activeOrgId}
              onChange={(e) => setActiveOrgId(e.target.value)}
              style={styles.select}
            >
              {organizations.map((org) => (
                <option key={org.org_id} value={org.org_id} style={styles.option}>
                  {org.org_name}
                </option>
              ))}
            </select>
            <Sparkles size={14} style={styles.sparkleIcon} />
          </div>
        ) : (
          <div style={styles.subAdminOrgBadge}>
            <span style={styles.subAdminOrgText}>{activeOrg?.org_name || 'Mapped Org'}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Navigation Links */}
      <nav style={styles.nav}>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'analytics' ? styles.navButtonActive : {}),
          }}
        >
          <LayoutDashboard size={18} />
          <span>Overview & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'campaigns' ? styles.navButtonActive : {}),
          }}
        >
          <QrCode size={18} />
          <span>QR Campaigns</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'settings' ? styles.navButtonActive : {}),
          }}
        >
          <Settings size={18} />
          <span>Organization Profile</span>
        </button>

        {userRole === 'super-admin' && (
          <button
            onClick={() => setActiveTab('system')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'system' ? styles.navButtonActive : {}),
            }}
          >
            <ShieldAlert size={18} />
            <span>System Control</span>
          </button>
        )}
      </nav>

      {/* Sidebar Footer - User Profile & Logout */}
      <div style={styles.footer}>
        <div style={styles.profileBadge}>
          <div style={styles.profileInfo}>
            <div style={styles.profileNameRow}>
              <span style={styles.profileName} title={displayName}>{displayName}</span>
              <span style={{ 
                ...styles.roleLabel,
                color: userRole === 'super-admin' ? '#ffd700' : '#00f2fe',
                backgroundColor: userRole === 'super-admin' ? 'rgba(255,215,0,0.08)' : 'rgba(0,242,254,0.08)',
                borderColor: userRole === 'super-admin' ? 'rgba(255,215,0,0.15)' : 'rgba(0,242,254,0.15)'
              }}>
                {userRole === 'super-admin' ? 'Super' : 'Sub'}
              </span>
            </div>
            <span style={styles.profileEmail} title={userEmail}>{userEmail}</span>
          </div>
          
          <button onClick={onLogout} style={styles.logoutBtn} title="Log Out of Portal">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: '#0c0d24',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    zIndex: 100,
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    padding: '0 8px',
  },
  logoCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(15,118,110,0.2) 100%)',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: '1.2',
  },
  brandSubtitle: {
    fontSize: '0.75rem',
    color: '#00f2fe',
    fontWeight: '500',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  selectorContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '24px',
    padding: '0 8px',
  },
  selectorLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: '600',
    letterSpacing: '0.05em',
  },
  selectWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: '#ffffff',
    padding: '10px 32px 10px 12px',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    transition: 'all 0.2s ease',
  },
  option: {
    backgroundColor: '#0c0d24',
    color: '#ffffff',
  },
  sparkleIcon: {
    position: 'absolute',
    right: '12px',
    color: '#ffd700',
    pointerEvents: 'none',
  },
  subAdminOrgBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.1)',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
  },
  subAdminOrgText: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#ffd700',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-color)',
    margin: '0 8px 24px 8px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexGrow: 1,
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  navButtonActive: {
    color: '#ffd700',
    background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.08) 0%, transparent 100%)',
    borderLeft: '3px solid #ffd700',
    paddingLeft: '13px',
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    padding: '0 4px',
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '12px',
    gap: '8px',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    maxWidth: '75%',
  },
  profileNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  profileName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roleLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '1px 5px',
    borderRadius: '3px',
    border: '1px solid',
    textTransform: 'uppercase',
  },
  profileEmail: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutBtn: {
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    borderRadius: '6px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
};
