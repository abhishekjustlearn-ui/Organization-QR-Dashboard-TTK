import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

router.get('/:orgId', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;

    // 1. Fetch Total Overview aggregates
    const scansRes = await query('SELECT COUNT(*)::int as count FROM click_events WHERE org_id = $1', [orgId]);
    const installsRes = await query('SELECT COUNT(*)::int as count FROM attributions WHERE org_id = $1', [orgId]);
    const signupsRes = await query('SELECT COUNT(*)::int as count FROM attributions WHERE org_id = $1', [orgId]);
    const revenueRes = await query('SELECT COALESCE(SUM(amount), 0)::int as count FROM payment_events WHERE org_id = $1', [orgId]);
    const payingDonorsRes = await query('SELECT COUNT(DISTINCT user_id)::int as count FROM payment_events WHERE org_id = $1', [orgId]);

    const totalScans = scansRes.rows[0]?.count || 0;
    const totalInstalls = installsRes.rows[0]?.count || 0;
    const totalSignups = signupsRes.rows[0]?.count || 0;
    const totalRevenue = revenueRes.rows[0]?.count || 0;
    const payingDonors = payingDonorsRes.rows[0]?.count || 0;

    // 2. Build Funnel Metric array
    const funnel = [
      { 
        stage: 'QR Scans', 
        count: totalScans, 
        percentage: 100, 
        overallPercentage: 100 
      },
      { 
        stage: 'App Installs', 
        count: totalInstalls, 
        percentage: totalScans ? Math.round((totalInstalls / totalScans) * 100) : 0, 
        overallPercentage: totalScans ? Math.round((totalInstalls / totalScans) * 100) : 0 
      },
      { 
        stage: 'Signups', 
        count: totalSignups, 
        percentage: totalInstalls ? Math.round((totalSignups / totalInstalls) * 100) : 0, 
        overallPercentage: totalScans ? Math.round((totalSignups / totalScans) * 100) : 0 
      },
      { 
        stage: 'Paying Donors', 
        count: payingDonors, 
        percentage: totalSignups ? Math.round((payingDonors / totalSignups) * 100) : 0, 
        overallPercentage: totalScans ? Math.round((payingDonors / totalScans) * 100) : 0 
      }
    ];

    // 3. Generate Timeline series (Last 30 Days) via PostgreSQL GENERATE_SERIES
    const timelineQuery = `
      SELECT 
        TO_CHAR(d, 'Mon DD') as date,
        COALESCE((SELECT COUNT(*)::int FROM click_events cl WHERE cl.org_id = $1 AND cl.timestamp::date = d::date), 0) as scans,
        COALESCE((SELECT COUNT(*)::int FROM attributions a WHERE a.org_id = $1 AND a.created_at::date = d::date), 0) as installs,
        COALESCE((SELECT COUNT(*)::int FROM attributions a WHERE a.org_id = $1 AND a.created_at::date = d::date), 0) as signups,
        COALESCE((SELECT SUM(amount)::int FROM payment_events p WHERE p.org_id = $1 AND p.created_at::date = d::date), 0) as revenue
      FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day'::interval) d
      ORDER BY d ASC
    `;
    const timelineRes = await query(timelineQuery, [orgId]);

    // 4. Fetch Live Activity Log from click, attribution, and payment records
    // We union them dynamically, sort by timestamp desc, and fetch top 20 events
    const logQuery = `
      (
        SELECT 
          'scan' as type,
          c.campaign_name,
          COALESCE(cl.device_type, 'Desktop') as device,
          'QR scanned at IP ' || cl.ip_address as detail,
          cl.timestamp,
          'Direct Link' as matched_via
        FROM click_events cl
        JOIN campaigns c ON cl.campaign_id = c.campaign_id
        WHERE cl.org_id = $1
      )
      UNION ALL
      (
        SELECT 
          'signup' as type,
          COALESCE(c.campaign_name, 'Direct') as campaign_name,
          COALESCE(a.device_type, 'Mobile') as device,
          'User signed up: ' || a.user_id as detail,
          a.created_at as timestamp,
          a.matched_via
        FROM attributions a
        LEFT JOIN campaigns c ON a.campaign_id = c.campaign_id
        WHERE a.org_id = $1
      )
      UNION ALL
      (
        SELECT 
          'payment' as type,
          'Member Portal' as campaign_name,
          'Mobile' as device,
          'Completed contribution of $' || p.amount::text || ' ' || p.currency as detail,
          p.created_at as timestamp,
          'Payment Webhook' as matched_via
        FROM payment_events p
        WHERE p.org_id = $1
      )
      ORDER BY timestamp DESC
      LIMIT 20
    `;
    const logRes = await query(logQuery, [orgId]);

    // Helper to format timestamps to readable strings (e.g. "5 mins ago", "1 hour ago")
    const formatTimeAgo = (timestampDate: Date) => {
      const seconds = Math.floor((new Date().getTime() - timestampDate.getTime()) / 1000);
      let interval = Math.floor(seconds / 31536000);
      
      if (interval >= 1) return interval === 1 ? '1 year ago' : `${interval} years ago`;
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return interval === 1 ? '1 month ago' : `${interval} months ago`;
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return interval === 1 ? '1 day ago' : `${interval} days ago`;
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return interval === 1 ? '1 min ago' : `${interval} mins ago`;
      return 'Just now';
    };

    const formattedLogs = logRes.rows.map((row, idx) => ({
      id: `act-${idx}`,
      type: row.type,
      campaign_name: row.campaign_name,
      device: row.device,
      detail: row.detail,
      timestamp: formatTimeAgo(new Date(row.timestamp)),
      matched_via: row.matched_via
    }));

    return res.status(200).json({
      summary: {
        totalScans,
        totalInstalls,
        totalSignups,
        totalRevenue,
        funnel
      },
      timeline: timelineRes.rows,
      logs: formattedLogs
    });
  } catch (err) {
    console.error('Error fetching analytics details:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
