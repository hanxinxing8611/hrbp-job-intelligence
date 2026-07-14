const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, 'data', 'jobs.db')

const db = new sqlite3.Database(dbPath)

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      companyId TEXT PRIMARY KEY,
      name TEXT,
      industry TEXT,
      scale TEXT,
      stage TEXT,
      founded TEXT,
      headquarters TEXT,
      description TEXT,
      logo TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      jobId TEXT PRIMARY KEY,
      title TEXT,
      companyId TEXT,
      city TEXT,
      district TEXT,
      experience TEXT,
      education TEXT,
      salaryRange TEXT,
      salaryMin INTEGER,
      salaryMax INTEGER,
      tags TEXT,
      source TEXT,
      postedAt TEXT,
      heat INTEGER,
      growth REAL,
      url TEXT,
      responsibilities TEXT,
      requirements TEXT,
      benefits TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (companyId) REFERENCES companies(companyId)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS crawl_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT,
      count INTEGER,
      status TEXT,
      startTime DATETIME,
      endTime DATETIME,
      error TEXT
    )
  `)

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city)
  `)

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_jobs_companyId ON jobs(companyId)
  `)

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source)
  `)
})

module.exports = db
