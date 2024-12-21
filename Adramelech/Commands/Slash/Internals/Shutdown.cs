using System.Diagnostics.CodeAnalysis;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash.Internals;

[SuppressMessage("ReSharper", "ClassNeverInstantiated.Global")]
public class Shutdown : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("shutdown", "Shutdown the bot.")]
    [RequireOwner]
    public async Task ExecuteAsync()
    {
        await RespondWithModalAsync<ShutdownModal>("shutdown_modal");
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
    public class ShutdownModal : IModal
    {
        [InputLabel("Confirmation")]
        [ModalTextInput("confirmation", TextInputStyle.Short, "Type 'shutdown' to confirm.")]
        public required string Confirmation { get; set; }

        public string Title => "Shutdown";
    }
}

public class ShutdownModalHandler(Config config, CancellationTokenSource cancellationTokenSource)
    : InteractionModuleBase<SocketInteractionContext<SocketModal>>
{
    [ModalInteraction("shutdown_modal")]
    [RequireOwner]
    public async Task Modal(Shutdown.ShutdownModal modal)
    {
        var confirmation = modal.Confirmation;
        if (confirmation != "shutdown")
        {
            await Context.SendError("Invalid confirmation.");
            return;
        }

        await RespondAsync(embed: new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithTitle("Shutting down...")
            .Build(), ephemeral: true);
        await cancellationTokenSource.CancelAsync();
    }
}