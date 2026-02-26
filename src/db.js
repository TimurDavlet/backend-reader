import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    onnotice: () => {}, // подавляем замечания IF NOT EXISTS
  });

// Инициализация схемы
await sql`
  CREATE TABLE IF NOT EXISTS books (
    id          TEXT    PRIMARY KEY,
    title       TEXT    NOT NULL,
    author      TEXT    NOT NULL,
    cover_url   TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    author_note TEXT    NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS chapters (
    id          TEXT    NOT NULL,
    book_id     TEXT    NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (id, book_id)
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS pages (
    id          SERIAL  PRIMARY KEY,
    chapter_id  TEXT    NOT NULL,
    book_id     TEXT    NOT NULL,
    number      INTEGER NOT NULL,
    title       TEXT,
    FOREIGN KEY (chapter_id, book_id) REFERENCES chapters(id, book_id) ON DELETE CASCADE,
    UNIQUE (chapter_id, book_id, number)
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS page_images (
    id                  SERIAL  PRIMARY KEY,
    page_id             INTEGER NOT NULL UNIQUE REFERENCES pages(id) ON DELETE CASCADE,
    url                 TEXT    NOT NULL,
    position            TEXT    NOT NULL DEFAULT 'top',
    width               INTEGER,
    height              INTEGER NOT NULL DEFAULT 250,
    alt                 TEXT    NOT NULL DEFAULT '',
    after_paragraph_id  TEXT,
    float_paragraph_id  TEXT
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS paragraphs (
    id          TEXT    PRIMARY KEY,
    page_id     INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    text        TEXT    NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS translations_pages (
    page_id     INTEGER PRIMARY KEY REFERENCES pages(id) ON DELETE CASCADE,
    text        TEXT    NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS translations_paragraphs (
    paragraph_id TEXT PRIMARY KEY REFERENCES paragraphs(id) ON DELETE CASCADE,
    text         TEXT NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS dictionary (
    id          SERIAL  PRIMARY KEY,
    book_id     TEXT    REFERENCES books(id) ON DELETE CASCADE,
    word        TEXT    NOT NULL,
    translation TEXT    NOT NULL,
    UNIQUE (book_id, word)
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS audio_pages (
    id          SERIAL  PRIMARY KEY,
    page_id     INTEGER NOT NULL UNIQUE REFERENCES pages(id) ON DELETE CASCADE,
    url         TEXT    NOT NULL,
    duration    REAL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS audio_paragraphs (
    id           SERIAL  PRIMARY KEY,
    paragraph_id TEXT    NOT NULL UNIQUE REFERENCES paragraphs(id) ON DELETE CASCADE,
    url          TEXT    NOT NULL,
    duration     REAL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS articles (
    id          TEXT    PRIMARY KEY,
    title       TEXT    NOT NULL,
    author      TEXT    NOT NULL DEFAULT '',
    cover_url   TEXT,
    description TEXT    NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS article_paragraphs (
    id          TEXT    PRIMARY KEY,
    article_id  TEXT    NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    text        TEXT    NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS article_images (
    id                 SERIAL  PRIMARY KEY,
    article_id         TEXT    NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    url                TEXT    NOT NULL,
    position           TEXT    NOT NULL DEFAULT 'top',
    width              INTEGER,
    height             INTEGER NOT NULL DEFAULT 250,
    alt                TEXT    NOT NULL DEFAULT '',
    after_paragraph_id TEXT
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS article_translations (
    paragraph_id TEXT PRIMARY KEY REFERENCES article_paragraphs(id) ON DELETE CASCADE,
    text         TEXT NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS article_translations_full (
    article_id  TEXT PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
    text        TEXT NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS audio_articles (
    article_id  TEXT PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    duration    REAL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS audio_article_paragraphs (
    paragraph_id TEXT PRIMARY KEY REFERENCES article_paragraphs(id) ON DELETE CASCADE,
    url          TEXT NOT NULL,
    duration     REAL
  )
`;

// Индексы
await sql`CREATE INDEX IF NOT EXISTS idx_chapters_book   ON chapters(book_id)`;
await sql`CREATE INDEX IF NOT EXISTS idx_pages_chapter   ON pages(chapter_id, book_id)`;
await sql`CREATE INDEX IF NOT EXISTS idx_paragraphs_page ON paragraphs(page_id)`;
await sql`CREATE INDEX IF NOT EXISTS idx_dict_word       ON dictionary(word)`;
await sql`CREATE INDEX IF NOT EXISTS idx_dict_book_word  ON dictionary(book_id, word)`;

export default sql;