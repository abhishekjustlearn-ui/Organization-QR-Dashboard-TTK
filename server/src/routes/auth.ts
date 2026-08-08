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

    const defaultFullPermissions = {
      analytics: {
        metrics: { scans: true, installs: true, signups: true, paying: true },
        graph: { scans: true, installs: true, signups: true, paying: true },
        funnel: { scans: true, installs: true, signups: true, paying: true },
        activityLog: true,
      },
      campaigns: {
        create: true,
        design: true,
        pause: true,
        delete: true,
        metrics: { scans: true, installs: true, signups: true, paying: true },
      },
      settings: {
        editProfile: true,
      },
    };

    // 1. Check Super Admin Credentials
    if (cleanUsername === 'abhishek@justlearnindia.in' && password === 'AdminPassword123!') {
      return res.status(200).json({
        role: 'super-admin',
        username: cleanUsername,
        orgId: '',
        displayName: 'Super Admin',
        permissions: defaultFullPermissions,
      });
    }

    // 2. Query Sub Admins Table in Neon
    const result = await query(
      'SELECT username, password_plain, org_id, name, permissions, COALESCE(status, \'active\') as status FROM sub_admins WHERE LOWER(username) = $1',
      [cleanUsername]
    );

    if (result.rows.length > 0) {
      const admin = result.rows[0];
      if (admin.password_plain === password) {
        if (admin.status === 'suspended') {
          return res.status(403).json({ error: 'Your account is currently suspended by Super-Admin. Please contact support.' });
        }
        // Merge or fallback to default if permissions is null
        let userPermissions = admin.permissions;
        if (!userPermissions || typeof userPermissions !== 'object') {
          userPermissions = defaultFullPermissions;
        } else {
          // Deep merge to ensure all keys exist
          userPermissions = {
            analytics: {
              metrics: { ...defaultFullPermissions.analytics.metrics, ...userPermissions.analytics?.metrics },
              graph: { ...defaultFullPermissions.analytics.graph, ...userPermissions.analytics?.graph },
              funnel: { ...defaultFullPermissions.analytics.funnel, ...userPermissions.analytics?.funnel },
              activityLog: userPermissions.analytics?.activityLog !== undefined ? userPermissions.analytics.activityLog : true,
            },
            campaigns: {
              ...defaultFullPermissions.campaigns,
              ...userPermissions.campaigns,
              metrics: {
                ...defaultFullPermissions.campaigns.metrics,
                ...userPermissions.campaigns?.metrics,
              },
            },
            settings: { ...defaultFullPermissions.settings, ...userPermissions.settings },
          };
        }

        return res.status(200).json({
          role: 'sub-admin',
          username: admin.username,
          orgId: admin.org_id,
          displayName: admin.name,
          permissions: userPermissions,
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
