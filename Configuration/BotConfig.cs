using Discord;
using Serilog;

namespace adramelech.Configuration;

public class BotConfig
{
    private static BotConfig? _instance;
    public static readonly Color EmbedColor = new(203, 166, 247);
    public static readonly Game Activity = new("you <3", ActivityType.Watching);
    public string Token = null!;

    private BotConfig()
    {
        FetchData();
    }

    public static BotConfig Instance => _instance ??= new BotConfig();

    private void FetchData()
    {
        var token = Environment.GetEnvironmentVariable("BOT_TOKEN");
        if (string.IsNullOrEmpty(token))
        {
            Log.Fatal("No token found in environment variables.");
            Environment.Exit(1);
        }

        Token = token;
    }
}