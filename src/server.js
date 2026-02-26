import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';

import authRoutes    from './routes/auth.js';
import booksRoutes   from './routes/books.js';
import translateRoutes from './routes/translate.js';
import uploadRoutes  from './routes/upload.js';
import audioRoutes   from './routes/audio.js';
import articleRoutes from './routes/articles.js';

// Инициализируем БД при старте
import './db.js';

const fastify = Fastify({
  logger: process.env.NODE_ENV !== 'production' ? {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  } : true,
});

await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

await fastify.register(jwt, { secret: process.env.JWT_SECRET });

await fastify.register(multipart, {
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB для аудио
});

await fastify.register(authRoutes,      { prefix: '/api/auth' });
await fastify.register(booksRoutes,     { prefix: '/api/books' });
await fastify.register(translateRoutes, { prefix: '/api/translate' });
await fastify.register(uploadRoutes,    { prefix: '/api/upload' });
await fastify.register(audioRoutes,     { prefix: '/api/audio' });
await fastify.register(articleRoutes,   { prefix: '/api/articles' });

fastify.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

try {
  await fastify.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}