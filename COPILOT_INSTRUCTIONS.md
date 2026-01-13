# GitHub Copilot Instructions - GoGoMarket.uz Backend

## Project Overview
GoGoMarket.uz is a social video marketplace platform built with Node.js/TypeScript backend. This document provides instructions for GitHub Copilot to assist with backend development tasks.

---

## Technology Stack

### Backend Core
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: AWS S3
- **Real-time**: Socket.io

### Key Dependencies
- `express` - Web framework
- `typescript` - Type safety
- `sequelize` - ORM for PostgreSQL
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - Cross-origin resource sharing
- `helmet` - Security headers
- `multer` - File upload handling
- `qrcode` - QR code generation
- `socket.io` - WebSocket support

---

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Database connection
│   │   └── index.ts     # App configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT authentication
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validation.ts
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   ├── smsService.ts
│   │   ├── qrService.ts
│   │   ├── uploadService.ts
│   │   └── socketService.ts
│   ├── types/           # TypeScript types
│   └── app.ts           # Application entry point
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Coding Standards

### TypeScript Guidelines
1. **Always use strict TypeScript**
   - Enable `strict` mode in tsconfig.json
   - Avoid using `any` type - use proper types or `unknown`
   - Define interfaces for all request/response objects

2. **Naming Conventions**
   - **Files**: camelCase for files (e.g., `authController.ts`)
   - **Interfaces**: PascalCase with 'I' prefix (e.g., `IUser`, `IProduct`)
   - **Types**: PascalCase (e.g., `UserRole`, `OrderStatus`)
   - **Enums**: PascalCase with descriptive names
   - **Functions**: camelCase (e.g., `createUser`, `validateToken`)
   - **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

3. **Error Handling**
   - Use try-catch blocks in all async functions
   - Create custom error classes extending `Error`
   - Always return proper HTTP status codes
   - Include error messages in English for logs, localized messages for users

4. **Async/Await**
   - Prefer async/await over promises
   - Always handle errors in async functions
   - Use Promise.all() for parallel operations

### Code Organization
```typescript
// Example controller structure
export const exampleController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Validate input
      const validatedData = validateInput(req.body);
      
      // 2. Business logic
      const result = await service.create(validatedData);
      
      // 3. Return response
      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};
```

---

## Priority Backend Tasks (B0.x Series)

### B0.1: CORS Configuration for Specific Domains

**Current State**: CORS is configured with wildcard (`*`)
```typescript
// backend/src/app.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
```

**Required Changes**:
1. Update `.env.example` to include multiple allowed domains:
```env
# CORS allowed origins (comma-separated)
CORS_ORIGINS=https://gogomarket.uz,https://www.gogomarket.uz,https://admin.gogomarket.uz,http://localhost:3001
```

2. Update CORS middleware in `app.ts`:
```typescript
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',  // Backend development server
      'http://localhost:3001'   // Frontend development server (React/Web)
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
```

3. Add CORS configuration to `src/config/index.ts`:
```typescript
export const config = {
  // ... existing config
  cors: {
    origins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://localhost:3001'],
  }
};
```

---

### B0.2: MIME Type Validation for File Uploads

**Current State**: File uploads may lack strict MIME validation

**Required Changes**:

1. Create `src/middleware/fileValidation.ts`:
```typescript
import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm'
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// File filter for images
export const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
  }
};

// File filter for videos
export const videoFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`));
  }
};

// Storage configuration with size limits
export const imageUploadLimits = {
  fileSize: MAX_IMAGE_SIZE,
  files: 10 // Max 10 images per request
};

export const videoUploadLimits = {
  fileSize: MAX_VIDEO_SIZE,
  files: 1 // Max 1 video per request
};
```

2. Update `src/services/uploadService.ts` to use MIME validation:
```typescript
import multer from 'multer';
import { imageFileFilter, videoFileFilter, imageUploadLimits, videoUploadLimits } from '../middleware/fileValidation';

// Image upload
export const imageUpload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: imageUploadLimits
});

// Video upload
export const videoUpload = multer({
  storage: storage,
  fileFilter: videoFileFilter,
  limits: videoUploadLimits
});
```

3. Add file extension verification in upload routes:
```typescript
// Verify file extension matches MIME type
const verifyFileExtension = (file: Express.Multer.File): boolean => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeMap: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'video/mp4': ['.mp4'],
    'video/quicktime': ['.mov'],
    'video/webm': ['.webm']
  };
  
  return mimeMap[file.mimetype]?.includes(ext) || false;
};
```

---

### B0.3: Redis Service Installation and Configuration

**Objective**: Set up Redis for caching, session management, and OTP storage

**Required Changes**:

1. Install Redis dependencies:
```bash
npm install redis ioredis
npm install --save-dev @types/redis
```

2. Create `src/config/redis.ts`:
```typescript
import Redis from 'ioredis';
import { config } from './index';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ETIMEDOUT'];
    return targetErrors.some(targetError => err.message.includes(targetError));
  }
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('error', (err: Error) => {
  console.error('Redis client error:', err);
});

