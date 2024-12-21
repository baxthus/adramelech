using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Services;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Cat(Config config, HttpUtils httpUtils, CooldownService cooldownService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("cat", "Get a random cat image")]
    public async Task CatAsync()
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        await DeferAsync();

        var response = await httpUtils.GetAsync<CatResponse[]>("https://api.thecatapi.com/v1/images/search");
        if (response.IsDefault())
        {
            await Context.SendError("Failed to get cat image", true);
            return;
        }

        await FollowupAsync(embed: new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithImageUrl(response!.First().Url)
            .WithFooter("Powered by thecatapi.com")
            .Build());
        Context.SetCooldown(cooldownService);
    }

    private struct CatResponse
    {
        public string Url { get; set; }
    }
}