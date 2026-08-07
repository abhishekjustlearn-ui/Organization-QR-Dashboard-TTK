import { Router, Request, Response } from 'express';
import { query } from '../db';
import { Pool } from 'pg';

const router = Router();

const APP_DB_URL = process.env.APP_DATABASE_URL || 'postgresql://neondb_owner:npg_xQXA5TDcwI3W@ep-falling-glitter-ah5yt8sv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const appPool = new Pool({ connectionString: APP_DB_URL, max: 3 });

const appQuery = async (sql: string, params: any[] = []): Promise<any[]> => {
  try {
    const res = await appPool.query(sql, params);
    return res.rows;
  } catch (err) {
    console.error('[App DB Campaigns] query error:', err);
    return [];
  }
};

// GET all campaigns
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM campaigns ORDER BY created_at DESC');
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

const APP_BACKEND_URL = process.env.APP_BACKEND_URL || 'https://talk-to-krishna-backend.onrender.com';
const PARTNER_ATTRIBUTION_ADMIN_KEY = process.env.PARTNER_ATTRIBUTION_ADMIN_KEY || '';

// Helper: fetch JSON with timeout using native Node 18 fetch + AbortController
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

// GET campaigns for specific organization (aggregated with metrics)
router.get('/:orgId', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    
    // Select campaigns and join with scans (click_events) and campaign-specific payments (joined via attributions)
    // Converts USD amounts to INR at 83.0 rate
    const queryStr = `
      SELECT 
        c.campaign_id,
        c.org_id,
        c.campaign_name,
        c.qr_link,
        c.status,
        c.created_at,
        (SELECT COUNT(*)::int FROM click_events cl WHERE cl.campaign_id = c.campaign_id) as scans_count,
        (SELECT COUNT(*)::int FROM attributions a WHERE a.campaign_id = c.campaign_id) as installs_count,
        (SELECT COUNT(*)::int FROM attributions a WHERE a.campaign_id = c.campaign_id) as signups_count,
        COALESCE(
          (
            SELECT SUM(
              CASE 
                WHEN p.currency = 'USD' THEN p.amount * 83.0
                ELSE p.amount
              END
            )::int 
            FROM payment_events p
            JOIN attributions a ON p.user_id = a.user_id
            WHERE a.campaign_id = c.campaign_id
          ), 0
        ) as revenue
      FROM campaigns c
      WHERE c.org_id = $1
      ORDER BY c.created_at DESC
    `;

    const [dbResult, appStats, payingCampaignRows] = await Promise.all([
      query(queryStr, [orgId]),
      fetchJson(
        `${APP_BACKEND_URL}/api/stats/attributions?org_id=${encodeURIComponent(orgId)}`,
        { 'x-partner-attribution-admin-key': PARTNER_ATTRIBUTION_ADMIN_KEY }
      ),
      appQuery(`
        WITH attributed_payers AS (
          SELECT DISTINCT u.id AS global_user_id, u.campaign_id
          FROM global_users u
          INNER JOIN payment_receipts r ON r.user_id = u.id
          WHERE u.org_id = $1 AND u.deleted_at IS NULL

          UNION

          SELECT DISTINCT u.id AS global_user_id, u.campaign_id
          FROM global_users u
          INNER JOIN dash_payments d
            ON d.status = 'paid'
           AND (
             d.global_user_id = u.id
             OR (d.global_user_id IS NULL AND d.email IS NOT NULL
                 AND lower(d.email::text) = lower(u.email::text))
           )
          WHERE u.org_id = $1 AND u.deleted_at IS NULL
        )
        SELECT campaign_id, COUNT(*)::int AS paying_users
        FROM attributed_payers
        GROUP BY campaign_id
      `, [orgId])
    ]);

    // Find campaign stats from App Backend
    let appCampaigns: any[] = [];
    if (appStats && Array.isArray(appStats.by_organization)) {
      const orgData = appStats.by_organization.find((o: any) => o.org_id === orgId);
      if (orgData && Array.isArray(orgData.campaigns)) {
        appCampaigns = orgData.campaigns;
      }
    }

    const payingMap: Record<string, number> = {};
    payingCampaignRows.forEach((r: any) => {
      if (r.campaign_id) payingMap[r.campaign_id] = r.paying_users || 0;
    });

    // Merge App Backend signup stats with local database campaigns
    const campaignsWithStats = dbResult.rows.map((row: any) => {
      const appCamp = appCampaigns.find((ac: any) => ac.campaign_id === row.campaign_id);
      const appSignups = appCamp ? appCamp.signups : 0;

      // Real signups = local DB attributions + App Backend signups
      const totalSignups = (row.signups_count || 0) + appSignups;
      const totalInstalls = (row.installs_count || 0) + appSignups; // simplify installs = signups for now
      const payingUsers = payingMap[row.campaign_id] || 0;

      return {
        ...row,
        installs_count: totalInstalls,
        signups_count: totalSignups,
        paying_users: payingUsers
      };
    });

    return res.status(200).json(campaignsWithStats);
  } catch (err) {
    console.error('Error fetching campaigns for org:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST create a campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const { campaign_id, org_id, campaign_name, qr_link } = req.body;
    if (!campaign_id || !org_id || !campaign_name || !qr_link) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const checkDup = await query('SELECT campaign_id FROM campaigns WHERE campaign_id = $1', [campaign_id]);
    if (checkDup.rows.length > 0) {
      return res.status(400).json({ error: 'A campaign with this ID already exists.' });
    }

    await query(
      'INSERT INTO campaigns (campaign_id, org_id, campaign_name, qr_link) VALUES ($1, $2, $3, $4)',
      [campaign_id, org_id, campaign_name, qr_link]
    );

    return res.status(201).json({ success: true, message: 'Campaign created successfully.' });
  } catch (err) {
    console.error('Error creating campaign:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE campaign
router.delete('/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    await query('DELETE FROM campaigns WHERE campaign_id = $1', [campaignId]);
    return res.status(200).json({ success: true, message: 'Campaign deleted successfully.' });
  } catch (err) {
    console.error('Error deleting campaign:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT toggle campaign status
router.put('/:campaignId/status', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { status } = req.body; // 'active' or 'inactive'
    if (!status || (status !== 'active' && status !== 'inactive')) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    await query('UPDATE campaigns SET status = $1 WHERE campaign_id = $2', [status, campaignId]);
    return res.status(200).json({ success: true, message: `Campaign status updated to ${status}.` });
  } catch (err) {
    console.error('Error updating campaign status:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
