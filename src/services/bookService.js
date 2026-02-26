import sql from '../db.js';

export async function getAllBooks() {
  const books = await sql`
    SELECT id, title, author, cover_url, description, author_note
    FROM books
    ORDER BY sort_order, created_at
  `;

  const withChapters = await Promise.all(books.map(async (book) => {
    const chapters = await sql`
      SELECT id, title FROM chapters
      WHERE book_id = ${book.id}
      ORDER BY sort_order
    `;
    return { ...formatBook(book), chapters };
  }));

  return withChapters;
}

export async function getBookById(bookId) {
  const [book] = await sql`
    SELECT id, title, author, cover_url, description, author_note
    FROM books WHERE id = ${bookId}
  `;
  if (!book) return null;

  const chapters = await sql`
    SELECT id, title FROM chapters
    WHERE book_id = ${bookId}
    ORDER BY sort_order
  `;

  return { ...formatBook(book), chapters };
}

export async function getChapter(bookId, chapterId) {
  const [chapter] = await sql`
    SELECT id, title FROM chapters
    WHERE id = ${chapterId} AND book_id = ${bookId}
  `;
  if (!chapter) return null;

  const pages = await sql`
    SELECT id, number, title FROM pages
    WHERE chapter_id = ${chapterId} AND book_id = ${bookId}
    ORDER BY number
  `;

  const pagesWithContent = await Promise.all(pages.map(async (page) => {
    const [image] = await sql`
      SELECT url, position, width, height, alt, after_paragraph_id, float_paragraph_id
      FROM page_images WHERE page_id = ${page.id}
    `;

    const paragraphs = await sql`
      SELECT p.id, p.text, ap.url AS audio_url
      FROM paragraphs p
      LEFT JOIN audio_paragraphs ap ON ap.paragraph_id = p.id
      WHERE p.page_id = ${page.id}
      ORDER BY p.sort_order
    `;

    return {
      number: page.number,
      title: page.title || null,
      image: image || null,
      paragraphs: paragraphs.map((p) => ({
        id: p.id,
        text: p.text,
        audioUrl: p.audio_url || null,
      })),
    };
  }));

  return { ...chapter, pages: pagesWithContent };
}

export async function createBook({ id, title, author, coverUrl, description, authorNote, sortOrder = 0 }) {
  await sql`
    INSERT INTO books (id, title, author, cover_url, description, author_note, sort_order)
    VALUES (${id}, ${title}, ${author}, ${coverUrl}, ${description || ''}, ${authorNote || ''}, ${sortOrder})
  `;
  return getBookById(id);
}

export async function createChapter({ id, bookId, title, sortOrder = 0 }) {
  await sql`
    INSERT INTO chapters (id, book_id, title, sort_order)
    VALUES (${id}, ${bookId}, ${title}, ${sortOrder})
  `;
}

export async function createPage({ bookId, chapterId, number, title, image, paragraphs }) {
  const [page] = await sql`
    INSERT INTO pages (chapter_id, book_id, number, title)
    VALUES (${chapterId}, ${bookId}, ${number}, ${title || null})
    RETURNING id
  `;
  const pageId = page.id;

  // Сначала абзацы
  for (let idx = 0; idx < paragraphs.length; idx++) {
    const para = paragraphs[idx];
    await sql`
      INSERT INTO paragraphs (id, page_id, sort_order, text)
      VALUES (${para.id}, ${pageId}, ${idx}, ${para.text})
    `;
  }

  // Потом картинка
  if (image) {
    await sql`
      INSERT INTO page_images (page_id, url, position, width, height, alt, after_paragraph_id, float_paragraph_id)
      VALUES (
        ${pageId}, ${image.url}, ${image.position || 'top'},
        ${image.width || null}, ${image.height || 250}, ${image.alt || ''},
        ${image.afterParagraphId || null}, ${image.floatParagraphId || null}
      )
    `;
  }

  return pageId;
}

export async function updatePage({ bookId, chapterId, number, title, image, paragraphs }) {
  await sql`
    UPDATE pages SET title = ${title || null}
    WHERE chapter_id = ${chapterId} AND book_id = ${bookId} AND number = ${number}
  `;

  const [page] = await sql`
    SELECT id FROM pages
    WHERE chapter_id = ${chapterId} AND book_id = ${bookId} AND number = ${number}
  `;
  if (!page) throw new Error('Page not found');

  // Сначала абзацы
  if (paragraphs?.length) {
    await sql`DELETE FROM paragraphs WHERE page_id = ${page.id}`;
    for (let idx = 0; idx < paragraphs.length; idx++) {
      const para = paragraphs[idx];
      await sql`
        INSERT INTO paragraphs (id, page_id, sort_order, text)
        VALUES (${para.id}, ${page.id}, ${idx}, ${para.text})
      `;
    }
  }

  // Потом картинка
  await sql`DELETE FROM page_images WHERE page_id = ${page.id}`;
  if (image) {
    await sql`
      INSERT INTO page_images (page_id, url, position, width, height, alt, after_paragraph_id, float_paragraph_id)
      VALUES (
        ${page.id}, ${image.url}, ${image.position || 'top'},
        ${image.width || null}, ${image.height || 250}, ${image.alt || ''},
        ${image.afterParagraphId || null}, ${image.floatParagraphId || null}
      )
    `;
  }
}

export async function updateBook(bookId, fields) {
  const allowed = {
    title: fields.title, author: fields.author,
    cover_url: fields.cover_url, description: fields.description,
    author_note: fields.author_note, sort_order: fields.sort_order,
  };
  await sql`UPDATE books SET ${sql(allowed, ...Object.keys(allowed).filter(k => allowed[k] !== undefined))} WHERE id = ${bookId}`;
}

export async function deleteBook(bookId) {
  await sql`DELETE FROM books WHERE id = ${bookId}`;
}

function formatBook(b) {
  return {
    id: b.id, title: b.title, author: b.author,
    cover: b.cover_url, description: b.description,
    authorNote: b.author_note, chapters: [],
  };
}