using adramelech.Extensions;
using NetCord;
using NetCord.Rest;
using NetCord.Services;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Clear(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("clear", "Clears the chat", Contexts = [InteractionContextType.Guild])]
    [RequireUserPermissions<SlashCommandContext>(Permissions.ManageMessages)]
    [RequireBotPermissions<SlashCommandContext>(Permissions.ManageMessages)]
    public async Task ClearAsync(
        [SlashCommandParameter(Name = "amount", Description = "The amount of messages to clear", MaxValue = 100,
            MinValue = 1)]
        int amount,
        [SlashCommandParameter(Name = "seconds_before_auto_delete",
            Description = "The seconds before the response is auto deleted", MinValue = 0, MaxValue = 10)]
        int secondsBeforeAutoDelete = 5
    )
    {
        await RespondAsync(InteractionCallback.DeferredMessage());

        var messages = (await Context.Channel.GetMessagesAsync(new PaginationProperties<ulong>()
                .WithLimit(amount)).ToListAsync())
            .Where(x => x.CreatedAt > DateTimeOffset.UtcNow.AddDays(-14))
            .Skip(1)
            .Select(x => x.Id)
            .ToList();

        if (messages.Count == 0)
        {
            await Context.Interaction.SendError("No messages found to delete or messages are older than 14 days", true);
            return;
        }

        try
        {
            await Context.Channel.DeleteMessagesAsync(messages);
        }
        catch (Exception e)
        {
            await Context.Interaction.SendError(e.Message, true);
            return;
        }

        var message = await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Messages Cleared")
                .WithDescription($"""
                                  Successfully cleared {messages.Count} messages
                                  Command executed by {Context.User}
                                  {secondsBeforeAutoDelete switch
                                  {
                                      0 => "",
                                      _ => $"This message will auto delete in <t:{DateTimeOffset.UtcNow.ToUnixTimeSeconds() + secondsBeforeAutoDelete}:R>"
                                  }}
                                  """)
            )
        );

        if (secondsBeforeAutoDelete == 0) return;

        await Task.Delay(TimeSpan.FromSeconds(secondsBeforeAutoDelete));

        try
        {
            await message.DeleteAsync();
        }
        catch
        {
            // ignored
        }
    }
}