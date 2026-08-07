export interface Organization {
  org_id: string;
  org_name: string;
  contact_email: string;
  contact_phone: string;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface Campaign {
  campaign_id: string;
  org_id: string;
  campaign_name: string;
  qr_link: string;
  created_at: string;
  scans_count: number;
  installs_count: number;
  signups_count: number;
  revenue: number;
  paying_users?: number;
  qr_config?: string; // JSON configuration of styled QR code
  status?: 'active' | 'inactive';
}

export interface ActivityLog {
  id: string;
  type: 'scan' | 'install' | 'signup' | 'payment';
  org_name: string;
  campaign_name: string;
  device: 'iOS' | 'Android' | 'Desktop';
  detail: string;
  timestamp: string;
  matched_via?: 'Fingerprint (iOS)' | 'Referrer (Android)' | 'Direct Link';
}

export interface DailyMetric {
  date: string;
  scans: number;
  installs: number;
  signups: number;
  revenue: number;
}

export interface FunnelMetric {
  stage: string;
  count: number;
  percentage: number; // conversion from previous stage
  overallPercentage: number; // conversion from first stage
}

// Initial Mock Organizations
export const mockOrganizations: Organization[] = [
  {
    org_id: 'org-iskcon-delhi',
    org_name: 'ISKCON Temple Delhi',
    contact_email: 'admin@iskcondelhi.org',
    contact_phone: '+91 11 2623 0323',
    status: 'active',
    created_at: '2026-01-15T08:30:00Z',
  },
  {
    org_id: 'org-gita-youth',
    org_name: 'Gita Youth Society',
    contact_email: 'connect@gitayouth.in',
    contact_phone: '+91 98765 43210',
    status: 'active',
    created_at: '2026-02-10T11:15:00Z',
  },
  {
    org_id: 'org-vrindavan-heritage',
    org_name: 'Vrindavan Heritage Foundation',
    contact_email: 'info@vrindavanheritage.org',
    contact_phone: '+91 565 244 3300',
    status: 'active',
    created_at: '2026-03-01T09:00:00Z',
  },
  {
    org_id: 'org-krishna-austin',
    org_name: 'Krishna Temple Austin',
    contact_email: 'service@krishnaaustin.org',
    contact_phone: '+1 (512) 555-0199',
    status: 'active',
    created_at: '2026-04-18T14:45:00Z',
  }
];

// Mock Campaigns per Organization
export const mockCampaigns: Campaign[] = [
  // ISKCON Delhi campaigns
  {
    campaign_id: 'camp-del-01',
    org_id: 'org-iskcon-delhi',
    campaign_name: 'Main Entrance Standee',
    qr_link: 'https://dash.talktokrishna.com/qr/camp-del-01',
    created_at: '2026-01-20T10:00:00Z',
    scans_count: 1420,
    installs_count: 980,
    signups_count: 740,
    revenue: 4950,
  },
  {
    campaign_id: 'camp-del-02',
    org_id: 'org-iskcon-delhi',
    campaign_name: 'Sunday Feast Handout',
    qr_link: 'https://dash.talktokrishna.com/qr/camp-del-02',
    created_at: '2026-02-05T09:30:00Z',
    scans_count: 850,
    installs_count: 510,
    signups_count: 320,
    revenue: 1250,
  },
  {
    campaign_id: 'camp-del-03',
    org_id: 'org-iskcon-delhi',
    campaign_name: 'Janmashtami Brochure',
    qr_link: 'https://dash.talktokrishna.com/qr/camp-del-03',
    created_at: '2026-07-01T12:00:00Z',
    scans_count: 3450,
    installs_count: 2890,
    signups_count: 2410,
    revenue: 18400,
  },
  
  // Gita Youth campaigns
  {
    campaign_id: 'camp-gita-01',
    org_id: 'org-gita-youth',
    campaign_name: 'College Campus Flyer',
    qr_link: 'https://dash.talktokrishna.com/qr/camp-gita-01',
    created_at: '2026-02-15T14:00:00Z',
    scans_count: 1210,
    installs_count: 840,
    signups_count: 610,
    revenue: 850,
  },
  {
    campaign_id: 'camp-gita-02',
    org_id: 'org-gita-youth',
    campaign_name: 'Youth Retreat Banner',
    qr_link: 'https://dash.talktokrishna.com/qr/camp-gita-02',
    created_at: '2026-04-10T08:00:00Z',
    scans_count: 640,
    installs_count: 490,
    signups_count: 390,
    revenue: 1600,
  },

  // Vrindavan Heritage campaigns
  {
    campaign_id: 'camp-vrin-01',
    org_id: 'org-vrindavan-heritage',
    campaign_name: 'Goshala Charity Flyer',
    qr_link: 'https://dash.talktokrishna.com/qr/camp-vrin-01',
    created_at: '2026-03-05T10:00:00Z',
    scans_count: 920,
    installs_count: 610,
    signups_count: 480,
    revenue: 6400,
  },

  // Austin Temple campaigns
  {
    campaign_id: 'camp-aus-01',
    org_id: 'org-krishna-austin',
    campaign_name: 'Temple Foyer Board',
    qr_link: 'https://dash.talktokrishna.com/qr/camp-aus-01',
    created_at: '2026-04-20T11:00:00Z',
    scans_count: 420,
    installs_count: 310,
    signups_count: 220,
    revenue: 3150,
  }
];

// Daily conversion metrics for last 30 days (simulation)
export const generateDailyMetrics = (orgId: string): DailyMetric[] => {
  const metrics: DailyMetric[] = [];
  const baseDate = new Date();
  
  // Deterministic coefficients per organization to make the data look realistic
  let scale = 1.0;
  if (orgId === 'org-iskcon-delhi') scale = 2.5;
  if (orgId === 'org-gita-youth') scale = 1.2;
  if (orgId === 'org-vrindavan-heritage') scale = 0.9;
  if (orgId === 'org-krishna-austin') scale = 0.5;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Add some noise/sine wave variations
    const dayFactor = 1 + 0.3 * Math.sin((date.getDate() + i) * 0.5);
    const weekendMultiplier = (date.getDay() === 0 || date.getDay() === 6) ? 1.5 : 0.8;
    
    const scans = Math.round(50 * scale * dayFactor * weekendMultiplier);
    const installs = Math.round(scans * 0.72);
    const signups = Math.round(installs * 0.65);
    const revenue = Math.round(signups * 7.5 * dayFactor);
    
    metrics.push({
      date: dateStr,
      scans,
      installs,
      signups,
      revenue
    });
  }
  
  return metrics;
};

