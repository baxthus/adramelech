import Elysia from 'elysia';
import { auth } from '~/utils/auth';

export default new Elysia({ name: 'better-auth' }).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const session = await auth.api.getSession({ headers });
      if (!session) return status(401, 'Unauthorized');

      return {
        user: session.user,
        session: session.session,
      };
    },
  },
});
