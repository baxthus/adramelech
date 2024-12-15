using Adramelech.Configuration;
using Adramelech.Extensions;
using Discord;
using Discord.Interactions;
using Discord.Net;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Kick(Config config) : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("kick", "Kick a user from the server")]
    [RequireUserPermission(GuildPermission.KickMembers)]
    [RequireBotPermission(GuildPermission.KickMembers)]
    [RequireContext(ContextType.Guild)]
    public async Task KickAsync([Summary("user", "The user to kick")] SocketGuildUser user,
        [Summary("reason", "The reason for the kick")]
        string reason = "No reason provided",
        [Summary("prune_days", "The number of days to prune messages")]
        int pruneDays = 0,
        [Summary("ephemeral", "Whether the response should be ephemeral")]
        bool ephemeral = false)
    {
        if (user.Id == Context.User.Id)
        {
            await Context.SendError("You can't kick yourself!");
            return;
        }

        if (user.Hierarchy >= Context.Guild.CurrentUser.Hierarchy)
        {
            await Context.SendError("You can't kick a user with a higher or equal role than me!");
            return;
        }

        await user.BanAsync(pruneDays, reason);

        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(config.EmbedColor)
                .WithTitle("User Kicked")
                .WithDescription($"User {user.Username} has been kicked")
                .AddField("Reason", $"`{reason}`")
                .AddField("Author", Context.User.Mention)
                .Build());

        try
        {
            // Will throw if the user has DMs disabled
            await user.SendMessageAsync($"You have been kicked from {Context.Guild.Name}. Reason: {reason}");
        }
        catch (HttpException)
        {
            await Context.SendError("Failed to notify the user about the kick");
        }
    }
}