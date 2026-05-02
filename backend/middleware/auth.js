import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { createError } from '../utils/http.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    next(createError(401, 'Bạn cần đăng nhập'))
    return
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret)
    next()
  } catch {
    next(createError(401, 'Token không hợp lệ hoặc đã hết hạn'))
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      next(createError(403, 'Bạn không có quyền thực hiện thao tác này'))
      return
    }
    next()
  }
}
