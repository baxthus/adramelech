import tailwindcss from '@tailwindcss/vite';
import { dark } from '@clerk/themes';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@clerk/nuxt'],
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',

  vite: {
    plugins: [tailwindcss()],
  },

  clerk: {
    appearance: {
      theme: dark,
    },
  },

  eslint: {
    config: {
      stylistic: {
        semi: true,
        indent: 2,
        quotes: 'single',
      },
    },
  },
});
