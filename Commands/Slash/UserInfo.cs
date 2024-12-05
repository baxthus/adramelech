using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class UserInfo : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("user-info", "Get information about a user")]
    public async Task UserInfoAsync([Summary("user", "The user to get information about")] SocketUser? user = null)
    {
        user ??= Context.User;

        var embed = Shared.UserInfo.Execute(user);

        await RespondAsync(embed: embed);
    }
}