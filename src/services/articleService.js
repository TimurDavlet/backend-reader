import sql from '../db.js';

export async function getAllArticles() {
  const articles = await sql`
    SELECT id, title, author, cover_url, description
    FROM articles ORDER BY sort_order, created_at
  `;
  return articles.map(formatArticle);
}

export async function getArticleById(articleId) {
  const [article] = await sql`
    SELECT id, title, author, cover_url, description FROM articles WHERE id = ${articleId}
  `;
  if (!article) return null;

  const paragraphs = await sql`
    SELECT ap.id, ap.text, atr.text AS translation,
           aap.url AS audio_url, aap.duration AS audio_duration
    FROM article_paragraphs ap
    LEFT JOIN article_translations atr ON atr.paragraph_id = ap.id
    LEFT JOIN audio_article_paragraphs aap ON aap.paragraph_id = ap.id
    WHERE ap.article_id = ${articleId}
    ORDER BY ap.sort_order
  `;

  const images = await sql`
    SELECT id, url, position, width, height, alt, after_paragraph_id
    FROM article_images WHERE article_id = ${articleId}
  `;

  const [fullTranslation] = await sql`
    SELECT text FROM article_translations_full WHERE article_id = ${articleId}
  `;

  const [audio] = await sql`
    SELECT url, duration FROM audio_articles WHERE article_id = ${articleId}
  `;

  return {
    ...formatArticle(article),
    paragraphs: paragraphs.map((p) => ({
      id: p.id, text: p.text,
      translation: p.translation || null,
      audioUrl: p.audio_url || null,
      audioDuration: p.audio_duration || null,
    })),
    images,
    fullTranslation: fullTranslation?.text || null,
    audioUrl: audio?.url || null,
    audioDuration: audio?.duration || null,
  };
}

export async function createArticle({ id, title, author = '', coverUrl = null, description = '', sortOrder = 0 }) {
  await sql`
    INSERT INTO articles (id, title, author, cover_url, description, sort_order)
    VALUES (${id}, ${title}, ${author}, ${coverUrl}, ${description}, ${sortOrder})
  `;
  return getArticleById(id);
}

export async function addParagraph({ id, articleId, text, sortOrder }) {
  await sql`
    INSERT INTO article_paragraphs (id, article_id, sort_order, text)
    VALUES (${id}, ${articleId}, ${sortOrder}, ${text})
  `;
}

export async function addImage({ articleId, url, position = 'top', width = null, height = 250, alt = '', afterParagraphId = null }) {
  await sql`
    INSERT INTO article_images (article_id, url, position, width, height, alt, after_paragraph_id)
    VALUES (${articleId}, ${url}, ${position}, ${width}, ${height}, ${alt}, ${afterParagraphId})
  `;
}

export async function upsertFullTranslation(articleId, text) {
  await sql`
    INSERT INTO article_translations_full (article_id, text) VALUES (${articleId}, ${text})
    ON CONFLICT (article_id) DO UPDATE SET text = EXCLUDED.text
  `;
}

export async function upsertParagraphTranslation(paragraphId, text) {
  await sql`
    INSERT INTO article_translations (paragraph_id, text) VALUES (${paragraphId}, ${text})
    ON CONFLICT (paragraph_id) DO UPDATE SET text = EXCLUDED.text
  `;
}

export async function deleteArticle(articleId) {
  await sql`DELETE FROM articles WHERE id = ${articleId}`;
}

function formatArticle(a) {
  return {
    id: a.id, title: a.title, author: a.author,
    cover: a.cover_url, description: a.description,
  };
}