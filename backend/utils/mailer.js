import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

/** Đủ để gửi mail thật: host + user + pass (From mặc định = user nếu không đặt SMTP_FROM). */
export function isSmtpConfigured() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass)
}

function getMailFrom() {
  return env.smtpFrom || env.smtpUser
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Gửi mật khẩu mới dạng plaintext (theo yêu cầu nghiệp vụ).
 * @throws {Error} khi SMTP bắt buộc nhưng gửi thất bại
 */
export async function sendNewPasswordEmail({ to, fullName, plainPassword }) {
  const safeName = escapeHtml(fullName)
  const safePass = escapeHtml(plainPassword)
  const subject = 'Mật khẩu đăng nhập mới — Hệ thống nhà thuốc'
  const text = `Xin chào ${fullName},\n\nMật khẩu mới của bạn: ${plainPassword}\n\nVui lòng đăng nhập và đổi mật khẩu trong mục Hồ sơ để bảo mật hơn.\n`
  const html = `<p>Xin chào <strong>${safeName}</strong>,</p>
<p>Mật khẩu mới của bạn: <strong>${safePass}</strong></p>
<p>Vui lòng đăng nhập và đổi mật khẩu trong mục <strong>Hồ sơ</strong>.</p>`

  // Đủ SMTP_* → luôn gửi qua Gmail/server thật, không dùng console.
  if (!isSmtpConfigured()) {
    if (env.forgotPasswordDevLog) {
      console.warn(`[forgot-password] DEV (không gửi email) → ${to} | mật khẩu mới: ${plainPassword}`)
      return { devLogOnly: true }
    }
    const err = new Error('SMTP chưa được cấu hình')
    err.status = 503
    throw err
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
    requireTLS: !env.smtpSecure && env.smtpPort === 587,
    debug: env.smtpDebug,
    logger: env.smtpDebug ? console : undefined,
  })

  try {
    await transporter.sendMail({
      from: getMailFrom(),
      to,
      subject,
      text,
      html,
    })
  } catch (err) {
    console.error('SMTP sendMail:', err?.message || err)
    const msg = String(err?.message || err)
    const authFail =
      /Invalid login|authentication failed|535|534|EAUTH/i.test(msg) ||
      err?.code === 'EAUTH'
    const friendly = authFail
      ? 'Đăng nhập SMTP thất bại. Với Gmail: bật 2FA và tạo «Mật khẩu ứng dụng», dán vào SMTP_PASS (không dùng mật khẩu đăng nhập web).'
      : `Gửi email thất bại: ${msg}`
    const e = new Error(friendly)
    e.status = 502
    throw e
  }

  return { devLogOnly: false }
}
