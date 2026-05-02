import { get, run } from '../config/database.js'

export async function findEmployeeByLogin(login) {
  return get(
    `SELECT e.*, r.RoleName
     FROM Employee e
     JOIN Role r ON r.RoleId = e.RoleId
     WHERE lower(e.Email) = lower(?) OR lower(e.Username) = lower(?)`,
    [login, login],
  )
}

export async function findEmployeeById(employeeId) {
  return get(
    `SELECT e.*, r.RoleName
     FROM Employee e
     JOIN Role r ON r.RoleId = e.RoleId
     WHERE e.EmployeeId = ?`,
    [employeeId],
  )
}

export async function findEmployeeByEmail(email) {
  return get(
    `SELECT e.*, r.RoleName
     FROM Employee e
     JOIN Role r ON r.RoleId = e.RoleId
     WHERE lower(e.Email) = lower(?)`,
    [email],
  )
}

export async function createEmployee(employee) {
  await run(
    `INSERT INTO Employee
      (EmployeeId, FullName, Phone, Email, Username, PasswordHash, RoleId, IsActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employee.employeeId,
      employee.fullName,
      employee.phone || '',
      employee.email,
      employee.username,
      employee.passwordHash,
      employee.roleId,
      employee.isActive ? 1 : 0,
    ],
  )
}

export async function countEmployees() {
  const row = await get('SELECT COUNT(*) AS total FROM Employee')
  return Number(row?.total || 0)
}

export async function updateEmployeePassword(employeeId, passwordHash) {
  await run('UPDATE Employee SET PasswordHash = ? WHERE EmployeeId = ?', [passwordHash, employeeId])
}

export async function updateEmployeeProfile(employeeId, payload) {
  await run(
    `UPDATE Employee
     SET FullName = ?,
         Email = ?,
         Phone = ?
     WHERE EmployeeId = ?`,
    [payload.fullName, payload.email, payload.phone || '', employeeId],
  )
  return findEmployeeById(employeeId)
}
