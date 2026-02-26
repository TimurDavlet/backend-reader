export async function requireAuth(request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  }
  
  export async function requireAdmin(request, reply) {
    try {
      await request.jwtVerify();
      if (!request.user?.isAdmin) {
        reply.code(403).send({ error: 'Forbidden' });
      }
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  }