import sqlite3 from 'sqlite3'
import { env } from '../config/env.js'

sqlite3.verbose()

function all(database, sql, params = []) {
  return new Promise((resolve, reject) => {
    database.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function main() {
  const file = env.databaseFile
  console.log('Database file:', file)
  const db = new sqlite3.Database(file)

  try {
    const tables = await all(
      db,
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
    )

    for (const row of tables) {
      const name = row.name
      const [{ n }] = await all(db, `SELECT COUNT(*) AS n FROM "${name}"`)
      console.log(`\n=== ${name} (${n} rows) — tối đa 5 dòng mẫu ===`)
      const sample = await all(db, `SELECT * FROM "${name}" LIMIT 5`)
      console.log(JSON.stringify(sample, null, 2))
    }
  } finally {
    db.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
