import { all, get, run } from '../config/database.js'

const alertSelect = `
  SELECT
    a.AlertId AS id,
    a.MedicineId AS medicineId,
    m.MedicineName AS medicineName,
    a.Stock AS stock,
    a.MinStock AS minStock,
    0 AS avgSold7d,
    0 AS avgSold30d,
    'Chưa cập nhật' AS supplierName,
    m.CostPrice AS lastImportPrice,
    a.Note AS note,
    a.Status AS status,
    a.CreatedBy AS createdBy,
    a.CreatedAt AS createdAt,
    a.ResolvedAt AS resolvedAt,
    a.ResolutionType AS resolutionType,
    a.ResolutionNote AS resolutionNote
  FROM StockAlert a
  JOIN Medicine m ON m.MedicineId = a.MedicineId
`

export function listAlerts() {
  return all(`${alertSelect} ORDER BY a.CreatedAt DESC`)
}

export function findPendingAlertByMedicine(medicineId) {
  return get(
    `${alertSelect}
     WHERE a.MedicineId = ? AND a.Status = 'PENDING'
     LIMIT 1`,
    [medicineId],
  )
}

export function findAlert(alertId) {
  return get(`${alertSelect} WHERE a.AlertId = ?`, [alertId])
}

export async function createAlert(payload) {
  await run(
    `INSERT INTO StockAlert
      (AlertId, MedicineId, Stock, MinStock, Note, Status, CreatedBy, CreatedAt)
     VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
    [
      payload.id,
      payload.medicineId,
      Number(payload.stock || 0),
      Number(payload.minStock || 10),
      payload.note || '',
      payload.createdBy || '',
      payload.createdAt,
    ],
  )

  return findAlert(payload.id)
}

export async function resolveAlert(alertId, resolution) {
  await run(
    `UPDATE StockAlert
     SET Status = ?,
         ResolvedAt = ?,
         ResolutionType = ?,
         ResolutionNote = ?
     WHERE AlertId = ?`,
    [
      resolution.status,
      resolution.resolvedAt,
      resolution.type,
      resolution.note || '',
      alertId,
    ],
  )

  return findAlert(alertId)
}
