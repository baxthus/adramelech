using Adramelech.Configuration;
using Discord;
using Discord.Commands;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class About(Config config) : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    // prey that the url doesn't change, because I won't remember to update it
    private const string DiscordNetIconUrl = "https://docs.discordnet.dev/marketing/logo/PackageLogo.png";

    [SlashCommand("about", "Shows information about the bot")]
    [Alias("info")]
    public async Task AboutAsync()
    {
        var commands = await Context.Client.GetGlobalApplicationCommandsAsync();
        var info = await Context.Client.GetApplicationInfoAsync();

        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(config.EmbedColor)
                .WithAuthor(info.Owner.Username, info.Owner.GetAvatarUrl())
                .WithTitle("About")
                .AddField("Commands", $"> Currently has {commands.Count} commands")
                .AddField("Running on", $"> {Environment.OSVersion}")
                .AddField("Monetization",
                    $"> {(info.IsMonetized ? ":white_check_mark: Monetized" : ":x: Not monetized")}")
                .AddField("Verified",
                    $"> {(info.VerificationState == ApplicationVerificationState.Succeeded ? ":white_check_mark: Verified" : ":x: Not verified")}")
                .AddField("Visibility",
                    $"> {(info.IsBotPublic ?? false ? ":globe_with_meridians: Public" : ":lock: Private")}")
                .WithFooter("Made with \u2764\ufe0f with Discord.Net", DiscordNetIconUrl)
                .Build(),
            components: new ComponentBuilder()
                .WithButton("Author", style: ButtonStyle.Link, url: config.AuthorUrl)
                .Build(),
            ephemeral: true);
    }
}