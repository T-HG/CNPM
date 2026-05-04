import {
  createCategory,
  createMedicine,
  findMedicine,
  findMedicineIdByNameAndUnit,
  increaseStock,
  listCategories,
  listMedicines,
  removeMedicine,
  updateMedicine,
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
  const body = req.body
  const name = (body.name || '').trim()
  if (!name) {
    throw createError(400, 'Tên thuốc là bắt buộc')
  }

  const type = body.type || 'Thuốc không kê đơn'
  const unit = (body.unit || 'Viên').trim() || 'Viên'
  const addQty = Number(body.stock ?? 0)
  if (Number.isNaN(addQty) || addQty < 0) {
    throw createError(400, 'Số lượng tồn không hợp lệ')
  }

  const idFromClient = typeof body.id === 'string' ? body.id.trim() : body.id ? String(body.id).trim() : ''

  if (idFromClient) {
    const byId = await findMedicine(idFromClient)
    if (byId) {
      if (addQty > 0) await increaseStock(idFromClient, addQty)
      return res.status(200).json(await findMedicine(idFromClient))
    }
  }

  const dupId = await findMedicineIdByNameAndUnit(name, unit)
  if (dupId) {
    throw createError(
      409,
      'Đã có thuốc trùng tên và đơn vị đóng gói. Vui lòng đổi tên hoặc đơn vị, hoặc cập nhật trên dòng thuốc hiện có.',
    )
  }

  const payload = {
    ...body,
    name,
    id: idFromClient || nextCode('SP', medicines.length + 1),
    type,
    unit,
    stock: addQty,
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

export async function patchMedicine(req, res) {
  const existing = await findMedicine(req.params.id)
  if (!existing) throw createError(404, 'Không tìm thấy thuốc')

  const body = req.body
  const name = (body.name || '').trim()
  if (!name) {
    throw createError(400, 'Tên thuốc là bắt buộc')
  }

  const type = body.type || 'Thuốc không kê đơn'
  const unit = (body.unit || 'Viên').trim() || 'Viên'
  const stock = Number(body.stock ?? 0)
  if (Number.isNaN(stock) || stock < 0) {
    throw createError(400, 'Số lượng tồn không hợp lệ')
  }

  const dupId = await findMedicineIdByNameAndUnit(name, unit)
  if (dupId && dupId !== req.params.id) {
    throw createError(
      409,
      'Tên thuốc và đơn vị đóng gói trùng với một thuốc khác trong hệ thống.',
    )
  }

  const updated = await updateMedicine(req.params.id, {
    name,
    type,
    unit,
    categoryId: body.categoryId ?? null,
    drugCode: body.drugCode || '',
    costPrice: body.costPrice,
    salePrice: body.salePrice ?? body.price,
    stock,
    ingredient: body.ingredient,
    usage: body.usage,
    dosage: body.dosage,
  })
  res.json(updated)
}

export async function deleteMedicine(req, res) {
  const outcome = await removeMedicine(req.params.id)
  if (!outcome.removed && outcome.reason === 'NOT_FOUND') {
    throw createError(404, 'Không tìm thấy thuốc')
  }
  if (!outcome.removed && outcome.reason === 'HAS_SALES_HISTORY') {
    throw createError(
      409,
      'Không thể xóa thuốc đã có trong lịch sử bán hàng. Ngừng kinh doanh thay cho xóa nếu cần.',
    )
  }
  res.status(204).send()
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
