const fs = require('node:fs')
const path = require('node:path')
const { DatabaseSync } = require('node:sqlite')

const PUBLICATIONS_SQL = `
  CREATE TABLE publications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    publish_date TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    draft_media_id TEXT,
    publish_id TEXT,
    article_url TEXT,
    last_error TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TEXT,
    last_status_check_at TEXT,
    article_title TEXT,
    article_digest TEXT,
    article_content TEXT
  );
  CREATE INDEX publications_recipe_idx ON publications(recipe_id, id DESC);
  CREATE INDEX publications_date_idx ON publications(publish_date, id DESC);
  CREATE INDEX publications_status_idx ON publications(status, updated_at);
`

function publicationsAreCurrent(db) {
  const idColumn = db.prepare('PRAGMA table_info(publications)').all().find((column) => column.name === 'id')
  return Boolean(idColumn && idColumn.pk === 1)
}

function ensurePublications(db) {
  if (publicationsAreCurrent(db)) return
  const legacy = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'publications'").get()
  if (!legacy) {
    db.exec(PUBLICATIONS_SQL)
    return
  }
  // 旧表把菜品和日期都做成了唯一键。迁移后同一道菜、同一天都可以有多条手动记录。
  db.exec(`
    BEGIN IMMEDIATE;
    DROP INDEX IF EXISTS publications_status_idx;
    ALTER TABLE publications RENAME TO publications_legacy;
    ${PUBLICATIONS_SQL}
    INSERT INTO publications (
      recipe_id, publish_date, title, status, source, draft_media_id, publish_id,
      article_url, last_error, created_at, updated_at, published_at, last_status_check_at
    )
    SELECT
      recipe_id, publish_date, title, status, source, draft_media_id, publish_id,
      article_url, last_error, created_at, updated_at, published_at, last_status_check_at
    FROM publications_legacy;
    DROP TABLE publications_legacy;
    COMMIT;
  `)
}

