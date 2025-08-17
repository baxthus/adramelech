import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import db from './db';
import { env } from '$env/dynamic/private';
import * as schema from 'database/schemas/auth-schema';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema
	}),
	emailAndPassword: {
		enabled: true,
		disableSignUp: env.ENABLED_SIGNUP !== 'true'
	}
});
