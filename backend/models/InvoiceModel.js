import { all, get, run } from '../config/database.js'

export async function listInvoices() {
  const invoices = await all(
    `SELECT
      i.InvoiceId AS id,
      i.EmployeeId AS employeeId,
      e.FullName AS createdBy,
      i.CustomerId AS customerId,
      i.CustomerNameSnapshot AS customerName,
      i.PhoneSnapshot AS phone,
      i.InvoiceDate AS createdAt,
      strftime('%d/%m/%Y %H:%M', i.InvoiceDate) AS date,
      i.TotalAmount AS total,
      i.Status AS status
     FROM SalesInvoice i
     LEFT JOIN Employee e ON e.EmployeeId = i.EmployeeId
     ORDER BY i.InvoiceDate DESC`,
  )

  const withItems = await Promise.all(
    invoices.map(async (invoice) => ({
      ...invoice,
      items: await listInvoiceLines(invoice.id),
    })),
  )
  return withItems
}

export function listInvoiceLines(invoiceId) {
  return all(
    `SELECT
      MedicineId AS id,
      MedicineNameSnapshot AS name,
      UnitSnapshot AS unit,
      Quantity AS qty,
      UnitPrice AS price,
      LineTotal AS total
     FROM SalesInvoiceLine
     WHERE InvoiceId = ?
     ORDER BY LineId ASC`,
    [invoiceId],
  )
}

export function listInvoiceLinesForStock(invoiceId) {
  return all(
    `SELECT
      MedicineId AS id,
      Quantity AS qty
     FROM SalesInvoiceLine
     WHERE InvoiceId = ?`,
    [invoiceId],
  )
}

export function findInvoice(id) {
  return get(
    `SELECT
      InvoiceId AS id,
      EmployeeId AS employeeId,
      CustomerId AS customerId,
      CustomerNameSnapshot AS customerName,
      PhoneSnapshot AS phone,
      InvoiceDate AS createdAt,
      TotalAmount AS total,
      Status AS status
     FROM SalesInvoice
     WHERE InvoiceId = ?`,
    [id],
  )
}

export async function createInvoice(invoice, lines) {
  await run(
    `INSERT INTO SalesInvoice
      (InvoiceId, EmployeeId, CustomerId, CustomerNameSnapshot, PhoneSnapshot,
       InvoiceDate, TotalAmount, Status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoice.id,
      invoice.employeeId || null,
      invoice.customerId || null,
      invoice.customerName,
      invoice.phone || '',
      invoice.createdAt,
      Number(invoice.total || 0),
      invoice.status || 'Hoàn thành',
    ],
  )

  for (const line of lines) {
    await run(
      `INSERT INTO SalesInvoiceLine
        (LineId, InvoiceId, MedicineId, MedicineNameSnapshot, UnitSnapshot,
         Quantity, UnitPrice, LineTotal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        line.lineId,
        invoice.id,
        line.id,
        line.name,
        line.unit,
        Number(line.qty || 0),
        Number(line.price || 0),
        Number(line.total || 0),
      ],
    )
  }
}

export async function updateInvoiceStatus(invoiceId, status) {
  await run('UPDATE SalesInvoice SET Status = ? WHERE InvoiceId = ?', [status, invoiceId])
  return findInvoice(invoiceId)
}

export async function revenueSummary() {
  const row = await get(
    `SELECT
      COALESCE(SUM(TotalAmount), 0) AS revenue,
      COUNT(*) AS invoiceCount
     FROM SalesInvoice
     WHERE Status = 'Hoàn thành'`,
  )
  return {
    revenue: Number(row?.revenue || 0),
    invoiceCount: Number(row?.invoiceCount || 0),
  }
}
