import {
  createAlert,
  findAlert,
  findPendingAlertByMedicine,
  listAlerts,
  resolveAlert,
} from '../models/AlertModel.js'
import { findMedicine, updateMedicineStatus, updateStock } from '../models/MedicineModel.js'
import { createError } from '../utils/http.js'

export async function getAlerts(req, res) {
  res.json(await listAlerts())
}

export async function postAlert(req, res) {
  const { medicineId, note, createdBy } = req.body
  if (!medicineId) {
    throw createError(400, 'Mã thuốc là bắt buộc')
  }

  const medicine = await findMedicine(medicineId)
  if (!medicine) {
    throw createError(404, 'Không tìm thấy thuốc')
  }
  if (medicine.medicineStatus === 'Ngừng kinh doanh') {
    throw createError(400, 'Thuốc đã ngừng kinh doanh, không thể gửi cảnh báo')
  }
  if (Number(medicine.stock || 0) > Number(medicine.minStock || 10)) {
    throw createError(400, 'Thuốc này chưa dưới ngưỡng tồn kho')
  }

  const existing = await findPendingAlertByMedicine(medicineId)
  if (existing) {
    res.status(200).json(existing)
    return
  }

  const createdAt = new Date().toISOString()
  const alert = await createAlert({
    id: `ALT-${Date.now()}`,
    medicineId,
    stock: medicine.stock,
    minStock: medicine.minStock,
    note,
    createdBy,
    createdAt,
  })

  res.status(201).json(alert)
}

export async function patchAlertResolution(req, res) {
  const alert = await findAlert(req.params.id)
  if (!alert) {
    throw createError(404, 'Không tìm thấy cảnh báo')
  }
  if (alert.status !== 'PENDING') {
    throw createError(400, 'Cảnh báo đã được xử lý')
  }

  const { type, quantity, actualStock, reason } = req.body
  const medicine = await findMedicine(alert.medicineId)
  if (!medicine) {
    throw createError(404, 'Không tìm thấy thuốc')
  }
  let nextStock = Number(medicine.stock || 0)

  if (type === 'RECEIPT') {
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0) {
      throw createError(400, 'Số lượng nhập thêm không hợp lệ')
    }
    nextStock += qty
    await updateStock(alert.medicineId, nextStock)
  } else if (type === 'ADJUSTMENT') {
    const stock = Number(actualStock)
    if (!Number.isFinite(stock) || stock < 0) {
      throw createError(400, 'Số lượng tồn thực tế không hợp lệ')
    }
    nextStock = stock
    await updateStock(alert.medicineId, nextStock)
  } else if (type === 'REJECT') {
    await updateMedicineStatus(alert.medicineId, 'Ngừng kinh doanh')
  } else {
    throw createError(400, 'Phương án xử lý không hợp lệ')
  }

  const resolved = await resolveAlert(req.params.id, {
    status: type === 'REJECT' ? 'REJECTED' : 'RESOLVED',
    type,
    note: reason || '',
    resolvedAt: new Date().toISOString(),
  })

  res.json(resolved)
}
