import bcrypt from 'bcryptjs'
import { run } from '../config/database.js'
import { initDatabase } from './init.js'

const categories = [
  ['DM000001', 'Giảm đau'],
  ['DM000002', 'Dị ứng'],
  ['DM000003', 'Bổ sung'],
  ['DM000004', 'Tiêu hóa'],
  ['DM000005', 'Mắt mũi'],
  ['DM000006', 'Vật tư'],
]

const medicines = [
  {
    id: 'SP001',
    name: 'Paracetamol 500mg',
    categoryId: 'DM000001',
    type: 'Thuốc không kê đơn',
    unit: 'Viên',
    drugCode: 'VD-12345-19',
    costPrice: 11000,
    salePrice: 15000,
    stock: 120,
    ingredient: 'Paracetamol 500mg, Caffeine 65mg',
    usage: 'Giảm đau đầu, đau răng, hạ sốt nhanh',
    dosage: 'Người lớn: 1 viên/lần, không quá 4 lần/ngày.',
  },
  {
    id: 'SP002',
    name: 'Telfast BD',
    categoryId: 'DM000002',
    type: 'Thuốc không kê đơn',
    unit: 'Viên',
    drugCode: 'VN-8821-21',
    costPrice: 140000,
    salePrice: 162000,
    stock: 5,
    ingredient: 'Fexofenadine hydrochloride 60mg',
    usage: 'Điều trị các triệu chứng viêm mũi dị ứng, mề đay vô căn',
    dosage: 'Người lớn và trẻ em trên 12 tuổi: 1 viên x 2 lần/ngày.',
  },
  {
    id: 'SP003',
    name: 'Vitamin C',
    categoryId: 'DM000003',
    type: 'Thuốc không kê đơn',
    unit: 'Hộp',
    drugCode: 'VD-45551-20',
    costPrice: 70000,
    salePrice: 85000,
    stock: 0,
    ingredient: 'Acid Ascorbic 500mg',
    usage: 'Bổ sung vitamin C, tăng cường sức đề kháng cho cơ thể',
    dosage: 'Uống 1 viên/ngày sau bữa ăn.',
  },
  {
    id: 'SP004',
    name: 'Oresol vị cam',
    categoryId: 'DM000004',
    type: 'Thuốc không kê đơn',
    unit: 'Gói',
    drugCode: 'VD-78211-18',
    costPrice: 3200,
    salePrice: 5000,
    stock: 200,
    ingredient: 'Glucose khan, Natri clorid, Kali clorid',
    usage: 'Bù nước và điện giải trong các trường hợp tiêu chảy, sốt cao',
    dosage: 'Pha 1 gói với lượng nước theo hướng dẫn trên bao bì.',
  },
  {
    id: 'SP005',
    name: 'Ibuprofen 400mg',
    categoryId: 'DM000001',
    type: 'Thuốc không kê đơn',
    unit: 'Viên',
    drugCode: 'VD-92311-22',
    costPrice: 6200,
    salePrice: 7900,
    stock: 100,
    ingredient: 'Ibuprofen 400mg',
    usage: 'Giảm các cơn đau nhẹ đến vừa, chống viêm không steroid',
    dosage: 'Người lớn: 1 viên/lần x 2-3 lần/ngày. Uống sau ăn no.',
  },
  {
    id: 'SP006',
    name: 'Tràng Vị Khang',
    categoryId: 'DM000004',
    type: 'Thuốc không kê đơn',
    unit: 'Hộp',
    drugCode: 'VD-71121-17',
    costPrice: 70000,
    salePrice: 90000,
    stock: 15,
    ingredient: 'Chiết xuất thảo dược tự nhiên',
    usage: 'Hỗ trợ giảm viêm đại tràng cấp và mãn tính, tiêu hóa kém',
    dosage: 'Uống theo hướng dẫn trên bao bì hoặc chỉ định của dược sĩ.',
  },
  {
    id: 'SP007',
    name: 'Nước muối sinh lý',
    categoryId: 'DM000005',
    type: 'Thuốc không kê đơn',
    unit: 'Chai',
    drugCode: 'VD-10101-19',
    costPrice: 4200,
    salePrice: 6000,
    stock: 500,
    ingredient: 'Natri clorid 0.9%',
    usage: 'Rửa mắt, mũi, súc miệng kháng khuẩn hàng ngày',
    dosage: 'Dùng trực tiếp ngoài da, mắt, mũi theo nhu cầu.',
  },
  {
    id: 'SP008',
    name: 'Khẩu trang y tế',
    categoryId: 'DM000006',
    type: 'Vật tư y tế',
    unit: 'Hộp',
    drugCode: '',
    costPrice: 24000,
    salePrice: 35000,
    stock: 80,
    ingredient: 'Vải không dệt 4 lớp, giấy kháng khuẩn',
    usage: 'Lọc bụi mịn, kháng khuẩn, bảo vệ đường hô hấp',
    dosage: 'Đeo che kín mũi và miệng, thay mới sau mỗi lần sử dụng.',
  },
]

const customers = [
  ['KH000001', 'Nguyễn Văn An', '0901234567', 'Nam', '', null, '', 1944000],
  ['KH000002', 'Trần Thị Bích', '0987654321', 'Nữ', '', null, '', 500000],
  ['KH000003', 'Lê Hoàng Hải', '0912223334', 'Nam', '', null, '', 197500],
]

