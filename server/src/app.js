import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { checkConnection } from './config/database.js';
import { checkRedisConnection } from './config/redis.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import universitiesRoutes from './modules/universities/universities.routes.js';
import programsRoutes from './modules/programs/programs.routes.js';
import countriesRoutes from './modules/countries/countries.routes.js';
import scholarshipsRoutes from './modules/scholarships/scholarships.routes.js';
import careersRoutes from './modules/careers/careers.routes.js';
import recommendationsRoutes from './modules/recommendations/recommendations.routes.js';
import applicationsRoutes from './modules/applications/applications.routes.js';
import deadlinesRoutes from './modules/deadlines/deadlines.routes.js';
import savedRoutes from './modules/saved/saved.routes.js';
import compareRoutes from './modules/compare/compare.routes.js';
import costsRoutes from './modules/costs/costs.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import immigrationRoutes from './modules/immigration/immigration.routes.js';
import reviewsRoutes from './modules/reviews/reviews.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import callRoutes from './modules/call/call.routes.js';

const app = express();

// ─── Security ───────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  },
});
app.use('/api/', limiter);

// Auth endpoints get stricter rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts' },
  },
});

// ─── Middleware ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check ───────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const dbOk = await checkConnection();
    const redisOk = await checkRedisConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbOk ? 'connected' : 'disconnected',
        redis: redisOk ? 'connected' : 'disconnected',
      },
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: { database: 'error', redis: 'unknown' },
    });
  }
});

// ─── API Routes ─────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/universities', universitiesRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/scholarships', scholarshipsRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/deadlines', deadlinesRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/immigration', immigrationRoutes);
app.use('/api/universities/:slug/reviews', reviewsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/call', callRoutes);

// ─── 404 ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.url} not found` },
  });
});

// ─── Error Handler ──────────────────────────────
app.use(errorHandler);

export default app;
