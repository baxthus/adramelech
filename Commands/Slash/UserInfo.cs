using Adramelech.Configuration;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class UserInfo(Config config) : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("user-info", "Get information about a user")]
    public async Task UserInfoAsync([Summary("user", "The user to get information about")] SocketUser? user = null)
    {
        user ??= Context.User;

        var userInfo = new Shared.UserInfo(config);
        var embed = userInfo.Execute(user);

        await RespondAsync(embed: embed);
    }
}