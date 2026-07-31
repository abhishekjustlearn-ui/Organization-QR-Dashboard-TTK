import { query } from './db';

const schemaSQL = `
-- 1. Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  org_id TEXT PRIMARY KEY,
  org_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sub Admins table
CREATE TABLE IF NOT EXISTS sub_admins (
  username TEXT PRIMARY KEY,
  password_plain TEXT NOT NULL,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(org_id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  qr_link TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Click Events table
CREATE TABLE IF NOT EXISTS click_events (
  click_id SERIAL PRIMARY KEY,
  org_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  device_type TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Fingerprint Matches table
CREATE TABLE IF NOT EXISTS fingerprint_matches (
  match_id SERIAL PRIMARY KEY,
  click_id INTEGER,
  ip_address TEXT,
  device_model TEXT,
  os_version TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  matched BOOLEAN DEFAULT false,
  matched_user_id TEXT
);

-- 6. Attributions table
CREATE TABLE IF NOT EXISTS attributions (
  attribution_id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  campaign_id TEXT,
  device_type TEXT,
  matched_via TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Payment Events table
CREATE TABLE IF NOT EXISTS payment_events (
  payment_id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  org_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

export const initializeSchema = async () => {
  try {
    console.log('Initializing PostgreSQL database schemas on Neon AWS...');
    await query(schemaSQL);
    
    // Ensure status column exists in campaigns table for campaign deactivation feature
    await query(`
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
    `);

    console.log('Schemas created successfully or already exist.');
  } catch (err) {
    console.error('Error initializing database schema', err);
    throw err;
  }
};
