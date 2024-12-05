using System.Diagnostics.CodeAnalysis;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Clear : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("clear", "Clears the chat")]
    [RequireUserPermission(GuildPermission.ManageMessages)]
    [RequireBotPermission(GuildPermission.ManageMessages)]
    [RequireContext(ContextType.Guild)]
    [SuppressMessage("ReSharper", "PossibleMultipleEnumeration")]
    public async Task ClearAsync(
        [Summary("amount", "The amount of messages to clear")] [MinValue(1)] [MaxValue(100)]
        int amount,
        [Summary("time_before_autodelete", "The time before the bot deletes the response")] [MinValue(0)] [MaxValue(10)]
        int timeBeforeDelete = 5)
    {
        await DeferAsync();

        var messages = await Context.Channel.GetMessagesAsync(amount).FlattenAsync();
        messages = messages.Where(x => x.CreatedAt > DateTimeOffset.Now.AddDays(-14)).ToList()
            // Skip deferred response
            .Skip(1);
        if (!messages.Any())
        {
            await Context.SendError("No messages to delete or messages are older than 14 days");
            return;
        }

        if ((await ErrorUtils.TryAsync(() =>
                Context.Guild.GetTextChannel(Context.Channel.Id).DeleteMessagesAsync(messages))).IsFailure)
            await Context.SendError("Failed to delete messages");

        await FollowupAsync(embed: new EmbedBuilder()
            .WithColor(Config.EmbedColor)
            .WithTitle("Messages Cleared")
            .WithDescription($"""
                              Successfully cleared {messages.Count()} messages
                              Command executed by {Context.User.Mention}
                              """)
            .Build());

        if (timeBeforeDelete == 0)
            return;

        await Task.Delay(TimeSpan.FromSeconds(timeBeforeDelete));

        await ErrorUtils.TryAsync(DeleteOriginalResponseAsync);
    }
}