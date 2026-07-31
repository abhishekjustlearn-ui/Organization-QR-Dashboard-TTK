import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

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

// GET campaigns for specific organization (aggregated with metrics)
router.get('/:orgId', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    
    // Select campaigns and join with counts of scans (click_events), installs/signups (attributions), and payments (payment_events)
    // To make this robust, we can run queries or use LEFT JOIN subqueries.
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
        (SELECT COUNT(*)::int FROM attributions a WHERE a.campaign_id = c.campaign_id) as signups_count, -- simplify signup/install count for tracking
        COALESCE((SELECT SUM(amount)::int FROM payment_events p WHERE p.org_id = c.org_id), 0) as revenue
      FROM campaigns c
      WHERE c.org_id = $1
      ORDER BY c.created_at DESC
    `;

    const result = await query(queryStr, [orgId]);
    return res.status(200).json(result.rows);
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
