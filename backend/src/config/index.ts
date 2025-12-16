import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'visitor_parcel_management',
  },
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  
  // Session
  sessionSecret: process.env.SESSION_SECRET || 'default-secret-change-me',
  
  // Status Transitions
  visitorStatusFlow: {
    NEW: ['WAITING'],
    WAITING: ['APPROVED', 'REJECTED'],
    APPROVED: ['ENTERED'],
    REJECTED: [],
    ENTERED: ['EXITED'],
    EXITED: [],
  } as Record<string, string[]>,
  
  parcelStatusFlow: {
    RECEIVED: ['ACKNOWLEDGED'],
    ACKNOWLEDGED: ['COLLECTED'],
    COLLECTED: [],
  } as Record<string, string[]>,
};

export default config;
