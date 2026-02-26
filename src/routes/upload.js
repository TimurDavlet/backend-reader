import { requireAdmin } from '../middleware/auth.js';
import { uploadImage } from '../services/storageService.js';

export default async function uploadRoutes(fastify) {

  fastify.post('/image', { onRequest: [requireAdmin] }, async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: 'Файл не передан' });

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(data.mimetype)) {
      return reply.code(400).send({ error: 'Только JPEG, PNG, WebP, GIF' });
    }

    try {
      const buffer = await data.toBuffer();
      const result = await uploadImage(buffer, data.filename);
      return { url: result.url };
    } catch (e) {
      return reply.code(500).send({ error: e.message });
    }
  });
}