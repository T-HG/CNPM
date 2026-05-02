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
