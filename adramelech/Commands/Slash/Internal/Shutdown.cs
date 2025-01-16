using adramelech.Commands.Preconditions;
using NetCord;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;
using NetCord.Services.ComponentInteractions;

namespace adramelech.Commands.Slash.Internal;

public class Shutdown : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("shutdown", "Shutdown the bot.", Contexts = [InteractionContextType.BotDMChannel])]
    [RequireOwner<SlashCommandContext>]
    public async Task ShutdownAsync()
    {
        await RespondAsync(InteractionCallback.Message(
            new InteractionMessageProperties()
                .AddEmbeds(
                    new EmbedProperties()
                        .WithColor(new Color(128, 128, 128)) // Gray
                        .WithTitle("Are you sure you want to shutdown the bot?")
                )
                .AddComponents(
                    new ActionRowProperties()
                        .AddButtons(
                            new ButtonProperties("shutdown_confirmation_button", "Confirm", ButtonStyle.Danger),
                            new ButtonProperties("shutdown_cancel_button", "Cancel", ButtonStyle.Secondary)
                        )
                )
        ));
    }
}

public class ShutdownHandler(Configuration config, CancellationTokenSource cts)
    : ComponentInteractionModule<ButtonInteractionContext>
{
    [ComponentInteraction("shutdown_confirmation_button")]
    [RequireOwner<ButtonInteractionContext>]
    public async Task ShutdownAsync()
    {
        await Context.Message.ModifyAsync(o =>
        {
            o.Embeds =
            [
                new EmbedProperties()
                    .WithColor(config.EmbedColor)
                    .WithTitle("Shutting down...")
            ];
            o.Components = Array.Empty<ActionRowProperties>();
        });
        await cts.CancelAsync();
    }
    
    [ComponentInteraction("shutdown_cancel_button")]
    [RequireOwner<ButtonInteractionContext>]
    public async Task CancelAsync()
    {
        await Context.Message.ModifyAsync(o =>
        {
            o.Embeds =
            [
                new EmbedProperties()
                    .WithColor(new Color(128, 128, 128)) // Gray
                    .WithTitle("Shutdown cancelled.")
            ];
            o.Components = Array.Empty<ActionRowProperties>();
        });
    }
}