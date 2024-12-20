﻿using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Services;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Short(Config config, HttpUtils httpUtils, CooldownService cooldownService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("short", "Shortens a URL")]
    public async Task ShortAsync([Summary("url", "The URL to shorten")] string url)
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        await DeferAsync();

        var response = await httpUtils.GetAsync<string>($"https://is.gd/create.php?format=simple&url={url}");
        if (response.IsNullOrEmpty() || response!.Trim().StartsWith("Error"))
        {
            await Context.SendError("An error occurred while shortening the URL.", true);
            return;
        }

        await FollowupAsync(embed: new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithTitle("URL Shortened")
            .AddField(":outbox_tray: Original URL", url)
            .AddField(":inbox_tray: Shortened URL", response)
            .WithFooter("Powered by is.gd")
            .Build());
        Context.SetCooldown(cooldownService);
    }
}