export default redisClient;
```

3. Update `src/config/index.ts`:
```typescript
export const config = {
  // ... existing config
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
    ttl: {
      otp: 300, // 5 minutes
      session: 86400, // 24 hours
      rateLimit: 900 // 15 minutes
    }
  }
};
```

4. Update `.env.example`:
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

5. Create Redis service wrapper `src/services/redisService.ts`:
```typescript
import redisClient from '../config/redis';
import { config } from '../config';

export class RedisService {
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await redisClient.setex(key, ttl, value);
    } else {
      await redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await redisClient.get(key);
  }

  async del(key: string): Promise<void> {
    await redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return result === 1;
  }

  async setJSON(key: string, value: any, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  async increment(key: string, ttl?: number): Promise<number> {
    const value = await redisClient.incr(key);
    if (ttl && value === 1) {
      await redisClient.expire(key, ttl);
    }
    return value;
  }

  async disconnect(): Promise<void> {
    await redisClient.quit();
  }
}

export default new RedisService();
```

---

### B0.4: OTP Storage and Verification with Redis

**Current State**: OTP might be stored in memory or database

**Required Changes**:

1. Create `src/services/otpService.ts`:
```typescript
import redisService from './redisService';
import { config } from '../config';

interface IOTPData {
  phone: string;
  otp: string;
  attempts: number;
  createdAt: number;
}

export class OTPService {
  private readonly OTP_PREFIX = 'otp:';
  private readonly OTP_ATTEMPT_PREFIX = 'otp_attempts:';
  private readonly MAX_ATTEMPTS = 3;
  private readonly OTP_TTL = config.redis.ttl.otp; // 5 minutes

  /**
   * Generate a 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP in Redis
   */
  async storeOTP(phone: string, otp: string): Promise<void> {
    const key = this.getOTPKey(phone);
    const data: IOTPData = {
      phone,
      otp,
      attempts: 0,
      createdAt: Date.now()
    };
    
    await redisService.setJSON(key, data, this.OTP_TTL);
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string): Promise<boolean> {
    const key = this.getOTPKey(phone);
    const data = await redisService.getJSON<IOTPData>(key);

    if (!data) {
      throw new Error('OTP expired or not found');
    }

    // Check max attempts
    if (data.attempts >= this.MAX_ATTEMPTS) {
      await redisService.del(key);
      throw new Error('Maximum OTP verification attempts exceeded');
    }

    // Verify OTP first
    const isValid = data.otp === otp;
    
    if (isValid) {
      // Delete OTP on successful verification
      await redisService.del(key);
      return true;
    }
    
    // Increment attempts only on failed verification
    data.attempts += 1;
    await redisService.setJSON(key, data, this.OTP_TTL);

    return false;
  }

  /**
   * Check rate limiting for OTP requests
   */
  async canRequestOTP(phone: string): Promise<boolean> {
    const attemptKey = this.getAttemptKey(phone);
    const attempts = await redisService.increment(
      attemptKey,
      config.redis.ttl.rateLimit // 15 minutes
    );

    return attempts <= 5; // Max 5 OTP requests per 15 minutes
  }

  /**
   * Delete OTP (e.g., after successful verification)
   */
  async deleteOTP(phone: string): Promise<void> {
    const key = this.getOTPKey(phone);
    await redisService.del(key);
  }

  private getOTPKey(phone: string): string {
    return `${this.OTP_PREFIX}${phone}`;
  }

  private getAttemptKey(phone: string): string {
    return `${this.OTP_ATTEMPT_PREFIX}${phone}`;
  }
}

export default new OTPService();
```

2. Update `src/controllers/authController.ts` to use Redis OTP:
```typescript
import otpService from '../services/otpService';
import smsService from '../services/smsService';

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    // Check rate limiting
    const canRequest = await otpService.canRequestOTP(phone);
    if (!canRequest) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.'
      });
    }

    // Generate and store OTP
    const otp = otpService.generateOTP();
    await otpService.storeOTP(phone, otp);

    // Send SMS
    await smsService.sendOTP(phone, otp);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    const isValid = await otpService.verifyOTP(phone, otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Continue with user registration/login
    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    next(error);
  }
};
```

---

### B0.5: JWT Token Management Improvements

**Current State**: Basic JWT implementation exists

**Required Changes**:

1. Implement token refresh mechanism in `src/middleware/auth.ts`:
```typescript
import jwt from 'jsonwebtoken';
import { config } from '../config';
import redisService from '../services/redisService';