// Generate live activity logs for all orgs
export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'act-1',
    type: 'payment',
    org_name: 'ISKCON Temple Delhi',
    campaign_name: 'Janmashtami Brochure',
    device: 'iOS',
    detail: 'Completed a divine contribution of $25.00',
    timestamp: '2 mins ago',
    matched_via: 'Fingerprint (iOS)'
  },
  {
    id: 'act-2',
    type: 'signup',
    org_name: 'Gita Youth Society',
    campaign_name: 'College Campus Flyer',
    device: 'Android',
    detail: 'Signed up for Hindi language path',
    timestamp: '7 mins ago',
    matched_via: 'Referrer (Android)'
  },
  {
    id: 'act-3',
    type: 'install',
    org_name: 'ISKCON Temple Delhi',
    campaign_name: 'Main Entrance Standee',
    device: 'iOS',
    detail: 'App downloaded & launched',
    timestamp: '12 mins ago',
    matched_via: 'Fingerprint (iOS)'
  },
  {
    id: 'act-4',
    type: 'scan',
    org_name: 'Krishna Temple Austin',
    campaign_name: 'Temple Foyer Board',
    device: 'Android',
    detail: 'QR Code scanned in foyer',
    timestamp: '18 mins ago',
    matched_via: 'Direct Link'
  },
  {
    id: 'act-5',
    type: 'payment',
    org_name: 'Vrindavan Heritage Foundation',
    campaign_name: 'Goshala Charity Flyer',
    device: 'Android',
    detail: 'Completed a divine contribution of $108.00',
    timestamp: '45 mins ago',
    matched_via: 'Referrer (Android)'
  },
  {
    id: 'act-6',
    type: 'signup',
    org_name: 'ISKCON Temple Delhi',
    campaign_name: 'Sunday Feast Handout',
    device: 'Android',
    detail: 'Signed up for English language path',
    timestamp: '1 hour ago',
    matched_via: 'Referrer (Android)'
  },
  {
    id: 'act-7',
    type: 'scan',
    org_name: 'ISKCON Temple Delhi',
    campaign_name: 'Janmashtami Brochure',
    device: 'iOS',
    detail: 'QR Code scanned',
    timestamp: '1.2 hours ago',
    matched_via: 'Direct Link'
  }
];

// Helper to aggregate overview metrics for an Org
export const getOrgSummary = (orgId: string, campaigns: Campaign[]) => {
  const orgCampaigns = campaigns.filter(c => c.org_id === orgId);
  const totalScans = orgCampaigns.reduce((sum, c) => sum + c.scans_count, 0);
  const totalInstalls = orgCampaigns.reduce((sum, c) => sum + c.installs_count, 0);
  const totalSignups = orgCampaigns.reduce((sum, c) => sum + c.signups_count, 0);
  const totalRevenue = orgCampaigns.reduce((sum, c) => sum + c.revenue, 0);

  const funnel: FunnelMetric[] = [
    { stage: 'QR Scans', count: totalScans, percentage: 100, overallPercentage: 100 },
    { stage: 'App Installs', count: totalInstalls, percentage: totalScans ? Math.round((totalInstalls / totalScans) * 100) : 0, overallPercentage: totalScans ? Math.round((totalInstalls / totalScans) * 100) : 0 },
    { stage: 'Signups', count: totalSignups, percentage: totalInstalls ? Math.round((totalSignups / totalInstalls) * 100) : 0, overallPercentage: totalScans ? Math.round((totalSignups / totalScans) * 100) : 0 },
    { stage: 'Paying Donors', count: Math.round(totalSignups * 0.18), percentage: totalSignups ? 18 : 0, overallPercentage: totalScans ? Math.round((Math.round(totalSignups * 0.18) / totalScans) * 100) : 0 }
  ];

  return {
    campaignsCount: orgCampaigns.length,
    totalScans,
    totalInstalls,
    totalSignups,
    totalRevenue,
    funnel
  };
};

export interface SubAdminUser {
  username: string;
  password_plain: string;
  org_id: string;
  name: string;
}

export const mockSubAdmins: SubAdminUser[] = [
  {
    username: 'delhi@talktokrishna.com',
    password_plain: 'Delhi123!',
    org_id: 'org-iskcon-delhi',
    name: 'Delhi Temple Coordinator'
  },
  {
    username: 'gita.youth@talktokrishna.com',
    password_plain: 'GitaYouth123!',
    org_id: 'org-gita-youth',
    name: 'Gita Youth Admin'
  }
];
