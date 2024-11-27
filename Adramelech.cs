using System.Reflection;
using Adramelech.Configuration;
using Adramelech.Events;
using Adramelech.Logging;
using Adramelech.Tools;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using Serilog.Events;

namespace Adramelech;

internal class Adramelech
{
    private static readonly DiscordSocketConfig ClientConfig = new()
    {
        GatewayIntents = GatewayIntents.Guilds |
                         GatewayIntents.GuildMembers |
                         GatewayIntents.GuildBans |
                         GatewayIntents.GuildMessages |
                         GatewayIntents.DirectMessages
    };

    public static Task Main()
    {
        return MainAsync();
    }

    private static async Task MainAsync()
    {
        DotEnv.Load();

        Log.Logger = Loggers.Default;

        var services = ConfigureServices();

        var client = services.GetRequiredService<DiscordSocketClient>();
        var interactionService = services.GetRequiredService<InteractionService>();

        client.Log += LogAsync;
        interactionService.Log += LogAsync;

        await client.SetActivityAsync(Config.Activity);

        await client.LoginAsync(TokenType.Bot, Config.Instance.Token);
        await client.StartAsync();

        await interactionService.AddModulesAsync(Assembly.GetEntryAssembly(), services);

        services.GetRequiredService<InteractionCreated>().Initialize();
        services.GetRequiredService<Ready>().Initialize();

        await Task.Delay(-1);
    }

    private static ServiceProvider ConfigureServices()
    {
        return new ServiceCollection()
            .AddSingleton(_ => new DiscordSocketClient(ClientConfig))
            .AddSingleton(x => new InteractionService(x.GetRequiredService<DiscordSocketClient>()))
            .AddSingleton<InteractionCreated>()
            .AddSingleton<Ready>()
            .BuildServiceProvider();
    }

    private static async Task LogAsync(LogMessage msg)
    {
        var severity = msg.Severity switch
        {
            LogSeverity.Critical => LogEventLevel.Fatal,
            LogSeverity.Error => LogEventLevel.Error,
            LogSeverity.Warning => LogEventLevel.Warning,
            LogSeverity.Info => LogEventLevel.Information,
            LogSeverity.Verbose => LogEventLevel.Verbose,
            LogSeverity.Debug => LogEventLevel.Debug,
            _ => LogEventLevel.Information
        };

        Log.Write(severity, msg.Exception, "[{Source}] {Message}", msg.Source, msg.Message);

        await Task.CompletedTask;
    }
}