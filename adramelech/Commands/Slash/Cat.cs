using System.Diagnostics.CodeAnalysis;
using adramelech.Commands.Preconditions;
using adramelech.Extensions;
using adramelech.Utilities;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Cat(Configuration config, HttpUtils httpUtils) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("cat", "Get a random cat image")]
    [RequireCooldown]
    public async Task CatAsync()
    {
        await RespondAsync(InteractionCallback.DeferredMessage());
        
        var response = await httpUtils.GetAsync<CatResponse[]>("https://api.thecatapi.com/v1/images/search");
        if (response.IsDefault())
        {
            await Context.Interaction.SendError("Failed to get cat image", true);
            return;
        }

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithImage(new EmbedImageProperties(response!.First().Url))
                .WithFooter(new EmbedFooterProperties()
                    .WithText("Powered by thecatapi.com")
                )
            )
        );
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct CatResponse
    {
        public string Url { get; set; }
    }
}