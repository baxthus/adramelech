﻿using System.Diagnostics.CodeAnalysis;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.Webhook;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Feedback(Config config) : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("feedback", "Send feedback to the bot developers.")]
    public async Task FeedbackAsync()
    {
        if (config.FeedbackWebhook.IsNullOrEmpty())
        {
            await Context.SendError("Feedback webhook is not configured.");
            return;
        }

        await RespondWithModalAsync<FeedbackModal>("feedback_modal");
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
    public class FeedbackModal : IModal
    {
        [InputLabel("Message")]
        [ModalTextInput("message", TextInputStyle.Paragraph, "Please provide your feedback here.")]
        public required string Message { get; set; }

        public string Title => "Feedback";
    }
}

public class FeedbackModalResponse(Config config) : InteractionModuleBase<SocketInteractionContext<SocketModal>>
{
    [ModalInteraction("feedback_modal")]
    public async Task Modal(Feedback.FeedbackModal modal)
    {
        var message = modal.Message;

        if (config.FeedbackWebhook.IsNullOrEmpty())
        {
            await RespondAsync("Feedback webhook is not configured.");
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

        await RespondAsync("Your feedback has been sent. Thank you!", ephemeral: true);
    }
}