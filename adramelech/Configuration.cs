using NetCord;
using NetCord.Gateway;
using Serilog;

namespace adramelech;

public class Configuration
{
    public readonly string Token = GetEnvironmentVariable("BOT_TOKEN", true)!;
    public readonly Color EmbedColor = new(203, 166, 247);
    public readonly string AuthorUrl = GetEnvironmentVariable("AUTHOR_URL", false) ?? "https://www.pudim.com.br";
    public readonly TimeSpan DefaultRequestTimeout = GetTimeSpanFromEnvironment("DEFAULT_REQUEST_TIMEOUT_SECONDS", 10);
    public readonly string UserAgent = GetEnvironmentVariable("USER_AGENT", false) ?? "adramelech";
    public readonly string? FeedbackWebhook = GetEnvironmentVariable("FEEDBACK_WEBHOOK", false);
    public readonly string? OpenWeatherKey = GetEnvironmentVariable("OPENWEATHER_KEY", false);

    public readonly TimeSpan CooldownCleanupInterval =
        GetTimeSpanFromEnvironment("COOLDOWN_CLEANUP_INTERVAL_SECONDS", 60);

    public readonly TimeSpan DefaultCooldown = GetTimeSpanFromEnvironment("DEFAULT_COOLDOWN_SECONDS", 5);

    public readonly string RepositoryUrl = GetEnvironmentVariable("REPOSITORY_URL", false) ??
                                           "https://www.youtube.com/watch?v=5-6wfBF2W0o";

    public readonly PresenceProperties Presence = new(UserStatusType.Online)
    {
        Activities =
        [
            new UserActivityProperties("you <3", UserActivityType.Watching)
        ]
    };

    private static string? GetEnvironmentVariable(string key, bool isRequired)
    {
        var value = Environment.GetEnvironmentVariable(key);
        switch (isRequired)
        {
            case true when string.IsNullOrWhiteSpace(value):
                Log.Fatal("No {Key} environment variable found", key);
                Environment.Exit(1);
                break;
            case false when string.IsNullOrWhiteSpace(value):
                Log.Warning("No {Key} environment variable found", key);
                break;
        }

        return value;
    }

    private static TimeSpan GetTimeSpanFromEnvironment(string key, int defaultSeconds)
    {
        var value = Environment.GetEnvironmentVariable(key);
        if (!string.IsNullOrWhiteSpace(value) && int.TryParse(value, out var seconds))
            return TimeSpan.FromSeconds(seconds);
        Log.Warning("No valid {Key} environment variable found, using default value of {DefaultSeconds} seconds", key,
            defaultSeconds);
        return TimeSpan.FromSeconds(defaultSeconds);
    }
}