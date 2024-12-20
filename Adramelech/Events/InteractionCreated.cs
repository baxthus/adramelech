﻿using Adramelech.Common;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Serilog;

namespace Adramelech.Events;

public class InteractionCreated(
    DiscordSocketClient client,
    InteractionService interactionService,
    IServiceProvider services) : Event
{
    public override void Initialize()
    {
        client.InteractionCreated += OnInteractionCreated;
    }

    private async Task OnInteractionCreated(SocketInteraction interaction)
    {
        try
        {
            var context = CreateGenericContext(interaction, client);
            await interactionService.ExecuteCommandAsync(context, services);
        }
        catch (Exception exception)
        {
            Log.Error("An error occurred while executing an interaction command: {Exception}", exception);
            try
            {
                // Delete the troublesome message (works sometimes)
                var originalResponse = await interaction.GetOriginalResponseAsync();
                await originalResponse.DeleteAsync();
            }
            catch
            {
                // ignored
            }
        }
    }

    private static IInteractionContext
        CreateGenericContext(SocketInteraction interaction, DiscordSocketClient client)
    {
        return interaction switch
        {
            SocketModal modal => new SocketInteractionContext<SocketModal>(client, modal),
            SocketUserCommand user => new SocketInteractionContext<SocketUserCommand>(client, user),
            SocketSlashCommand slash => new SocketInteractionContext<SocketSlashCommand>(client, slash),
            SocketMessageCommand message => new SocketInteractionContext<SocketMessageCommand>(client, message),
            SocketMessageComponent component => new SocketInteractionContext<SocketMessageComponent>(client, component),
            _ => throw new InvalidOperationException("Unknown interaction type")
        };
    }
}