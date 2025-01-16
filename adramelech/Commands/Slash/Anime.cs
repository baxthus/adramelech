using System.Diagnostics.CodeAnalysis;
using System.Text;
using adramelech.Commands.Preconditions;
using adramelech.Extensions;
using adramelech.Utilities;
using Flurl;
using NetCord;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

[SlashCommand("anime", "Anime commands")]
public class Anime : ApplicationCommandModule<SlashCommandContext>
{
    [SubSlashCommand("media", "Anime media commands")]
    public class Media(Configuration config, HttpUtils httpUtils) : ApplicationCommandModule<SlashCommandContext>
    {
        [SubSlashCommand("image", "Get a random anime image")]
        [RequireCooldown]
        public async Task ImageAsync(
            [SlashCommandParameter(Name = "age-rating", Description = "The age rating of the image")]
            AgeRating ageRating = AgeRating.Safe
        )
        {
            await RespondAsync(InteractionCallback.DeferredMessage());

            var rating = nameof(ageRating).ToLower();
            if (ageRating is AgeRating.Borderline or AgeRating.Explicit && Context.Guild != null)
            {
                var channel = Context.Channel as TextGuildChannel;
                if (channel != null && !channel.Nsfw)
                {
                    await Context.Interaction.SendError("This command can only be used in NSFW channels.", true);
                    return;
                }
            }

            var response = await httpUtils.GetAsync<NekosApiResponse>(
                new Url("https://api.nekosapi.com")
                    .AppendPathSegments("v3", "images", "random")
                    .SetQueryParam("limit", 1)
                    .SetQueryParam("rating", rating),
                new HttpOptions
                {
                    UserAgent = config.UserAgent
                }
            );
            if (response.IsDefault())
            {
                await Context.Interaction.SendError("Failed to fetch image.", true);
                return;
            }

            var data = response.Items.First();

            var footer = new StringBuilder();
            if (data.Source != null)
                footer.AppendLine($"Source: {data.Source}");
            footer.Append("Powered by nekosapi.com");

            await FollowupAsync(new InteractionMessageProperties()
                .AddEmbeds(new EmbedProperties()
                    .WithColor(config.EmbedColor)
                    .WithImage(new EmbedImageProperties(data.ImageUrl))
                    .WithFooter(new EmbedFooterProperties()
                        .WithText(footer.ToString())
                    )
                )
            );
        }

        [SubSlashCommand("neko", "Get a random neko image")]
        [RequireCooldown]
        public async Task NekoAsync()
        {
            await RespondAsync(InteractionCallback.DeferredMessage());

            var response = await httpUtils.GetAsync<NekosLifeResponse>("https://nekos.life/api/v2/img/neko");
            if (response.IsDefault())
            {
                await Context.Interaction.SendError("Failed to fetch image.", true);
                return;
            }
            
            await FollowupAsync(new InteractionMessageProperties()
                .AddEmbeds(new EmbedProperties()
                    .WithColor(config.EmbedColor)
                    .WithImage(new EmbedImageProperties(response.Url))
                    .WithFooter(new EmbedFooterProperties()
                        .WithText("Powered by nekos.life")
                    )
                )
            );
        }
        
        [SuppressMessage("ReSharper", "UnusedMember.Global")]
        public enum AgeRating
        {
            Safe,
            Suggestive,
            Borderline,
            Explicit
        }

        [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
        private struct NekosApiResponse
        {
            public Item[] Items { get; set; }
            
            internal struct Item
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