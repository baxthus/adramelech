using System.Reflection;
using Adramelech.Common;
using Adramelech.Configuration;
using Adramelech.Events;
using Adramelech.Logging;
using Adramelech.Tools;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using Serilog.Events;

namespace Adramelech;

internal static class Adramelech
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

        var config = services.GetRequiredService<Config>();
        var client = services.GetRequiredService<DiscordSocketClient>();
        var interactionService = services.GetRequiredService<InteractionService>();

        client.Log += LogAsync;
        interactionService.Log += LogAsync;

        await client.SetActivityAsync(config.Activity);

        await client.LoginAsync(TokenType.Bot, config.Token);
        await client.StartAsync();

        await interactionService.AddModulesAsync(Assembly.GetEntryAssembly(), services);

        services.GetRequiredService<EventsActivator>().Activate();

        await Task.Delay(-1);
    }

    private static ServiceProvider ConfigureServices()
    {
        var serviceCollection = new ServiceCollection()
            .AddSingleton<Config>()
            .AddSingleton(_ => new DiscordSocketClient(ClientConfig))
            .AddSingleton(x => new InteractionService(x.GetRequiredService<DiscordSocketClient>()))
            .AddSingleton<InteractionCreated>()
            .AddSingleton<Ready>()
            .AddHttpClient()
            .AddSingleton<HttpUtils>();

        EventsActivator.Register(serviceCollection);

        return serviceCollection.BuildServiceProvider();
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