interface ITokenPayload {
  userId: string;
  role: string;
  phone: string;
}

export class TokenService {
  private readonly ACCESS_TOKEN_EXPIRES = '15m';
  private readonly REFRESH_TOKEN_EXPIRES = '7d';
  private readonly TOKEN_BLACKLIST_PREFIX = 'blacklist:';

  /**
   * Generate access and refresh tokens
   */
  generateTokens(payload: ITokenPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES
    });

    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): ITokenPayload {
    return jwt.verify(token, config.jwtSecret) as ITokenPayload;
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): ITokenPayload {
    return jwt.verify(token, config.jwtRefreshSecret) as ITokenPayload;
  }

  /**
   * Blacklist a token (for logout)
   */
  async blacklistToken(token: string, ttl: number): Promise<void> {
    const key = `${this.TOKEN_BLACKLIST_PREFIX}${token}`;
    await redisService.set(key, '1', ttl);
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `${this.TOKEN_BLACKLIST_PREFIX}${token}`;
    return await redisService.exists(key);
  }
}

export const tokenService = new TokenService();
```

2. Update `src/config/index.ts`:
```typescript
export const config = {
  // ... existing config
  jwtSecret: process.env.JWT_SECRET || throwError('JWT_SECRET is required'),
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || throwError('JWT_REFRESH_SECRET is required'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

function throwError(message: string): never {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(message);
  }
  console.warn(`Warning: ${message}`);
  throw new Error(message); // Always throw in development too
}
```

3. Update `.env.example`:
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

4. Add refresh token endpoint:
```typescript
// In authController.ts
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const payload = tokenService.verifyRefreshToken(refreshToken);

    // Check if blacklisted
    const isBlacklisted = await tokenService.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    // Blacklist the old refresh token to prevent reuse
    const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
    await tokenService.blacklistToken(refreshToken, refreshTokenExpiry);

    // Generate new tokens
    const tokens = tokenService.generateTokens({
      userId: payload.userId,
      role: payload.role,
      phone: payload.phone
    });

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};
```

---

### B0.6: Remove Hardcoded Secrets and Encryption Keys

**Security Risk**: Hardcoded secrets in source code

**Required Changes**:

1. Audit all files for hardcoded secrets:
```bash
# Search for potential hardcoded secrets
grep -r "secret" --include="*.ts" src/
grep -r "key" --include="*.ts" src/
grep -r "password" --include="*.ts" src/
grep -r "token" --include="*.ts" src/
```

2. Move all secrets to environment variables in `src/config/index.ts`:
```typescript
// ❌ BAD - Hardcoded
const jwtSecret = 'my-secret-key';

// ✅ GOOD - From environment
const jwtSecret = process.env.JWT_SECRET || throwError('JWT_SECRET is required');

// Helper function to enforce required env vars in production
function throwError(message: string): never {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(message);
  }
  console.warn(`Warning: ${message}`);
  return '' as never;
}
```

3. Add secret validation at startup in `src/app.ts`:
```typescript
const validateEnvironment = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_PASSWORD'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Call before starting server
validateEnvironment();
```

4. Use encryption for sensitive data in database:
```typescript
import crypto from 'crypto';
import { config } from '../config';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = Buffer.from(config.encryptionKey, 'hex');

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export default new EncryptionService();
```

5. Update `.env.example`:
```env
# Encryption (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=
```

---

### B0.7: API Key Management System

**Objective**: Implement API key authentication for third-party integrations

**Required Changes**:

1. Create API Key model in `src/models/ApiKey.ts`:
```typescript
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import crypto from 'crypto';

interface IApiKeyAttributes {
  id: string;
  name: string;
  key: string;
  hashedKey: string;
  userId: string;
  permissions: string[];
  isActive: boolean;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class ApiKey extends Model<IApiKeyAttributes> implements IApiKeyAttributes {
  public id!: string;
  public name!: string;
  public key!: string;
  public hashedKey!: string;
  public userId!: string;
  public permissions!: string[];
  public isActive!: boolean;
  public expiresAt?: Date;
  public lastUsedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static generateKey(): string {
    return `gm_${crypto.randomBytes(32).toString('hex')}`;
  }

  static hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}

ApiKey.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    key: {
      type: DataTypes.VIRTUAL,
      allowNull: true,
    },
    hashedKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'api_keys',
    timestamps: true,
  }
);

export default ApiKey;
```

2. Create API key middleware in `src/middleware/apiKey.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import ApiKey from '../models/ApiKey';

