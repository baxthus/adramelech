﻿using System.Text;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Services;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Whois(Config config, HttpUtils httpUtils, CooldownService cooldownService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    private static readonly string[] BadStrings =
    [
        "Malformed",
        "Wrong",
        "The queried object does not",
        "Invalid",
        "No match",
        "Domain not",
        "NOT FOUND",
        "Did not get"
    ];

    [SlashCommand("whois", "Get information about a domain or IP address")]
    public async Task WhoisAsync([Summary("target", "The domain or IP address to look up")] string target)
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        await DeferAsync();

        var response = await httpUtils.GetAsync<string>($"https://da.gd/w/{target}");
        if (response.IsNullOrEmpty() || BadStrings.Any(response!.Trim().Contains))
        {
            await Context.SendError("Error looking up the target", true);
            return;
        }

        await FollowupWithFileAsync(
            embed: new EmbedBuilder()
                .WithColor(config.EmbedColor)
                .WithTitle("Whois Lookup")
                .AddField(":link: Target", $"`{target}`")
                .WithFooter("Powered by da.gd")
                .Build(),
            fileName: $"{target}.txt",
            fileStream: new MemoryStream(Encoding.UTF8.GetBytes(response)));
        Context.SetCooldown(cooldownService);
    }
}