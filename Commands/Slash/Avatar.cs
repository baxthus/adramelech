using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Avatar : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("avatar", "Get the avatar of a user")]
    public async Task AvatarAsync([Summary("user", "The user to get the avatar of")] SocketUser? user = null)
    {
        user ??= Context.User;

        var (embed, component) = Shared.Avatar.Execute(user);

        await RespondAsync(embed: embed, components: component);
    }
}