import { requireAuth, requireAdmin } from '../middleware/auth.js';
import * as translateService from '../services/translateService.js';

export default async function translateRoutes(fastify) {

  // GET /api/translate/page?bookId=&chapterId=&pageNumber=
  fastify.get('/page', { onRequest: [requireAuth] }, async (request, reply) => {
    const { bookId, chapterId, pageNumber } = request.query;

    if (!bookId || !chapterId || !pageNumber) {
      return reply.code(400).send({ error: 'bookId, chapterId, pageNumber обязательны' });
    }

    const text = await translateService.getPageTranslation(bookId, chapterId, Number(pageNumber));
    if (!text) return reply.code(404).send({ error: 'Translation not found' });

    return { text };
  });

  // GET /api/translate/paragraph/:paragraphId
  fastify.get('/paragraph/:paragraphId', { onRequest: [requireAuth] }, async (request, reply) => {
    const text = await translateService.getParagraphTranslation(request.params.paragraphId);
    if (!text) return reply.code(404).send({ error: 'Translation not found' });
    return { text };
  });

  // GET /api/translate/word?word=&bookId=
  fastify.get('/word', { onRequest: [requireAuth] }, async (request, reply) => {
    const { word, bookId } = request.query;
    if (!word) return reply.code(400).send({ error: 'word обязателен' });

    const translation = await translateService.getWordTranslation(word, bookId || null);
    if (!translation) return reply.code(404).send({ error: 'Word not found' });

    return { word, translation };
  });

  // ── Админ: добавить/обновить переводы ────────────────────

  // PUT /api/translate/page
  fastify.put('/page', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { bookId, chapterId, pageNumber, text } = request.body;
    if (!bookId || !chapterId || !pageNumber || !text) {
      return reply.code(400).send({ error: 'Все поля обязательны' });
    }
    await translateService.upsertPageTranslation(bookId, chapterId, Number(pageNumber), text);
    return { ok: true };
  });

  // PUT /api/translate/paragraph
  fastify.put('/paragraph', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { paragraphId, text } = request.body;
    if (!paragraphId || !text) {
      return reply.code(400).send({ error: 'paragraphId и text обязательны' });
    }
    await translateService.upsertParagraphTranslation(paragraphId, text);
    return { ok: true };
  });

  // GET /api/translate/dictionary?bookId=   (null = общий)
  fastify.get('/dictionary', { onRequest: [requireAdmin] }, async (request) => {
    const { bookId } = request.query;
    return await translateService.getDictionary(bookId || null);
  });

  // PUT /api/translate/dictionary
  fastify.put('/dictionary', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { word, translation, bookId } = request.body;
    if (!word || !translation) {
      return reply.code(400).send({ error: 'word и translation обязательны' });
    }
    await translateService.upsertDictionaryWord(word, translation, bookId || null);
    return { ok: true };
  });

  // DELETE /api/translate/dictionary/:id
  fastify.delete('/dictionary/:id', { onRequest: [requireAdmin] }, async (request) => {
    await translateService.deleteDictionaryWord(Number(request.params.id));
    return { ok: true };
  });
}