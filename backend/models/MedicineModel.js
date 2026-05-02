import { all, get, run } from '../config/database.js'

const medicineSelect = `
  SELECT
    m.MedicineId AS id,
    m.MedicineName AS name,
    m.CategoryId AS categoryId,
    c.CategoryName AS category,
    m.ProductType AS type,
    m.UnitName AS unit,
    m.DrugRegistrationCode AS drugCode,
    m.CostPrice AS costPrice,
    m.SalePrice AS salePrice,
    COALESCE(m.MedicineStatus, 'Đang kinh doanh') AS medicineStatus,
    COALESCE(s.QuantityOnHand, 0) AS stock,
    10 AS minStock,
    'Chưa cập nhật' AS supplierName,
    m.CostPrice AS lastImportPrice,
    0 AS avgSold7d,
    0 AS avgSold30d,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM StockAlert a
        WHERE a.MedicineId = m.MedicineId AND a.Status = 'PENDING'
      )
      THEN 'PENDING'
      ELSE 'NONE'
    END AS alertStatus,
    m.Ingredient AS ingredient,
    m.Usage AS usage,
    m.Dosage AS dosage
  FROM Medicine m
  LEFT JOIN MedicineCategory c ON c.CategoryId = m.CategoryId
  LEFT JOIN MedicineStock s ON s.MedicineId = m.MedicineId
`

export function listMedicines() {
  return all(`${medicineSelect} ORDER BY m.MedicineId DESC`)
}

export function findMedicine(id) {
  return get(`${medicineSelect} WHERE m.MedicineId = ?`, [id])
}

/** Một dòng đại diện khi trùng tên + đơn vị (chuẩn hóa trim, không phân biệt hoa thường). */
export async function findMedicineIdByNameAndUnit(name, unit) {
  const n = (name || '').trim()
  if (!n) return null
  const u = (unit || '').trim()
  const row = await get(
    `SELECT m.MedicineId AS id
     FROM Medicine m
     WHERE LOWER(TRIM(m.MedicineName)) = LOWER(?)
       AND LOWER(TRIM(COALESCE(m.UnitName, ''))) = LOWER(?)
     ORDER BY m.MedicineId ASC
     LIMIT 1`,
    [n, u],
  )
  return row?.id ?? null
}

export async function createMedicine(payload) {
  await run(
    `INSERT INTO Medicine
      (MedicineId, MedicineName, CategoryId, ProductType, UnitName, DrugRegistrationCode,
       CostPrice, SalePrice, MedicineStatus, Ingredient, Usage, Dosage)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.id,
      payload.name,
      payload.categoryId || null,
      payload.type,
      payload.unit,
      payload.drugCode || '',
      Number(payload.costPrice || 0),
      Number(payload.salePrice || 0),
      payload.medicineStatus || 'Đang kinh doanh',
      payload.ingredient || '',
      payload.usage || '',
      payload.dosage || '',
    ],
  )
  await run('INSERT INTO MedicineStock (MedicineId, QuantityOnHand) VALUES (?, ?)', [
    payload.id,
    Number(payload.stock || 0),
  ])
  return findMedicine(payload.id)
}

export async function updateStock(medicineId, quantityOnHand) {
  await run('UPDATE MedicineStock SET QuantityOnHand = ? WHERE MedicineId = ?', [
    Number(quantityOnHand || 0),
    medicineId,
  ])
  return findMedicine(medicineId)
}

export async function updateMedicineStatus(medicineId, medicineStatus) {
  await run('UPDATE Medicine SET MedicineStatus = ? WHERE MedicineId = ?', [
    medicineStatus,
    medicineId,
  ])
  return findMedicine(medicineId)
}

export async function decreaseStock(medicineId, quantity) {
  await run(
    `UPDATE MedicineStock
     SET QuantityOnHand = QuantityOnHand - ?
     WHERE MedicineId = ? AND QuantityOnHand >= ?`,
    [quantity, medicineId, quantity],
  )
}

export async function increaseStock(medicineId, quantity) {
  await run(
    `UPDATE MedicineStock
     SET QuantityOnHand = QuantityOnHand + ?
     WHERE MedicineId = ?`,
    [quantity, medicineId],
  )
}

export function listCategories() {
  return all(
    `SELECT CategoryId AS id, CategoryName AS name
     FROM MedicineCategory
     ORDER BY CategoryName ASC`,
  )
}

export async function createCategory(payload) {
  await run('INSERT INTO MedicineCategory (CategoryId, CategoryName) VALUES (?, ?)', [
    payload.id,
    payload.name,
  ])
  return get('SELECT CategoryId AS id, CategoryName AS name FROM MedicineCategory WHERE CategoryId = ?', [
    payload.id,
  ])
}

/** Không xóa nếu thuốc đã có trong phiếu bán (SalesInvoiceLine). Tồn kho & cảnh báo xóa theo CASCADE. */
export async function removeMedicine(medicineId) {
  const exists = await get('SELECT 1 AS ok FROM Medicine WHERE MedicineId = ?', [medicineId])
  if (!exists) return { removed: false, reason: 'NOT_FOUND' }

  const hasSales = await get('SELECT 1 AS ok FROM SalesInvoiceLine WHERE MedicineId = ? LIMIT 1', [
    medicineId,
  ])
  if (hasSales) return { removed: false, reason: 'HAS_SALES_HISTORY' }

  await run('DELETE FROM Medicine WHERE MedicineId = ?', [medicineId])
  return { removed: true }
}
