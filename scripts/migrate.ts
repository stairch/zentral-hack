// Script to migrate production database

import { query, getClient, endPool } from "@/lib/db"
import fs from "fs"
import path from "path"

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const { rows } = await query("SELECT filename FROM _migrations")
  const appliedSet = new Set(rows.map((r) => r.filename))

  const dir = path.join(process.cwd(), "migrations")
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`⏭️  skipped: ${file}`)
      continue
    }

    const content = fs.readFileSync(path.join(dir, file), "utf-8")
    const client = await getClient()
    try {
      await client.query("BEGIN")
      await client.query(content)
      await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [file])
      await client.query("COMMIT")
      console.log(`✅ applied: ${file}`)
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  }

  console.log("Migration complete.")
  await endPool()
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
