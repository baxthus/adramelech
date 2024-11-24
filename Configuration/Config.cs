using Discord;
using Serilog;

namespace adramelech.Configuration;

public class Config
{
    private static Config? _instance;
    public static readonly Color EmbedColor = new(203, 166, 247);
    public static readonly Game Activity = new("you <3", ActivityType.Watching);
    public static readonly string UserAgent = "Adramelech (by @baxthus)";
    public string? FeedbackWebhook;
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
            // We will not exit, but remember to check when using this value.
            Log.Warning("No feedback webhook found in environment variables.");

        Token = token;
        FeedbackWebhook = feedbackWebhook;
    }
}