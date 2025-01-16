using adramelech.Services;
using adramelech.Tools;
using adramelech.Utilities;
using Microsoft.Extensions.DependencyInjection;
using NetCord;
using NetCord.Gateway;
using Serilog;
using Serilog.Events;

namespace adramelech;

internal static class Adramelech
{
    private static readonly CancellationTokenSource Cts = new();

    public static Task Main() => MainAsync();

    private static async Task MainAsync()
    {
        await DotEnv.Load(cancellationToken: Cts.Token);

        Log.Logger = Logger.Default;

        var services = ConfigureServices();

        var client = services.GetRequiredService<GatewayClient>();

        services.GetRequiredService<EventsService>().Activate();
        await services.GetRequiredService<InteractionService>().Activate();

        var config = services.GetRequiredService<Configuration>();

        await client.StartAsync(config.Presence, Cts.Token);
        // Locking until the token is cancelled
        Cts.Token.WaitHandle.WaitOne();

        Log.Information("Shutting down...");

        await client.CloseAsync();
        services.GetRequiredService<CooldownService>().Dispose();
        client.Dispose();
        await Log.CloseAndFlushAsync();
    }

    private static GatewayClient CreateClient(Configuration config)
    {
        var client = new GatewayClient(new BotToken(config.Token), new GatewayClientConfiguration
        {
            Intents = GatewayIntents.Guilds |
                      GatewayIntents.GuildUsers |
                      GatewayIntents.GuildModeration |
                      GatewayIntents.GuildMessages |
                      GatewayIntents.DirectMessages
        });

        client.Log += msg =>
        {
            var severity = msg.Severity switch
            {
                // Why is there just two levels?
                LogSeverity.Info => LogEventLevel.Information,
                LogSeverity.Error => LogEventLevel.Error,
                _ => LogEventLevel.Information
            };

            Log.Write(severity, msg.Exception, "{Message} | {Description}", msg.Message, msg.Description);
            return default;
        };

        return client;
    }

    private static ServiceProvider ConfigureServices()
    {
        var services = new ServiceCollection()
            .AddSingleton(Cts)
            .AddSingleton<Configuration>()
            .AddSingleton<InteractionService>()
            .AddSingleton(provider => CreateClient(provider.GetRequiredService<Configuration>()))
            .AddHttpClient()
            .AddSingleton<HttpUtils>()
            .AddSingleton<CooldownService>();

        EventsService.Register(services);

        return services.BuildServiceProvider();
    }
}