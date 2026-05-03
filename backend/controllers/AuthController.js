import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { sendNewPasswordEmail } from '../utils/mailer.js'
import {
  createEmployee,
  countEmployees,
  findEmployeeByEmail,
  findEmployeeById,
  findEmployeeByLogin,
  updateEmployeePassword,
  updateEmployeeProfile,
} from '../models/AuthModel.js'
import { createError } from '../utils/http.js'
import { nextCode } from '../utils/ids.js'

function toUser(employee) {
  const isAdmin = employee.RoleId === 'ADMIN'
  return {
    employeeId: employee.EmployeeId,
    accountId: employee.EmployeeId,
    name: employee.FullName,
    email: employee.Email,
    phone: employee.Phone || '',
    username: employee.Username,
    role: isAdmin ? 'admin' : 'staff',
    roleName: employee.RoleName,
    isActive: Boolean(employee.IsActive),
    isRoot: employee.EmployeeId === 'NV001',
  }
}

export async function login(req, res) {
  const { email, username, password } = req.body
  const loginName = email || username

  if (!loginName || !password) {
    throw createError(400, 'Email/username và mật khẩu là bắt buộc')
  }

  const employee = await findEmployeeByLogin(loginName)
  if (!employee || !employee.IsActive) {
    throw createError(401, 'Sai tài khoản hoặc tài khoản đã bị khóa')
  }

  const matched = await bcrypt.compare(password, employee.PasswordHash)
  if (!matched) {
    throw createError(401, 'Sai tài khoản hoặc mật khẩu')
  }

  const user = toUser(employee)
  const token = jwt.sign(user, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
  res.json({ user, token })
}

export async function register(req, res) {
  const { fullName, email, phone, password } = req.body
  if (!fullName || !email || !password) {
    throw createError(400, 'Họ tên, email và mật khẩu là bắt buộc')
  }

  const existing = await findEmployeeByLogin(email)
  if (existing) {
    throw createError(409, 'Email đã được đăng ký')
  }

  const total = await countEmployees()
  const employeeId = nextCode('NV', total + 1)
  const username = email.split('@')[0]
  const passwordHash = await bcrypt.hash(password, 10)

  await createEmployee({
    employeeId,
    fullName,
    phone,
    email,
    username,
    passwordHash,
    roleId: 'STAFF',
    isActive: true,
  })

  res.status(201).json({ message: 'Đăng ký tài khoản thành công' })
}

function generateTempPassword(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += chars[bytes[i] % chars.length]
  }
  return out
}

/** Quên mật khẩu: tạo mật khẩu mới và gửi qua email (không dùng link). */
export async function forgotPassword(req, res) {
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase()
  if (!email) {
    throw createError(400, 'Email là bắt buộc')
  }

  const employee = await findEmployeeByLogin(email)
  if (!employee || !employee.IsActive) {
    throw createError(404, 'Không tìm thấy tài khoản hoạt động với email này.')
  }

  const plain = generateTempPassword(env.forgotPasswordTempLength)

  let devLogOnly = false
  try {
    const result = await sendNewPasswordEmail({
      to: employee.Email,
      fullName: employee.FullName,
      plainPassword: plain,
    })
    devLogOnly = Boolean(result?.devLogOnly)
  } catch (err) {
    const status =
      typeof err.status === 'number' && err.status >= 400 ? err.status : 502
    throw createError(status, err.message || 'Không gửi được email. Thử lại sau.')
  }

  const passwordHash = await bcrypt.hash(plain, 10)
  await updateEmployeePassword(employee.EmployeeId, passwordHash)

  res.json({
    message: devLogOnly
      ? 'Chế độ dev: mật khẩu mới được in trong console máy chủ API (chưa cấu hình SMTP).'
      : 'Đã gửi mật khẩu mới đến email của bạn. Kiểm tra hộp thư và mục spam.',
  })
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    throw createError(400, 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc')
  }
  if (newPassword.length < 6) {
    throw createError(400, 'Mật khẩu mới phải có ít nhất 6 ký tự')
  }
  if (currentPassword === newPassword) {
    throw createError(400, 'Mật khẩu mới không được trùng mật khẩu hiện tại')
  }

  const employee = await findEmployeeById(req.user?.employeeId)
  if (!employee || !employee.IsActive) {
    throw createError(401, 'Tài khoản không tồn tại hoặc đã bị khóa')
  }

  const matched = await bcrypt.compare(currentPassword, employee.PasswordHash)
  if (!matched) {
    throw createError(400, 'Mật khẩu hiện tại không đúng')
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await updateEmployeePassword(employee.EmployeeId, passwordHash)
  res.json({ message: 'Đổi mật khẩu thành công' })
}

export async function updateProfile(req, res) {
  const fullName = String(req.body.fullName || req.body.name || '').trim()
  const email = String(req.body.email || '').trim()
  const phone = String(req.body.phone || '').trim()

  if (!fullName || !email) {
    throw createError(400, 'Họ tên và email là bắt buộc')
  }

  const employee = await findEmployeeById(req.user?.employeeId)
  if (!employee || !employee.IsActive) {
    throw createError(401, 'Tài khoản không tồn tại hoặc đã bị khóa')
  }

  const existingEmail = await findEmployeeByEmail(email)
  if (existingEmail && existingEmail.EmployeeId !== employee.EmployeeId) {
    throw createError(409, 'Email đã được sử dụng bởi tài khoản khác')
  }

  const updatedEmployee = await updateEmployeeProfile(employee.EmployeeId, {
    fullName,
    email,
    phone,
  })
  const user = toUser(updatedEmployee)
  const token = jwt.sign(user, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
  res.json({ user, token })
}
