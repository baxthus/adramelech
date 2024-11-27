using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.User;

public class Avatar : InteractionModuleBase<SocketInteractionContext<SocketUserCommand>>
{
    [UserCommand("Avatar")]
    public async Task AvatarAsync(IUser user)
    {
        var (embed, component) = Shared.Avatar.Execute(user);

        await RespondAsync(embed: embed, components: component);
    }
}