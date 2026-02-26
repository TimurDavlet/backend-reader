import sql from '../db.js';

export async function getPageTranslation(bookId, chapterId, pageNumber) {
  const [row] = await sql`
    SELECT tp.text FROM translations_pages tp
    JOIN pages p ON p.id = tp.page_id
    WHERE p.book_id = ${bookId} AND p.chapter_id = ${chapterId} AND p.number = ${pageNumber}
  `;
  return row?.text || null;
}

export async function getParagraphTranslation(paragraphId) {
  const [row] = await sql`
    SELECT text FROM translations_paragraphs WHERE paragraph_id = ${paragraphId}
  `;
  return row?.text || null;
}

export async function getWordTranslation(word, bookId = null) {
  const normalized = word.toLowerCase().replace(/[^a-z\-']/g, '');

  if (bookId) {
    const [row] = await sql`
      SELECT translation FROM dictionary
      WHERE word = ${normalized} AND book_id = ${bookId}
    `;
    if (row) return row.translation;
  }

  const [row] = await sql`
    SELECT translation FROM dictionary
    WHERE word = ${normalized} AND book_id IS NULL
  `;
  return row?.translation || null;
}

export async function upsertPageTranslation(bookId, chapterId, pageNumber, text) {
  const [page] = await sql`
    SELECT id FROM pages
    WHERE book_id = ${bookId} AND chapter_id = ${chapterId} AND number = ${pageNumber}
  `;
  if (!page) throw new Error('Page not found');

  await sql`
    INSERT INTO translations_pages (page_id, text) VALUES (${page.id}, ${text})
    ON CONFLICT (page_id) DO UPDATE SET text = EXCLUDED.text
  `;
}

export async function upsertParagraphTranslation(paragraphId, text) {
  await sql`
    INSERT INTO translations_paragraphs (paragraph_id, text) VALUES (${paragraphId}, ${text})
    ON CONFLICT (paragraph_id) DO UPDATE SET text = EXCLUDED.text
  `;
}

export async function upsertDictionaryWord(word, translation, bookId = null) {
  const normalized = word.toLowerCase().trim();
  await sql`
    INSERT INTO dictionary (word, translation, book_id) VALUES (${normalized}, ${translation}, ${bookId})
    ON CONFLICT (book_id, word) DO UPDATE SET translation = EXCLUDED.translation
  `;
}

export async function getDictionary(bookId = null) {
  return sql`
    SELECT id, word, translation, book_id FROM dictionary
    WHERE book_id IS NOT DISTINCT FROM ${bookId}
    ORDER BY word
  `;
}

export async function deleteDictionaryWord(id) {
  await sql`DELETE FROM dictionary WHERE id = ${id}`;
}