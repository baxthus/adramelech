import {
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import z from 'zod';
import type { Command } from '~/types/command';
import config from '~/config';
import { sendError } from '~/utils/sendError';
import ky from 'ky';
import { stripIndents } from 'common-tags';
import v from 'voca';

const BASE_URL = 'https://api.openweathermap.org';

const geoSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

const weatherSchema = z.object({
  name: z.string().nullish(),
  weather: z.array(
    z.object({
      main: z.string(),
      description: z.string(),
    }),
  ),
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

    const geoUrl = new URL(`${BASE_URL}/geo/1.0/direct`);
    geoUrl.searchParams.set('q', `${city},${country}`);
    geoUrl.searchParams.append('limit', '1');
    geoUrl.searchParams.append('appid', config.OPENWEATHER_KEY);

    const geoResponse = await ky.get(geoUrl).json();
    const geo = geoSchema.array().safeParse(geoResponse);
    if (geo.error) return await sendError(intr, 'Invalid location');

    const weatherUrl = new URL(`${BASE_URL}/data/2.5/weather`);
    weatherUrl.searchParams.append('lat', geo.data[0]!.lat.toString());
    weatherUrl.searchParams.append('lon', geo.data[0]!.lon.toString());
    weatherUrl.searchParams.append('units', 'metric');
    weatherUrl.searchParams.append('appid', config.OPENWEATHER_KEY);
    weatherUrl.searchParams.append('lang', 'en');
    const weatherResponse = await ky.get(weatherUrl).json();
    const { data: weather, error } = weatherSchema.safeParse(weatherResponse);
    if (error) return await sendError(intr, 'Failed to retrieve weather data');

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
              # Weather${weather.name ? ` in ${weather.name}` : ''}
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
