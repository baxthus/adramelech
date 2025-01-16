using adramelech.Commands.Preconditions;
using adramelech.Extensions;
using Discord;
using Discord.Webhook;
using NetCord;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;
using NetCord.Services.ComponentInteractions;
using Color = Discord.Color;
using MessageFlags = NetCord.MessageFlags;
using TextInputStyle = NetCord.Rest.TextInputStyle;

namespace adramelech.Commands.Slash;

public class Feedback(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("feedback", "Send feedback to the bot developers")]
    [RequireCooldown(CooldownSeconds = 86400)] // 1 day
    public async Task FeedbackAsync()
    {
        if (config.FeedbackWebhook == null)
        {
            await Context.Interaction.SendError("Feedback is not configured.");
            return;
        }

        await RespondAsync(InteractionCallback.Modal(new ModalProperties("feedback_modal", "Feedback")
            .AddComponents(
                new TextInputProperties("message", TextInputStyle.Paragraph, "Message")
                    .WithPlaceholder("Enter your feedback...")
            )
        ));
    }
}

public class FeedbackHandler(Configuration config) : ComponentInteractionModule<ModalInteractionContext>
{
    [ComponentInteraction("feedback_modal")]
    public async Task ModalASync()
    {
        var message = Context.Components.OfType<TextInput>().First().Value;

        if (config.FeedbackWebhook == null)
        {
            await Context.Interaction.SendError("Feedback is not configured.");
            return;
        }

        var webhook = new DiscordWebhookClient(config.FeedbackWebhook);

        try
        {
            var bot = await Context.Client.Rest.GetCurrentUserAsync();
            // Using Discord.Net here because I couldn't figure out how to do it in NetCord
            await webhook.SendMessageAsync(
                username: "Adramelech Feedback",
                avatarUrl: bot.GetAvatarUrl()?.ToString(),
                embeds:
                [
                    new EmbedBuilder()
                        .WithColor(Color.Green)
                        .WithTitle("Adramelech Feedback")
                        .WithDescription($"From `{Context.User.Username}` (`{Context.User.Id}`)")
                        .AddField("> Message", $"```{message}```")
                        .Build()
                ]
            );
        }
        catch
        {
            await Context.Interaction.SendError("Failed to send feedback.");
            return;
        }

        await RespondAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Feedback sent, thank you!")
            )
            .WithFlags(MessageFlags.Ephemeral)
        ));
    }
}