const invoices = [
  {
    id: 'HD00105',
    employeeId: 'NV001',
    customerId: 'KH000001',
    customerName: 'Nguyễn Văn An',
    phone: '0901234567',
    date: '2026-04-06T14:30:00.000Z',
    total: 1944000,
    status: 'Hoàn thành',
    lines: [{ id: 'SP002', name: 'Telfast BD', unit: 'Viên', qty: 12, price: 162000 }],
  },
  {
    id: 'HD00104',
    employeeId: 'NV002',
    customerId: null,
    customerName: 'Khách lẻ',
    phone: '',
    date: '2026-04-06T10:15:00.000Z',
    total: 750000,
    status: 'Hoàn thành',
    lines: [{ id: 'SP001', name: 'Paracetamol 500mg', unit: 'Viên', qty: 50, price: 15000 }],
  },
  {
    id: 'HD00103',
    employeeId: 'NV001',
    customerId: 'KH000002',
    customerName: 'Trần Thị Bích',
    phone: '0987654321',
    date: '2026-04-05T16:45:00.000Z',
    total: 500000,
    status: 'Hoàn thành',
    lines: [{ id: 'SP004', name: 'Oresol vị cam', unit: 'Gói', qty: 100, price: 5000 }],
  },
  {
    id: 'HD00102',
    employeeId: 'NV001',
    customerId: 'KH000003',
    customerName: 'Lê Hoàng Hải',
    phone: '0912223334',
    date: '2026-04-05T09:20:00.000Z',
    total: 197500,
    status: 'Đã hủy',
    lines: [{ id: 'SP005', name: 'Ibuprofen 400mg', unit: 'Viên', qty: 25, price: 7900 }],
  },
]

async function seed() {
  await initDatabase()
  await run('BEGIN TRANSACTION')
  try {
    await run('DELETE FROM SalesInvoiceLine')
    await run('DELETE FROM SalesInvoice')
    await run('DELETE FROM MedicineStock')
    await run('DELETE FROM Medicine')
    await run('DELETE FROM MedicineCategory')
    await run('DELETE FROM Customer')
    await run('DELETE FROM Employee')
    await run('DELETE FROM Role')

    await run("INSERT INTO Role (RoleId, RoleName) VALUES ('ADMIN', 'Admin')")
    await run("INSERT INTO Role (RoleId, RoleName) VALUES ('STAFF', 'Nhân viên bán hàng')")

    const adminHash = await bcrypt.hash('123456', 10)
    const staffHash = await bcrypt.hash('123456', 10)
    await run(
      `INSERT INTO Employee
        (EmployeeId, FullName, Phone, Email, Username, PasswordHash, RoleId, IsActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['NV001', 'Quản trị viên', '0901111222', 'admin@gmail.com', 'admin01', adminHash, 'ADMIN', 1],
    )
    await run(
      `INSERT INTO Employee
        (EmployeeId, FullName, Phone, Email, Username, PasswordHash, RoleId, IsActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['NV002', 'Nhân viên', '0988333444', 'staff@gmail.com', 'staff01', staffHash, 'STAFF', 1],
    )

    for (const [id, name] of categories) {
      await run('INSERT INTO MedicineCategory (CategoryId, CategoryName) VALUES (?, ?)', [id, name])
    }

    for (const item of medicines) {
      await run(
        `INSERT INTO Medicine
          (MedicineId, MedicineName, CategoryId, ProductType, UnitName, DrugRegistrationCode,
           CostPrice, SalePrice, Ingredient, Usage, Dosage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.name,
          item.categoryId,
          item.type,
          item.unit,
          item.drugCode,
          item.costPrice,
          item.salePrice,
          item.ingredient,
          item.usage,
          item.dosage,
        ],
      )
      await run('INSERT INTO MedicineStock (MedicineId, QuantityOnHand) VALUES (?, ?)', [
        item.id,
        item.stock,
      ])
    }

    for (const customer of customers) {
      await run(
        `INSERT INTO Customer
          (CustomerId, CustomerName, Phone, Gender, Email, DateOfBirth, Address, TotalSpent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        customer,
      )
    }

    for (const invoice of invoices) {
      await run(
        `INSERT INTO SalesInvoice
          (InvoiceId, EmployeeId, CustomerId, CustomerNameSnapshot, PhoneSnapshot,
           InvoiceDate, TotalAmount, Status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoice.id,
          invoice.employeeId,
          invoice.customerId,
          invoice.customerName,
          invoice.phone,
          invoice.date,
          invoice.total,
          invoice.status,
        ],
      )

      for (const [index, line] of invoice.lines.entries()) {
        await run(
          `INSERT INTO SalesInvoiceLine
            (LineId, InvoiceId, MedicineId, MedicineNameSnapshot, UnitSnapshot,
             Quantity, UnitPrice, LineTotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `${invoice.id}-L${index + 1}`,
            invoice.id,
            line.id,
            line.name,
            line.unit,
            line.qty,
            line.price,
            line.qty * line.price,
          ],
        )
      }
    }

    await run('COMMIT')
    console.log('Seed database thành công.')
    console.log('Admin: admin@gmail.com / 123456')
    console.log('Staff: staff@gmail.com / 123456')
  } catch (error) {
    await run('ROLLBACK')
    throw error
  }
}

seed().catch((error) => {
  console.error('Seed database thất bại:', error)
  process.exit(1)
})
