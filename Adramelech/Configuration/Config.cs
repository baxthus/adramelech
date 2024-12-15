using Discord;
using Serilog;

namespace Adramelech.Configuration;

public class Config
{
    public const string UserAgent = "Adramelech (by @baxthus)";
    public readonly Game Activity = new("you <3", ActivityType.Watching);
    public readonly string? AuthorUrl;
    public readonly Color EmbedColor = new(203, 166, 247);
    public readonly string? FeedbackWebhook;
    public readonly string? OpenWeatherKey;
    public readonly string Token;

    public Config()
    {
        var token = Environment.GetEnvironmentVariable("BOT_TOKEN");
        if (string.IsNullOrEmpty(token))
        {
            Log.Fatal("No token found in environment variables.");
            Environment.Exit(1);
        }

        var feedbackWebhook = Environment.GetEnvironmentVariable("FEEDBACK_WEBHOOK");
        if (string.IsNullOrEmpty(feedbackWebhook))
            Log.Warning("No feedback webhook found in environment variables.");

        var openWeatherKey = Environment.GetEnvironmentVariable("OPENWEATHER_KEY");
        if (string.IsNullOrEmpty(openWeatherKey))
            Log.Warning("No OpenWeather key found in environment variables.");

        var authorUrl = Environment.GetEnvironmentVariable("AUTHOR_URL");
        if (string.IsNullOrEmpty(authorUrl))
        {
            Log.Warning("No author link found in environment variables.");
            authorUrl = "https://www.pudim.com.br"; // References...
        }

        Token = token;
        FeedbackWebhook = feedbackWebhook;
        OpenWeatherKey = openWeatherKey;
        AuthorUrl = authorUrl;
    }
}