import {
  listEmployees,
  updateEmployeeRole,
  updateEmployeeStatus,
} from '../models/EmployeeModel.js'
import { createError } from '../utils/http.js'

const roleMap = {
  admin: 'ADMIN',
  staff: 'STAFF',
  Admin: 'ADMIN',
  'Nhân viên bán hàng': 'STAFF',
}

export async function getEmployees(req, res) {
  const employees = await listEmployees()
  res.json(
    employees.map((item) => ({
      ...item,
      isActive: Boolean(item.isActive),
      isRoot: item.id === 'NV001',
    })),
  )
}

export async function patchEmployeeRole(req, res) {
  const roleId = roleMap[req.body.role] || req.body.roleId
  if (!['ADMIN', 'STAFF'].includes(roleId)) {
    throw createError(400, 'Vai trò không hợp lệ')
  }
  if (req.params.id === 'NV001') {
    throw createError(403, 'Không thể đổi vai trò tài khoản root')
  }

  await updateEmployeeRole(req.params.id, roleId)
  res.json({ message: 'Cập nhật vai trò thành công' })
}

export async function patchEmployeeStatus(req, res) {
  if (req.params.id === 'NV001') {
    throw createError(403, 'Không thể khóa tài khoản root')
  }

  await updateEmployeeStatus(req.params.id, Boolean(req.body.isActive))
  res.json({ message: 'Cập nhật trạng thái thành công' })
}
