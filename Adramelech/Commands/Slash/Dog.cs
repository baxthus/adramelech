﻿using System.Diagnostics.CodeAnalysis;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Services;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Dog(Config config, HttpUtils httpUtils, CooldownService cooldownService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("dog", "Get a random dog image")]
    public async Task DogAsync()
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        await DeferAsync();

        var response = await httpUtils.GetAsync<DogResponse>("https://dog.ceo/api/breeds/image/random");
        if (response.IsDefault() || response.Status != "success")
        {
            await Context.SendError("Failed to fetch dog image", true);
            return;
        }

        await FollowupAsync(embed: new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithImageUrl(response.Message)
            .WithFooter("Powered by dog.ceo")
            .Build());
        Context.SetCooldown(cooldownService);
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct DogResponse
    {
        public string Status { get; set; }
        public string Message { get; set; }
    }
}