using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Services;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Flurl;

namespace Adramelech.Commands.Slash;

public class Weather(Config config, HttpUtils httpUtils, CooldownService cooldownService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    private const string OpenWeatherUrl = "https://api.openweathermap.org";

    [SlashCommand("weather", "Get the weather of a city")]
    public async Task WeatherAsync([Summary("country", "The country of the city")] string country,
        [Summary("city", "The city to get the weather of")]
        string city)
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        if (config.FeedbackWebhook.IsNullOrEmpty())
        {
            await Context.SendError("The feedback webhook is not set up.");
            return;
        }

        await DeferAsync();

        var coordinates = await httpUtils.GetAsync<OpenWeatherGeo[]>(
            OpenWeatherUrl.AppendPathSegments("geo", "1.0", "direct")
                .SetQueryParam("q", $"{city},{country}")
                .SetQueryParam("appid", config.OpenWeatherKey)
                .ToString());
        if (coordinates.IsDefault()) await Context.SendError("Failed to get the coordinates of the city.");

        var weather = await httpUtils.GetAsync<OpenWeather>(
            OpenWeatherUrl.AppendPathSegments("data", "2.5", "weather")
                .SetQueryParam("lat", coordinates![0].Lat)
                .SetQueryParam("lon", coordinates[0].Lon)
                .SetQueryParam("appid", config.OpenWeatherKey)
                .SetQueryParam("units", "metric")
                .SetQueryParam("lang", "en")
                .ToString());
        if (weather.IsDefault())
        {
            await Context.SendError("Failed to get the weather of the city.");
            return;
        }

        var mainField = $"""
                         **Temperature**: {weather.Main.Temp}°C
                         **Feels Like**: {weather.Main.FeelsLike}°C
                         **Minimum Temperature**: {weather.Main.TempMin}°C
                         **Maximum Temperature**: {weather.Main.TempMax}°C
                         **Pressure**: {weather.Main.Pressure}hPa
                         **Humidity**: {weather.Main.Humidity}%
                         **Sea Level**: {weather.Main.SeaLevel}hPa
                         **Ground Level**: {weather.Main.GroundLevel}hPa
                         """;
        var weatherField = $"""
                            **Main**: {weather.Weather[0].Main}
                            **Description**: {weather.Weather[0].Description}
                            """;
        var windField = $"""
                         **Speed**: {weather.Wind.Speed}m/s
                         **Degree**: {weather.Wind.Deg}°
                         **Gust**: {weather.Wind.Gust}m/s
                         """;

        await FollowupAsync(embed: new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithTitle($"Weather{(weather.Name.IsNullOrEmpty() ? string.Empty : $" in {weather.Name}")}")
            .AddField("> :zap: Main", mainField)
            .AddField("> :cloud: Weather", weatherField)
            .AddField("> :dash: Wind", windField)
            .WithFooter("Powered by openweathermap.org")
            .Build());
        Context.SetCooldown(cooldownService, TimeSpan.FromMinutes(10));
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct OpenWeatherGeo
    {
        public double Lat { get; set; }
        public double Lon { get; set; }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct OpenWeather
    {
        public SWeather[] Weather { get; set; }
        public SMain Main { get; set; }
        public SWind Wind { get; set; }
        public string? Name { get; set; }

        internal struct SWeather
        {
            public string Main { get; set; }
            public string Description { get; set; }
        }

        internal struct SMain
        {
            public double Temp { get; set; }
            public double FeelsLike { get; set; }
            public double TempMin { get; set; }
            public double TempMax { get; set; }
            public int Pressure { get; set; }
            public int Humidity { get; set; }
            public int SeaLevel { get; set; }
            [JsonPropertyName("grnd_level")] public int GroundLevel { get; set; }
        }

        internal struct SWind
        {
            public double Speed { get; set; }
            public int Deg { get; set; }
            public double Gust { get; set; }
        }
    }
}