import { VueQueryPlugin } from '@tanstack/vue-query';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueQueryPlugin, {
    queryClientConfig: {
      defaultOptions: {
        queries: {
          staleTime: 5 * 1000 * 60, // 5 minutes
          retry: false,
        },
      },
    },
  });
});
