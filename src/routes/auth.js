import { requireAuth } from '../middleware/auth.js';

export default async function authRoutes(fastify) {
  const { ADMIN_LOGIN, ADMIN_PASSWORD } = process.env;

  // POST /api/auth/login
  fastify.post('/login', async (request, reply) => {
    const { login, password } = request.body;
  
    const adminLogin    = process.env.ADMIN_LOGIN;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const userLogin     = process.env.USER_LOGIN;
    const userPassword  = process.env.USER_PASSWORD;
  
    let role = null;
    let name = null;
  
    if (login === adminLogin && password === adminPassword) {
      role = 'admin';
      name = 'Admin';
    } else if (login === userLogin && password === userPassword) {
      role = 'user';
      name = userLogin;
    }
  
    if (!role) {
      return reply.code(401).send({ error: 'Неверный логин или пароль' });
    }
  
    const token = fastify.jwt.sign({ login, role, name });
    return { token, user: { login, role, name } };
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