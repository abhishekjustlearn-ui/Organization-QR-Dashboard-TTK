import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// GET all organizations
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM organizations ORDER BY created_at DESC');
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching organizations:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST onboard new organization
router.post('/', async (req: Request, res: Response) => {
  try {
    const { org_id, org_name, contact_email, contact_phone } = req.body;
    if (!org_id || !org_name) {
      return res.status(400).json({ error: 'Org ID and Org Name are required.' });
    }

    // Check duplicate
    const checkDup = await query('SELECT org_id FROM organizations WHERE org_id = $1', [org_id]);
    if (checkDup.rows.length > 0) {
      return res.status(400).json({ error: 'An organization with this ID already exists.' });
    }

    await query(
      'INSERT INTO organizations (org_id, org_name, contact_email, contact_phone, status) VALUES ($1, $2, $3, $4, $5)',
      [org_id, org_name, contact_email || null, contact_phone || null, 'active']
    );

    return res.status(201).json({ success: true, message: 'Organization onboarded successfully.' });
  } catch (err) {
    console.error('Error creating organization:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT update organization profile
router.put('/:orgId', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { org_name, contact_email, contact_phone } = req.body;
    if (!org_name) {
      return res.status(400).json({ error: 'Org Name is required.' });
    }

    await query(
      'UPDATE organizations SET org_name = $1, contact_email = $2, contact_phone = $3 WHERE org_id = $4',
      [org_name, contact_email || null, contact_phone || null, orgId]
    );

    return res.status(200).json({ success: true, message: 'Organization updated successfully.' });
  } catch (err) {
    console.error('Error updating organization:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET all sub-admins
router.get('/subadmins', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT username, password_plain, org_id, name, created_at FROM sub_admins ORDER BY created_at DESC');
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching sub-admins:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST create sub-admin
router.post('/subadmins', async (req: Request, res: Response) => {
  try {
    const { username, password_plain, org_id, name } = req.body;
    if (!username || !password_plain || !org_id || !name) {
      return res.status(400).json({ error: 'All fields (username, password_plain, org_id, name) are required.' });
    }

    // Check duplicate
    const checkDup = await query('SELECT username FROM sub_admins WHERE username = $1', [username]);
    if (checkDup.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this username already exists.' });
    }

    await query(
      'INSERT INTO sub_admins (username, password_plain, org_id, name) VALUES ($1, $2, $3, $4)',
      [username, password_plain, org_id, name]
    );

    return res.status(201).json({ success: true, message: 'Sub-admin credentials mapped successfully.' });
  } catch (err) {
    console.error('Error creating sub-admin:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE organization (Cascades to subadmins, campaigns, etc.)
router.delete('/:orgId', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    await query('DELETE FROM organizations WHERE org_id = $1', [orgId]);
    return res.status(200).json({ success: true, message: 'Organization and all associated data deleted.' });
  } catch (err) {
    console.error('Error deleting organization:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT toggle organization status
router.put('/:orgId/status', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    const { status } = req.body; // 'active' or 'suspended'
    if (!status || (status !== 'active' && status !== 'suspended')) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    await query('UPDATE organizations SET status = $1 WHERE org_id = $2', [status, orgId]);
    return res.status(200).json({ success: true, message: `Organization status set to ${status}.` });
  } catch (err) {
    console.error('Error toggling organization status:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
