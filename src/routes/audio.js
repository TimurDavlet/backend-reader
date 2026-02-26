import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import * as audioService from '../services/audioService.js';
import { uploadAudio } from '../services/cloudinaryService.js';

const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';

export default async function audioRoutes(fastify) {

  // GET /api/audio/page?bookId=&chapterId=&pageNumber=
  fastify.get('/page', { onRequest: [requireAuth] }, async (request, reply) => {
    const { bookId, chapterId, pageNumber } = request.query;
    if (!bookId || !chapterId || !pageNumber) {
      return reply.code(400).send({ error: 'bookId, chapterId, pageNumber обязательны' });
    }
    const audio = await audioService.getPageAudio(bookId, chapterId, Number(pageNumber));
    if (!audio) return reply.code(404).send({ error: 'Audio not found' });
    return audio;
  });

  // GET /api/audio/paragraph/:paragraphId
  fastify.get('/paragraph/:paragraphId', { onRequest: [requireAuth] }, async (request, reply) => {
    const audio = await audioService.getParagraphAudio(request.params.paragraphId);
    if (!audio) return reply.code(404).send({ error: 'Audio not found' });
    return audio;
  });

  // GET /api/audio/article/:articleId
  fastify.get('/article/:articleId', { onRequest: [requireAuth] }, async (request, reply) => {
    const audio = await audioService.getArticleAudio(request.params.articleId);
    if (!audio) return reply.code(404).send({ error: 'Audio not found' });
    return audio;
  });

  // GET /api/audio/article-paragraph/:paragraphId
  fastify.get('/article-paragraph/:paragraphId', { onRequest: [requireAuth] }, async (request, reply) => {
    const audio = await audioService.getArticleParagraphAudio(request.params.paragraphId);
    if (!audio) return reply.code(404).send({ error: 'Audio not found' });
    return audio;
  });

  // POST /api/audio/upload — загрузка файла
  fastify.post('/upload', { onRequest: [requireAdmin] }, async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: 'Файл не передан' });
  
    const allowed = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    if (!allowed.includes(data.mimetype)) {
      return reply.code(400).send({ error: 'Только MP3, WAV, OGG, M4A' });
    }
  
    const ext      = path.extname(data.filename).toLowerCase() || '.mp3';
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const buffer   = await data.toBuffer();
  
    const result = await uploadAudio(buffer, filename);
    return { url: result.secure_url };
  });

  // PUT /api/audio/page
  fastify.put('/page', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { bookId, chapterId, pageNumber, url, duration } = request.body;
    if (!bookId || !chapterId || !pageNumber || !url) {
      return reply.code(400).send({ error: 'bookId, chapterId, pageNumber, url обязательны' });
    }
    await audioService.upsertPageAudio(bookId, chapterId, Number(pageNumber), url, duration);
    return { ok: true };
  });

  // PUT /api/audio/paragraph
  fastify.put('/paragraph', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { paragraphId, url, duration } = request.body;
    if (!paragraphId || !url) return reply.code(400).send({ error: 'paragraphId и url обязательны' });
    await audioService.upsertParagraphAudio(paragraphId, url, duration);
    return { ok: true };
  });

  // PUT /api/audio/article
  fastify.put('/article', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { articleId, url, duration } = request.body;
    if (!articleId || !url) return reply.code(400).send({ error: 'articleId и url обязательны' });
    await audioService.upsertArticleAudio(articleId, url, duration);
    return { ok: true };
  });

  // PUT /api/audio/article-paragraph
  fastify.put('/article-paragraph', { onRequest: [requireAdmin] }, async (request, reply) => {
    const { paragraphId, url, duration } = request.body;
    if (!paragraphId || !url) return reply.code(400).send({ error: 'paragraphId и url обязательны' });
    await audioService.upsertArticleParagraphAudio(paragraphId, url, duration);
    return { ok: true };
  });

  // DELETE /api/audio/page
  fastify.delete('/page', { onRequest: [requireAdmin] }, async (request) => {
    const { bookId, chapterId, pageNumber } = request.body;
    await audioService.deletePageAudio(bookId, chapterId, Number(pageNumber));
    return { ok: true };
  });

  // DELETE /api/audio/paragraph/:paragraphId
  fastify.delete('/paragraph/:paragraphId', { onRequest: [requireAdmin] }, async (request) => {
    await audioService.deleteParagraphAudio(request.params.paragraphId);
    return { ok: true };
  });
}