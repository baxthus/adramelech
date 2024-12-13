using Adramelech.Common;
using Discord.Interactions;
using Discord.WebSocket;
using Serilog;

namespace Adramelech.Events;

public class Ready(DiscordSocketClient client, InteractionService interactionService) : Event
{
    public override void Initialize()
    {
        client.Ready += OnReady;
    }

    private async Task OnReady()
    {
        var commands = await interactionService.RegisterCommandsGloballyAsync();

        Log.Information("Ready as {Username}#{Discriminator}", client.CurrentUser.Username,
            client.CurrentUser.Discriminator);
        Log.Information("Activity: {Type} {Name}", client.Activity.Type, client.Activity.Name);
        Log.Information("Registered {Count} commands", commands.Count);
    }
}