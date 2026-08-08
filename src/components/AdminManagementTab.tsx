import React, { useState } from 'react';
import { Plus, UserPlus, Users, Key, Mail, Building2, Check, Copy, Shield, Sliders, X } from 'lucide-react';
import { Organization, SubAdminUser, SubAdminPermissions, DEFAULT_PERMISSIONS } from '../mockData';

interface AdminManagementTabProps {
  organizations: Organization[];
  onboardOrg: (org: Organization) => void;
  onDeleteOrg: (orgId: string) => void;
  onToggleOrgStatus: (orgId: string, currentStatus: string) => void;
  subAdmins: SubAdminUser[];
  createSubAdmin: (admin: SubAdminUser) => void;
  onUpdateSubAdminPermissions?: (username: string, newPermissions: SubAdminPermissions) => void;
  onToggleSubAdminStatus?: (username: string, currentStatus?: string) => void;
  onDeleteSubAdmin?: (username: string) => void;
}

export const AdminManagementTab: React.FC<AdminManagementTabProps> = ({
  organizations,
  onboardOrg,
  onDeleteOrg,
  onToggleOrgStatus,
  subAdmins,
  createSubAdmin,
  onUpdateSubAdminPermissions,
  onToggleSubAdminStatus,
  onDeleteSubAdmin,
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
  const [adminPermissions, setAdminPermissions] = useState<SubAdminPermissions>(DEFAULT_PERMISSIONS);

  // Edit Permissions Modal State
  const [editingAdmin, setEditingAdmin] = useState<SubAdminUser | null>(null);
  const [editPermissionsState, setEditPermissionsState] = useState<SubAdminPermissions>(DEFAULT_PERMISSIONS);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Permission Presets
  const applyPreset = (preset: 'all' | 'view-only' | 'campaign-manager', target: 'create' | 'edit') => {
    let p: SubAdminPermissions;
    if (preset === 'all') {
      p = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
    } else if (preset === 'view-only') {
      p = {
        analytics: {
          metrics: { scans: true, installs: true, signups: true, paying: true },
          graph: { scans: true, installs: true, signups: true, paying: true },
          funnel: { scans: true, installs: true, signups: true, paying: true },
          activityLog: true,
        },
        campaigns: {
          create: false,
          design: true,
          pause: false,
          delete: false,
          metrics: { scans: true, installs: true, signups: true, paying: true },
        },
        settings: {
          editProfile: false,
        },
      };
    } else {
      // Campaign Manager
      p = {
        analytics: {
          metrics: { scans: true, installs: true, signups: true, paying: false },
          graph: { scans: true, installs: true, signups: true, paying: false },
          funnel: { scans: true, installs: true, signups: true, paying: false },
          activityLog: true,
        },
        campaigns: {
          create: true,
          design: true,
          pause: true,
          delete: false,
          metrics: { scans: true, installs: true, signups: true, paying: false },
        },
        settings: {
          editProfile: false,
        },
      };
    }

    if (target === 'create') setAdminPermissions(p);
    else setEditPermissionsState(p);
  };

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
      status: 'active',
      permissions: adminPermissions,
    };

    createSubAdmin(newSubAdmin);
    setAdminName('');
    setAdminUsername('');
    setAdminPassword('');
    setAdminPermissions(DEFAULT_PERMISSIONS);
    setAdminSuccess(`Credentials created for "${newSubAdmin.name}" with custom access!`);
    setTimeout(() => setAdminSuccess(''), 3000);
  };

  const handleCopyCredentials = (admin: SubAdminUser, idx: number) => {
    const text = `Org: ${organizations.find(o => o.org_id === admin.org_id)?.org_name}\nUser: ${admin.username}\nPass: ${admin.password_plain}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const openEditModal = (admin: SubAdminUser) => {
    setEditingAdmin(admin);
    const existing = admin.permissions || DEFAULT_PERMISSIONS;
    const merged: SubAdminPermissions = {
      analytics: {
        metrics: { ...DEFAULT_PERMISSIONS.analytics.metrics, ...existing.analytics?.metrics },
        graph: { ...DEFAULT_PERMISSIONS.analytics.graph, ...existing.analytics?.graph },
        funnel: { ...DEFAULT_PERMISSIONS.analytics.funnel, ...existing.analytics?.funnel },
        activityLog: existing.analytics?.activityLog !== undefined ? existing.analytics.activityLog : true,
      },
      campaigns: {
        ...DEFAULT_PERMISSIONS.campaigns,
        ...existing.campaigns,
        metrics: {
          ...DEFAULT_PERMISSIONS.campaigns.metrics,
          ...existing.campaigns?.metrics,
        },
      },
      settings: {
        ...DEFAULT_PERMISSIONS.settings,
        ...existing.settings,
      },
    };
    setEditPermissionsState(merged);
  };

  const handleSaveEditedPermissions = () => {
    if (!editingAdmin || !onUpdateSubAdminPermissions) return;
    onUpdateSubAdminPermissions(editingAdmin.username, editPermissionsState);
    setEditingAdmin(null);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>System Control Center</h2>
          <p style={styles.subtitle}>Super-Admin Panel to configure partners, spin up sub-admins, and customize access checklists.</p>
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
            <p style={styles.cardDesc}>Users mapped to specific organizations with customized visibility controls.</p>
            
            <div style={styles.list}>
              {subAdmins.map((admin, idx) => {
                const org = organizations.find((o) => o.org_id === admin.org_id);
                return (
                  <div key={admin.username} style={styles.adminItem}>
                    <div style={styles.adminHeader}>
                      <span style={styles.adminNameTitle}>{admin.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={styles.adminOrgName}>{org?.org_name || 'Unassigned'}</span>
                        <span style={{ 
                          ...styles.statusBadge, 
                          backgroundColor: admin.status === 'suspended' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: admin.status === 'suspended' ? '#ef4444' : '#10b981'
                        }}>
                          ● {(admin.status || 'active').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div style={styles.adminMeta}>
                      <span>User: {admin.username}</span>
                      <span>Pass: {admin.password_plain}</span>
                    </div>

                    <div style={styles.adminActionRow}>
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
                            <span>Copy Login</span>
                          </>
                        )}
                      </button>

                      {onUpdateSubAdminPermissions && (
                        <button
                          onClick={() => openEditModal(admin)}
                          style={styles.editAccessBtn}
                        >
                          <Shield size={12} style={{ color: '#00f2fe' }} />
                          <span>Edit Access</span>
                        </button>
                      )}

                      {onToggleSubAdminStatus && (
                        <button
                          onClick={() => onToggleSubAdminStatus(admin.username, admin.status)}
                          style={{
                            ...styles.actionBtn,
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            color: admin.status === 'suspended' ? '#10b981' : '#f59e0b',
                            backgroundColor: admin.status === 'suspended' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                            border: admin.status === 'suspended' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                          }}
                        >
                          {admin.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      )}

                      {onDeleteSubAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to permanently delete sub-admin account "${admin.name}" (${admin.username})?`)) {
                              onDeleteSubAdmin(admin.username);
                            }
                          }}
                          style={{
                            ...styles.actionBtn,
                            padding: '4px 8px',
                            fontSize: '0.72rem',
                            color: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create new Sub Admin Form with Granular Permissions Matrix */}
          <div className="glass-card" style={styles.rightCard}>
            <h3 style={styles.cardTitle}>Create Sub-Admin Account</h3>
            <p style={styles.cardDesc}>Generate credentials and configure exact parameter view & action permissions.</p>

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

              {/* Granular Permission Checklist Matrix */}
              <div style={styles.permSection}>
                <div style={styles.permHeaderRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={14} style={{ color: '#ffd700' }} />
                    <span style={styles.permSectionTitle}>Access & Visibility Checklist</span>
                  </div>
                  <div style={styles.presetGroup}>
                    <button type="button" onClick={() => applyPreset('all', 'create')} style={styles.presetBtn}>Select All</button>
                    <button type="button" onClick={() => applyPreset('view-only', 'create')} style={styles.presetBtn}>View Only</button>
                    <button type="button" onClick={() => applyPreset('campaign-manager', 'create')} style={styles.presetBtn}>Campaign Manager</button>
                  </div>
                </div>

                {/* 1. Overview & Analytics */}
                <div style={styles.permGroup}>
                  <span style={styles.permGroupTitle}>📊 Overview & Analytics</span>
                  
                  <div style={styles.permSubGroup}>
                    <span style={styles.permSubTitle}>KPI Metrics:</span>
                    <div style={styles.checkboxGrid}>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.metrics.scans}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              metrics: { ...adminPermissions.analytics.metrics, scans: e.target.checked }
                            }
                          })}
                        />
                        <span>Total Scans</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.metrics.installs}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              metrics: { ...adminPermissions.analytics.metrics, installs: e.target.checked }
                            }
                          })}
                        />
                        <span>App Installs</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.metrics.signups}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              metrics: { ...adminPermissions.analytics.metrics, signups: e.target.checked }
                            }
                          })}
                        />
                        <span>Signups</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.metrics.paying}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              metrics: { ...adminPermissions.analytics.metrics, paying: e.target.checked }
                            }
                          })}
                        />
                        <span>Paying Users</span>
                      </label>
                    </div>
                  </div>

                  <div style={styles.permSubGroup}>
                    <span style={styles.permSubTitle}>Trend Graph:</span>
                    <div style={styles.checkboxGrid}>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.graph.scans}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              graph: { ...adminPermissions.analytics.graph, scans: e.target.checked }
                            }
                          })}
                        />
                        <span>Scans Graph</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.graph.installs}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              graph: { ...adminPermissions.analytics.graph, installs: e.target.checked }
                            }
                          })}
                        />
                        <span>Installs Graph</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.graph.signups}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              graph: { ...adminPermissions.analytics.graph, signups: e.target.checked }
                            }
                          })}
                        />
                        <span>Signups Graph</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.graph.paying}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              graph: { ...adminPermissions.analytics.graph, paying: e.target.checked }
                            }
                          })}
                        />
                        <span>Paying Users Graph</span>
                      </label>
                    </div>
                  </div>

                  <div style={styles.permSubGroup}>
                    <span style={styles.permSubTitle}>Conversion Funnel:</span>
                    <div style={styles.checkboxGrid}>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.funnel.scans}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              funnel: { ...adminPermissions.analytics.funnel, scans: e.target.checked }
                            }
                          })}
                        />
                        <span>Scans Funnel</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.funnel.installs}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              funnel: { ...adminPermissions.analytics.funnel, installs: e.target.checked }
                            }
                          })}
                        />
                        <span>Installs Funnel</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.funnel.signups}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              funnel: { ...adminPermissions.analytics.funnel, signups: e.target.checked }
                            }
                          })}
                        />
                        <span>Signups Funnel</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.analytics.funnel.paying}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            analytics: {
                              ...adminPermissions.analytics,
                              funnel: { ...adminPermissions.analytics.funnel, paying: e.target.checked }
                            }
                          })}
                        />
                        <span>Paying Users Funnel</span>
                      </label>
                    </div>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={adminPermissions.analytics.activityLog}
                        onChange={(e) => setAdminPermissions({
                          ...adminPermissions,
                          analytics: {
                            ...adminPermissions.analytics,
                            activityLog: e.target.checked
                          }
                        })}
                      />
                      <span style={{ fontWeight: '600' }}>Show Live Attribution Log Table</span>
                    </label>
                  </div>
                </div>

                {/* 2. QR Campaigns */}
                <div style={styles.permGroup}>
                  <span style={styles.permGroupTitle}>🚀 QR Campaigns Capabilities</span>
                  
                  <div style={styles.permSubGroup}>
                    <span style={styles.permSubTitle}>Campaign Actions:</span>
                    <div style={styles.checkboxGrid}>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.campaigns.create}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            campaigns: { ...adminPermissions.campaigns, create: e.target.checked }
                          })}
                        />
                        <span>Create Campaign</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.campaigns.design}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            campaigns: { ...adminPermissions.campaigns, design: e.target.checked }
                          })}
                        />
                        <span>Design Studio QR</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.campaigns.pause}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            campaigns: { ...adminPermissions.campaigns, pause: e.target.checked }
                          })}
                        />
                        <span>Pause / Activate</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.campaigns.delete}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            campaigns: { ...adminPermissions.campaigns, delete: e.target.checked }
                          })}
                        />
                        <span>Delete Campaign</span>
                      </label>
                    </div>
                  </div>

                  <div style={styles.permSubGroup}>
                    <span style={styles.permSubTitle}>Table Metrics Columns:</span>
                    <div style={styles.checkboxGrid}>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.campaigns.metrics.scans}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            campaigns: {
                              ...adminPermissions.campaigns,
                              metrics: { ...adminPermissions.campaigns.metrics, scans: e.target.checked }
                            }
                          })}
                        />
                        <span>Scans Column</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.campaigns.metrics.installs}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            campaigns: {
                              ...adminPermissions.campaigns,
                              metrics: { ...adminPermissions.campaigns.metrics, installs: e.target.checked }
                            }
                          })}
                        />
                        <span>Installs Column</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.campaigns.metrics.signups}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            campaigns: {
                              ...adminPermissions.campaigns,
                              metrics: { ...adminPermissions.campaigns.metrics, signups: e.target.checked }
                            }
                          })}
                        />
                        <span>Signups Column</span>
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={adminPermissions.campaigns.metrics.paying}
                          onChange={(e) => setAdminPermissions({
                            ...adminPermissions,
                            campaigns: {
                              ...adminPermissions.campaigns,
                              metrics: { ...adminPermissions.campaigns.metrics, paying: e.target.checked }
                            }
                          })}
                        />
                        <span>Paying Users Column</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. Organization Profile */}
                <div style={styles.permGroup}>
                  <span style={styles.permGroupTitle}>⚙️ Organization Profile</span>
                  <label style={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={adminPermissions.settings.editProfile}
                      onChange={(e) => setAdminPermissions({
                        ...adminPermissions,
                        settings: { ...adminPermissions.settings, editProfile: e.target.checked }
                      })}
                    />
                    <span>Allow Editing Organization Name, Email & Phone</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                <UserPlus size={16} />
                <span>Create Credentials & Map Permissions</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal for Super Admin */}
      {editingAdmin && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} style={{ color: '#00f2fe' }} />
                <div>
                  <h3 style={styles.modalTitle}>Edit Access Permissions</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>User: {editingAdmin.name} ({editingAdmin.username})</p>
                </div>
              </div>
              <button onClick={() => setEditingAdmin(null)} style={styles.closeBtn}>
                <X size={16} />
              </button>
            </div>

            <div style={styles.presetGroupModal}>
              <button type="button" onClick={() => applyPreset('all', 'edit')} style={styles.presetBtn}>Select All</button>
              <button type="button" onClick={() => applyPreset('view-only', 'edit')} style={styles.presetBtn}>View Only</button>
              <button type="button" onClick={() => applyPreset('campaign-manager', 'edit')} style={styles.presetBtn}>Campaign Manager</button>
            </div>

            {/* Modal Checklist */}
            <div style={{ ...styles.permSection, maxHeight: '420px', overflowY: 'auto' }}>
              {/* 1. Overview & Analytics */}
              <div style={styles.permGroup}>
                <span style={styles.permGroupTitle}>📊 Overview & Analytics</span>
                
                <div style={styles.permSubGroup}>
                  <span style={styles.permSubTitle}>KPI Metrics:</span>
                  <div style={styles.checkboxGrid}>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.metrics.scans}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            metrics: { ...editPermissionsState.analytics.metrics, scans: e.target.checked }
                          }
                        })}
                      />
                      <span>Total Scans</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.metrics.installs}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            metrics: { ...editPermissionsState.analytics.metrics, installs: e.target.checked }
                          }
                        })}
                      />
                      <span>App Installs</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.metrics.signups}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            metrics: { ...editPermissionsState.analytics.metrics, signups: e.target.checked }
                          }
                        })}
                      />
                      <span>Signups</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.metrics.paying}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            metrics: { ...editPermissionsState.analytics.metrics, paying: e.target.checked }
                          }
                        })}
                      />
                      <span>Paying Users</span>
                    </label>
                  </div>
                </div>

                <div style={styles.permSubGroup}>
                  <span style={styles.permSubTitle}>Trend Graph:</span>
                  <div style={styles.checkboxGrid}>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.graph.scans}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            graph: { ...editPermissionsState.analytics.graph, scans: e.target.checked }
                          }
                        })}
                      />
                      <span>Scans Graph</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.graph.installs}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            graph: { ...editPermissionsState.analytics.graph, installs: e.target.checked }
                          }
                        })}
                      />
                      <span>Installs Graph</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.graph.signups}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            graph: { ...editPermissionsState.analytics.graph, signups: e.target.checked }
                          }
                        })}
                      />
                      <span>Signups Graph</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.graph.paying}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            graph: { ...editPermissionsState.analytics.graph, paying: e.target.checked }
                          }
                        })}
                      />
                      <span>Paying Users Graph</span>
                    </label>
                  </div>
                </div>

                <div style={styles.permSubGroup}>
                  <span style={styles.permSubTitle}>Conversion Funnel:</span>
                  <div style={styles.checkboxGrid}>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.funnel.scans}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            funnel: { ...editPermissionsState.analytics.funnel, scans: e.target.checked }
                          }
                        })}
                      />
                      <span>Scans Funnel</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.funnel.installs}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            funnel: { ...editPermissionsState.analytics.funnel, installs: e.target.checked }
                          }
                        })}
                      />
                      <span>Installs Funnel</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.funnel.signups}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            funnel: { ...editPermissionsState.analytics.funnel, signups: e.target.checked }
                          }
                        })}
                      />
                      <span>Signups Funnel</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.analytics.funnel.paying}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          analytics: {
                            ...editPermissionsState.analytics,
                            funnel: { ...editPermissionsState.analytics.funnel, paying: e.target.checked }
                          }
                        })}
                      />
                      <span>Paying Users Funnel</span>
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <label style={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={editPermissionsState.analytics.activityLog}
                      onChange={(e) => setEditPermissionsState({
                        ...editPermissionsState,
                        analytics: {
                          ...editPermissionsState.analytics,
                          activityLog: e.target.checked
                        }
                      })}
                    />
                    <span style={{ fontWeight: '600' }}>Show Live Attribution Log Table</span>
                  </label>
                </div>
              </div>

              {/* 2. QR Campaigns */}
              <div style={styles.permGroup}>
                <span style={styles.permGroupTitle}>🚀 QR Campaigns Capabilities</span>
                
                <div style={styles.permSubGroup}>
                  <span style={styles.permSubTitle}>Campaign Actions:</span>
                  <div style={styles.checkboxGrid}>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.campaigns.create}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          campaigns: { ...editPermissionsState.campaigns, create: e.target.checked }
                        })}
                      />
                      <span>Create Campaign</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.campaigns.design}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          campaigns: { ...editPermissionsState.campaigns, design: e.target.checked }
                        })}
                      />
                      <span>Design Studio QR</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.campaigns.pause}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          campaigns: { ...editPermissionsState.campaigns, pause: e.target.checked }
                        })}
                      />
                      <span>Pause / Activate</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.campaigns.delete}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          campaigns: { ...editPermissionsState.campaigns, delete: e.target.checked }
                        })}
                      />
                      <span>Delete Campaign</span>
                    </label>
                  </div>
                </div>

                <div style={styles.permSubGroup}>
                  <span style={styles.permSubTitle}>Table Metrics Columns:</span>
                  <div style={styles.checkboxGrid}>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.campaigns.metrics.scans}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          campaigns: {
                            ...editPermissionsState.campaigns,
                            metrics: { ...editPermissionsState.campaigns.metrics, scans: e.target.checked }
                          }
                        })}
                      />
                      <span>Scans Column</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.campaigns.metrics.installs}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          campaigns: {
                            ...editPermissionsState.campaigns,
                            metrics: { ...editPermissionsState.campaigns.metrics, installs: e.target.checked }
                          }
                        })}
                      />
                      <span>Installs Column</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.campaigns.metrics.signups}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          campaigns: {
                            ...editPermissionsState.campaigns,
                            metrics: { ...editPermissionsState.campaigns.metrics, signups: e.target.checked }
                          }
                        })}
                      />
                      <span>Signups Column</span>
                    </label>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={editPermissionsState.campaigns.metrics.paying}
                        onChange={(e) => setEditPermissionsState({
                          ...editPermissionsState,
                          campaigns: {
                            ...editPermissionsState.campaigns,
                            metrics: { ...editPermissionsState.campaigns.metrics, paying: e.target.checked }
                          }
                        })}
                      />
                      <span>Paying Users Column</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. Organization Profile */}
              <div style={styles.permGroup}>
                <span style={styles.permGroupTitle}>⚙️ Organization Profile</span>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={editPermissionsState.settings.editProfile}
                    onChange={(e) => setEditPermissionsState({
                      ...editPermissionsState,
                      settings: { ...editPermissionsState.settings, editProfile: e.target.checked }
                    })}
                  />
                  <span>Allow Editing Organization Name, Email & Phone</span>
                </label>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setEditingAdmin(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSaveEditedPermissions} className="btn-primary">
                Save Permissions
              </button>
            </div>
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
    maxHeight: '520px',
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
  adminActionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '6px',
    marginTop: '6px',
    flexWrap: 'wrap',
  },
  adminCopyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 6px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  editAccessBtn: {
    background: 'rgba(0, 242, 254, 0.06)',
    border: '1px solid rgba(0, 242, 254, 0.2)',
    color: '#00f2fe',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '6px',
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
  },
  permSection: {
    marginTop: '16px',
    padding: '14px',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  permHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '8px',
  },
  permSectionTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  presetGroup: {
    display: 'flex',
    gap: '6px',
  },
  presetGroupModal: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  presetBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    padding: '3px 8px',
    fontSize: '0.72rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  permGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.03)',
  },
  permGroupTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#ffd700',
  },
  permSubGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  permSubTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '8px',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    color: '#ffffff',
    cursor: 'pointer',
    userSelect: 'none',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalCard: {
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    backgroundColor: '#0d1024',
    border: '1px solid rgba(0, 242, 254, 0.2)',
    borderRadius: '16px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '12px',
  },
  modalTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
    paddingTop: '14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
};
