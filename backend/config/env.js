import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export const env = {
  port: Number(process.env.PORT || 5055),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseFile:
    process.env.DATABASE_FILE ||
    path.resolve(process.cwd(), 'backend', 'database', 'pharmacy.sqlite'),
}
