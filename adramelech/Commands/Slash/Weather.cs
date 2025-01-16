using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using adramelech.Commands.Preconditions;
using adramelech.Extensions;
using adramelech.Utilities;
using Flurl;
using Humanizer;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Weather(Configuration config, HttpUtils httpUtils) : ApplicationCommandModule<SlashCommandContext>
{
    private const string OpenWeatherUrl = "https://api.openweathermap.org";

    [SlashCommand("weather", "Get the weather of a city")]
    [RequireCooldown(CooldownSeconds = 10 * 60)] // 10 minutes
    public async Task WeatherAsync(
        [SlashCommandParameter(Name = "city", Description = "The city to get the weather of")]
        string city,
        [SlashCommandParameter(Name = "country", Description = "The country of the city")]
        string country
    )
    {
        if (string.IsNullOrWhiteSpace(config.OpenWeatherKey))
        {
            await Context.Interaction.SendError("The OpenWeather API key is not set up.");
            return;
        }

        await RespondAsync(InteractionCallback.DeferredMessage());

        var coordinates = await httpUtils.GetAsync<OpenWeatherGeo[]>(
            OpenWeatherUrl.AppendPathSegments("geo", "1.0", "direct")
                .SetQueryParam("q", $"{city},{country}")
                .SetQueryParam("appid", config.OpenWeatherKey)
                .SetQueryParam("limit", 1)
        );
        if (coordinates.IsDefault())
        {
            await Context.Interaction.SendError("City not found.", true);
            return;
        }

        var weather = await httpUtils.GetAsync<OpenWeather>(
            OpenWeatherUrl.AppendPathSegments("data", "2.5", "weather")
                .SetQueryParam("lat", coordinates![0].Lat)
                .SetQueryParam("lon", coordinates[0].Lon)
                .SetQueryParam("appid", config.OpenWeatherKey)
                .SetQueryParam("units", "metric")
                .SetQueryParam("lang", "en")
        );
        if (weather.IsDefault())
        {
            await Context.Interaction.SendError("Failed to get weather data.", true);
            return;
        }

        var mainField = $"""
                         **Temperature**: {weather.Main.Temp}°C
                         **Feels like**: {weather.Main.FeelsLike}°C
                         **Minimum temperature**: {weather.Main.TempMin}°C
                         **Maximum temperature**: {weather.Main.TempMax}°C
                         **Pressure**: {weather.Main.Pressure} hPa
                         **Humidity**: {weather.Main.Humidity}%
                         **Sea level**: {weather.Main.SeaLevel} hPa
                         **Ground level**: {weather.Main.GroundLevel} hPa
                         """;
        var weatherField = $"""
                            **Main**: {weather.Weather[0].Main}
                            **Description**: {weather.Weather[0].Description.Humanize(LetterCasing.Sentence)}
                            """;
        var windField = $"""
                         **Speed**: {weather.Wind.Speed} m/s
                         **Direction**: {weather.Wind.Deg}°
                         **Gust**: {weather.Wind.Gust} m/s
                         """;

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle($"Weather{(string.IsNullOrWhiteSpace(weather.Name) ? "" : $" in {weather.Name}")}")
                .AddFields(
                    new EmbedFieldProperties()
                        .WithName("> :zap: Main")
                        .WithValue(mainField),
                    new EmbedFieldProperties()
                        .WithName("> :cloud: Weather")
                        .WithValue(weatherField),
                    new EmbedFieldProperties()
                        .WithName("> :dash: Wind")
                        .WithValue(windField)
                )
                .WithFooter(new EmbedFooterProperties()
                    .WithText("Powered by openweathermap.org")
                )
            )
        );
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct OpenWeatherGeo
    {
        public double Lat { get; init; }
        public double Lon { get; init; }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct OpenWeather
    {
        public WeatherType[] Weather { get; init; }
        public MainType Main { get; init; }
        public WindType Wind { get; init; }
        public string? Name { get; init; }

        internal struct WeatherType
        {
            public string Main { get; init; }
            public string Description { get; init; }
        }

        internal struct MainType
        {
            public double Temp { get; init; }
            public double FeelsLike { get; init; }
            public double TempMin { get; init; }
            public double TempMax { get; init; }
            public int Pressure { get; init; }
            public int Humidity { get; init; }
            public int SeaLevel { get; init; }
            [JsonPropertyName("grnd_level")] public int GroundLevel { get; init; }
        }

        internal struct WindType
        {
            public double Speed { get; init; }
            public int Deg { get; init; }
            public double Gust { get; init; }
        }
    }
}