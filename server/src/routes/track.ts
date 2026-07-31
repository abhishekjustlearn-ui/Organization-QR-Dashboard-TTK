import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// 1. QR Redirect Endpoint (GET /api/track/qr/:campaignId)
router.get('/qr/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;

    // Fetch campaign details to get org_id
    const campaignRes = await query('SELECT * FROM campaigns WHERE campaign_id = $1', [campaignId]);
    if (campaignRes.rows.length === 0) {
      return res.status(404).send('Campaign not found.');
    }
    const campaign = campaignRes.rows[0];
    const orgId = campaign.org_id;

    // Extract headers for logging click event
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    
    // Parse approximate device
    let deviceType = 'Desktop';
    if (/android/i.test(userAgent)) {
      deviceType = 'Android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      deviceType = 'iOS';
    }

    // Log the click event in PostgreSQL click_events table
    await query(
      'INSERT INTO click_events (org_id, campaign_id, device_type, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [orgId, campaignId, deviceType, ipAddress, userAgent]
    );

    // Route based on OS
    if (deviceType === 'Android') {
      const playStoreUrl = `https://play.google.com/store/apps/details?id=com.talktokrishna&referrer=org_id%3D${orgId}`;
      return res.redirect(playStoreUrl);
    } else if (deviceType === 'iOS') {
      const appStoreUrl = `https://apps.apple.com/app/talk-to-krishna-id12345`; // Mock App Store Link
      return res.redirect(appStoreUrl);
    } else {
      // For desktop, show a premium landing page or redirect to web platform
      return res.send(`
        <html>
          <head>
            <title>Talk to Krishna</title>
            <style>
              body { background-color: #080916; color: white; font-family: sans-serif; text-align: center; padding: 50px; }
              .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; display: inline-block; max-width: 400px; }
              h1 { color: #ffd700; }
              p { color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Talk to Krishna</h1>
              <p>Scan this QR code from your mobile device to open the application.</p>
              <p>Onboarded via partner: <strong>${orgId}</strong></p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (err) {
    console.error('Error in QR redirect:', err);
    return res.status(500).send('Internal server error.');
  }
});

// 2. iOS Fingerprint Matching Endpoint
router.post('/fingerprint', async (req: Request, res: Response) => {
  try {
    const { device_model, os_version, screen_resolution, timezone, temp_user_id } = req.body;
    
    // Capture incoming request IP
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    
    console.log('Attribution check: iOS fingerprint received', { ipAddress, device_model, os_version });

    // Search click_events for a match: same IP + device type iOS + within tight window (15 minutes)
    const matchQuery = `
      SELECT click_id, org_id, campaign_id, timestamp
      FROM click_events
      WHERE ip_address = $1 
        AND device_type = 'iOS'
        AND timestamp >= NOW() - INTERVAL '15 minutes'
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const matchRes = await query(matchQuery, [ipAddress]);

    if (matchRes.rows.length > 0) {
      const match = matchRes.rows[0];
      const clickId = match.click_id;
      const orgId = match.org_id;
      const campaignId = match.campaign_id;
      const userId = temp_user_id || `usr-ios-${Date.now()}`;

      // Insert fingerprint match record
      await query(
        `INSERT INTO fingerprint_matches (click_id, ip_address, device_model, os_version, screen_resolution, timezone, matched, matched_user_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [clickId, ipAddress, device_model, os_version, screen_resolution, timezone, true, userId]
      );

      // Create permanent attribution record
      await query(
        `INSERT INTO attributions (user_id, org_id, campaign_id, device_type, matched_via) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, orgId, campaignId, 'iOS', 'Fingerprint (iOS)']
      );

      return res.status(200).json({
        matched: true,
        org_id: orgId,
        campaign_id: campaignId,
        user_id: userId
      });
    }

    return res.status(200).json({ matched: false, message: 'No matching click event found within the 15-minute window.' });
  } catch (err) {
    console.error('Error matching iOS fingerprint:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 3. Android Referrer Tracking Endpoint
router.post('/referrer', async (req: Request, res: Response) => {
  try {
    const { org_id, campaign_id, referrer_url, temp_user_id } = req.body;
    if (!org_id) {
      return res.status(400).json({ error: 'Org ID is required.' });
    }

    const userId = temp_user_id || `usr-and-${Date.now()}`;

    // Create attribution record (official Play Referrer is 100% reliable)
    await query(
      `INSERT INTO attributions (user_id, org_id, campaign_id, device_type, matched_via) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, org_id, campaign_id || null, 'Android', 'Referrer (Android)']
    );

    return res.status(201).json({
      success: true,
      org_id,
      user_id: userId
    });
  } catch (err) {
    console.error('Error tracking Android referrer:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 4. Downstream Signup Tracking
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { user_id, org_id, campaign_id, device_type } = req.body;
    if (!user_id || !org_id) {
      return res.status(400).json({ error: 'User ID and Org ID are required.' });
    }

    // Verify if attribution already exists
    const checkAtt = await query('SELECT attribution_id FROM attributions WHERE user_id = $1', [user_id]);
    if (checkAtt.rows.length > 0) {
      return res.status(200).json({ message: 'Attribution already registered for this user.' });
    }

    await query(
      `INSERT INTO attributions (user_id, org_id, campaign_id, device_type, matched_via) 
       VALUES ($1, $2, $3, $4, $5)`,
      [user_id, org_id, campaign_id || null, device_type || 'Mobile', 'Backend Signup API']
    );

    return res.status(201).json({ success: true, message: 'Signup attributed successfully.' });
  } catch (err) {
    console.error('Error mapping signup attribution:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 5. Downstream Payment Tracking
router.post('/payment', async (req: Request, res: Response) => {
  try {
    const { user_id, org_id, amount, currency } = req.body;
    if (!user_id || !org_id || !amount) {
      return res.status(400).json({ error: 'User ID, Org ID, and Amount are required.' });
    }

    await query(
      `INSERT INTO payment_events (user_id, org_id, amount, currency, status) 
       VALUES ($1, $2, $3, $4, $5)`,
      [user_id, org_id, amount, currency || 'USD', 'success']
    );

    return res.status(201).json({ success: true, message: 'Payment attributed and logged successfully.' });
  } catch (err) {
    console.error('Error logging payment attribution:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 6. Manual Click Logging Endpoint (POST /api/track/click)
router.post('/click', async (req: Request, res: Response) => {
  try {
    const { org_id, campaign_id } = req.body;
    if (!org_id || !campaign_id) {
      return res.status(400).json({ error: 'Org ID and Campaign ID are required.' });
    }

    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    
    let deviceType = 'Desktop';
    if (/android/i.test(userAgent)) {
      deviceType = 'Android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      deviceType = 'iOS';
    }

    await query(
      'INSERT INTO click_events (org_id, campaign_id, device_type, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [org_id, campaign_id, deviceType, ipAddress, userAgent]
    );

    return res.status(201).json({ success: true, message: 'Click event logged successfully.' });
  } catch (err) {
    console.error('Error logging click event:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
