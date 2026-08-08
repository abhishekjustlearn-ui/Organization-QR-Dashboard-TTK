import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Organization, SubAdminPermissions, DEFAULT_PERMISSIONS } from '../mockData';
import { API_BASE } from '../config';

interface OrgSettingsTabProps {
  organization: Organization;
  permissions?: SubAdminPermissions;
}

export const OrgSettingsTab: React.FC<OrgSettingsTabProps> = ({
  organization,
  permissions,
}) => {
  const effectivePerms = permissions || DEFAULT_PERMISSIONS;
  const canEdit = effectivePerms.settings.editProfile;

  const [name, setName] = useState(organization.org_name);
  const [email, setEmail] = useState(organization.contact_email);
  const [phone, setPhone] = useState(organization.contact_phone);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Organization Profile</h2>
          <p style={styles.subtitle}>Manage contact details matching this organization’s profile.</p>
        </div>
      </div>

      <div style={styles.centeredContent}>
        <div className="glass-card" style={styles.settingsCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h3 style={styles.cardTitle}>Basic Configuration</h3>
            {!canEdit && (
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '600', 
                color: '#f59e0b', 
                backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                border: '1px solid rgba(245, 158, 11, 0.2)', 
                borderRadius: '6px', 
                padding: '3px 8px' 
              }}>
                🔒 Read-Only
              </span>
            )}
          </div>
          <p style={styles.cardDesc}>Specify details matching this organization’s legal contact profile.</p>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                style={!canEdit ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
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
                disabled={!canEdit}
                style={!canEdit ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
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
                disabled={!canEdit}
                style={!canEdit ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                required
              />
            </div>

            <div style={styles.formActions}>
              {canEdit ? (
                <button type="submit" className="btn-primary" style={styles.saveBtn}>
                  <Save size={16} />
                  <span>{saved ? 'Settings Saved!' : 'Save Changes'}</span>
                </button>
              ) : (
                <div style={{ width: '100%', textAlign: 'center', padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Edits to organization details are restricted by Super-Admin.
                </div>
              )}
            </div>
          </form>
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
  centeredContent: {
    maxWidth: '600px',
    width: '100%',
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
  }
};
