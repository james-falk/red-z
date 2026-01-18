import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { startCronJobs } from './cron';
import { errorHandler } from './middleware/error';

// Routes
import contentRoutes from './routes/content.routes';
import sourcesRoutes from './routes/sources.routes';
import favoritesRoutes from './routes/favorites.routes';
import savedRoutes from './routes/saved.routes';
import feedsRoutes from './routes/feeds.routes';
import feedDetailRoutes from './routes/feed-detail.routes';
import myFeedRoutes from './routes/my-feed.routes';
import sleeperRoutes from './routes/sleeper.routes';
import ingestRoutes from './routes/ingest.routes';
import featuredRoutes from './routes/featured.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/content', contentRoutes);
app.use('/sources', sourcesRoutes);
app.use('/me/favorites', favoritesRoutes);
app.use('/me/saved', savedRoutes);
app.use('/feeds', feedsRoutes);
app.use('/feeds', feedDetailRoutes);
app.use('/me/feed', myFeedRoutes);
app.use('/integrations/sleeper', sleeperRoutes);
app.use('/ingest', ingestRoutes);
app.use('/featured', featuredRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  
  // Start cron jobs
  if (process.env.NODE_ENV !== 'test') {
    startCronJobs();
  }
});

export default app;
