import { run } from '../config/database.js'
import {
  addCustomerSpending,
  countCustomers,
  subtractCustomerSpending,
  upsertCustomer,
} from '../models/CustomerModel.js'
import { decreaseStock, findMedicine, increaseStock } from '../models/MedicineModel.js'
import {
  createInvoice,
  findInvoice,
  listInvoices,
  listInvoiceLinesForStock,
  revenueSummary,
  updateInvoiceStatus,
} from '../models/InvoiceModel.js'
import { createError } from '../utils/http.js'
import { invoiceCode, lineCode, nextCode } from '../utils/ids.js'

export async function getInvoices(req, res) {
  res.json(await listInvoices())
}

export async function postInvoice(req, res) {
  const { customerName, phone, employeeId, items = [] } = req.body
  if (!customerName || !phone) {
    throw createError(400, 'Tên khách hàng và số điện thoại là bắt buộc')
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw createError(400, 'Hóa đơn phải có ít nhất một sản phẩm')
  }

  const normalizedLines = []
  for (const [index, item] of items.entries()) {
    const medicine = await findMedicine(item.id || item.medicineId)
    const qty = Number(item.qty || item.quantity || 0)
    if (!medicine) throw createError(404, `Không tìm thấy thuốc ${item.id}`)
    if (qty <= 0) throw createError(400, 'Số lượng bán phải lớn hơn 0')
    if (Number(medicine.stock || 0) < qty) {
      throw createError(409, `${medicine.name} chỉ còn ${medicine.stock} ${medicine.unit}`)
    }

    const price = Number(item.price || medicine.salePrice || 0)
    normalizedLines.push({
      lineId: lineCode(index),
      id: medicine.id,
      name: medicine.name,
      unit: medicine.unit,
      qty,
      price,
      total: qty * price,
    })
  }

  const total = normalizedLines.reduce((sum, item) => sum + item.total, 0)
  const customerCount = await countCustomers()
  const customer = await upsertCustomer({
    customerId: nextCode('KH', customerCount + 1),
    name: customerName,
    phone,
  })

  const invoice = {
    id: req.body.id || invoiceCode(),
    employeeId: employeeId || req.user?.employeeId || null,
    customerId: customer.CustomerId,
    customerName,
    phone,
    createdAt: new Date().toISOString(),
    total,
    status: req.body.status || 'Hoàn thành',
  }

  await run('BEGIN TRANSACTION')
  try {
    await createInvoice(invoice, normalizedLines)
    for (const line of normalizedLines) {
      await decreaseStock(line.id, line.qty)
    }
    await addCustomerSpending(customer.CustomerId, total)
    await run('COMMIT')
  } catch (error) {
    await run('ROLLBACK')
    throw error
  }

  res.status(201).json({ ...invoice, items: normalizedLines })
}

export async function patchInvoiceStatus(req, res) {
  const validStatuses = ['Hoàn thành', 'Đã hủy']
  if (!validStatuses.includes(req.body.status)) {
    throw createError(400, 'Trạng thái hóa đơn không hợp lệ')
  }

  const currentInvoice = await findInvoice(req.params.id)
  if (!currentInvoice) throw createError(404, 'Không tìm thấy hóa đơn')

  if (currentInvoice.status === req.body.status) {
    res.json(currentInvoice)
    return
  }

  const lines = await listInvoiceLinesForStock(req.params.id)
  await run('BEGIN TRANSACTION')
  try {
    if (req.body.status === 'Đã hủy' && currentInvoice.status !== 'Đã hủy') {
      for (const line of lines) {
        await increaseStock(line.id, Number(line.qty || 0))
      }
      if (currentInvoice.customerId) {
        await subtractCustomerSpending(currentInvoice.customerId, currentInvoice.total)
      }
    }

    if (currentInvoice.status === 'Đã hủy' && req.body.status !== 'Đã hủy') {
      for (const line of lines) {
        const medicine = await findMedicine(line.id)
        const qty = Number(line.qty || 0)
        if (!medicine) throw createError(404, `Không tìm thấy thuốc ${line.id}`)
        if (Number(medicine.stock || 0) < qty) {
          throw createError(409, `${medicine.name} chỉ còn ${medicine.stock} ${medicine.unit}`)
        }
        await decreaseStock(line.id, qty)
      }
      if (currentInvoice.customerId) {
        await addCustomerSpending(currentInvoice.customerId, currentInvoice.total)
      }
    }

    const invoice = await updateInvoiceStatus(req.params.id, req.body.status)
    await run('COMMIT')
    res.json(invoice)
  } catch (error) {
    await run('ROLLBACK')
    throw error
  }
}

export async function getRevenueSummary(req, res) {
  res.json(await revenueSummary())
}
