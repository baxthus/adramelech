using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;
using adramelech.Commands.Preconditions;
using adramelech.Extensions;
using adramelech.Utilities;
using Flurl;
using NetCord;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class CepSearch(Configuration config, HttpUtils httpUtils) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("cep-search", "Search for a CEP (Brazilian postal code)")]
    [RequireCooldown]
    public async Task CepSearchAsync(
        [SlashCommandParameter(Description = "CEP to search for")]
        string cep
    )
    {
        await RespondAsync(InteractionCallback.DeferredMessage());

        if (!CepSearchHelper.CepRegex().IsMatch(cep))
        {
            await Context.Interaction.SendError("Invalid CEP format", true);
            return;
        }

        var response = await httpUtils.GetAsync<CepResponse>($"https://brasilapi.com.br/api/cep/v2/{cep}");
        if (response.IsDefault())
        {
            await Context.Interaction.SendError("Failed to fetch CEP information", true);
            return;
        }

        if (response.Name != null)
        {
            var errors = $"""
                          **Name:** `{response.Name}`
                          **Message:** `{response.Message}`
                          **Type:** `{response.Type}`
                          """;
            await Context.Interaction.SendError(errors, true);
            return;
        }

        var mainField = $"""
                         **CEP:** `{response.Cep}`
                         **State:** `{response.State}`
                         **City:** `{response.City}`
                         **Neighborhood:** `{response.Neighborhood}`
                         **Street:** `{response.Street}`
                         **Service Used:** `{response.Service}`
                         """;

        var locationField = $"""
                             **Type:** `{response.Location.Type}`
                             **Latitude:** `{response.Location.Coordinates.Latitude.OrElse("N/A")}`
                             **Longitude:** `{response.Location.Coordinates.Longitude.OrElse("N/A")}`
                             """;

        var mapsUrl = new Url("https://www.google.com")
            .AppendPathSegments("maps", "search", "/")
            .SetQueryParam("api", "1")
            .SetQueryParam("query", response.Location.Coordinates is { Latitude: null, Longitude: null }
                ? $"{response.Street}, {response.City}, {response.State}"
                : $"{response.Location.Coordinates.Latitude},{response.Location.Coordinates.Longitude}"
            );

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("CEP Search")
                .AddFields(
                    new EmbedFieldProperties()
                        .WithName("> :zap: Main")
                        .WithValue(mainField),
                    new EmbedFieldProperties()
                        .WithName("> :earth_americas: Location")
                        .WithValue(locationField)
                )
            )
            .AddComponents(new ActionRowProperties()
                .AddButtons(
                    new LinkButtonProperties(
                        mapsUrl.ToString(),
                        "Open in Google Maps",
                        new EmojiProperties("🌎")
                    ))
            )
        );
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct CepResponse
    {
        public string? Name { get; set; }
        public string? Message { get; set; }
        public string? Type { get; set; }
        public string Cep { get; set; }
        public string State { get; set; }
        public string City { get; set; }
        public string Neighborhood { get; set; }
        public string Street { get; set; }
        public string Service { get; set; }
        public LocationType Location { get; set; }

        internal struct LocationType
        {
            public string Type { get; set; }
            public CoordinatesType Coordinates { get; set; }

            internal struct CoordinatesType
            {
                public string? Latitude { get; set; }
                public string? Longitude { get; set; }
            }
        }
    }
}

internal static partial class CepSearchHelper
{
    [GeneratedRegex(@"^\d{5}-?\d{3}$")]
    public static partial Regex CepRegex();
}