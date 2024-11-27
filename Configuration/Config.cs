using Discord;
using Serilog;

namespace Adramelech.Configuration;

public class Config
{
    public const string UserAgent = "Adramelech (by @baxthus)";
    private static Config? _instance;
    public static readonly Color EmbedColor = new(203, 166, 247);
    public static readonly Game Activity = new("you <3", ActivityType.Watching);
    public string? FeedbackWebhook;
    public string? OpenWeatherKey;
    public string Token = null!;

    private Config()
    {
        FetchData();
    }

    public static Config Instance => _instance ??= new Config();

    private void FetchData()
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

        Token = token;
        FeedbackWebhook = feedbackWebhook;
        OpenWeatherKey = openWeatherKey;
    }
}