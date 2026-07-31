import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeSchema } from './schema';

// Import routes
import authRoutes from './routes/auth';
import orgRoutes from './routes/orgs';
import campaignRoutes from './routes/campaigns';
import analyticsRoutes from './routes/analytics';
import trackRoutes from './routes/track';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with support for frontend clients
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-dash-token'],
}));

app.use(express.json());

// Bind routes
app.use('/api/auth', authRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/track', trackRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Start Express Server
const startServer = async () => {
  try {
    // Run schema creation on start
    await initializeSchema();

    app.listen(PORT, () => {
      console.log(`================================================`);
      console.log(`  Talk to Krishna Dashboard Backend (b_dash)`);
      console.log(`  Server is listening on port: ${PORT}`);
      console.log(`  Database: Connected to Neon AWS PostgreSQL`);
      console.log(`================================================`);
    });
  } catch (err) {
    console.error('Failed to start server due to DB setup errors:', err);
    process.exit(1);
  }
};

// Conditionally start listening if not running on Vercel serverless
if (!process.env.VERCEL) {
  startServer();
} else {
  // On Vercel serverless, run migrations asynchronously on module initialization
  initializeSchema().catch(err => {
    console.error('Failed to initialize schemas on Vercel startup:', err);
  });
}

export default app;
