import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// App Backend base URL — set APP_BACKEND_URL in .env / Vercel environment vars
// ─────────────────────────────────────────────────────────────────────────────
const APP_BACKEND_URL = process.env.APP_BACKEND_URL || 'https://talk-to-krishna-backend.onrender.com';

// Auth key — set PARTNER_ATTRIBUTION_ADMIN_KEY in Vercel env vars
const PARTNER_ATTRIBUTION_ADMIN_KEY = process.env.PARTNER_ATTRIBUTION_ADMIN_KEY || '';

// Helper: fetch JSON with timeout using native Node 18 fetch + AbortController
// Returns null on any error so the dashboard never crashes
const fetchJson = async (url: string, headers: Record<string, string> = {}): Promise<any | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000); // 7s timeout
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
};

router.get('/:orgId', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;

    // ── 1. DASHBOARD DB — QR Scans & Payments (always from our own DB) ──────
    const scansRes = await query(
      'SELECT COUNT(*)::int as count FROM click_events WHERE org_id = $1',
      [orgId]
    );
    const revenueRes = await query(
      'SELECT COALESCE(SUM(amount), 0)::float as count FROM payment_events WHERE org_id = $1',
      [orgId]
    );
    const payingDonorsRes = await query(
      'SELECT COUNT(DISTINCT user_id)::int as count FROM payment_events WHERE org_id = $1',
      [orgId]
    );
    const currencyRes = await query(
      'SELECT currency FROM payment_events WHERE org_id = $1 LIMIT 1',
      [orgId]
    );

    const totalScans   = scansRes.rows[0]?.count || 0;
    const totalRevenue = parseFloat(revenueRes.rows[0]?.count) || 0;
    const payingDonors = payingDonorsRes.rows[0]?.count || 0;
    
    // Determine currency symbol dynamically (defaults to INR ₹ since Talk to Krishna is primarily India-focused)
    const currencyCode = currencyRes.rows[0]?.currency || 'INR';
    let currencySymbol = '₹';
    if (currencyCode === 'USD') currencySymbol = '$';
    else if (currencyCode === 'EUR') currencySymbol = '€';
    else if (currencyCode === 'GBP') currencySymbol = '£';

    // ── 2. APP BACKEND — Real Installs & Signups ────────────────────────────
    const appStats = await fetchJson(
      `${APP_BACKEND_URL}/api/stats/attributions?org_id=${encodeURIComponent(orgId)}`,
      { 'x-partner-attribution-admin-key': PARTNER_ATTRIBUTION_ADMIN_KEY }
    );

    let totalInstalls = 0;
    let totalSignups  = 0;
    const campaignBreakdown: any[] = [];

    if (appStats && Array.isArray(appStats.by_organization)) {
      const orgData = appStats.by_organization.find((o: any) => o.org_id === orgId);
      if (orgData) {
        totalSignups  = orgData.org_signups || 0;
        // Until app backend separately tracks install events, installs = signups
        totalInstalls = orgData.org_signups || 0;
        if (Array.isArray(orgData.campaigns)) {
          campaignBreakdown.push(...orgData.campaigns);
        }
      }
    }

    // ── 3. Conversion Funnel ────────────────────────────────────────────────
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

    // ── 4. 30-Day Timeline (scans & revenue from Dashboard DB) ──────────────
    const timelineQuery = `
      SELECT
        TO_CHAR(d, 'Mon DD') as date,
        COALESCE((
          SELECT COUNT(*)::int FROM click_events cl
          WHERE cl.org_id = $1 AND cl.timestamp::date = d::date
        ), 0) as scans,
        COALESCE((
          SELECT COALESCE(SUM(amount), 0)::int FROM payment_events p
          WHERE p.org_id = $1 AND p.created_at::date = d::date
        ), 0) as revenue
      FROM generate_series(
        CURRENT_DATE - INTERVAL '29 days',
        CURRENT_DATE,
        '1 day'::interval
      ) d
      ORDER BY d ASC
    `;
    const timelineRes = await query(timelineQuery, [orgId]);

    // installs/signups at day-level: placeholder 0s until app backend exposes day-level endpoint
    const timelineRows = timelineRes.rows.map((row: any) => ({
      date: row.date,
      scans: row.scans,
      installs: 0,
      signups: 0,
      revenue: row.revenue
    }));

    // ── 5. Live Activity Log ────────────────────────────────────────────────
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
          'Completed contribution of ' || p.amount::text || ' ' || p.currency as detail,
          p.created_at as timestamp,
          'Payment Webhook' as matched_via
        FROM payment_events p
        WHERE p.org_id = $1
      )
      ORDER BY timestamp DESC
      LIMIT 20
    `;
    const logRes = await query(logQuery, [orgId]);

    const formatTimeAgo = (timestampDate: Date): string => {
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

    const formattedLogs = logRes.rows.map((row: any, idx: number) => ({
      id: `act-${idx}`,
      type: row.type,
      campaign_name: row.campaign_name,
      device: row.device,
      detail: row.detail,
      timestamp: formatTimeAgo(new Date(row.timestamp)),
      matched_via: row.matched_via
    }));

    // ── 6. Final Response ───────────────────────────────────────────────────
    return res.status(200).json({
      summary: {
        totalScans,
        totalInstalls,
        totalSignups,
        totalRevenue,
        payingDonors,
        funnel,
        appBackendConnected: appStats !== null,   // lets frontend show a warning if disconnected
        currencySymbol
      },
      timeline: timelineRows,
      logs: formattedLogs,
      campaignBreakdown   // per-campaign signup data from App Backend
    });

  } catch (err: any) {
    console.error('Error fetching analytics details:', err);
    return res.status(500).json({ error: 'Internal server error.', detail: err?.message || String(err) });
  }
});

export default router;
