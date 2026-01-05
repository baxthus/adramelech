import { type } from 'arktype';
import { stripIndents } from 'common-tags';
import {
  ButtonStyle,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import ky from 'ky';
import { fromAsyncThrowable } from 'neverthrow';
import { arkToResult } from 'utils/validation';
import config from '~/config';
import type { CommandInfer } from '~/types/command';
import { sendError } from '~/utils/sendError';

const BASE_URL = 'https://api.openweathermap.org';

const Geos = type({
  lat: 'number',
  lon: 'number',
})
  .array()
  .exactlyLength(1);

const Weather = type({
  id: 'number',
  name: 'string | null',
  weather: type({
    main: 'string',
    description: 'string.capitalize',
  })
    .array()
    .exactlyLength(1),
  main: {
    temp: 'number',
    feels_like: 'number',
    temp_min: 'number',
    temp_max: 'number',
    pressure: 'number',
    humidity: 'number',
    sea_level: 'number',
    grnd_level: 'number',
  },
  wind: {
    speed: 'number',
    deg: 'number',
    gust: 'number | null',
  },
  sys: {
    country: 'string == 2 |> string.lower',
  },
});

export const command = <CommandInfer>{
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
  cooldown: 10 * 60, // 10 minutes
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
    )().andThen(arkToResult(Geos));
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
    )().andThen(arkToResult(Weather));
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
              **Description:** ${weather.weather[0]?.description}
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
