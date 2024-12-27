using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Services;
using Discord;
using Discord.Interactions;
using Discord.Webhook;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Feedback(Config config, CooldownService cooldownService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("feedback", "Send feedback to the bot developers.")]
    public async Task FeedbackAsync()
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        if (config.FeedbackWebhook == null)
        {
            await Context.SendError("Feedback webhook is not configured.");
            return;
        }

        await RespondWithModalAsync<FeedbackModal>("feedback_modal");
        Context.SetCooldown(cooldownService, TimeSpan.FromDays(1));
    }

    // ReSharper disable once ClassNeverInstantiated.Global
    public class FeedbackModal : IModal
    {
        [InputLabel("Message")]
        [ModalTextInput("message", TextInputStyle.Paragraph, "Please provide your feedback here.")]
        // ReSharper disable once UnusedAutoPropertyAccessor.Global
        public required string Message { get; set; }

        public string Title => "Feedback";
    }

    public class FeedbackModalHandler(Config config) : InteractionModuleBase<SocketInteractionContext<SocketModal>>
    {
        [ModalInteraction("feedback_modal")]
        public async Task Modal(FeedbackModal modal)
        {
            var message = modal.Message;

            if (config.FeedbackWebhook == null)
            {
                await Context.SendError("Feedback webhook is not configured.");
                return;
            }

            var webhook = new DiscordWebhookClient(config.FeedbackWebhook);

            await webhook.SendMessageAsync(
                username: "Adramelech Feedback",
                avatarUrl: Context.Client.CurrentUser.GetAvatarUrl(),
                embeds:
                [
                    new EmbedBuilder()
                        .WithColor(config.EmbedColor)
                        .WithTitle("Adramelech Feedback")
                        .WithDescription($"From `{Context.User.Username}` (`{Context.User.Id}`)")
                        .WithThumbnailUrl(Context.User.GetAvatarUrl())
                        .AddField("Message", $"```{message}```")
                        .Build()
                ]);

            await RespondAsync(
                embed: new EmbedBuilder()
                    .WithColor(config.EmbedColor)
                    .WithTitle("Feedback sent, thank you!")
                    .Build(),
                ephemeral: true);
        }
    }
}