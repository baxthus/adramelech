using Adramelech.Configuration;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash.Internals;

[RequireContext(ContextType.DM)]
public class Shutdown : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("shutdown", "Shutdown the bot.")]
    [RequireOwner]
    public async Task ExecuteAsync()
    {
        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(Color.LightGrey)
                .WithTitle("Are you sure you want to shut down the bot?")
                .Build(),
            components: new ComponentBuilder()
                .WithButton("Confirm", "shutdown_confirmation_button", ButtonStyle.Danger)
                .WithButton("Cancel", "shutdown_cancel_button", ButtonStyle.Secondary)
                .Build());
    }

    public class ShutdownHandler(Config config, CancellationTokenSource cancellationTokenSource)
        : InteractionModuleBase<SocketInteractionContext<SocketMessageComponent>>
    {
        [ComponentInteraction("shutdown_confirmation_button")]
        [RequireOwner]
        public async Task ShutdownAsync()
        {
            await Context.Interaction.UpdateAsync(p =>
            {
                p.Embed = new EmbedBuilder()
                    .WithColor(config.EmbedColor)
                    .WithTitle("Shutting down...")
                    .Build();
                p.Components = null;
            });
            await cancellationTokenSource.CancelAsync();
        }

        [ComponentInteraction("shutdown_cancel_button")]
        [RequireOwner]
        public async Task CancelAsync()
        {
            await Context.Interaction.UpdateAsync(p =>
            {
                p.Embed = new EmbedBuilder()
                    .WithColor(Color.LightGrey)
                    .WithTitle("Shutdown cancelled.")
                    .Build();
                p.Components = null;
            });
        }
    }
}