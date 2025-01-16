using System.Diagnostics;
using Humanizer;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class About(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    // Pray that the url doesn't change
    private const string NetCordLogoUrl =
        "https://raw.githubusercontent.com/NetCordDev/NetCord/refs/heads/alpha/Documentation/images/logo.webp";

    [SlashCommand("about", "Show information about the bot")]
    public async Task AboutAsync()
    {
        var commands = await Context.Client.Rest.GetGlobalApplicationCommandsAsync(Context.Client.Id);
        var info = await Context.Client.Rest.GetCurrentBotApplicationInformationAsync();

        await RespondAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithAuthor(new EmbedAuthorProperties()
                    .WithName(info.Owner?.Username ?? "Astolfo") // Astolfo is the best
                    .WithIconUrl(info.Owner?.GetAvatarUrl()?.ToString())
                )
                .WithTitle("About")
                .AddFields(
                    new EmbedFieldProperties()
                        .WithName("> Commands")
                        .WithValue($"Currently has {commands.Count} commands"),
                    new EmbedFieldProperties()
                        .WithName("> Running on")
                        .WithValue($"`{Environment.OSVersion}`"),
                    new EmbedFieldProperties()
                        .WithName("> Uptime")
                        .WithValue($"{(DateTime.Now - Process.GetCurrentProcess().StartTime).Humanize()}"),
                    new EmbedFieldProperties()
                        .WithName("> Guilds")
                        .WithValue($"In approximately {info.ApproximateGuildCount} guilds"),
                    new EmbedFieldProperties()
                        .WithName("> User Installs")
                        .WithValue($"Serving approximately {info.ApproximateUserInstallCount} users")
                )
                .WithFooter(new EmbedFooterProperties()
                    .WithText("Made with ❤️ with NetCord")
                    .WithIconUrl(NetCordLogoUrl)
                )
            )
            .AddComponents(new ActionRowProperties()
                .AddButtons(
                    new LinkButtonProperties(config.AuthorUrl, "Author"),
                    new LinkButtonProperties(config.RepositoryUrl, "Repository")
                )
            )
        ));
    }
}