function openDatabase(filename = path.resolve(__dirname, '../storage/publisher.sqlite')) {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true })
  const db = new DatabaseSync(filename)
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER NOT NULL DEFAULT 0,
      publish_hour INTEGER NOT NULL DEFAULT 18 CHECK (publish_hour BETWEEN 0 AND 23),
      override_date TEXT,
      override_recipe_id INTEGER
    );
    INSERT OR IGNORE INTO settings (id) VALUES (1);
  `)
  ensurePublications(db)
  const hasColumn = (table, column) => db.prepare(`PRAGMA table_info(${table})`).all()
    .some((item) => item.name === column)
  if (!hasColumn('settings', 'template_id')) {
    db.exec("ALTER TABLE settings ADD COLUMN template_id TEXT NOT NULL DEFAULT 'classic'")
  }
  if (!hasColumn('publications', 'template_id')) {
    db.exec("ALTER TABLE publications ADD COLUMN template_id TEXT NOT NULL DEFAULT 'classic'")
  }
  for (const column of ['article_title', 'article_digest', 'article_content']) {
    if (!hasColumn('publications', column)) db.exec(`ALTER TABLE publications ADD COLUMN ${column} TEXT`)
  }

  const api = {
    close: () => db.close(),
    settings: () => db.prepare('SELECT * FROM settings WHERE id = 1').get(),
    updateSettings: ({ enabled, publishHour, templateId }) => {
      db.prepare('UPDATE settings SET enabled = ?, publish_hour = ?, template_id = ? WHERE id = 1')
        .run(enabled ? 1 : 0, publishHour, templateId ?? api.settings().template_id)
      return api.settings()
    },
    setToday: (date, recipeId) => {
      db.prepare('UPDATE settings SET override_date = ?, override_recipe_id = ? WHERE id = 1')
        .run(date, recipeId)
      return api.settings()
    },
    allRecords: () => db.prepare('SELECT * FROM publications ORDER BY publish_date DESC, id DESC').all(),
    recentRecords: (limit = 10) => db.prepare('SELECT * FROM publications ORDER BY publish_date DESC, id DESC LIMIT ?').all(limit),
    history: (status, limit, offset) => status
      ? db.prepare('SELECT * FROM publications WHERE status = ? ORDER BY publish_date DESC, id DESC LIMIT ? OFFSET ?').all(status, limit, offset)
      : db.prepare('SELECT * FROM publications ORDER BY publish_date DESC, id DESC LIMIT ? OFFSET ?').all(limit, offset),
    historyCount: (status) => status
      ? db.prepare('SELECT count(*) AS count FROM publications WHERE status = ?').get(status).count
      : db.prepare('SELECT count(*) AS count FROM publications').get().count,
    usedIds: () => new Set(db.prepare('SELECT DISTINCT recipe_id FROM publications').all().map((item) => item.recipe_id)),
    publishedIds: () => new Set(db.prepare(`SELECT DISTINCT recipe_id FROM publications WHERE status = 'published'`).all().map((item) => item.recipe_id)),
    hasPublished: (id) => Boolean(db.prepare(`SELECT 1 AS ok FROM publications WHERE recipe_id = ? AND status = 'published' LIMIT 1`).get(Number(id))),
    byId: (id) => db.prepare('SELECT * FROM publications WHERE id = ?').get(Number(id)),
    byRecipe: (id) => db.prepare('SELECT * FROM publications WHERE recipe_id = ? ORDER BY id DESC LIMIT 1').get(Number(id)),
    recordsByDate: (date) => db.prepare('SELECT * FROM publications WHERE publish_date = ? ORDER BY id DESC').all(date),
    timerRecord: (date) => db.prepare(`SELECT * FROM publications WHERE publish_date = ? AND source = 'timer' ORDER BY id DESC LIMIT 1`).get(date),
    reserve: (recipe, date, source, templateId = 'classic') => {
      const result = db.prepare('INSERT INTO publications (recipe_id, publish_date, title, status, source, template_id) VALUES (?, ?, ?, ?, ?, ?)')
        .run(recipe.recipeId, date, recipe.title, 'preparing', source, templateId)
      return api.byId(result.lastInsertRowid)
    },
    transition: (id, from, to, extra = {}) => {
      const allowed = ['draft_media_id', 'publish_id', 'article_url', 'last_error', 'published_at', 'last_status_check_at']
      const entries = Object.entries(extra).filter(([key]) => allowed.includes(key))
      const set = ['status = ?', 'updated_at = CURRENT_TIMESTAMP', ...entries.map(([key]) => `${key} = ?`)]
      const values = [to, ...entries.map(([, value]) => value), Number(id)]
      const where = from === null ? '' : ' AND status = ?'
      if (from !== null) values.push(from)
      const result = db.prepare(`UPDATE publications SET ${set.join(', ')} WHERE id = ?${where}`).run(...values)
      return result.changes === 1
    },
    release: (id) => db.prepare(`DELETE FROM publications WHERE id = ? AND status = 'needs_review'
      AND draft_media_id IS NULL AND publish_id IS NULL`).run(Number(id)).changes === 1,
    setTemplate: (id, templateId) => db.prepare(`UPDATE publications SET template_id = ?, last_error = NULL,
      updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'draft' AND publish_id IS NULL`)
      .run(templateId, Number(id)).changes === 1,
    saveArticle: (id, { templateId, title, digest, content }) => db.prepare(`UPDATE publications
      SET template_id = ?, article_title = ?, article_digest = ?, article_content = ?, last_error = NULL,
      updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'draft' AND publish_id IS NULL`)
      .run(templateId, title, digest, content, Number(id)).changes === 1,
    removeDraft: (id) => db.prepare(`DELETE FROM publications WHERE id = ? AND status = 'draft' AND publish_id IS NULL`)
      .run(Number(id)).changes === 1
  }
  return api
}

module.exports = { openDatabase }
