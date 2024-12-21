using System.Text;
using Adramelech.Services;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Humanizer;
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
    ///     Respond with an ephemeral error message
    /// </summary>
    /// <param name="context">The interaction context (can be implicit)</param>
    /// <param name="description">The description of the error (optional)</param>
    /// <param name="isDeferred">Whether the response should be deferred (optional)</param>
    /// <param name="toDm">Whether the response should be sent to DM</param>
    /// <returns></returns>
    public static Task SendError(this SocketInteractionContext<SocketModal> context,
        string? description = null, bool isDeferred = false, bool toDm = false)
    {
        return SendError(context, isDeferred ? InteractionOrigin.SlashCommandDeferred : InteractionOrigin.SlashCommand,
            description, toDm);
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

    /// <summary>
    ///     Verify if the user is on cooldown for the command, and respond with an error if they are
    /// </summary>
    /// <param name="context">The interaction context (can be implicit)</param>
    /// <param name="cooldownService">The cooldown service</param>
    /// <param name="isDeferred">Whether the response should be deferred</param>
    /// <returns>Whether the user is on cooldown</returns>
    public static async Task<bool> VerifyCooldown(this SocketInteractionContext<SocketSlashCommand> context,
        CooldownService cooldownService, bool isDeferred = false)
    {
        var result = cooldownService.IsOnCooldown(context.GetUniqueCommandName(), context.User.Id, out var remaining);
        if (result)
            await context.SendError(
                $"You are on cooldown for this command. Please wait {remaining.Humanize(2)} before trying again.",
                isDeferred);
        return result;
    }

    /// <summary>
    ///     Set the cooldown for the user
    /// </summary>
    /// <param name="context">The interaction context (can be implicit)</param>
    /// <param name="cooldownService">The cooldown service</param>
    /// <param name="cooldown">The cooldown duration</param>
    public static void SetCooldown(this SocketInteractionContext<SocketSlashCommand> context,
        CooldownService cooldownService, TimeSpan? cooldown = null)
    {
        cooldownService.SetCooldown(context.GetUniqueCommandName(), context.User.Id, cooldown);
    }

    /// <summary>
    ///     Get the unique command name from a <see cref="SocketInteractionContext{SocketSlashCommand}" />
    /// </summary>
    /// <param name="context">The interaction context (can be implicit)</param>
    /// <returns>The unique command name</returns>
    public static string GetUniqueCommandName(this SocketInteractionContext<SocketSlashCommand> context)
    {
        var sb = new StringBuilder();
        sb.Append(context.Interaction.Data.Name);
        foreach (var option in context.Interaction.Data.Options)
            GetNameRecursive(sb, option);
        return sb.ToString();
    }

    private static void GetNameRecursive(StringBuilder sb, IApplicationCommandInteractionDataOption option)
    {
        if (option.Type != ApplicationCommandOptionType.SubCommand &&
            option.Type != ApplicationCommandOptionType.SubCommandGroup) return;
        sb.Append($"-{option.Name}");
        foreach (var subOption in option.Options) GetNameRecursive(sb, subOption);
    }
}

public enum InteractionOrigin
{
    SlashCommand,
    SlashCommandDeferred,
    Component
}