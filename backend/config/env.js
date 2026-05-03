import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const nodeEnv = process.env.NODE_ENV || 'development'
const isProd = nodeEnv === 'production'

export const env = {
  port: Number(process.env.PORT || 5055),
  nodeEnv,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  /** Dev: phản chiếu Origin (5173, 5175, …); prod: một origin cố định hoặc biến môi trường. */
  corsOrigin:
    process.env.CORS_ORIGIN && String(process.env.CORS_ORIGIN).trim() !== ''
      ? process.env.CORS_ORIGIN
      : isProd
        ? 'http://localhost:5173'
        : true,
  databaseFile:
    process.env.DATABASE_FILE ||
    path.resolve(process.cwd(), 'backend', 'database', 'pharmacy.sqlite'),
  /** Gửi email quên mật khẩu (nodemailer) — trim để tránh khoảng trắng làm hỏng đăng nhập */
  smtpHost: String(process.env.SMTP_HOST || '').trim(),
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1',
  smtpUser: String(process.env.SMTP_USER || '').trim(),
  smtpPass: String(process.env.SMTP_PASS || '').replace(/\s+/g, ''),
  /** Để trống thì dùng cùng địa chỉ SMTP_USER */
  smtpFrom: String(process.env.SMTP_FROM || '').trim(),
  /** true: nodemailer in log chi tiết (chỉ khi gỡ lỗi SMTP) */
  smtpDebug: process.env.SMTP_DEBUG === 'true' || process.env.SMTP_DEBUG === '1',
  /**
   * Dev/staging: mặc định bật (chưa SMTP vẫn đổi mật khẩu + in ra console API).
   * Tắt: FORGOT_PASSWORD_DEV_LOG=false. Production: chỉ bật nếu đặt =true.
   */
  forgotPasswordDevLog: isProd
    ? process.env.FORGOT_PASSWORD_DEV_LOG === 'true' ||
      process.env.FORGOT_PASSWORD_DEV_LOG === '1'
    : process.env.FORGOT_PASSWORD_DEV_LOG !== 'false' &&
      process.env.FORGOT_PASSWORD_DEV_LOG !== '0',
  /** Độ dài mật khẩu ngẫu nhiên khi quên mật khẩu (tối thiểu 6 — trùng rule đổi mật khẩu). */
  forgotPasswordTempLength: (() => {
    const n = Number(process.env.FORGOT_PASSWORD_LENGTH || 6)
    if (!Number.isFinite(n)) return 6
    return Math.min(32, Math.max(6, Math.floor(n)))
  })(),
}
