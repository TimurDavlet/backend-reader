import { requireAuth, requireAdmin } from '../middleware/auth.js';
import * as articleService from '../services/articleService.js';

export default async function articleRoutes(fastify) {

  // GET /api/articles
  fastify.get('/', { onRequest: [requireAuth] }, async () => {
    return await articleService.getAllArticles();
  });

  // GET /api/articles/:articleId
  fastify.get('/:articleId', { onRequest: [requireAuth] }, async (request, reply) => {
    const article = await articleService.getArticleById(request.params.articleId);
    if (!article) return reply.code(404).send({ error: 'Article not found' });
    return article;
  });

  // POST /api/articles
  fastify.post('/', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { id, title, author, coverUrl, description, sortOrder } = request.body;
    if (!id || !title) return reply.code(400).send({ error: 'id и title обязательны' });
    try {
      const article = await articleService.createArticle({ id, title, author, coverUrl, description, sortOrder });
      return reply.code(201).send(article);
    } catch (e) {
      if (e.message.includes('UNIQUE')) return reply.code(409).send({ error: 'Статья с таким id уже существует' });
      throw e;
    }
  });

  // POST /api/articles/:articleId/paragraphs
  fastify.post('/:articleId/paragraphs', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { id, text, sortOrder } = request.body;
    if (!id || !text) return reply.code(400).send({ error: 'id и text обязательны' });
    await articleService.addParagraph({ id, articleId: request.params.articleId, text, sortOrder: sortOrder ?? 0 });
    return reply.code(201).send({ ok: true });
  });

  // POST /api/articles/:articleId/images
  fastify.post('/:articleId/images', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { url, position, width, height, alt, afterParagraphId } = request.body;
    if (!url) return reply.code(400).send({ error: 'url обязателен' });
    await articleService.addImage({ articleId: request.params.articleId, url, position, width, height, alt, afterParagraphId });
    return reply.code(201).send({ ok: true });
  });

  // PUT /api/articles/:articleId/translation
  fastify.put('/:articleId/translation', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { text } = request.body;
    if (!text) return reply.code(400).send({ error: 'text обязателен' });
    await articleService.upsertFullTranslation(request.params.articleId, text);
    return { ok: true };
  });

  // PUT /api/articles/paragraphs/:paragraphId/translation
  fastify.put('/paragraphs/:paragraphId/translation', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { text } = request.body;
    if (!text) return reply.code(400).send({ error: 'text обязателен' });
    await articleService.upsertParagraphTranslation(request.params.paragraphId, text);
    return { ok: true };
  });

  // DELETE /api/articles/:articleId
  fastify.delete('/:articleId', { onRequest: [requireAdmin] }, async (request) => {
    await articleService.deleteArticle(request.params.articleId);
    return { ok: true };
  });
}