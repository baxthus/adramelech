using adramelech.Commands.Preconditions;
using adramelech.Extensions;
using NetCord;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash.Internal;

public class SendDm(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("send-dm", "Send a DM to a user",
        Contexts = [InteractionContextType.BotDMChannel])]
    [RequireOwner<SlashCommandContext>]
    public async Task SendDmAsync(
        [SlashCommandParameter(Name = "user-id", Description = "The user to send the message to")]
        string rawUserId,
        [SlashCommandParameter(Name = "message", Description = "The message to send")]
        string message
    )
    {
        if (!ulong.TryParse(rawUserId, out var userId))
        {
            await Context.Interaction.SendError("Invalid user ID");
            return;
        }
        
        var user = await Context.Client.Rest.GetUserAsync(userId);
        
        try
        {
            var dmChannel = await user.GetDMChannelAsync();
            await dmChannel.SendMessageAsync(message);
        }
        catch
        {
            await Context.Interaction.SendError("Failed to send the message");
        }

        await RespondAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(
                new EmbedProperties()
                    .WithColor(config.EmbedColor)
                    .WithTitle("Message Sent")
            )
        ));
    }
}