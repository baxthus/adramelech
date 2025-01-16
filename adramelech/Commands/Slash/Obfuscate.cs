using System.Text.Json;
using System.Text.RegularExpressions;
using adramelech.Commands.Preconditions;
using adramelech.Extensions;
using adramelech.Utilities;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Obfuscate(Configuration config, HttpUtils httpUtils) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("obfuscate", "Obfuscate a URL")]
    [RequireCooldown]
    public async Task ObfuscateAsync(
        [SlashCommandParameter(Name = "url", Description = "The URL to obfuscate")]
        string url,
        [SlashCommandParameter(Name = "metadata", Description = "Wheter to remove metadata")]
        bool metadata = false
    )
    {
        await RespondAsync(InteractionCallback.DeferredMessage());

        // https://stackoverflow.com/a/7581824
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult?.Scheme != Uri.UriSchemeHttp || uriResult.Scheme != Uri.UriSchemeHttps))
        {
            await Context.Interaction.SendError("Invalid URL", true);
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
            new HttpOptions
            {
                UserAgent = config.UserAgent,
                ResponseNamingPolicy = JsonNamingPolicy.CamelCase
            }
        );
        if (response.IsDefault())
        {
            await Context.Interaction.SendError("Failed to obfuscate URL", true);
            return;
        }

        var createdAt = DateTimeOffset.Parse(response.CreatedAt);
        var removedMetadata = response.Metadata == "IGNORE" ? "Yes" : "No";

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Obfuscated URL")
                .AddFields(
                    new EmbedFieldProperties()
                        .WithName("> :outbox_tray: Destination")
                        .WithValue($"```{response.Destination}```"),
                    new EmbedFieldProperties()
                        .WithName("> :inbox_tray: Result")
                        .WithValue($"```{response.Id}```"),
                    new EmbedFieldProperties()
                        .WithName("> :wrench: Method")
                        .WithValue($"```{response.Method}```"),
                    new EmbedFieldProperties()
                        .WithName("> :information_source: Metadata removed?")
                        .WithValue($"```{removedMetadata}```")
                        .WithInline(),
                    new EmbedFieldProperties()
                        .WithName("> :clock1: Created at")
                        .WithValue($"<t:{createdAt.ToUnixTimeSeconds()}>")
                        .WithInline()
                )
            )
        );
    }

    private struct ObfuscateData
    {
        public string Link { get; init; }
        public string Generator { get; init; }
        public string Metadata { get; init; }
    }

    private struct ObfuscateResponse
    {
        public string Id { get; init; }
        public string Destination { get; init; }
        public string Method { get; init; }
        public string Metadata { get; init; }
        public string CreatedAt { get; init; }
    }
}