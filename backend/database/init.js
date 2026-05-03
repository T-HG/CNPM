import fs from 'node:fs/promises'
import path from 'node:path'
import { exec, run } from '../config/database.js'

export async function initDatabase() {
  const schemaPath = path.resolve(process.cwd(), 'backend', 'database', 'schema.sql')
  const schema = await fs.readFile(schemaPath, 'utf8')
  await exec(schema)
  try {
    await run(
      "ALTER TABLE Medicine ADD COLUMN MedicineStatus NVARCHAR(30) NOT NULL DEFAULT 'Đang kinh doanh'",
    )
  } catch (error) {
    if (!String(error.message || '').includes('duplicate column name')) {
      throw error
    }
  }
  await run("UPDATE SalesInvoice SET Status = 'Hoàn thành' WHERE Status = 'Đang xử lý'")
}
