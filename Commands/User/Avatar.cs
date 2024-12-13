using Adramelech.Configuration;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.User;

public class Avatar(Config config) : InteractionModuleBase<SocketInteractionContext<SocketUserCommand>>
{
    [UserCommand("Avatar")]
    public async Task AvatarAsync(IUser user)
    {
        var avatar = new Shared.Avatar(config);
        var (embed, component) = avatar.Execute(user);

        await RespondAsync(embed: embed, components: component);
    }
}