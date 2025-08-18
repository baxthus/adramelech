import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  // debug: process.env.NODE_ENV !== "production",
  tracesSampleRate: 1.0, // Adjust as needed
});
