using adramelech.Commands.Preconditions;
using adramelech.Extensions;
using adramelech.Utilities;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Short(Configuration config, HttpUtils httpUtils) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("short", "Shorten a URL")]
    [RequireCooldown]
    public async Task ShortAsync(
        [SlashCommandParameter(Name = "url", Description = "The URL to shorten")]
        string url
    )
    {
        await RespondAsync(InteractionCallback.DeferredMessage());

        var response = await httpUtils.GetAsync<string>($"https://is.gd/create.php?format=simple&url={url}");
        if (string.IsNullOrWhiteSpace(response) || response.Trim().StartsWith("Error"))
        {
            await Context.Interaction.SendError("An error occurred while shortening the URL.", true);
            return;
        }

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("URL Shortened")
                .AddFields(
                    new EmbedFieldProperties()
                        .WithName("> :outbox_tray: Original URL")
                        .WithValue($"```{url}```"),
                    new EmbedFieldProperties()
                        .WithName("> :inbox_tray: Shortened URL")
                        .WithValue($"```{response}```")
                )
                .WithFooter(new EmbedFooterProperties()
                    .WithText("Powered by is.gd")
                )
            )
        );
    }
}