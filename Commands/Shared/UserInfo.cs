using Adramelech.Configuration;
using Discord;
using Discord.WebSocket;

namespace Adramelech.Commands.Shared;

public class UserInfo(Config config)
{
    public Embed Execute(IUser user)
    {
        var member = user as SocketGuildUser;

        var embed = new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithAuthor(user.Username, user.GetAvatarUrl())
            .WithThumbnailUrl(user.GetAvatarUrl())
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
            embed.AddField("> Permissions", string.Join(", ", member.GuildPermissions.ToList()));
        }

        return embed.Build();
    }
}