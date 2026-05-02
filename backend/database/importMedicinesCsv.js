import fs from 'node:fs/promises'
import path from 'node:path'
import { run } from '../config/database.js'
import { initDatabase } from './init.js'

const csvPath = process.argv[2]

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)
  return values
}

function parseCsv(content) {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean)
  const headers = parseCsvLine(lines[0]).map((item) => item.trim())

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return headers.reduce((row, header, index) => {
      row[header] = values[index]?.trim() || ''
      return row
    }, {})
  })
}

function nextCategoryId(index) {
  return `CAT${String(index + 1).padStart(5, '0')}`
}

async function importMedicines() {
  if (!csvPath) {
    throw new Error('Vui lòng truyền đường dẫn file CSV. Ví dụ: node backend/database/importMedicinesCsv.js C:\\path\\medicine_ready.csv')
  }

  const absoluteCsvPath = path.resolve(csvPath)
  const content = await fs.readFile(absoluteCsvPath, 'utf8')
  const rows = parseCsv(content)
  const categoryMap = new Map()
  let insertedMedicines = 0

  await initDatabase()
  await run('BEGIN TRANSACTION')

  try {
    for (const row of rows) {
      const categoryName = row.CategoryId || 'Chưa phân loại'
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, nextCategoryId(categoryMap.size))
      }

      const categoryId = categoryMap.get(categoryName)
      await run(
        `INSERT INTO MedicineCategory (CategoryId, CategoryName)
         VALUES (?, ?)
         ON CONFLICT(CategoryName) DO UPDATE SET CategoryName = excluded.CategoryName`,
        [categoryId, categoryName],
      )

      await run(
        `INSERT INTO Medicine
          (MedicineId, MedicineName, CategoryId, ProductType, UnitName, DrugRegistrationCode,
           CostPrice, SalePrice, Ingredient, Usage, Dosage)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(MedicineId) DO UPDATE SET
           MedicineName = excluded.MedicineName,
           CategoryId = excluded.CategoryId,
           ProductType = excluded.ProductType,
           UnitName = excluded.UnitName,
           DrugRegistrationCode = excluded.DrugRegistrationCode,
           CostPrice = excluded.CostPrice,
           SalePrice = excluded.SalePrice,
           Ingredient = excluded.Ingredient,
           Usage = excluded.Usage,
           Dosage = excluded.Dosage`,
        [
          row.MedicineId,
          row.MedicineName,
          categoryId,
          row.ProductType || 'Thuốc không kê đơn',
          row.UnitName || 'Chưa cập nhật',
          row.DrugRegistrationCode || '',
          Number(row.CostPrice || 0),
          Number(row.SalePrice || 0),
          row.Ingredient || '',
          row.Usage || '',
          row.Dosage || '',
        ],
      )

      await run(
        `INSERT INTO MedicineStock (MedicineId, QuantityOnHand)
         VALUES (?, 0)
         ON CONFLICT(MedicineId) DO NOTHING`,
        [row.MedicineId],
      )

      insertedMedicines += 1
    }

    await run('COMMIT')
    console.log(`Import thành công ${insertedMedicines} thuốc từ ${absoluteCsvPath}`)
    console.log(`Số danh mục phát hiện: ${categoryMap.size}`)
    console.log('Tồn kho mặc định cho thuốc mới: 0')
  } catch (error) {
    await run('ROLLBACK')
    throw error
  }
}

importMedicines().catch((error) => {
  console.error('Import thuốc thất bại:', error)
  process.exit(1)
})
