using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Ban : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("ban", "Ban a member")]
    [RequireUserPermission(GuildPermission.BanMembers)]
    [RequireBotPermission(GuildPermission.BanMembers)]
    [RequireContext(ContextType.Guild)]
    public async Task BanAsync([Summary("user", "The user to ban")] SocketGuildUser user,
        [Summary("reason", "The reason for the ban")]
        string reason = "No reason provided",
        [Summary("prune_days", "The number of days to prune messages")]
        int pruneDays = 0,
        [Summary("ephemeral", "Whether the response should be ephemeral")]
        bool ephemeral = false)
    {
        if (user.Id == Context.User.Id)
        {
            await Context.SendError("You can't ban yourself!");
            return;
        }

        if (user.Hierarchy >= Context.Guild.CurrentUser.Hierarchy)
        {
            await Context.SendError("You cannot ban a member with a higher or equal role than you!");
            return;
        }

        await user.BanAsync(pruneDays, reason);

        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(Config.EmbedColor)
                .WithTitle("Member Banned")
                .WithDescription($"User {user.Username} has been banned")
                .AddField("Reason", $"`{reason}`")
                .AddField("Author", Context.User.Mention)
                .Build(),
            ephemeral: ephemeral);

        if ((await ErrorUtils.TryAsync(() =>
                user.SendMessageAsync($"You have benn banned from {Context.Guild.Name}. Reason: {reason}"))).IsFailure)
            await Context.SendError("Failed to notify the user about the ban");
    }
}