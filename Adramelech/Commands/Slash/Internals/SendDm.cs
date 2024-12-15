using Adramelech.Configuration;
using Adramelech.Extensions;
using Discord;
using Discord.Interactions;
using Discord.Net;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash.Internals;

public class SendDm(Config config) : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("send_dm", "Send a DM to a user")]
    [RequireOwner]
    public async Task SendDmAsync([Summary("user", "The user to send the message to")] SocketUser user,
        [Summary("message", "The message to send")]
        string message)
    {
        try
        {
            // Will throw if the user has DMs disabled
            await user.SendMessageAsync(message);
        }
        catch (HttpException)
        {
            await Context.SendError("Failed to send the message.");
            return;
        }

        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(config.EmbedColor)
                .WithTitle("Message sent")
                .WithDescription($"Message sent successfully to {user.Mention}")
                .Build(),
            ephemeral: true);
    }
}