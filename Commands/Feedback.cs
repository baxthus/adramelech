using adramelech.Configuration;
using adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.Webhook;
using Discord.WebSocket;

namespace Adramelech.Commands;

public class Feedback : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("feedback", "Send feedback to the bot developers.")]
    public async Task FeedbackAsync()
    {
        await RespondWithModalAsync<FeedbackModal>("feedback_modal");
    }

    public class FeedbackModal : IModal
    {
        [InputLabel("Message")]
        [ModalTextInput("message", TextInputStyle.Paragraph, "Please provide your feedback here.")]
        public required string Message { get; set; }

        public string Title => "Feedback";
    }
}

public class FeedbackModalResponse : InteractionModuleBase<SocketInteractionContext<SocketModal>>
{
    [ModalInteraction("feedback_modal")]
    public async Task Modal(Feedback.FeedbackModal modal)
    {
        var message = modal.Message;

        if (BotConfig.Instance.FeedbackWebhook.IsNullOrEmpty())
        {
            await RespondAsync("Feedback webhook is not configured.");
            return;
        }

        var webhook = new DiscordWebhookClient(BotConfig.Instance.FeedbackWebhook);

        await webhook.SendMessageAsync(
            username: "Adramelech Feedback",
            avatarUrl: Context.Client.CurrentUser.GetAvatarUrl(),
            embeds:
            [
                new EmbedBuilder()
                    .WithColor(BotConfig.EmbedColor)
                    .WithTitle("Adramelech Feedback")
                    .WithDescription($"From `{Context.User.Username}` (`{Context.User.Id}`)")
                    .WithThumbnailUrl(Context.User.GetAvatarUrl())
                    .AddField("Message", $"```{message}```")
                    .Build()
            ]);

        await RespondAsync("Your feedback has been sent. Thank you!", ephemeral: true);
    }
}