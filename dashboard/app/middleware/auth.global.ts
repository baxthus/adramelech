const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default defineNuxtRouteMiddleware((to) => {
  const { isSignedIn } = useAuth();
  console.log('Auth Middleware Triggered:', {
    to: to.fullPath,
    isSignedIn: isSignedIn.value,
  });

  if (!isPublicRoute(to) && !isSignedIn.value) return navigateTo('/sign-in');
  if (isPublicRoute(to) && isSignedIn.value) return navigateTo('/');
});
