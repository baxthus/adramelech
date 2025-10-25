const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default defineNuxtRouteMiddleware((to) => {
  const { isSignedIn } = useAuth();

  if (!isPublicRoute(to) && !isSignedIn.value) return navigateTo('/sign-in');
  if (isPublicRoute(to) && isSignedIn.value) return navigateTo('/');
});
