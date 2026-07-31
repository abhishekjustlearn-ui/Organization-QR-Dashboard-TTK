import React, { useState } from 'react';
import { Plus, BarChart2, QrCode, Calendar, ArrowRight, X } from 'lucide-react';
import { Organization, Campaign } from '../mockData';
import { QRStylingPanel } from './QRStylingPanel';
import { QRPreview, QRStyleOptions } from './QRPreview';
import { logoPresets } from '../assets/logoPresets';

import { useEffect } from 'react';

interface CampaignsTabProps {
  organization: Organization;
  campaigns: Campaign[]; // Left for type compatibility but unused
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>; // Left for type compatibility but unused
}

export const CampaignsTab: React.FC<CampaignsTabProps> = ({
  organization,
}) => {
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
      const response = await fetch(`http://localhost:5000/api/campaigns/${organization.org_id}`);
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
    const qrLink = `http://localhost:5000/api/track/qr/${newId}`;
    
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
      const response = await fetch('http://localhost:5000/api/campaigns', {
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Campaigns & QR Codes</h2>
          <p style={styles.subtitle}>Manage your marketing locations, print standees, and design custom QR codes.</p>
        </div>
        {!selectedCampaign && !isAddingCampaign && (
          <button onClick={() => setIsAddingCampaign(true)} className="btn-primary">
            <Plus size={16} />
            <span>Create Campaign</span>
          </button>
        )}
      </div>

      {/* Main Panel View */}
      {selectedCampaign ? (
        /* QR Styling View */
        <div style={styles.designerGrid}>
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
                  <th>Scans</th>
                  <th>Installs</th>
                  <th>Signups</th>
                  <th>Revenue</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgCampaigns.map((camp) => (
                  <tr key={camp.campaign_id}>
                    <td style={{ fontWeight: '600' }}>
                      <div style={styles.campNameCol}>
                        <QrCode size={16} style={{ color: '#ffd700' }} />
                        <span>{camp.campaign_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={styles.dateCol}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{new Date(camp.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{camp.scans_count.toLocaleString()}</td>
                    <td>{camp.installs_count.toLocaleString()}</td>
                    <td>{camp.signups_count.toLocaleString()}</td>
                    <td style={{ color: '#10b981', fontWeight: '600' }}>
                      ${camp.revenue.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleSelectCampaign(camp)}
                        className="btn-secondary"
                        style={styles.designBtn}
                      >
                        <BarChart2 size={13} />
                        <span>Design & Export QR</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {orgCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={7} style={styles.emptyCell}>
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
  designerGrid: {
    display: 'grid',
    gridTemplateColumns: '7fr 5fr',
    gap: '24px',
    alignItems: 'start',
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
  }
};
