using Discord;
using Serilog;

namespace Adramelech.Configuration;

public class Config
{
    public const string UserAgent = "Adramelech (by @baxthus)";
    public readonly Game Activity = new("you <3", ActivityType.Watching);
    public readonly string AuthorUrl = GetEnvironmentVariable("AUTHOR_URL", false) ?? "https://www.pudim.com.br";

    public readonly TimeSpan CooldownCleanupInterval =
        GetTimeSpanFromEnvironment("COOLDOWN_CLEANUP_INTERVAL_SECONDS", 60);

    public readonly TimeSpan
        DefaultCooldown =
            GetTimeSpanFromEnvironment("DEFAULT_COOLDOWN_SECONDS",
                5); // Used in commands that require external API calls

    public readonly TimeSpan DefaultRequestTimeout = GetTimeSpanFromEnvironment("DEFAULT_REQUEST_TIMEOUT_SECONDS", 10);
    public readonly Color EmbedColor = new(203, 166, 247);
    public readonly string? FeedbackWebhook = GetEnvironmentVariable("FEEDBACK_WEBHOOK", false);
    public readonly string? OpenWeatherKey = GetEnvironmentVariable("OPENWEATHER_KEY", false);
    public readonly string Token = GetEnvironmentVariable("BOT_TOKEN", true)!;

    private static string? GetEnvironmentVariable(string key, bool isRequired)
    {
        var value = Environment.GetEnvironmentVariable(key);
        switch (isRequired)
        {
            case true when string.IsNullOrEmpty(value):
                Log.Fatal("No {Key} found in environment variables.", key);
                Environment.Exit(1);
                break;
            case false when string.IsNullOrEmpty(value):
                Log.Warning("No {Key} found in environment variables.", key);
                break;
        }

        return value;
    }

    private static TimeSpan GetTimeSpanFromEnvironment(string key, int defaultSeconds)
    {
        var value = Environment.GetEnvironmentVariable(key);
        if (!string.IsNullOrEmpty(value) && int.TryParse(value, out var seconds)) return TimeSpan.FromSeconds(seconds);
        Log.Warning("No {Key} found in environment variables, using default value of {DefaultSeconds}.",
            key, defaultSeconds);
        return TimeSpan.FromSeconds(defaultSeconds);
    }
}