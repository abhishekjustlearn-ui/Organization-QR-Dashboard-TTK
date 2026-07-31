import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_a8mqCLFRYE6B@ep-dawn-shadow-axi9ckqi-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Bypass SSL validation issues in serverless environments
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // Increase to 15s to prevent cold start network timeouts on Vercel
});

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
