import { tlmRedis } from '.';

function getWeekIdentifier(): string {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const weekDay = start.getDay() || 7; // Sunday = 7, not 0
  const week = Math.ceil((days + weekDay) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

// NOTE: They're all async, but realistically they will not be awaited
//       to avoid blocking the main execution flow

export async function trackMessage(
  userId: string,
  guildId: string = 'dm'
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours().toString();
  const week = getWeekIdentifier();

  const guildKey = `messages:guild:${guildId}:${today}`;
  const userKey = `messages:user:${userId}:${today}`;
  const hourlyKey = `activity:hourly:${guildId}:${today}`;
  const leaderboardKey = `leaderboard:messages:${guildId}:${week}`;
  const activeUsersKey = `users:active:${guildId}:${today}`;

  await Promise.all([
    tlmRedis.incr(guildKey),
    tlmRedis.incr(userKey),
    tlmRedis.hincrby(hourlyKey, hour, 1),
    tlmRedis.zadd(leaderboardKey, 'INCR', 1, userId),
    tlmRedis.sadd(activeUsersKey, userId),
  ]);

  // Set TTLs (30 days for most, 8 days for weekly leaderboard)
  const ttl30Days = 30 * 24 * 60 * 60;
  const ttl8Days = 8 * 24 * 60 * 60;

  await Promise.all([
    tlmRedis.expire(guildKey, ttl30Days),
    tlmRedis.expire(userKey, ttl30Days),
    tlmRedis.expire(hourlyKey, ttl30Days),
    tlmRedis.expire(leaderboardKey, ttl8Days),
    tlmRedis.expire(activeUsersKey, ttl30Days),
  ]);
}

export async function trackCommand(
  commandName: string,
  guildId: string = 'dm',
  success: boolean
) {
  const today = new Date().toISOString().split('T')[0];

  const commandKey = `commands:${commandName}:${today}`;
  const totalKey = `commands:total:${guildId}:${today}`;

  await Promise.all([
    tlmRedis.incr(commandKey),
    tlmRedis.incr(totalKey),
    success
      ? tlmRedis.incr(`commands:success:${today}`)
      : tlmRedis.incr(`commands:failure:${today}`),
  ]);

  // Set TTLs (30 days, but not for success/failure as requested)
  const ttl30Days = 30 * 24 * 60 * 60;
  await Promise.all([
    tlmRedis.expire(commandKey, ttl30Days),
    tlmRedis.expire(totalKey, ttl30Days),
  ]);
}

export async function trackComponent(
  id: string,
  guildId: string = 'dm',
  success: boolean
) {
  const today = new Date().toISOString().split('T')[0];

  const componentKey = `components:${id}:${today}`;
  const totalKey = `components:total:${guildId}:${today}`;

  await Promise.all([
    tlmRedis.incr(componentKey),
    tlmRedis.incr(totalKey),
    success
      ? tlmRedis.incr(`components:success:${today}`)
      : tlmRedis.incr(`components:failure:${today}`),
  ]);

  // Set TTLs (30 days, but not for success/failure as requested)
  const ttl30Days = 30 * 24 * 60 * 60;
  await Promise.all([
    tlmRedis.expire(componentKey, ttl30Days),
    tlmRedis.expire(totalKey, ttl30Days),
  ]);
}

export async function trackModal(
  id: string,
  guildId: string = 'dm',
  success: boolean
) {
  const today = new Date().toISOString().split('T')[0];

  const modalKey = `modals:${id}:${today}`;
  const totalKey = `modals:total:${guildId}:${today}`;

  await Promise.all([
    tlmRedis.incr(modalKey),
    tlmRedis.incr(totalKey),
    success
      ? tlmRedis.incr(`modals:success:${today}`)
      : tlmRedis.incr(`modals:failure:${today}`),
  ]);

  // Set TTLs (30 days, but not for success/failure as requested)
  const ttl30Days = 30 * 24 * 60 * 60;
  await Promise.all([
    tlmRedis.expire(modalKey, ttl30Days),
    tlmRedis.expire(totalKey, ttl30Days),
  ]);
}
