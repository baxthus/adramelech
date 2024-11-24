using adramelech.Configuration;
using adramelech.Extensions;
using adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands;

public class SendDm : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("send_dm", "Send a DM to a user")]
    [RequireOwner]
    public async Task SendDmAsync([Summary("user", "The user to send the message to")] SocketUser user,
        [Summary("message", "The message to send")]
        string message)
    {
        var result = await ExceptionUtils.TryAsync(() => user.SendMessageAsync(message));
        if (result.IsFailure)
        {
            await Context.SendError("Failed to send the message.");
            return;
        }

        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(BotConfig.EmbedColor)
                .WithTitle("Message sent")
                .WithDescription($"Message sent successfully to {user.Mention}")
                .Build(),
            ephemeral: true);
    }
}