import React, { useState } from 'react';
import { Plus, UserPlus, Users, Key, Mail, Building2, Check, Copy } from 'lucide-react';
import { Organization, SubAdminUser } from '../mockData';

interface AdminManagementTabProps {
  organizations: Organization[];
  onboardOrg: (org: Organization) => void;
  onDeleteOrg: (orgId: string) => void;
  onToggleOrgStatus: (orgId: string, currentStatus: string) => void;
  subAdmins: SubAdminUser[];
  createSubAdmin: (admin: SubAdminUser) => void;
}

export const AdminManagementTab: React.FC<AdminManagementTabProps> = ({
  organizations,
  onboardOrg,
  onDeleteOrg,
  onToggleOrgStatus,
  subAdmins,
  createSubAdmin,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'orgs' | 'admins'>('orgs');

  // Org form state
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgEmail, setNewOrgEmail] = useState('');
  const [newOrgPhone, setNewOrgPhone] = useState('');
  const [orgSuccess, setOrgSuccess] = useState('');

  // Sub-admin form state
  const [adminOrgId, setAdminOrgId] = useState(organizations[0]?.org_id || '');
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const newOrgId = `org-${newOrgName.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Check if duplicate ID
    if (organizations.some(o => o.org_id === newOrgId)) {
      alert('An organization with this name already exists.');
      return;
    }

    const newOrg: Organization = {
      org_id: newOrgId,
      org_name: newOrgName,
      contact_email: newOrgEmail,
      contact_phone: newOrgPhone,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    onboardOrg(newOrg);
    setNewOrgName('');
    setNewOrgEmail('');
    setNewOrgPhone('');
    setOrgSuccess(`Successfully onboarded organization "${newOrg.org_name}"!`);
    
    // Auto-update selection in sub-admin creator
    if (!adminOrgId) setAdminOrgId(newOrgId);
    
    setTimeout(() => setOrgSuccess(''), 3000);
  };

  const handleCreateSubAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminOrgId || !adminUsername.trim() || !adminPassword.trim()) return;

    // Check for duplicate username
    if (subAdmins.some((a) => a.username.toLowerCase() === adminUsername.trim().toLowerCase())) {
      alert('This sub-admin username already exists. Please choose a different email.');
      return;
    }

    const newSubAdmin: SubAdminUser = {
      username: adminUsername.trim(),
      password_plain: adminPassword.trim(),
      org_id: adminOrgId,
      name: adminName.trim() || 'Org Coordinator',
    };

    createSubAdmin(newSubAdmin);
    setAdminName('');
    setAdminUsername('');
    setAdminPassword('');
    setAdminSuccess(`Credentials created for "${newSubAdmin.name}"!`);
    setTimeout(() => setAdminSuccess(''), 3000);
  };

  const handleCopyCredentials = (admin: SubAdminUser, idx: number) => {
    const text = `Org: ${organizations.find(o => o.org_id === admin.org_id)?.org_name}\nUser: ${admin.username}\nPass: ${admin.password_plain}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>System Control Center</h2>
          <p style={styles.subtitle}>Super-Admin Panel to configure partners, spin up sub-admins, and inspect system states.</p>
        </div>
      </div>

      {/* Selector Navigation */}
      <div style={styles.toggleRow}>
        <button
          onClick={() => setActiveSubTab('orgs')}
          style={{
            ...styles.toggleBtn,
            ...(activeSubTab === 'orgs' ? styles.toggleBtnActive : {})
          }}
        >
          <Building2 size={16} />
          <span>Manage Organizations ({organizations.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('admins')}
          style={{
            ...styles.toggleBtn,
            ...(activeSubTab === 'admins' ? styles.toggleBtnActive : {})
          }}
        >
          <Users size={16} />
          <span>Onboard Sub-Admins ({subAdmins.length})</span>
        </button>
      </div>

      {activeSubTab === 'orgs' ? (
        <div className="admin-control-grid">
          {/* List of current Orgs */}
          <div className="glass-card" style={styles.leftCard}>
            <h3 style={styles.cardTitle}>Registered Organizations</h3>
            <p style={styles.cardDesc}>Overview of all partner entities on the Talk to Krishna platform.</p>
            
            <div style={styles.list}>
              {organizations.map((org) => {
                const subAdminCount = subAdmins.filter(a => a.org_id === org.org_id).length;
                return (
                  <div key={org.org_id} style={styles.listItem}>
                    <div style={styles.listItemHeader}>
                      <span style={styles.orgName}>{org.org_name}</span>
                      <span style={{ 
                        ...styles.statusBadge, 
                        backgroundColor: org.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: org.status === 'active' ? '#10b981' : '#ef4444'
                      }}>
                        ● {org.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={styles.listItemDetails}>
                      <span>ID: {org.org_id}</span>
                      <span>•</span>
                      <span>{subAdminCount} Sub-Admins mapped</span>
                    </div>
                    {/* Action Row for Super Admins */}
                    <div style={styles.actionRow}>
                      <button
                        onClick={() => onToggleOrgStatus(org.org_id, org.status)}
                        style={{
                          ...styles.actionBtn,
                          color: org.status === 'active' ? '#f59e0b' : '#10b981',
                          backgroundColor: org.status === 'active' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                          border: org.status === 'active' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                        }}
                      >
                        {org.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${org.org_name}"? This will permanently delete all its sub-admins, campaigns, and attribution data!`)) {
                            onDeleteOrg(org.org_id);
                          }
                        }}
                        style={{
                          ...styles.actionBtn,
                          color: '#ef4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create new Org Form */}
          <div className="glass-card" style={styles.rightCard}>
            <h3 style={styles.cardTitle}>Onboard New Organization</h3>
            <p style={styles.cardDesc}>Add a temple, center, or community group to route attributions.</p>

            {orgSuccess && <div style={styles.successBanner}>{orgSuccess}</div>}

            <form onSubmit={handleCreateOrg}>
              <div className="form-group">
                <label className="form-label">Organization Name (Legal/Public)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. ISKCON Bangalore"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={newOrgEmail}
                  onChange={(e) => setNewOrgEmail(e.target.value)}
                  placeholder="e.g. info@iskconbangalore.org"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={newOrgPhone}
                  onChange={(e) => setNewOrgPhone(e.target.value)}
                  placeholder="e.g. +91 80 2347 1953"
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                <Plus size={16} />
                <span>Onboard Partner Organization</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="admin-control-grid">
          {/* List of Sub Admins */}
          <div className="glass-card" style={styles.leftCard}>
            <h3 style={styles.cardTitle}>Active Sub-Admin Users</h3>
            <p style={styles.cardDesc}>Users mapped to specific organizations to manage their analytics and QR customizers.</p>
            
            <div style={styles.list}>
              {subAdmins.map((admin, idx) => {
                const org = organizations.find((o) => o.org_id === admin.org_id);
                return (
                  <div key={admin.username} style={styles.adminItem}>
                    <div style={styles.adminHeader}>
                      <span style={styles.adminNameTitle}>{admin.name}</span>
                      <span style={styles.adminOrgName}>{org?.org_name || 'Unassigned'}</span>
                    </div>
                    <div style={styles.adminMeta}>
                      <span>User: {admin.username}</span>
                      <span>Pass: {admin.password_plain}</span>
                    </div>
                    <button 
                      onClick={() => handleCopyCredentials(admin, idx)}
                      style={styles.adminCopyBtn}
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check size={12} style={{ color: '#10b981' }} />
                          <span style={{ color: '#10b981' }}>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Login Details</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create new Sub Admin Form */}
          <div className="glass-card" style={styles.rightCard}>
            <h3 style={styles.cardTitle}>Create Sub-Admin Account</h3>
            <p style={styles.cardDesc}>Generate credentials and link them to an organization partner.</p>

            {adminSuccess && <div style={styles.successBanner}>{adminSuccess}</div>}

            <form onSubmit={handleCreateSubAdmin}>
              <div className="form-group">
                <label className="form-label">Link to Organization</label>
                <select
                  className="form-select"
                  value={adminOrgId}
                  onChange={(e) => setAdminOrgId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select an Organization...</option>
                  {organizations.map((org) => (
                    <option key={org.org_id} value={org.org_id}>{org.org_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name / Coordinator Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Anand Sharma (Temple President)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Username (Email Address)</label>
                <div style={styles.inputIconWrapper}>
                  <Mail size={14} style={styles.fieldIcon} />
                  <input
                    type="email"
                    className="form-input"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="e.g. anand@iskcondelhi.org"
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Secure Access Password</label>
                <div style={styles.inputIconWrapper}>
                  <Key size={14} style={styles.fieldIcon} />
                  <input
                    type="text"
                    className="form-input"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="e.g. DelhiTempAdmin99!"
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                <UserPlus size={16} />
                <span>Create Credentials & Map Role</span>
              </button>
            </form>
          </div>
        </div>
      )}
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
  toggleRow: {
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '16px',
  },
  toggleBtn: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    color: 'var(--text-secondary)',
    padding: '12px 20px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  toggleBtnActive: {
    color: '#080916',
    background: '#ffd700',
    borderColor: '#ffd700',
  },
  leftCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightCard: {
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: '40px',
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '460px',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  listItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  listItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgName: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#ffffff',
  },
  statusBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    borderRadius: '4px',
    padding: '2px 6px',
  },
  listItemDetails: {
    display: 'flex',
    gap: '8px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: '#a7f3d0',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.85rem',
    marginBottom: '16px',
    fontWeight: '500',
  },
  adminItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  adminHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  adminNameTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#ffffff',
  },
  adminOrgName: {
    fontSize: '0.75rem',
    color: '#ffd700',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.1)',
    borderRadius: '4px',
    padding: '2px 8px',
  },
  adminMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: '8px 12px',
    borderRadius: '6px',
  },
  adminCopyBtn: {
    alignSelf: 'flex-end',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  inputIconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  fieldIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    paddingTop: '12px',
  },
  actionBtn: {
    flex: 1,
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
  }
};
