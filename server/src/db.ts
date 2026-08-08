import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Configure the Neon Serverless driver to use WebSockets in Node.js runtime environments (essential for Vercel)
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_a8mqCLFRYE6B@ep-dawn-shadow-axi9ckqi-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pool = new Pool({
  connectionString,
});

// Ensure permissions and status columns exist on sub_admins table
const initDb = async () => {
  try {
    await pool.query(`
      ALTER TABLE sub_admins ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT NULL;
      ALTER TABLE sub_admins ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    `);
  } catch (err) {
    console.error('Error ensuring sub_admins columns:', err);
  }
};
initDb();

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // Log queries in dev mode
  if (process.env.NODE_ENV !== 'production') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  return res;
};
