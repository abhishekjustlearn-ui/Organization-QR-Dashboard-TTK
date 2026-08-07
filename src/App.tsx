import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { AnalyticsTab } from './components/AnalyticsTab';
import { CampaignsTab } from './components/CampaignsTab';
import { OrgSettingsTab } from './components/OrgSettingsTab';
import { AdminManagementTab } from './components/AdminManagementTab';
import { Login } from './components/Login';
import { Organization, SubAdminUser, Campaign } from './mockData';
import { API_BASE } from './config';
import { LandingPage } from './components/LandingPage';

function App() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdminUser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'super-admin' | 'sub-admin' | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Active Layout State
  const [activeOrgId, setActiveOrgId] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'campaigns' | 'settings' | 'system'>('analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar drawer on tab switch (useful on mobile layout)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab, activeOrgId]);

  // Restore session from localStorage on page load (prevents logout on refresh)
  useEffect(() => {
    const saved = localStorage.getItem('ttk_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session.role && session.email) {
          setUserRole(session.role);
          setUserEmail(session.email);
          setDisplayName(session.name || '');
          setIsAuthenticated(true);
          fetchOrganizations(session.role, session.orgId || '');
          if (session.role === 'super-admin') fetchSubAdmins();
        }
      } catch {
        localStorage.removeItem('ttk_session');
      }
    }
  }, []);

  // Load organizations from backend
  const fetchOrganizations = async (role: 'super-admin' | 'sub-admin', orgId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/orgs`);
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
        
        // Handle initial organization selection
        if (role === 'sub-admin' && orgId) {
          setActiveOrgId(orgId);
        } else if (data.length > 0) {
          setActiveOrgId(data[0].org_id);
        }
      }
    } catch (err) {
      console.error('Error fetching organizations from Neon:', err);
    }
  };

  // Load sub-admins from backend
  const fetchSubAdmins = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/orgs/subadmins`);
      if (response.ok) {
        const data = await response.json();
        setSubAdmins(data);
      }
    } catch (err) {
      console.error('Error fetching sub-admins:', err);
    }
  };

  // Fetch data on authentication
  useEffect(() => {
    if (isAuthenticated && userRole) {
      // Only fetch if organizations are not loaded yet to prevent race conditions from overriding activeOrgId
      if (organizations.length === 0) {
        const saved = localStorage.getItem('ttk_session');
        let savedOrgId = '';
        if (saved) {
          try {
            savedOrgId = JSON.parse(saved).orgId || '';
          } catch {}
        }
        fetchOrganizations(userRole, activeOrgId || savedOrgId);
      }
      if (userRole === 'super-admin') {
        fetchSubAdmins();
      }
    }
  }, [isAuthenticated, userRole]);

  const handleLoginSuccess = (
    role: 'super-admin' | 'sub-admin',
    email: string,
    orgId: string,
    name: string
  ) => {
    setUserRole(role);
    setUserEmail(email);
    setDisplayName(name);
    setIsAuthenticated(true);
    setActiveTab('analytics');

    // Persist session so refresh doesn't log out the user
    localStorage.setItem('ttk_session', JSON.stringify({ role, email, orgId, name }));

    // Trigger loading organizations immediately with custom parameters
    fetchOrganizations(role, orgId);
    if (role === 'super-admin') {
      fetchSubAdmins();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ttk_session');  // Clear persisted session
    setIsAuthenticated(false);
    setUserRole(null);
    setUserEmail('');
    setDisplayName('');
    setActiveOrgId('');
    setOrganizations([]);
    setSubAdmins([]);
    setActiveTab('analytics');
  };

  // Wrapper function to onboard new organization
  const handleOnboardOrg = async (newOrg: Organization) => {
    try {
      const response = await fetch(`${API_BASE}/api/orgs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrg)
      });
      if (response.ok) {
        await fetchOrganizations(userRole || 'super-admin', activeOrgId);
      } else {
        const data = await response.json();
        alert(`Failed to onboard organization: ${data.error}`);
      }
    } catch (err) {
      console.error('Error onboarding org:', err);
    }
  };

  // Wrapper function to create sub-admin
  const handleCreateSubAdmin = async (newAdmin: SubAdminUser) => {
    try {
      const response = await fetch(`${API_BASE}/api/orgs/subadmins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });
      if (response.ok) {
        await fetchSubAdmins();
      } else {
        const data = await response.json();
        alert(`Failed to create sub-admin: ${data.error}`);
      }
    } catch (err) {
      console.error('Error creating sub-admin:', err);
    }
  };

  // Wrapper function to delete organization
  const handleDeleteOrg = async (orgId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/orgs/${orgId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchOrganizations(userRole || 'super-admin', '');
      } else {
        alert('Failed to delete organization.');
      }
    } catch (err) {
      console.error('Error deleting organization:', err);
    }
  };

  // Wrapper function to toggle organization status (suspend/activate)
  const handleToggleOrgStatus = async (orgId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const response = await fetch(`${API_BASE}/api/orgs/${orgId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        await fetchOrganizations(userRole || 'super-admin', activeOrgId);
      } else {
        alert('Failed to update organization status.');
      }
    } catch (err) {
      console.error('Error toggling organization status:', err);
    }
  };

  const activeOrg = organizations.find((o) => o.org_id === activeOrgId);

  // Check if current URL path matches the landing page router pattern: /:orgId/:campaignId
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const isLandingPage = pathSegments.length === 2 && 
                        pathSegments[0].startsWith('org-') && 
                        pathSegments[1].startsWith('camp-');

  if (isLandingPage) {
    return <LandingPage orgId={pathSegments[0]} campaignId={pathSegments[1]} />;
  }

  // Guard Clause: If not logged in, mount Login Screen
  if (!isAuthenticated || !userRole) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  return (
    <div className="app-layout">
      {/* Mobile Drawer Overlay Backdrop */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Premium Navigation Sidebar */}
      <Sidebar
        organizations={organizations}
        activeOrgId={activeOrgId}
        setActiveOrgId={setActiveOrgId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        userEmail={userEmail}
        displayName={displayName}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Tab Controller */}
      <main className="main-content">
        {/* Mobile Header Bar */}
        <header className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff' }}>Talk to Krishna</span>
            <span style={{ fontSize: '0.65rem', color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeTab}</span>
          </div>
        </header>
        {activeTab === 'system' && userRole === 'super-admin' && (
          <AdminManagementTab
            organizations={organizations}
            onboardOrg={handleOnboardOrg}
            onDeleteOrg={handleDeleteOrg}
            onToggleOrgStatus={handleToggleOrgStatus}
            subAdmins={subAdmins}
            createSubAdmin={handleCreateSubAdmin}
          />
        )}

        {activeTab !== 'system' && (
          activeOrg ? (
            <>
              {activeTab === 'analytics' && (
                <AnalyticsTab 
                  organization={activeOrg} 
                  campaigns={campaigns} 
                />
              )}
              {activeTab === 'campaigns' && (
                <CampaignsTab
                  organization={activeOrg}
                  campaigns={campaigns}
                  setCampaigns={setCampaigns}
                />
              )}
              {activeTab === 'settings' && (
                <OrgSettingsTab 
                  organization={activeOrg} 
                />
              )}
            </>
          ) : (
            <div style={styles.errorState}>
              <h2>No Active Organization Selected</h2>
              <p>Please select or onboard an organization to configure attribution routing.</p>
            </div>
          )
        )}
      </main>
    </div>
  );
}

const styles = {
  errorState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '80vh',
    gap: '12px',
    color: 'var(--text-secondary)'
  }
};

export default App;
