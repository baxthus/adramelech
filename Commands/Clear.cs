using System.Diagnostics.CodeAnalysis;
using adramelech.Configuration;
using adramelech.Extensions;
using adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace adramelech.Commands;

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
        [Summary("time_before_autodelete", "The time before the bot deletes the response")] [MinValue(1)] [MaxValue(10)]
        int timeBeforeDelete = 5)
    {
        var messages = await Context.Channel.GetMessagesAsync(amount).FlattenAsync();
        messages = messages.Where(x => x.CreatedAt > DateTimeOffset.Now.AddDays(-14)).ToList();
        if (!messages.Any())
        {
            await Context.SendError("No messages to delete or messages are older than 14 days");
            return;
        }

        if ((await ExceptionUtils.TryAsync(() =>
                Context.Guild.GetTextChannel(Context.Channel.Id).DeleteMessagesAsync(messages))).IsFailure)
            await Context.SendError("Failed to delete messages");

        await RespondAsync(embed: new EmbedBuilder()
            .WithColor(BotConfig.EmbedColor)
            .WithTitle("Messages Cleared")
            .WithDescription($"""
                              Successfully cleared {messages.Count()} messages
                              Command executed by {Context.User.Mention}
                              """)
            .Build());

        await Task.Delay(TimeSpan.FromSeconds(timeBeforeDelete));

        await ExceptionUtils.TryAsync(DeleteOriginalResponseAsync);
    }
}