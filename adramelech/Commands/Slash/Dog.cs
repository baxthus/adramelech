using System.Diagnostics.CodeAnalysis;
using adramelech.Commands.Preconditions;
using adramelech.Extensions;
using adramelech.Utilities;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Dog(Configuration config, HttpUtils httpUtils) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("dog", "Get a random dog image")]
    [RequireCooldown]
    public async Task DogAsync()
    {
        await RespondAsync(InteractionCallback.DeferredMessage());

        var response = await httpUtils.GetAsync<DogResponse>("https://dog.ceo/api/breeds/image/random");
        if (response.IsDefault() || response.Status != "success")
        {
            await Context.Interaction.SendError("Failed to fetch dog image", true);
            return;
        }

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithImage(new EmbedImageProperties(response.Message))
                .WithFooter(new EmbedFooterProperties()
                    .WithText("Powered by dog.ceo")
                )
            )
        );
    }
    
    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct DogResponse
    {
        public string Status { get; set; }
        public string Message { get; set; }
    }
}