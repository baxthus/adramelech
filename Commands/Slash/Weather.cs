using System.Diagnostics.CodeAnalysis;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Flurl;
using Newtonsoft.Json;

namespace Adramelech.Commands.Slash;

public class Weather : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    private const string OpenWeatherUrl = "https://api.openweathermap.org";

    [SlashCommand("weather", "Get the weather of a city")]
    public async Task WeatherAsync([Summary("country", "The country of the city")] string country,
        [Summary("city", "The city to get the weather of")]
        string city)
    {
        if (Config.Instance.FeedbackWebhook.IsNullOrEmpty())
        {
            await Context.SendError("The feedback webhook is not set up.");
            return;
        }

        await DeferAsync();

        var coordinates = await OpenWeatherUrl
            .AppendPathSegments("geo", "1.0", "direct")
            .SetQueryParam("q", $"{city},{country}")
            .SetQueryParam("appid", Config.Instance.OpenWeatherKey)
            .ToString()
            .GetAsync<OpenWeatherGeo[]>();
        if (coordinates.IsDefault()) await Context.SendError("Failed to get the coordinates of the city.");

        var weather = await OpenWeatherUrl
            .AppendPathSegments("data", "2.5", "weather")
            .SetQueryParam("lat", coordinates![0].Lat)
            .SetQueryParam("lon", coordinates[0].Lon)
            .SetQueryParam("appid", Config.Instance.OpenWeatherKey)
            .SetQueryParam("units", "metric")
            .SetQueryParam("lang", "en")
            .ToString()
            .GetAsync<OpenWeather>();
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
            .WithColor(Config.EmbedColor)
            .WithTitle($"Weather{(weather.Name.IsNullOrEmpty() ? string.Empty : $" in {weather.Name}")}")
            .AddField("> :zap: Main", mainField)
            .AddField("> :cloud: Weather", weatherField)
            .AddField("> :dash: Wind", windField)
            .WithFooter("Powered by openweathermap.org")
            .Build());
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct OpenWeatherGeo
    {
        public string Lat { get; set; }
        public string Lon { get; set; }
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
            [JsonProperty("feels_like")] public double FeelsLike { get; set; }
            [JsonProperty("temp_min")] public double TempMin { get; set; }
            [JsonProperty("temp_max")] public double TempMax { get; set; }
            public int Pressure { get; set; }
            public int Humidity { get; set; }
            [JsonProperty("sea_level")] public int SeaLevel { get; set; }
            [JsonProperty("grnd_level")] public int GroundLevel { get; set; }
        }

        internal struct SWind
        {
            public double Speed { get; set; }
            public int Deg { get; set; }
            public double Gust { get; set; }
        }
    }
}