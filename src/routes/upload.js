import path from 'path';
import crypto from 'crypto';
import { requireAdmin } from '../middleware/auth.js';
import { uploadImage } from '../services/cloudinaryService.js';

export default async function uploadRoutes(fastify) {

  fastify.post('/image', { onRequest: [requireAdmin] }, async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: 'Файл не передан' });

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(data.mimetype)) {
      return reply.code(400).send({ error: 'Только JPEG, PNG, WebP, GIF' });
    }

    const ext      = path.extname(data.filename).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const buffer   = await data.toBuffer();

    const result = await uploadImage(buffer, filename);
    return { url: result.secure_url };
  });
}