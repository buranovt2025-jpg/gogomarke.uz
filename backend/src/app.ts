import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { initializeDatabase } from './models';
import { config } from './config';
import socketService from './services/socketService';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Parse allowed origins from environment variable
// CORS_ORIGINS should be comma-separated list: "https://gogomarket.uz,https://admin.gogomarket.uz"
const parseAllowedOrigins = (): string[] => {
  const envOrigins = process.env.CORS_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }
  
  // Default allowed origins for production
  const defaultOrigins = [
    'https://gogomarket.uz',
    'https://www.gogomarket.uz',
    'https://admin.gogomarket.uz',
    'https://api.gogomarket.uz',
  ];
  
  // Add localhost origins in development
  if (process.env.NODE_ENV !== 'production') {
    defaultOrigins.push(
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    );
  }
  
  return defaultOrigins;
};

const allowedOrigins = parseAllowedOrigins();

// Log allowed origins on startup
console.log('[CORS] Allowed origins:', allowedOrigins);

// Warn if using wildcard in production
if (process.env.NODE_ENV === 'production' && process.env.CORS_ORIGIN === '*') {
  console.warn('[CORS] WARNING: Using wildcard (*) origin in production is not recommended!');
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for API endpoints
app.use('/api', apiRateLimiter);

// Serve uploaded files statically
const uploadsDir = process.env.LOCAL_UPLOAD_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.use('/api/v1', routes);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to GoGoMarket API',
    version: '1.0.0',
    docs: '/api/v1/health',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await initializeDatabase();
    
    // Initialize Socket.io with same CORS config
    socketService.initialize(httpServer, allowedOrigins);
    
    httpServer.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log('Socket.io enabled for real-time chat');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
