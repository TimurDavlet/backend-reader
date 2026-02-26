import { requireAuth } from '../middleware/auth.js';

export default async function authRoutes(fastify) {
  const { ADMIN_LOGIN, ADMIN_PASSWORD } = process.env;

  // POST /api/auth/login
  fastify.post('/login', async (request, reply) => {
    const { login, password } = request.body;

    if (!login || !password) {
      return reply.code(400).send({ error: 'Введите логин и пароль' });
    }

    // Пока один захардкоженный пользователь из .env
    // TODO: когда понадобятся другие пользователи — добавить таблицу users
    if (login !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
      return reply.code(401).send({ error: 'Неверный логин или пароль' });
    }

    const token = fastify.jwt.sign(
      { id: 1, login, isAdmin: true },
      { expiresIn: '30d' }
    );

    return { token, user: { id: 1, login, name: login } };
  });

  // POST /api/auth/logout — клиент просто удаляет токен
  fastify.post('/logout', { onRequest: [requireAuth] }, async () => {
    return { ok: true };
  });

  // GET /api/auth/me — проверить текущий токен
  fastify.get('/me', { onRequest: [requireAuth] }, async (request) => {
    return { user: request.user };
  });
}