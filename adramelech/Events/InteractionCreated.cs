using adramelech.Common;
using adramelech.Extensions;
using adramelech.Services;
using NetCord;
using NetCord.Gateway;
using NetCord.Services;
using NetCord.Services.ApplicationCommands;
using NetCord.Services.ComponentInteractions;
using Serilog;

namespace adramelech.Events;

public class InteractionCreated(
    GatewayClient client,
    InteractionService interactionService,
    IServiceProvider services) : Event
{
    public override void Initialize()
    {
        client.InteractionCreate += OnInteractionCreated;
    }

    private async ValueTask OnInteractionCreated(Interaction interaction)
    {
        var result = await (interaction switch
        {
            SlashCommandInteraction slashCommandInteraction => interactionService.SlashCommandService.ExecuteAsync(
                new SlashCommandContext(slashCommandInteraction, client), services),
            UserCommandInteraction userCommandInteraction => interactionService.UserCommandService.ExecuteAsync(
                new UserCommandContext(userCommandInteraction, client), services),
            ButtonInteraction buttonInteraction => interactionService.ButtonService.ExecuteAsync(
                new ButtonInteractionContext(buttonInteraction, client), services),
            ModalInteraction modalInteraction => interactionService.ModalService.ExecuteAsync(
                new ModalInteractionContext(modalInteraction, client), services),
            _ => throw new InvalidOperationException("Unknown interaction type")
        });

        if (result is IFailResult failResult)
        {
            await interaction.SendError(failResult.Message);
        }
    }
}