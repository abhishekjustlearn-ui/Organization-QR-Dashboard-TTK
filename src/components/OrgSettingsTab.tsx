import React, { useState } from 'react';
import { Save, Copy, Check, Terminal, ShieldAlert } from 'lucide-react';
import { Organization } from '../mockData';
import { API_BASE } from '../config';

interface OrgSettingsTabProps {
  organization: Organization;
}

export const OrgSettingsTab: React.FC<OrgSettingsTabProps> = ({
  organization,
}) => {
  const [name, setName] = useState(organization.org_name);
  const [email, setEmail] = useState(organization.contact_email);
  const [phone, setPhone] = useState(organization.contact_phone);
  const [saved, setSaved] = useState(false);
  const [copiedText, setCopiedText] = useState<'id' | 'key' | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/orgs/${organization.org_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: name,
          contact_email: email,
          contact_phone: phone
        })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Failed to update organization profile.');
      }
    } catch (err) {
      console.error('Error updating organization profile:', err);
    }
  };

  const handleCopy = (text: string, type: 'id' | 'key') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Organization Profile</h2>
          <p style={styles.subtitle}>Manage contact details, retrieve API tokens, and access mobile deep-linking guides.</p>
        </div>
      </div>

      <div style={styles.layoutGrid}>
        
        {/* Left Column: Form Settings */}
        <div style={styles.leftCol}>
          <div className="glass-card" style={styles.settingsCard}>
            <h3 style={styles.cardTitle}>Basic Configuration</h3>
            <p style={styles.cardDesc}>Specify details matching this organization’s legal contact profile.</p>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Organization Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div style={styles.formActions}>
                <button type="submit" className="btn-primary" style={styles.saveBtn}>
                  <Save size={16} />
                  <span>{saved ? 'Settings Saved!' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Credentials panel */}
          <div className="glass-card" style={styles.settingsCard}>
            <h3 style={styles.cardTitle}>Integration Keys</h3>
            <p style={styles.cardDesc}>Credentials for connecting A1 (iOS) and A2 (Android) configurations.</p>
            
            <div style={styles.credRow}>
              <div style={styles.credInfo}>
                <span style={styles.credLabel}>Organization ID (org_id)</span>
                <code style={styles.code}>{organization.org_id}</code>
              </div>
              <button 
                onClick={() => handleCopy(organization.org_id, 'id')}
                style={styles.copyBtn}
              >
                {copiedText === 'id' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              </button>
            </div>

            <div style={styles.credRow}>
              <div style={styles.credInfo}>
                <span style={styles.credLabel}>Attribution API Token (`x-dash-token`)</span>
                <code style={styles.code}>token_tk_{organization.org_id.split('-').pop()}_9a2f77bc</code>
              </div>
              <button 
                onClick={() => handleCopy(`token_tk_${organization.org_id.split('-').pop()}_9a2f77bc`, 'key')}
                style={styles.copyBtn}
              >
                {copiedText === 'key' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Documentation / Mobile Deep Linking guide */}
        <div style={styles.rightCol}>
          <div className="glass-card" style={styles.docCard}>
            <div style={styles.docTitleWrapper}>
              <Terminal size={18} style={{ color: '#ffd700' }} />
              <h3 style={styles.cardTitle}>Mobile Integration Guide</h3>
            </div>
            <p style={styles.cardDesc}>Follow these implementation rules to set up first-launch attribution inside A1 (iOS) and A2 (Android).</p>

            <div style={styles.docSection}>
              <h4 style={styles.docSubtitle}>🤖 Android (A2) Install Referrer Setup</h4>
              <p style={styles.docText}>
                When a user scans the QR code on Android, we redirect to the Play Store with the referrer parameter appended:
              </p>
              <pre style={styles.pre}>
                {`https://play.google.com/store/apps/details?id=com.talktokrishna\n&referrer=org_id%3D${organization.org_id}`}
              </pre>
              <p style={styles.docText}>
                On first launch of A2, use the Google Play Install Referrer Library to fetch the referrer, retrieve <code>org_id</code>, and POST to:
              </p>
              <pre style={styles.preCode}>
                {`POST /track/referrer\nHeaders: x-dash-token: <token>\nBody: { referrer_url: "...", org_id: "${organization.org_id}" }`}
              </pre>
            </div>

            <div style={styles.docSection}>
              <h4 style={styles.docSubtitle}>🍎 iOS (A1) Fingerprint Matching Setup</h4>
              <p style={styles.docText}>
                Since iOS has no install referrer API, A1 collects device details on first launch and calls the matching API.
              </p>
              <p style={styles.docText}>
                POST the following payload from A1 on first boot. The backend will compare it against recent scans from the same IP address within a 15-minute window:
              </p>
              <pre style={styles.preCode}>
                {`POST /track/fingerprint\nBody: {\n  device_model: "iPhone 15 Pro",\n  os_version: "iOS 17.4",\n  screen_resolution: "1179x2556",\n  timezone: "Asia/Kolkata"\n}`}
              </pre>
            </div>

            <div style={styles.warningBox}>
              <ShieldAlert size={16} style={{ color: '#ffd700', flexShrink: 0 }} />
              <span style={styles.warningText}>
                Downstream signup and payment attribution is <strong>first-touch permanent</strong>. Once <code>attributed_org_id</code> is set inside d1-d5, it is never modified.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '1.65rem',
    color: '#ffffff',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '5fr 6fr',
    gap: '24px',
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightCol: {
    position: 'sticky',
    top: '40px',
  },
  settingsCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: '1.15rem',
    color: '#ffffff',
    marginBottom: '4px',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '12px',
  },
  saveBtn: {
    width: '100%',
    justifyContent: 'center',
  },
  credRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.015)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '12px',
  },
  credInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxWidth: '85%',
  },
  credLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  code: {
    fontFamily: 'monospace',
    color: '#ffd700',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  docCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  docTitleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  docSection: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '20px',
    marginTop: '16px',
  },
  docSubtitle: {
    fontSize: '0.9rem',
    color: '#ffd700',
    fontFamily: 'var(--font-heading)',
    fontWeight: '600',
    marginBottom: '8px',
  },
  docText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '8px',
  },
  pre: {
    backgroundColor: '#050612',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '12px',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    marginBottom: '12px',
  },
  preCode: {
    backgroundColor: '#050612',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '12px',
    color: '#00f2fe',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    marginBottom: '12px',
  },
  warningBox: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(229, 169, 59, 0.05)',
    border: '1px solid rgba(229, 169, 59, 0.15)',
    borderRadius: '10px',
    padding: '12px',
    marginTop: '20px',
  },
  warningText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  }
};
