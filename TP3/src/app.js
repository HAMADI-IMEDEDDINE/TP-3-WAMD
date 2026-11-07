import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { generalLimiter } from './middleware/rateLimiters.js';
import { ApiError, errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (Postman, curl, server-to-server)
      // are allowed. Browser origins must be explicitly allowed.
      if (!origin || env.clientOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new ApiError(403, 'CORS_NOT_ALLOWED', `Origin ${origin} is not allowed by CORS.`)
      );
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'TechNest Store API',
    version: '1.0.0',
    module: 'WAMD - TD-TP 3',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      health: '/api/health',
    },
  });
});

app.use('/api', generalLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
