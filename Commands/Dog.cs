using adramelech.Configuration;
using adramelech.Extensions;
using adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands;

public class Dog : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("dog", "Get a random dog image")]
    public async Task DogAsync()
    {
        await DeferAsync();

        var response = await "https://dog.ceo/api/breeds/image/random".GetAsync<DogResponse>();
        if (response.IsDefault() || response.Status != "success")
        {
            await Context.SendError("Failed to fetch dog image", true);
            return;
        }

        await FollowupAsync(embed: new EmbedBuilder()
            .WithColor(Config.EmbedColor)
            .WithImageUrl(response.Message)
            .WithFooter("Powered by dog.ceo")
            .Build());
    }

    private struct DogResponse
    {
        public string Status { get; set; }
        public string Message { get; set; }
    }
}