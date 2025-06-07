import { stripIndents } from 'common-tags';
import {
  ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import ky from 'ky';
import v from 'voca';
import { z } from 'zod';
import env from '#env';
import type { Command } from '#bot/types/command';
import { sendError } from '#bot/utils/sendError';

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
    })
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
    gust: z.number().optional(), // Present most of the time, but not always
  }),
});

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Get the weather of a city')
    .addStringOption((option) =>
      option
        .setName('city')
        .setDescription('The city you want to get the weather of')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('country')
        .setDescription('The country of the city')
        .setRequired(true)
    ),
  cooldown: 10 * 60, // 10 minutes, because the API is expensive and I'm not rich
  uses: ['OpenWeatherMap'],
  async execute(intr: ChatInputCommandInteraction) {
    if (!env.OPENWEATHER_KEY)
      return await sendError(intr, 'OpenWeatherMap API key is not configured');

    await intr.deferReply();

    const city = intr.options.getString('city', true);
    const country = intr.options.getString('country', true);

    const geoUrl = new URL(`${BASE_URL}/geo/1.0/direct`);
    geoUrl.searchParams.append('q', `${city},${country}`);
    geoUrl.searchParams.append('limit', '1');
    geoUrl.searchParams.append('appid', env.OPENWEATHER_KEY);

    const geoResponse = await ky(geoUrl.toString()).json();
    const { data: geoData, error: geoError } = geoSchema
      .array()
      .safeParse(geoResponse);
    if (geoError) return await sendError(intr, 'City not found');

    const weatherUrl = new URL(`${BASE_URL}/data/2.5/weather`);
    weatherUrl.searchParams.append('lat', geoData[0].lat.toString());
    weatherUrl.searchParams.append('lon', geoData[0].lon.toString());
    weatherUrl.searchParams.append('appid', env.OPENWEATHER_KEY);
    weatherUrl.searchParams.append('units', 'metric');
    weatherUrl.searchParams.append('lang', 'en');
    const response = await ky(weatherUrl.toString()).json();
    const { data, error } = weatherSchema.safeParse(response);
    if (error)
      return await sendError(
        intr,
        'An error occurred while fetching the weather data'
      );

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              # Weather${data.name ? ` in ${data.name}` : ''}
              **Temperature:** ${data.main.temp}°C
              **Feels like:** ${data.main.feels_like}°C
              **Minimum temperature:** ${data.main.temp_min}°C
              **Maximum temperature:** ${data.main.temp_max}°C
              **Pressure:** ${data.main.pressure} hPa
              **Humidity:** ${data.main.humidity}%
              **Sea level:** ${data.main.sea_level} hPa
              **Ground level:** ${data.main.grnd_level} hPa
              ### :cloud: Weather
              **Main:** ${data.weather[0].main}
              **Description:** ${v.titleCase(data.weather[0].description)}
              ### :dash: Wind
              **Speed:** ${data.wind.speed} m/s
              **Direction:** ${data.wind.deg}°
              **Gust:** ${data.wind.gust ? `${data.wind.gust} m/s` : 'N/A'}
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
