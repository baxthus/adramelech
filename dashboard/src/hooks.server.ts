import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	const fetchedSession = await auth.api.getSession({
		headers: event.request.headers
	});

	if (fetchedSession) {
		event.locals.session = fetchedSession.session;
		event.locals.user = fetchedSession.user;
	} else {
		delete event.locals.session;
		delete event.locals.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
