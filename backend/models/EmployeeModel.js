import { all, run } from '../config/database.js'

export function listEmployees() {
  return all(
    `SELECT
      e.EmployeeId AS id,
      e.FullName AS fullName,
      e.Phone AS phone,
      e.Email AS email,
      e.Username AS username,
      e.RoleId AS roleId,
      r.RoleName AS role,
      e.IsActive AS isActive
     FROM Employee e
     JOIN Role r ON r.RoleId = e.RoleId
     ORDER BY e.EmployeeId ASC`,
  )
}

export async function updateEmployeeRole(employeeId, roleId) {
  await run('UPDATE Employee SET RoleId = ? WHERE EmployeeId = ?', [roleId, employeeId])
}

export async function updateEmployeeStatus(employeeId, isActive) {
  await run('UPDATE Employee SET IsActive = ? WHERE EmployeeId = ?', [
    isActive ? 1 : 0,
    employeeId,
  ])
}
