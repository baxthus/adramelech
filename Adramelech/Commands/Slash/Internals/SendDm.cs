using Adramelech.Configuration;
using Adramelech.Extensions;
using Discord;
using Discord.Interactions;
using Discord.Net;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash.Internals;

public class SendDm(Config config) : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("send-dm", "Send a DM to a user")]
    [RequireContext(ContextType.DM)]
    [RequireOwner]
    public async Task SendDmAsync(
        [Summary("username", "The username of the user to send the message to")]
        string username,
        [Summary("message", "The message to send")]
        string message)
    {
        var user = Context.Client.GetUser(username);
        if (user == null)
        {
            await Context.SendError("User not found.");
            return;
        }

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