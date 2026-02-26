import sql from '../db.js';

export async function getPageAudio(bookId, chapterId, pageNumber) {
  const [row] = await sql`
    SELECT ap.url, ap.duration FROM audio_pages ap
    JOIN pages p ON p.id = ap.page_id
    WHERE p.book_id = ${bookId} AND p.chapter_id = ${chapterId} AND p.number = ${pageNumber}
  `;
  return row || null;
}

export async function upsertPageAudio(bookId, chapterId, pageNumber, url, duration = null) {
  const [page] = await sql`
    SELECT id FROM pages
    WHERE book_id = ${bookId} AND chapter_id = ${chapterId} AND number = ${pageNumber}
  `;
  if (!page) throw new Error('Page not found');

  await sql`
    INSERT INTO audio_pages (page_id, url, duration) VALUES (${page.id}, ${url}, ${duration})
    ON CONFLICT (page_id) DO UPDATE SET url = EXCLUDED.url, duration = EXCLUDED.duration
  `;
}

export async function deletePageAudio(bookId, chapterId, pageNumber) {
  const [page] = await sql`
    SELECT id FROM pages
    WHERE book_id = ${bookId} AND chapter_id = ${chapterId} AND number = ${pageNumber}
  `;
  if (page) await sql`DELETE FROM audio_pages WHERE page_id = ${page.id}`;
}

export async function getParagraphAudio(paragraphId) {
  const [row] = await sql`SELECT url, duration FROM audio_paragraphs WHERE paragraph_id = ${paragraphId}`;
  return row || null;
}

export async function upsertParagraphAudio(paragraphId, url, duration = null) {
  await sql`
    INSERT INTO audio_paragraphs (paragraph_id, url, duration) VALUES (${paragraphId}, ${url}, ${duration})
    ON CONFLICT (paragraph_id) DO UPDATE SET url = EXCLUDED.url, duration = EXCLUDED.duration
  `;
}

export async function deleteParagraphAudio(paragraphId) {
  await sql`DELETE FROM audio_paragraphs WHERE paragraph_id = ${paragraphId}`;
}

export async function getArticleAudio(articleId) {
  const [row] = await sql`SELECT url, duration FROM audio_articles WHERE article_id = ${articleId}`;
  return row || null;
}

export async function upsertArticleAudio(articleId, url, duration = null) {
  await sql`
    INSERT INTO audio_articles (article_id, url, duration) VALUES (${articleId}, ${url}, ${duration})
    ON CONFLICT (article_id) DO UPDATE SET url = EXCLUDED.url, duration = EXCLUDED.duration
  `;
}

export async function getArticleParagraphAudio(paragraphId) {
  const [row] = await sql`SELECT url, duration FROM audio_article_paragraphs WHERE paragraph_id = ${paragraphId}`;
  return row || null;
}

export async function upsertArticleParagraphAudio(paragraphId, url, duration = null) {
  await sql`
    INSERT INTO audio_article_paragraphs (paragraph_id, url, duration) VALUES (${paragraphId}, ${url}, ${duration})
    ON CONFLICT (paragraph_id) DO UPDATE SET url = EXCLUDED.url, duration = EXCLUDED.duration
  `;
}