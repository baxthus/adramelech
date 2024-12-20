using System.Diagnostics.CodeAnalysis;
using System.Text;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Flurl;

namespace Adramelech.Commands.Slash;

[Group("anime", "Anime commands")]
public class Anime : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [Group("media", "Anime media commands")]
    public class Media(Config config, HttpUtils httpUtils)
        : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
    {
        [SlashCommand("image", "Get a random anime image")]
        public async Task ImageAsync(
            [Summary("age-rating", "The age rating of the image")] [Choice("SFW", "sfw")] [Choice("NSFW", "nsfw")]
            string ageRating = "sfw")
        {
            await DeferAsync();

            string[] rating;

            switch (ageRating)
            {
                case "sfw":
                    rating = ["safe", "questionable"];
                    break;
                case "nsfw":
                    if (Context.Channel is not SocketTextChannel { IsNsfw: true })
                    {
                        await Context.SendError("This command can only be used in NSFW channels.", true);
                        return;
                    }

                    // rating = ["borderline", "explicit"];
                    rating = ["explicit"];
                    break;
                default:
                    await Context.SendError("Invalid age rating.", true);
                    return;
            }

            var url = new Url("https://api.nekosapi.com")
                .AppendPathSegments("v3", "images", "random")
                .SetQueryParam("limit", 1)
                .SetQueryParam("rating", rating)
                .ToString()!;

            var response = await httpUtils.GetAsync<NekosApiResponse>(url, Config.UserAgent);
            if (response.IsDefault())
            {
                await Context.SendError("Failed to fetch image.", true);
                return;
            }

            var data = response.Items.First();

            var footer = new StringBuilder();
            if (data.Source is not null)
                footer.AppendLine($"Source: {data.Source}");
            footer.Append("Powered by nekosapi.com");

            await FollowupAsync(embed: new EmbedBuilder()
                .WithColor(config.EmbedColor)
                .WithImageUrl(data.ImageUrl)
                .WithFooter(footer.ToString())
                .Build());
        }

        [SlashCommand("neko", "Get a random neko image")]
        public async Task NekoAsync()
        {
            await DeferAsync();

            var response = await httpUtils.GetAsync<NekosLifeResponse>("https://nekos.life/api/v2/img/neko");
            if (response.IsDefault())
            {
                await Context.SendError("Failed to fetch image.", true);
                return;
            }

            await FollowupAsync(embed: new EmbedBuilder()
                .WithColor(config.EmbedColor)
                .WithImageUrl(response.Url)
                .WithFooter("Powered by nekos.life")
                .Build());
        }

        [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
        private struct NekosApiResponse
        {
            public SItem[] Items { get; set; }

            internal struct SItem
            {
                public string ImageUrl { get; set; }
                public string? Source { get; set; }
            }
        }

        [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
        private struct NekosLifeResponse
        {
            public string Url { get; set; }
        }
    }
}