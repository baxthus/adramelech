import { ActivityType } from 'discord.js';
import kleur from 'kleur';
import z from 'zod';
import logger from '~/logger';

const configSchema = z.object({
  BOT_TOKEN: z.string().min(1),
  BOT_ID: z.string().min(1),
  PRESENCE_TYPE: z.coerce.number().pipe(z.enum(ActivityType)),
  PRESENCE_NAME: z.string().min(1),
  EMBED_COLOR: z.coerce.number(),
  AUTHOR_URL: z.url().default('https://www.pudim.com.br'),
  REPOSITORY_URL: z.url(),
  DEFAULT_COOLDOWN_SECONDS: z.coerce.number().int().positive(),
  USER_AGENT: z.string().default('adramelech'),
  OPENWEATHER_KEY: z.string().optional(),
  DATABASE_URL: z
    .url()
    .default('postgres://postgres:hunter2@localhost/adramelech'),
});

function validateConfig() {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    const u = kleur.underline;
    for (const error of result.error.issues) {
      logger.error(`ENV VAR  ${u(error.path.toString())} ${error.message}`);
      if (error.code === 'invalid_type')
        logger.log(
          kleur.dim(
            `󱞩 Expected: ${u().green(error.expected)} | Received: ${u().red(typeof error.input)}`,
          ),
        );
    }
    process.exit(1);
  }
  logger.success('Environment variables loaded');

  return result.data;
}

const env = validateConfig();

export default env;
