using Adramelech.Configuration;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Humanizer;

namespace Adramelech.Commands.Generic;

public class UserInfoSlashCommand(Config config) : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("user-info", "Get information about a user")]
    public async Task UserInfoAsync([Summary("user", "The user to get information about")] SocketUser? user = null)
    {
        user ??= Context.User;

        await new UserInfoHelper(config).Execute(Context, user);
    }
}

public class UserInfoUserCommand(Config config) : InteractionModuleBase<SocketInteractionContext<SocketUserCommand>>
{
    [UserCommand("User Info")]
    public async Task UserInfoAsync(IUser user)
    {
        await new UserInfoHelper(config).Execute(Context, user);
    }
}

internal class UserInfoHelper(Config config)
{
    public Task Execute(IInteractionContext context, IUser user)
    {
        var member = user as SocketGuildUser;

        var embed = new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithAuthor(user.Username, user.GetAvatarUrl())
            .AddField("> ID", user.Id, true)
            .AddField("> Nickname", member?.Nickname ?? "None", true)
            .AddField("> Created at",
                $"<t:{user.CreatedAt.ToUnixTimeSeconds()}:F> (<t:{user.CreatedAt.ToUnixTimeSeconds()}:R>)");
        if (member is { JoinedAt: not null })
            embed.AddField("> Joined at",
                $"<t:{member.JoinedAt.Value.ToUnixTimeSeconds()}:F> (<t:{member.JoinedAt.Value.ToUnixTimeSeconds()}:R>)");
        if (member != null)
        {
            embed.AddField($"> Cargos [{member.Roles.Count}]", string.Join(", ", member.Roles.Select(x => x.Mention)));
            embed.AddField("> Permissions",
                string.Join(", ", member.GuildPermissions.ToList().Humanize(p => p.Humanize(LetterCasing.Title))));
        }

        return context.Interaction.RespondAsync(embed: embed.Build());
    }
}