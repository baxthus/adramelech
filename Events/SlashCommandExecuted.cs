using Discord;
using Discord.Interactions;
using Serilog;

namespace Adramelech.Events;

public class SlashCommandExecuted(InteractionService interactionService)
{
    public void Initialize()
    {
        interactionService.SlashCommandExecuted += OnSlashCommandExecuted;
    }

    private static Task OnSlashCommandExecuted(SlashCommandInfo commandInfo, IInteractionContext interactionContext,
        IResult result)
    {
        if (result.IsSuccess) return Task.CompletedTask;

        Log.Error("Error while executing slash command {CommandName}: {ErrorReason}", commandInfo.Name,
            result.ErrorReason);

        return Task.CompletedTask;
    }
}