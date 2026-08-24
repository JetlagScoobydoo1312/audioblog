CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  day_number INTEGER,
  title TEXT NOT NULL,
  place TEXT,
  body TEXT NOT NULL DEFAULT '',
  audio_key TEXT,
  audio_type TEXT,
  audio_bytes INTEGER,
  duration INTEGER,
  published_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_episodes_published ON episodes (published_at DESC);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_id INTEGER NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  media_key TEXT NOT NULL,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_photos_episode ON photos (episode_id, sort_order);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_id INTEGER NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  audio_key TEXT,
  audio_type TEXT,
  duration INTEGER,
  created_at TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_comments_episode ON comments (episode_id, created_at);