export const validateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.header('X-API-Key');

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }

    const hashedKey = ApiKey.hashKey(apiKey);
    const keyRecord = await ApiKey.findOne({
      where: { hashedKey, isActive: true }
    });

    if (!keyRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Check expiration
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'API key has expired'
      });
    }

    // Update last used timestamp
    await keyRecord.update({ lastUsedAt: new Date() });

    // Attach to request
    req.apiKey = keyRecord;
    req.userId = keyRecord.userId;

    next();
  } catch (error) {
    next(error);
  }
};

// Permission check middleware
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    if (!req.apiKey.permissions.includes(permission) && 
        !req.apiKey.permissions.includes('*')) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};
```

3. Create API key controller:
```typescript
// src/controllers/apiKeyController.ts
export const createApiKey = async (req: Request, res: Response) => {
  try {
    const { name, permissions, expiresInDays } = req.body;
    const userId = req.user.id;

    const key = ApiKey.generateKey();
    const hashedKey = ApiKey.hashKey(key);

    // Calculate expiration timestamp
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * MS_PER_DAY)
      : undefined;

    const apiKey = await ApiKey.create({
      name,
      hashedKey,
      userId,
      permissions,
      expiresAt,
    });

    // Return the plain key only once
    res.status(201).json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: key, // Only shown once
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
      },
      message: 'Save this API key securely. It will not be shown again.'
    });
  } catch (error) {
    next(error);
  }
};

export const listApiKeys = async (req: Request, res: Response) => {
  const userId = req.user.id;
  
  const apiKeys = await ApiKey.findAll({
    where: { userId },
    attributes: ['id', 'name', 'permissions', 'isActive', 'expiresAt', 'lastUsedAt', 'createdAt'],
  });

  res.json({
    success: true,
    data: apiKeys
  });
};

export const revokeApiKey = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  const apiKey = await ApiKey.findOne({ where: { id, userId } });
  
  if (!apiKey) {
    return res.status(404).json({
      success: false,
      message: 'API key not found'
    });
  }

  await apiKey.update({ isActive: false });

  res.json({
    success: true,
    message: 'API key revoked successfully'
  });
};
```

---

## Additional Backend Best Practices

### Security
1. **Input Validation**: Always validate and sanitize user input
2. **SQL Injection**: Use parameterized queries (Sequelize handles this)
3. **XSS Prevention**: Sanitize output, set proper headers
4. **Rate Limiting**: Implement on all public endpoints
5. **HTTPS Only**: Force HTTPS in production
6. **Secure Headers**: Use Helmet.js (already configured)

### Performance
1. **Database Indexing**: Add indexes on frequently queried fields
2. **Caching**: Use Redis for frequently accessed data
3. **Pagination**: Always paginate list endpoints
4. **Connection Pooling**: Configure proper DB connection pools
5. **Compression**: Use gzip compression for responses

### API Design
1. **RESTful Conventions**: Follow REST principles
2. **Versioning**: Use `/api/v1` prefix
3. **Status Codes**: Use appropriate HTTP status codes
4. **Response Format**: Consistent JSON structure
```typescript
{
  success: boolean,
  data?: any,
  message?: string,
  error?: {
    code: string,
    details?: any
  }
}
```

### Logging
1. **Structured Logging**: Use JSON format in production
2. **Log Levels**: DEBUG, INFO, WARN, ERROR
3. **Request Logging**: Log all API requests (Morgan is configured)
4. **Error Logging**: Log all errors with stack traces
5. **Sensitive Data**: Never log passwords, tokens, or API keys

### Testing
1. **Unit Tests**: Test individual functions and services
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test complete user flows
4. **Test Coverage**: Aim for >80% coverage
5. **Test Data**: Use factories/fixtures for test data

---

## Environment Variables Reference

```env
# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGINS=https://gogomarket.uz,https://www.gogomarket.uz,https://admin.gogomarket.uz

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=gogomarket

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=gogomarket-media

# SMS Gateway
ESKIZ_EMAIL=
ESKIZ_PASSWORD=

# Payment Gateways
PAYME_ID=
PAYME_KEY=
CLICK_SERVICE_ID=
CLICK_MERCHANT_ID=

# Platform Settings
PLATFORM_COMMISSION=0.10
COURIER_FEE_DEFAULT=15000
```

---

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build TypeScript
npm run start            # Start production server
npm run lint             # Run TypeScript compiler checks

# Database
npx sequelize-cli db:migrate        # Run migrations
npx sequelize-cli db:seed:all       # Seed database
npx sequelize-cli db:migrate:undo   # Rollback migration

# Testing (to be implemented)
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

---

## Git Commit Message Convention

Use conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(auth): implement OTP verification with Redis
fix(upload): add MIME type validation for images
docs(readme): update environment variables section
refactor(jwt): extract token service into separate file
```

---

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Sequelize ORM](https://sequelize.org/)
- [Redis Documentation](https://redis.io/docs/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

*Last Updated: January 2026*
*Project: GoGoMarket.uz Backend*
