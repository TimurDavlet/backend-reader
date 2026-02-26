import { requireAuth, requireAdmin } from '../middleware/auth.js';
import * as bookService from '../services/bookService.js';

export default async function booksRoutes(fastify) {

  // GET /api/books
  fastify.get('/', { onRequest: [requireAuth] }, async () => {
    return bookService.getAllBooks(); // ← убрать .map(formatBook)
  });

  // GET /api/books/:bookId
  fastify.get('/:bookId', { onRequest: [requireAuth] }, async (request, reply) => {
    const book = await bookService.getBookById(request.params.bookId);
    if (!book) return reply.code(404).send({ error: 'Book not found' });
    return book; // ← убрать formatBook(book)
  });

  // GET /api/books/:bookId/chapters/:chapterId
  fastify.get('/:bookId/chapters/:chapterId', { onRequest: [requireAuth] }, async (request, reply) => {
    const { bookId, chapterId } = request.params;
    const chapter = await bookService.getChapter(bookId, chapterId);
    if (!chapter) return reply.code(404).send({ error: 'Chapter not found' });
    return chapter;
  });

  // ── Админские роуты ──────────────────────────────────────

  // POST /api/books
  fastify.post('/', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { id, title, author, coverUrl, description, authorNote, sortOrder } = request.body;

    if (!id || !title || !author || !coverUrl) {
      return reply.code(400).send({ error: 'id, title, author, coverUrl обязательны' });
    }

    try {
      const book = await bookService.createBook({ id, title, author, coverUrl, description: description || '', authorNote: authorNote || '', sortOrder });
      return reply.code(201).send(book);
    } catch (e) {
      if (e.message.includes('UNIQUE')) {
        return reply.code(409).send({ error: 'Книга с таким id уже существует' });
      }
      throw e;
    }
  });

  // POST /api/books/:bookId/chapters
  fastify.post('/:bookId/chapters', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { bookId } = request.params;
    const { id, title, sortOrder } = request.body;

    if (!id || !title) {
      return reply.code(400).send({ error: 'id и title обязательны' });
    }

    await bookService.createChapter({ id, bookId, title, sortOrder: sortOrder ?? 0 });
    return reply.code(201).send({ ok: true });
  });

  // POST /api/books/:bookId/chapters/:chapterId/pages
  fastify.post('/:bookId/chapters/:chapterId/pages', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { bookId, chapterId } = request.params;
    const { number, image } = request.body;

    if (!number) {
        return reply.code(400).send({ error: 'number обязателен' });
    }
    const paragraphs = request.body.paragraphs || [];

    const pageId = await bookService.createPage({ bookId, chapterId, number, image: image || null, paragraphs });
    return reply.code(201).send({ pageId });
  });

  // PATCH /api/books/:bookId
  fastify.patch('/:bookId', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { bookId } = request.params;
    await bookService.updateBook(bookId, request.body);
    return { ok: true };
  });

  // PATCH /api/books/:bookId/chapters/:chapterId/pages/:pageNumber
fastify.patch('/:bookId/chapters/:chapterId/pages/:pageNumber', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { bookId, chapterId, pageNumber } = request.params;
    const { title, image, paragraphs } = request.body;
  
    try {
        await bookService.updatePage({
        bookId,
        chapterId,
        number: Number(pageNumber),
        title,
        image: image || null,
        paragraphs: paragraphs || [],
      });
      return { ok: true };
    } catch (e) {
      return reply.code(404).send({ error: e.message });
    }
  });

  // DELETE /api/books/:bookId
  fastify.delete('/:bookId', { onRequest: [requireAdmin] }, async (request) => {
    await bookService.deleteBook(request.params.bookId);
    return { ok: true };
  });
}

// snake_case → camelCase
function formatBook(book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    cover: book.cover_url,
    description: book.description,
    authorNote: book.author_note,
    chapters: book.chapters || [],
  };
}