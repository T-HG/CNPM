import {
  createCategory,
  createMedicine,
  findMedicine,
  listCategories,
  listMedicines,
  updateStock,
} from '../models/MedicineModel.js'
import { createError } from '../utils/http.js'
import { nextCode } from '../utils/ids.js'

export async function getMedicines(req, res) {
  res.json(await listMedicines())
}

export async function getMedicine(req, res) {
  const medicine = await findMedicine(req.params.id)
  if (!medicine) throw createError(404, 'Không tìm thấy thuốc')
  res.json(medicine)
}

export async function postMedicine(req, res) {
  const medicines = await listMedicines()
  const payload = {
    ...req.body,
    id: req.body.id || nextCode('SP', medicines.length + 1),
    type: req.body.type || 'Thuốc không kê đơn',
    unit: req.body.unit || 'Viên',
  }

  if (!payload.name) {
    throw createError(400, 'Tên thuốc là bắt buộc')
  }

  const created = await createMedicine(payload)
  res.status(201).json(created)
}

export async function patchMedicineStock(req, res) {
  const { quantityOnHand, stock } = req.body
  const nextStock = quantityOnHand ?? stock
  if (nextStock === undefined || Number(nextStock) < 0) {
    throw createError(400, 'Số lượng tồn không hợp lệ')
  }

  const medicine = await updateStock(req.params.id, nextStock)
  if (!medicine) throw createError(404, 'Không tìm thấy thuốc')
  res.json(medicine)
}

export async function getCategories(req, res) {
  res.json(await listCategories())
}

export async function postCategory(req, res) {
  const { id, name } = req.body
  if (!name) throw createError(400, 'Tên danh mục là bắt buộc')
  const categories = await listCategories()
  const created = await createCategory({
    id: id || nextCode('DM', categories.length + 1),
    name,
  })
  res.status(201).json(created)
}
