import { all, get, run } from '../config/database.js'

export function listCustomers() {
  return all(
    `SELECT
      CustomerId AS id,
      CustomerName AS name,
      Phone AS phone,
      Gender AS gender,
      Email AS email,
      DateOfBirth AS dateOfBirth,
      Address AS address,
      TotalSpent AS totalSpent
     FROM Customer
     ORDER BY CustomerId DESC`,
  )
}

export function findCustomerByPhone(phone) {
  return get('SELECT * FROM Customer WHERE Phone = ?', [phone])
}

export async function upsertCustomer(payload) {
  const existing = await findCustomerByPhone(payload.phone)
  if (existing) return existing

  await run(
    `INSERT INTO Customer
      (CustomerId, CustomerName, Phone, Gender, Email, DateOfBirth, Address, TotalSpent)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      payload.customerId,
      payload.name,
      payload.phone,
      payload.gender || null,
      payload.email || null,
      payload.dateOfBirth || null,
      payload.address || null,
    ],
  )
  return findCustomerByPhone(payload.phone)
}

export async function addCustomerSpending(customerId, total) {
  await run('UPDATE Customer SET TotalSpent = TotalSpent + ? WHERE CustomerId = ?', [
    Number(total || 0),
    customerId,
  ])
}

export async function subtractCustomerSpending(customerId, total) {
  await run(
    `UPDATE Customer
     SET TotalSpent = MAX(TotalSpent - ?, 0)
     WHERE CustomerId = ?`,
    [Number(total || 0), customerId],
  )
}

export async function countCustomers() {
  const row = await get('SELECT COUNT(*) AS total FROM Customer')
  return Number(row?.total || 0)
}
