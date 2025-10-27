import { REST, Routes, type RESTGetAPIUserResult } from 'discord.js';

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN || '');

export async function getUserAvatar(userId: string) {
  const user = (await rest.get(Routes.user(userId))) as RESTGetAPIUserResult;
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png?size=1024`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';
  return avatar;
}
