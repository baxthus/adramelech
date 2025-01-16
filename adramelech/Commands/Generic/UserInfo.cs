using Humanizer;
using NetCord;
using NetCord.Rest;
using NetCord.Services;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Generic;

public class UserInfoSlashCommand(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("user-info", "Get information about a user")]
    public async Task UserInfoAsync(
        [SlashCommandParameter(Name = "user", Description = "The user to get information about")] User? user = null)
    {
        user ??= Context.User;

        await new UserInfoHelper(config).Execute(Context, user);
    }
}

public class UserInfoUserCommand(Configuration config) : ApplicationCommandModule<UserCommandContext>
{
    [UserCommand("User Info")]
    public async Task UserInfoAsync(User user)
    {
        await new UserInfoHelper(config).Execute(Context, user);
    }
}

public class UserInfoHelper(Configuration config)
{
    public Task Execute(IInteractionContext context, User user)
    {
        var member = user as GuildUser;

        var embed = new EmbedProperties()
            .WithColor(config.EmbedColor)
            .WithAuthor(
                new EmbedAuthorProperties()
                    .WithName(user.Username)
                    .WithIconUrl(user.GetAvatarUrl()?.ToString(1024))
            )
            .AddFields(
                new EmbedFieldProperties()
                    .WithName("> ID")
                    .WithValue(user.Id.ToString())
                    .WithInline(),
                new EmbedFieldProperties()
                    .WithName("> Nickname")
                    .WithValue(member?.Nickname ?? "None")
                    .WithInline(),
                new EmbedFieldProperties()
                    .WithName("> Created at")
                    .WithValue(
                        $"<t:{user.CreatedAt.ToUnixTimeSeconds()}:F> (<t:{user.CreatedAt.ToUnixTimeSeconds()}:R>)")
            );

        if (member == null)
            return context.Interaction.SendResponseAsync(InteractionCallback.Message(new InteractionMessageProperties()
                .AddEmbeds(embed)
            ));

        var roles = member.GetRoles(context.Interaction.Guild!).ToList();
        var permissions = member.GetPermissions(context.Interaction.Guild!);
        embed.AddFields(
            new EmbedFieldProperties()
                .WithName("> Joined at")
                .WithValue(
                    $"<t:{member.JoinedAt.ToUnixTimeSeconds()}:F> (<t:{member.JoinedAt.ToUnixTimeSeconds()}:R>)"),
            new EmbedFieldProperties()
                .WithName($"> Roles [{roles.Count}]")
                .WithValue(string.Join(", ", roles)),
            new EmbedFieldProperties()
                .WithName("> Permissions")
                .WithValue(permissions.Humanize())
        );

        return context.Interaction.SendResponseAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(embed)
        ));
    }
}