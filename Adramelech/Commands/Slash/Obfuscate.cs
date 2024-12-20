﻿using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Services;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Obfuscate(Config config, HttpUtils httpUtils, CooldownService cooldownService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("obfuscate", "Obfuscate a URL")]
    public async Task ObfuscateAsync([Summary("url", "The URL to obfuscate")] string url,
        [Summary("metadata", "Whether to remove metadata")]
        bool metadata = false)
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        await DeferAsync();

        if (!url.StartsWith("http"))
        {
            await Context.SendError("Invalid URL", true);
            return;
        }

        var response = await httpUtils.PostAsync<ObfuscateData, ObfuscateResponse>(
            "https://owo.vc/api/v2/link",
            new ObfuscateData
            {
                Link = url,
                Generator = "sketchy",
                Metadata = metadata ? "IGNORE" : "PROXY"
            },
            Config.UserAgent,
            responseNamingPolicy: JsonNamingPolicy.CamelCase);
        if (response.IsDefault())
        {
            await Context.SendError("Failed to obfuscate URL", true);
            return;
        }

        var createdAt = DateTimeOffset.Parse(response.CreatedAt);
        var removedMetadata = response.Metadata == "IGNORE" ? "Yes" : "No";

        await FollowupAsync(embed: new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithTitle("Obfuscated URL")
            .AddField(":outbox_tray: Destination", $"```{response.Destination}```")
            .AddField(":inbox_tray: Result", $"```{response.Id}```")
            .AddField(":wrench: Method", $"```{response.Method}```")
            .AddField(":information_source: Metadata Removed", $"```{removedMetadata}```", true)
            .AddField(":clock1: Created At", $"<t:{createdAt.ToUnixTimeSeconds()}>", true)
            .WithFooter("Powered by owo.vc")
            .Build());
        Context.SetCooldown(cooldownService);
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct ObfuscateData
    {
        public string Link { get; set; }
        public string Generator { get; set; }
        public string Metadata { get; set; }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct ObfuscateResponse
    {
        public string Id { get; set; }
        public string Destination { get; set; }
        public string Method { get; set; }
        public string Metadata { get; set; }
        public string CreatedAt { get; set; }
    }
}