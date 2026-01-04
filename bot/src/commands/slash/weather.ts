import { stripIndents } from 'common-tags';
import {
  ButtonStyle,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import ky from 'ky';
import { errAsync, fromAsyncThrowable, okAsync } from 'neverthrow';
import v from 'voca';
import z from 'zod';
import config from '~/config';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

const BASE_URL = 'https://api.openweathermap.org';

const geoSchema = z
  .object({
    lat: z.number(),
    lon: z.number(),
  })
  .array()
  .length(1);

const weatherSchema = z.object({
  id: z.number(),
  name: z.string().nullish(),
  weather: z
    .array(
      z.object({
        main: z.string(),
        description: z.string(),
      }),
    )
    .length(1),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    pressure: z.number(),
    humidity: z.number(),
    sea_level: z.number(),
    grnd_level: z.number(),
  }),
  wind: z.object({
    speed: z.number(),
    deg: z.number(),
    gust: z.number().nullish(), // Present most of the time, but not always
  }),
  sys: z.object({
    country: z.string().length(2).transform(v.lowerCase),
  }),
});

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Get the current weather for a location')
    .addStringOption((option) =>
      option
        .setName('city')
        .setDescription('The name of the city to get the weather for')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('country')
        .setDescription('The country the city is in')
        .setRequired(true),
    ),
  cooldown: 10 * 60, // 10 minutes because the API is expensive
  uses: ['OpenWeatherMap'],
  async execute(intr: ChatInputCommandInteraction) {
    if (!config.OPENWEATHER_KEY)
      return await sendError(intr, 'Weather API key is not configured');

    await intr.deferReply();

    const city = intr.options.getString('city', true);
    const country = intr.options.getString('country', true);

    const geoResult = await fromAsyncThrowable(
      ky.get(`${BASE_URL}/geo/1.0/direct`, {
        searchParams: {
          q: `${city},${country}`,
          limit: '1',
          appid: config.OPENWEATHER_KEY,
        },
      }).json,
      (e) => `Failed to fetch geolocation data: ${String(e)}`,
    )().andThen((json) => {
      const parsed = geoSchema.safeParse(json);
      return parsed.success
        ? okAsync(parsed.data)
        : errAsync(parsed.error.message);
    });
    if (geoResult.isErr()) return await sendError(intr, geoResult.error);

    const weatherResult = await fromAsyncThrowable(
      ky.get(`${BASE_URL}/data/2.5/weather`, {
        searchParams: {
          lat: geoResult.value[0]!.lat.toString(),
          lon: geoResult.value[0]!.lon.toString(),
          units: 'metric',
          appid: config.OPENWEATHER_KEY,
          lang: 'en',
        },
      }).json,
      (e) => `Failed to fetch weather data: ${String(e)}`,
    )().andThen((json) => {
      const parsed = weatherSchema.safeParse(json);
      return parsed.success
        ? okAsync(parsed.data)
        : errAsync(parsed.error.message);
    });
    if (weatherResult.isErr())
      return await sendError(intr, weatherResult.error);
    const weather = weatherResult.value;

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: config.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              # Weather${weather.name ? ` in ${weather.name} :flag_${weather.sys.country}:` : ''}
              `,
            },
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  label: 'View on OpenWeatherMap',
                  style: ButtonStyle.Link,
                  url: `https://openweathermap.org/city/${weather.id}`,
                },
              ],
            },
            { type: ComponentType.Separator, divider: false },
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              **Temperature:** ${weather.main.temp}ºC
              **Feels Like:** ${weather.main.feels_like}ºC
              **Minimum Temperature:** ${weather.main.temp_min}ºC
              **Maximum Temperature:** ${weather.main.temp_max}ºC
              **Pressure:** ${weather.main.pressure} hPa
              **Humidity:** ${weather.main.humidity}%
              **Sea level:** ${weather.main.sea_level} hPa
              **Ground level:** ${weather.main.grnd_level} hPa
              ## :cloud: Weather
              **Main:** ${weather.weather[0]?.main}
              **Description:** ${v.titleCase(weather.weather[0]?.description)}
              ## :dash: Wind
              **Speed:** ${weather.wind.speed} m/s
              **Direction:** ${weather.wind.deg}º
              **Gust:** ${weather.wind.gust ? `${weather.wind.gust} m/s` : 'N/A'}
              `,
            },
            {
              type: ComponentType.TextDisplay,
              content: '> Powered by OpenWeatherMap',
            },
          ],
        },
      ],
    });
  },
};
