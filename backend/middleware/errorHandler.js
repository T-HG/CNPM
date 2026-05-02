import { env } from '../config/env.js'

export function notFound(req, res) {
  res.status(404).json({ message: `Không tìm thấy API ${req.originalUrl}` })
}

export function errorHandler(error, req, res, _next) {
  const status = error.status || 500
  res.status(status).json({
    message: error.message || 'Lỗi máy chủ',
    stack: env.nodeEnv === 'production' ? undefined : error.stack,
  })
}
