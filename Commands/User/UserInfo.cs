using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.User;

public class UserInfo : InteractionModuleBase<SocketInteractionContext<SocketUserCommand>>
{
    [UserCommand("User Info")]
    public async Task UserInfoAsync(IUser user)
    {
        var embed = Shared.UserInfo.Execute(user);

        await RespondAsync(embed: embed);
    }
}