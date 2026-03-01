export async function requireAuth(request, reply) {
    try {
      await request.jwtVerify();
      // пропускаем и admin и user
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  }
  
  export async function requireAdmin(request, reply) {
    try {
      await request.jwtVerify();
      if (request.user.role !== 'admin') {
        return reply.code(403).send({ error: 'Forbidden' });
      }
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  }