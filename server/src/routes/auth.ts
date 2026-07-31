import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();

    // 1. Check Super Admin Credentials
    if (cleanUsername === 'abhishek@justlearnindia.in' && password === 'AdminPassword123!') {
      return res.status(200).json({
        role: 'super-admin',
        username: cleanUsername,
        orgId: '',
        displayName: 'Super Admin',
      });
    }

    // 2. Query Sub Admins Table in Neon
    const result = await query(
      'SELECT username, password_plain, org_id, name FROM sub_admins WHERE LOWER(username) = $1',
      [cleanUsername]
    );

    if (result.rows.length > 0) {
      const admin = result.rows[0];
      if (admin.password_plain === password) {
        return res.status(200).json({
          role: 'sub-admin',
          username: admin.username,
          orgId: admin.org_id,
          displayName: admin.name,
        });
      }
    }

    // 3. Fail Response
    return res.status(401).json({ error: 'Invalid username or password.' });
  } catch (err) {
    console.error('Error in login handler:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
