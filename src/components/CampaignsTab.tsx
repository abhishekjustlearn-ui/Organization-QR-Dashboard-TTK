import React, { useState, useEffect } from 'react';
import { Plus, BarChart2, QrCode, Calendar, ArrowRight, X, Power, Trash2 } from 'lucide-react';
import { Organization, Campaign, SubAdminPermissions, DEFAULT_PERMISSIONS } from '../mockData';
import { QRStylingPanel } from './QRStylingPanel';
import { QRPreview, QRStyleOptions } from './QRPreview';
import { logoPresets } from '../assets/logoPresets';
import { API_BASE } from '../config';

interface CampaignsTabProps {
  organization: Organization;
  campaigns: Campaign[]; // Left for type compatibility but unused
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>; // Left for type compatibility but unused
  permissions?: SubAdminPermissions;
}

export const CampaignsTab: React.FC<CampaignsTabProps> = ({
  organization,
  permissions,
}) => {
  const effectivePerms = permissions || DEFAULT_PERMISSIONS;
  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  
  // Customizer styling state
  const [qrOptions, setQrOptions] = useState<QRStyleOptions>({
    data: '',
    dotsColorType: 'gradient',
    dotsColor: '#00f2fe',
    dotsGradientStart: '#ffd700',
    dotsGradientEnd: '#00f2fe',
    dotsType: 'extra-rounded',
    bgColor: '#ffffff',
    eyeFrameColor: '#ffd700',
    eyeBallColor: '#097676',
    eyeFrameType: 'extra-rounded',
    eyeBallType: 'dot',
    logo: logoPresets.peacock,
    logoMargin: 6,
    logoSize: 32,
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${organization.org_id}`);
      if (response.ok) {
        const data = await response.json();
        setLocalCampaigns(data);
      }
    } catch (err) {
      console.error('Error fetching campaigns from Neon:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [organization.org_id]);

  const orgCampaigns = localCampaigns;

  const handleSelectCampaign = (camp: Campaign) => {
    setSelectedCampaign(camp);
    setQrOptions((prev) => ({
      ...prev,
      data: camp.qr_link,
    }));
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    const newId = `camp-${organization.org_id.split('-').pop()}-${Date.now().toString().slice(-4)}`;
    // The link should point to our public redirect endpoint: /api/track/qr/:campaignId
    const qrLink = `${window.location.origin}/${organization.org_id}/${newId}`;
    
    const newCamp: Campaign = {
      campaign_id: newId,
      org_id: organization.org_id,
      campaign_name: newCampaignName,
      qr_link: qrLink,
      created_at: new Date().toISOString(),
      scans_count: 0,
      installs_count: 0,
      signups_count: 0,
      revenue: 0,
    };

    try {
      const response = await fetch(`${API_BASE}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCamp)
      });

      if (response.ok) {
        setNewCampaignName('');
        setIsAddingCampaign(false);
        await fetchCampaigns();
        
        // Auto select the new campaign from the updated list
        const updatedCamp = { ...newCamp };
        handleSelectCampaign(updatedCamp);
      } else {
        const data = await response.json();
        alert(`Failed to add campaign: ${data.error}`);
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
    }
  };

  const handleToggleStatus = async (campaignId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        await fetchCampaigns();
      } else {
        alert('Failed to update campaign status.');
      }
    } catch (err) {
      console.error('Error toggling campaign status:', err);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchCampaigns();
      } else {
        alert('Failed to delete campaign.');
      }
    } catch (err) {
      console.error('Error deleting campaign:', err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Campaigns & QR Codes</h2>
          <p style={styles.subtitle}>Manage your marketing locations, print standees, and design custom QR codes.</p>
        </div>
        {!selectedCampaign && !isAddingCampaign && effectivePerms.campaigns.create && (
          <button onClick={() => setIsAddingCampaign(true)} className="btn-primary">
            <Plus size={16} />
            <span>Create Campaign</span>
          </button>
        )}
      </div>

      {/* Main Panel View */}
      {selectedCampaign ? (
        /* QR Styling View */
        <div className="designer-grid">
          {/* Customizer Control Panel */}
          <div style={styles.leftCol}>
            <div style={styles.backHeader}>
              <button onClick={() => setSelectedCampaign(null)} style={styles.backBtn}>
                <X size={16} />
                <span>Exit Design Studio</span>
              </button>
              <span style={styles.studioBadge}>Design Studio</span>
            </div>
            <QRStylingPanel options={qrOptions} setOptions={setQrOptions} />
          </div>

          {/* QR Preview & Export Canvas */}
          <div style={styles.rightCol}>
            <QRPreview 
              options={qrOptions} 
              campaignName={selectedCampaign.campaign_name} 
              orgName={organization.org_name} 
            />
          </div>
        </div>
      ) : isAddingCampaign ? (
        /* Create Campaign Dialog */
        <div className="glass-card" style={styles.formCard}>
          <h3 style={styles.formTitle}>Add New Campaign</h3>
          <form onSubmit={handleAddCampaign}>
            <div className="form-group">
              <label className="form-label">Campaign Name (e.g. Temple Foyer Standee)</label>
              <input
                type="text"
                className="form-input"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="Enter campaign name..."
                required
                autoFocus
              />
            </div>
            <div style={styles.formActions}>
              <button type="button" onClick={() => setIsAddingCampaign(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create & Design QR
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div className="glass-card" style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <span>Loading campaigns from Neon PostgreSQL...</span>
        </div>
      ) : (
        /* Campaigns Table / Grid List */
        <div className="glass-card">
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Active QR Campaigns</h3>
            <span style={styles.campCount}>{orgCampaigns.length} Campaigns</span>
          </div>

          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Date Created</th>
                  {effectivePerms.campaigns.metrics.scans && <th>Scans</th>}
                  {effectivePerms.campaigns.metrics.installs && <th>Installs</th>}
                  {effectivePerms.campaigns.metrics.signups && <th>Signups</th>}
                  {effectivePerms.campaigns.metrics.paying && <th>Paying Users</th>}
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgCampaigns.map((camp) => {
                  const hasAnyAction = effectivePerms.campaigns.design || effectivePerms.campaigns.pause || effectivePerms.campaigns.delete;
                  return (
                    <tr key={camp.campaign_id}>
                      <td style={{ fontWeight: '600' }}>
                        <div style={styles.campNameCol}>
                          <QrCode size={16} style={{ color: camp.status === 'inactive' ? 'var(--text-muted)' : '#ffd700' }} />
                          <span style={{ color: camp.status === 'inactive' ? 'var(--text-muted)' : 'inherit' }}>
                            {camp.campaign_name}
                          </span>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: '700', 
                            marginLeft: '8px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            backgroundColor: camp.status === 'inactive' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: camp.status === 'inactive' ? '#ef4444' : '#10b981'
                          }}>
                            {camp.status || 'active'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={styles.dateCol}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>{new Date(camp.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>
                      {effectivePerms.campaigns.metrics.scans && (
                        <td style={{ fontWeight: '500' }}>{camp.scans_count.toLocaleString()}</td>
                      )}
                      {effectivePerms.campaigns.metrics.installs && (
                        <td>{camp.installs_count.toLocaleString()}</td>
                      )}
                      {effectivePerms.campaigns.metrics.signups && (
                        <td>{camp.signups_count.toLocaleString()}</td>
                      )}
                      {effectivePerms.campaigns.metrics.paying && (
                        <td style={{ color: '#10b981', fontWeight: '600' }}>
                          {(camp.paying_users || 0).toLocaleString()}
                        </td>
                      )}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {effectivePerms.campaigns.design && (
                            <button
                              onClick={() => handleSelectCampaign(camp)}
                              className="btn-secondary"
                              style={styles.designBtn}
                            >
                              <BarChart2 size={13} />
                              <span>Design</span>
                              <ArrowRight size={12} />
                            </button>
                          )}
                          {effectivePerms.campaigns.pause && (
                            <button
                              onClick={() => handleToggleStatus(camp.campaign_id, camp.status)}
                              style={{
                                ...styles.statusActionBtn,
                                color: camp.status === 'inactive' ? '#10b981' : '#f59e0b',
                                backgroundColor: camp.status === 'inactive' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                                border: camp.status === 'inactive' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                              }}
                            >
                              <Power size={13} />
                              <span>{camp.status === 'inactive' ? 'Activate' : 'Pause'}</span>
                            </button>
                          )}
                          {effectivePerms.campaigns.delete && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete campaign "${camp.campaign_name}"?`)) {
                                  handleDeleteCampaign(camp.campaign_id);
                                }
                              }}
                              style={{
                                ...styles.deleteActionBtn,
                                color: '#ef4444',
                                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                          {!hasAnyAction && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {orgCampaigns.length === 0 && (
                  <tr>
                    <td 
                      colSpan={
                        2 +
                        (effectivePerms.campaigns.metrics.scans ? 1 : 0) +
                        (effectivePerms.campaigns.metrics.installs ? 1 : 0) +
                        (effectivePerms.campaigns.metrics.signups ? 1 : 0) +
                        (effectivePerms.campaigns.metrics.paying ? 1 : 0) +
                        1
                      } 
                      style={styles.emptyCell}
                    >
                      No campaigns yet. Create your first campaign to generate a custom QR code!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rightCol: {
    position: 'sticky',
    top: '40px',
  },
  backHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    outline: 'none',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  studioBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    border: '1px solid rgba(255, 215, 0, 0.15)',
    color: '#ffd700',
    borderRadius: '4px',
    padding: '3px 8px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  formCard: {
    maxWidth: '500px',
    margin: '40px auto',
  },
  formTitle: {
    fontSize: '1.25rem',
    color: '#ffffff',
    marginBottom: '20px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 4px 16px 4px',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '16px',
  },
  tableTitle: {
    fontSize: '1.1rem',
    color: '#ffffff',
  },
  campCount: {
    fontSize: '0.85rem',
    color: '#ffd700',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    border: '1px solid rgba(255, 215, 0, 0.1)',
    padding: '4px 10px',
    borderRadius: '20px',
    fontWeight: '600',
  },
  campNameCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dateCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-secondary)',
  },
  designBtn: {
    padding: '8px 14px',
    fontSize: '0.8rem',
    gap: '6px',
  },
  emptyCell: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  statusActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    fontSize: '0.75rem',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  deleteActionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
};
