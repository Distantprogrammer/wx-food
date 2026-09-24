-- HowToCook 抓取数据 (SQLite, 中文)
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name TEXT
);
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY,
  title TEXT,
  category_slug TEXT REFERENCES categories(slug),
  difficulty INTEGER,
  calories INTEGER,
  likes INTEGER,
  favorites INTEGER,
  last_updated TEXT,
  github_path TEXT,
  cover_image TEXT,
  summary TEXT,
  ingredients_html TEXT,
  calculation TEXT,
  calculation_html TEXT,
  steps_html TEXT,
  notes_html TEXT,
  markdown_html TEXT
);
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id INTEGER REFERENCES recipes(id),
  pos INTEGER,
  name TEXT,
  PRIMARY KEY (recipe_id, pos)
);
CREATE TABLE IF NOT EXISTS recipe_steps (
  recipe_id INTEGER REFERENCES recipes(id),
  pos INTEGER,
  text TEXT,
  PRIMARY KEY (recipe_id, pos)
);
CREATE TABLE IF NOT EXISTS recipe_images (
  recipe_id INTEGER REFERENCES recipes(id),
  pos INTEGER,
  url TEXT,
  local_file TEXT,
  PRIMARY KEY (recipe_id, pos)
);
CREATE TABLE IF NOT EXISTS recipe_calculation_items (
  recipe_id INTEGER REFERENCES recipes(id),
  pos INTEGER,
  item TEXT,
  PRIMARY KEY (recipe_id, pos)
);
CREATE TABLE IF NOT EXISTS tips (
  id INTEGER PRIMARY KEY,
  title TEXT,
  summary TEXT,
  markdown_html TEXT
);
CREATE TABLE IF NOT EXISTS tip_images (
  tip_id INTEGER REFERENCES tips(id),
  pos INTEGER,
  url TEXT,
  local_file TEXT,
  PRIMARY KEY (tip_id, pos)
);
