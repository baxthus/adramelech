using Adramelech.Configuration;
using Discord;
using Discord.Commands;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class About : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("about", "Shows information about the bot")]
    [Alias("info")]
    public async Task AboutAsync()
    {
        var commands = await Context.Client.GetGlobalApplicationCommandsAsync();
        var info = await Context.Client.GetApplicationInfoAsync();

        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(Config.EmbedColor)
                .WithTitle("About")
                .WithDescription("This bot is a simple Discord bot written in C# using Discord.Net")
                .AddField("Commands", $"> Currently has {commands.Count} commands")
                .AddField("Running on", $"> {Environment.OSVersion}")
                .AddField("Monetization",
                    $"> {(info.IsMonetized ? ":white_check_mark: Monetized" : ":x: Not monetized")}")
                .AddField("Verified",
                    $"> {(info.VerificationState == ApplicationVerificationState.Succeeded ? ":white_check_mark: Verified" : ":x: Not verified")}")
                .AddField("Visibility",
                    $"> {(info.IsBotPublic ?? false ? ":globe_with_meridians: Public" : ":lock: Private")}")
                .WithFooter($"Bot created by {info.Owner.Username}", info.Owner.GetAvatarUrl())
                .Build(),
            ephemeral: true);
    }
}