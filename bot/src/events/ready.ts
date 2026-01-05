import { ActivityType, Events, version } from 'discord.js';
import type { EventInfer } from '~/types/event';
import type { CustomClient } from '~';
import logger from '~/logger';
import kleur from 'kleur';
import { testConnection } from 'database/utils';

export const event = <EventInfer>{
  name: Events.ClientReady,
  once: true,
  async execute(client: CustomClient) {
    logger.log();

    const library = `${kleur.magenta(' Discord.js')} ${kleur.dim(version)}`;
    const runtime = `${kleur.yellow(' Bun')} ${kleur.dim(Bun.version)}`;
    logger.log(`${library} | ${runtime}`);

    logger.log();
    const dbLatency = await testConnection().match(
      (latency) => latency,
      (err) => {
        logger.error(err);
        process.exit(1);
      },
    );
    logger.log(
      kleur.green(
        ` Database connected successfully! ${kleur.dim(`- ${dbLatency.toFixed(2)}ms`)}`,
      ),
    );
    logger.log();

    logger.log(kleur.green(` Online as ${kleur.bold(client.user!.tag)}`));
    const presence = client.user!.presence.activities[0]!;
    logger.log(
      kleur.blue(`󱞩 Presence: ${ActivityType[presence.type]} ${presence.name}`),
    );
    logger.log(`󱞩 API Version: ${client.options.rest?.version}`);
  },
};
