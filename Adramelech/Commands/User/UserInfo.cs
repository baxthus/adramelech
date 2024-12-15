using Adramelech.Configuration;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.User;

public class UserInfo(Config config) : InteractionModuleBase<SocketInteractionContext<SocketUserCommand>>
{
    [UserCommand("User Info")]
    public async Task UserInfoAsync(IUser user)
    {
        var userInfo = new Shared.UserInfo(config);
        var embed = userInfo.Execute(user);

        await RespondAsync(embed: embed);
    }
}