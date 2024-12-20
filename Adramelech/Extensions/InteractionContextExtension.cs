using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Serilog;

namespace Adramelech.Extensions;

/// <summary>
///     Extension class for <see cref="IInteractionContext" />
/// </summary>
public static class InteractionContextExtension
{
    /// <summary>
    ///     Respond with an ephemeral error message
    /// </summary>
    /// <param name="context">The interaction context (can be implicit)</param>
    /// <param name="origin">The origin of the interaction</param>
    /// <param name="description">The description of the error (optional)</param>
    /// <param name="toDm">Whether the response should be sent to DM</param>
    private static async Task SendError(this IInteractionContext context, InteractionOrigin origin,
        string? description = null, bool toDm = false)
    {
        var embed = new EmbedBuilder()
            .WithColor(Color.Red)
            .WithTitle("Error")
            .WithDescription(description ?? "An error occurred.")
            .Build();

        if (toDm)
        {
            await context.User.SendMessageAsync(embed: embed);
            return;
        }

        switch (origin)
        {
            case InteractionOrigin.SlashCommand:
                await context.Interaction.RespondAsync(embed: embed, ephemeral: true);
                break;
            case InteractionOrigin.SlashCommandDeferred:
                // Delete the original because whe need it to be ephemeral
                // NOTE: Every command that uses an external API should be deferred
                var msg = context.Interaction.FollowupAsync("opps...");
                try
                {
                    await msg.Result.DeleteAsync();
                }
                catch
                {
                    // ignored
                }

                await context.Interaction.FollowupAsync(embed: embed, ephemeral: true);
                break;
            case InteractionOrigin.Component:
                if (context is not SocketInteractionContext<SocketMessageComponent> componentContext) return;
                await componentContext.Interaction.UpdateAsync(p =>
                {
                    p.Embed = embed;
                    p.Content = "";
                    p.Components = new ComponentBuilder().Build();
                });
                break;
            default:
                // If this happens, something is very wrong
                Log.Warning("Unknown interaction type {InteractionId} from {Username} ({Userid})",
                    context.Interaction.Id, context.User.Username, context.User.Id);
                break;
        }
    }

    /// <summary>
    ///     Respond with an ephemeral error message
    /// </summary>
    /// <param name="context">The interaction context (can be implicit)</param>
    /// <param name="description">The description of the error (optional)</param>
    /// <param name="isDeferred">Whether the response should be deferred</param>
    /// <param name="toDm">Whether the response should be sent to DM</param>
    public static Task SendError(this SocketInteractionContext<SocketSlashCommand> context, string? description = null,
        bool isDeferred = false, bool toDm = false)
    {
        return SendError(context, isDeferred ? InteractionOrigin.SlashCommandDeferred : InteractionOrigin.SlashCommand,
            description, toDm);
    }

    /// <summary>
    ///     Respond with an ephemeral error message
    /// </summary>
    /// <param name="context">The interaction context (can be implicit)</param>
    /// <param name="description">The description of the error (optional)</param>
    /// <param name="toDm">Whether the response should be sent to DM</param>
    public static Task SendError(this SocketInteractionContext<SocketMessageComponent> context,
        string? description = null, bool toDm = false)
    {
        return SendError(context, InteractionOrigin.Component, description, toDm);
    }

    /// <summary>
    ///     Get the <see cref="MessageReference" /> from a <see cref="IInteractionContext" />
    /// </summary>
    /// <param name="context">The interaction context (can be implicit)</param>
    /// <returns>The <see cref="MessageReference" /> or null</returns>
    /// <remarks>Currently only supports <see cref="SocketInteractionContext{SocketMessageComponent}" /></remarks>
    public static MessageReference? MessageReference(this IInteractionContext context)
    {
        return context switch
        {
            SocketInteractionContext<SocketMessageComponent> componentContext => new MessageReference(
                componentContext.Interaction.Message.Id, componentContext.Interaction.Channel.Id,
                componentContext.Interaction.GuildId),
            _ => null
        };
    }
}

public enum InteractionOrigin
{
    SlashCommand,
    SlashCommandDeferred,
    Component
}