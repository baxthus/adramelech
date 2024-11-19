using Discord.Interactions;
using Discord.WebSocket;
using Serilog;

namespace Adramelech.Events;

public class Ready(DiscordSocketClient client, InteractionService interactionService)
{
    public void Initialize()
    {
        client.Ready += OnReady;
    }

    private async Task OnReady()
    {
        await interactionService.RegisterCommandsGloballyAsync();

        Log.Information("Ready as {Username}#{Discriminator}", client.CurrentUser.Username,
            client.CurrentUser.Discriminator);
        Log.Information("Activity: {Type} {Name}", client.Activity.Type, client.Activity.Name);
    }
}