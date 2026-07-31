import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  QrCode, 
  Download, 
  UserCheck, 
  DollarSign, 
  ArrowRight,
  Smartphone,
  ShieldCheck,
  Calendar,
  Loader2
} from 'lucide-react';
import { Organization, Campaign } from '../mockData';
import { API_BASE } from '../config';

interface AnalyticsTabProps {
  organization: Organization;
  campaigns: Campaign[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ organization }) => {
  const [timelineMetric, setTimelineMetric] = useState<'scans' | 'installs' | 'signups' | 'revenue'>('scans');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<{
    summary: {
      totalScans: number;
      totalInstalls: number;
      totalSignups: number;
      totalRevenue: number;
      funnel: any[];
    };
    timeline: any[];
    logs: any[];
  } | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/analytics/${organization.org_id}`);
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error('Error fetching analytics from Neon:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [organization.org_id]);

  const summary = analyticsData?.summary || {
    totalScans: 0,
    totalInstalls: 0,
    totalSignups: 0,
    totalRevenue: 0,
    funnel: [
      { stage: 'QR Scans', count: 0, percentage: 100, overallPercentage: 100 },
      { stage: 'App Installs', count: 0, percentage: 0, overallPercentage: 0 },
      { stage: 'Signups', count: 0, percentage: 0, overallPercentage: 0 },
      { stage: 'Paying Donors', count: 0, percentage: 0, overallPercentage: 0 }
    ]
  };

  const dailyData = analyticsData?.timeline || [];
  const activityLogs = analyticsData?.logs || [];

  // SVG Line Chart calculations
  const chartWidth = 700;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 50 };

  const chartMetrics = useMemo(() => {
    if (dailyData.length === 0) {
      return {
        linePath: '',
        areaPath: '',
        maxVal: 10,
        minVal: 0,
        getX: () => 0,
        getY: () => 0
      };
    }
    const values = dailyData.map(d => Number(d[timelineMetric]) || 0);
    const maxVal = Math.max(...values, 10);
    const minVal = Math.min(...values, 0);
    
    // Scale helper
    const getX = (index: number) => {
      const step = (chartWidth - padding.left - padding.right) / (dailyData.length - 1);
      return padding.left + index * step;
    };
    
    const getY = (val: number) => {
      const heightRange = chartHeight - padding.top - padding.bottom;
      const valRange = maxVal - minVal;
      // invert Y coordinate for SVG
      return padding.top + heightRange - ((val - minVal) / valRange) * heightRange;
    };

    // Build path strings
    let linePath = '';
    let areaPath = '';
    
    dailyData.forEach((d, i) => {
      const x = getX(i);
      const y = getY(Number(d[timelineMetric]) || 0);
      
      if (i === 0) {
        linePath = `M ${x} ${y}`;
        areaPath = `M ${x} ${chartHeight - padding.bottom} L ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }
      
      if (i === dailyData.length - 1) {
        areaPath += ` L ${x} ${chartHeight - padding.bottom} Z`;
      }
    });

    return {
      linePath,
      areaPath,
      maxVal,
      minVal,
      getX,
      getY
    };
  }, [dailyData, timelineMetric]);

  // Formatter for values
  const formatValue = (val: number) => {
    if (timelineMetric === 'revenue') {
      return `$${val.toLocaleString()}`;
    }
    return val.toLocaleString();
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={36} style={styles.spinner} />
        <h3 style={{ marginTop: '16px', fontFamily: 'var(--font-heading)' }}>Fetching Neon DB metrics...</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Querying aws-neon-postgres-pooler instance...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Overview Analytics</h2>
          <p style={styles.subtitle}>Real-time campaign performance and acquisition logs for {organization.org_name}.</p>
        </div>
        <div style={styles.dateBadge}>
          <Calendar size={14} />
          <span>Last 30 Days</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div style={styles.kpiHeader}>
            <span className="kpi-title">Total Scans</span>
            <div style={{ ...styles.kpiIconWrapper, background: 'rgba(0, 242, 254, 0.1)' }}>
              <QrCode size={18} style={{ color: 'var(--color-teal-start)' }} />
            </div>
          </div>
          <span className="kpi-value">{summary.totalScans.toLocaleString()}</span>
          <div className="kpi-change positive">
            <TrendingUp size={14} />
            <span>+14.2% from last month</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div style={styles.kpiHeader}>
            <span className="kpi-title">App Installs</span>
            <div style={{ ...styles.kpiIconWrapper, background: 'rgba(139, 92, 246, 0.1)' }}>
              <Download size={18} style={{ color: 'var(--accent-purple)' }} />
            </div>
          </div>
          <span className="kpi-value">{summary.totalInstalls.toLocaleString()}</span>
          <div className="kpi-change positive">
            <TrendingUp size={14} />
            <span>+11.8% from last month</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div style={styles.kpiHeader}>
            <span className="kpi-title">Signups</span>
            <div style={{ ...styles.kpiIconWrapper, background: 'rgba(245, 158, 11, 0.1)' }}>
              <UserCheck size={18} style={{ color: 'var(--accent-gold)' }} />
            </div>
          </div>
          <span className="kpi-value">{summary.totalSignups.toLocaleString()}</span>
          <div className="kpi-change positive">
            <TrendingUp size={14} />
            <span>+18.5% from last month</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div style={styles.kpiHeader}>
            <span className="kpi-title">Revenue (Donations)</span>
            <div style={{ ...styles.kpiIconWrapper, background: 'rgba(16, 185, 129, 0.1)' }}>
              <DollarSign size={18} style={{ color: '#10b981' }} />
            </div>
          </div>
          <span className="kpi-value">${summary.totalRevenue.toLocaleString()}</span>
          <div className="kpi-change positive">
            <TrendingUp size={14} />
            <span>+24.1% from last month</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Section: Chart and Funnel */}
      <div style={styles.chartAndFunnelGrid}>
        
        {/* Trend Chart */}
        <div className="glass-card" style={styles.chartCard}>
          <div style={styles.chartTitleContainer}>
            <h3 style={styles.cardTitle}>Acquisition Trends</h3>
            <div style={styles.chartToggleGroup}>
              {(['scans', 'installs', 'signups', 'revenue'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setTimelineMetric(m)}
                  style={{
                    ...styles.toggleBtn,
                    ...(timelineMetric === m ? styles.toggleBtnActive : {})
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Custom Line Chart */}
          <div style={styles.chartWrapper}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={styles.svgChart}>
              <defs>
                <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={timelineMetric === 'revenue' ? '#10b981' : 'var(--color-teal-start)'} stopOpacity="0.25" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = padding.top + (chartHeight - padding.top - padding.bottom) * ratio;
                const value = chartMetrics.maxVal - (chartMetrics.maxVal - chartMetrics.minVal) * ratio;
                return (
                  <g key={index}>
                    <line 
                      x1={padding.left} 
                      y1={y} 
                      x2={chartWidth - padding.right} 
                      y2={y} 
                      stroke="rgba(255, 255, 255, 0.05)" 
                      strokeDasharray="4"
                    />
                    <text 
                      x={padding.left - 10} 
                      y={y + 4} 
                      fill="var(--text-muted)" 
                      fontSize="10" 
                      textAnchor="end"
                    >
                      {formatValue(Math.round(value))}
                    </text>
                  </g>
                );
              })}

              {/* X Axis Labels (sample days) */}
              {dailyData.filter((_, idx) => idx % 6 === 0).map((d, index) => {
                const idx = index * 6;
                const x = chartMetrics.getX(idx);
                return (
                  <text
                    key={idx}
                    x={x}
                    y={chartHeight - 10}
                    fill="var(--text-muted)"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {d.date}
                  </text>
                );
              })}

              {/* Gradient Area Fill */}
              <path d={chartMetrics.areaPath} fill="url(#chartAreaGradient)" />

              {/* Line path */}
              <path 
                d={chartMetrics.linePath} 
                fill="none" 
                stroke={timelineMetric === 'revenue' ? '#10b981' : 'var(--color-teal-start)'} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />

              {/* Dots on line */}
              {dailyData.filter((_, idx) => idx % 2 === 0).map((d, i) => {
                const idx = i * 2;
                const x = chartMetrics.getX(idx);
                const y = chartMetrics.getY(d[timelineMetric]);
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#080916"
                    stroke={timelineMetric === 'revenue' ? '#10b981' : 'var(--color-teal-start)'}
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="glass-card" style={styles.funnelCard}>
          <h3 style={styles.cardTitle}>Conversion Funnel</h3>
          <p style={styles.cardDesc}>Analysis of the user acquisition journey from scans to payments.</p>
          
          <div style={styles.funnelContainer}>
            {summary.funnel.map((stage, idx) => {
              const baseWidth = 100 - idx * 12; // tapered funnel shapes
              return (
                <div key={idx} style={styles.funnelRow}>
                  <div style={styles.funnelBarContainer}>
                    <div 
                      style={{ 
                        ...styles.funnelBar, 
                        width: `${baseWidth}%`,
                        background: idx === 0 
                          ? 'linear-gradient(90deg, var(--color-teal-start), var(--color-teal-end))'
                          : idx === 1
                          ? 'linear-gradient(90deg, var(--accent-purple), #9061f9)'
                          : idx === 2
                          ? 'linear-gradient(90deg, var(--accent-gold), #ffd700)'
                          : 'linear-gradient(90deg, #10b981, #34d399)'
                      }}
                    >
                      <span style={styles.funnelStageName}>{stage.stage}</span>
                      <span style={styles.funnelCount}>{stage.count.toLocaleString()}</span>
                    </div>
                  </div>
                  {idx < 3 && (
                    <div style={styles.conversionArrow}>
                      <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                      <span style={styles.arrowText}>
                        {summary.funnel[idx + 1].percentage}% conv.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Log / Acquisition Events */}
      <div className="glass-card" style={styles.logCard}>
        <div style={styles.logHeader}>
          <div>
            <h3 style={styles.cardTitle}>Live Attribution Log</h3>
            <p style={styles.cardDesc}>Recent app downloads and signup activities routed through your QR campaigns.</p>
          </div>
          <div style={styles.securityBadge}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            <span>Encrypted Fingerprints Matched</span>
          </div>
        </div>

        <div style={styles.logTableWrapper}>
          <table style={styles.logTable}>
            <thead>
              <tr style={styles.logTableHeaderRow}>
                <th style={styles.logTableHeaderCell}>Activity</th>
                <th style={styles.logTableHeaderCell}>Campaign</th>
                <th style={styles.logTableHeaderCell}>Device</th>
                <th style={styles.logTableHeaderCell}>Attribution Method</th>
                <th style={{ ...styles.logTableHeaderCell, textAlign: 'right' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((log) => (
                  <tr key={log.id} style={styles.logRow}>
                    <td style={styles.logCell}>
                      <div style={styles.activityLabelWrapper}>
                        <span 
                          style={{
                            ...styles.activityBadge,
                            backgroundColor: log.type === 'payment'
                              ? 'rgba(16, 185, 129, 0.12)'
                              : log.type === 'signup'
                              ? 'rgba(245, 158, 11, 0.12)'
                              : log.type === 'install'
                              ? 'rgba(139, 92, 246, 0.12)'
                              : 'rgba(0, 242, 254, 0.12)',
                            color: log.type === 'payment'
                              ? '#10b981'
                              : log.type === 'signup'
                              ? 'var(--accent-gold)'
                              : log.type === 'install'
                              ? 'var(--accent-purple)'
                              : 'var(--color-teal-start)'
                          }}
                        >
                          {log.type.toUpperCase()}
                        </span>
                        <span style={styles.activityDetail}>{log.detail}</span>
                      </div>
                    </td>
                    <td style={styles.logCell}>{log.campaign_name}</td>
                    <td style={styles.logCell}>
                      <div style={styles.deviceWrapper}>
                        <Smartphone size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{log.device}</span>
                      </div>
                    </td>
                    <td style={styles.logCell}>
                      <span style={styles.matchMethod}>{log.matched_via}</span>
                    </td>
                    <td style={{ ...styles.logCell, textAlign: 'right', color: 'var(--text-muted)' }}>
                      {log.timestamp}
                    </td>
                  </tr>
                ))}
              {activityLogs.length === 0 && (
                <tr>
                  <td colSpan={5} style={styles.noDataCell}>
                    No recent events for this organization. Generate a QR code to start tracking!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
  dateBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartAndFunnelGrid: {
    display: 'grid',
    gridTemplateColumns: '7fr 5fr',
    gap: '24px',
  },
  chartCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardTitle: {
    fontSize: '1.15rem',
    color: '#ffffff',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
  },
  chartTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartToggleGroup: {
    display: 'flex',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '4px',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toggleBtnActive: {
    color: '#080916',
    background: '#ffd700',
  },
  chartWrapper: {
    position: 'relative',
    width: '100%',
    height: '240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgChart: {
    width: '100%',
    height: '100%',
    overflow: 'visible',
  },
  funnelCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  funnelContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px',
  },
  funnelRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  funnelBarContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  funnelBar: {
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#080916',
    fontWeight: '700',
    fontSize: '0.85rem',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
  funnelStageName: {
    textShadow: '0 1px 2px rgba(255,255,255,0.2)',
  },
  funnelCount: {
    fontSize: '0.95rem',
  },
  conversionArrow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '12px',
  },
  arrowText: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  logCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  securityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '6px',
    padding: '6px 12px',
    fontWeight: '600',
  },
  logTableWrapper: {
    overflowX: 'auto',
  },
  logTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.9rem',
  },
  logTableHeaderRow: {
    borderBottom: '1px solid var(--border-color)',
  },
  logTableHeaderCell: {
    padding: '12px 16px',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  logRow: {
    borderBottom: '1px solid var(--border-color)',
    transition: 'background-color 0.2s ease',
  },
  logCell: {
    padding: '16px',
    color: 'var(--text-primary)',
    verticalAlign: 'middle',
  },
  activityLabelWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  activityBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.05em',
  },
  activityDetail: {
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  deviceWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  matchMethod: {
    fontSize: '0.8rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    padding: '4px 8px',
    color: 'var(--text-secondary)',
  },
  noDataCell: {
    padding: '32px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '70vh',
    color: '#ffffff',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    color: '#ffd700',
  }
};
