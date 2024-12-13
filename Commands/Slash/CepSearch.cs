using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Flurl;

namespace Adramelech.Commands.Slash;

public partial class CepSearch(Config config) : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("cep_search", "Search for a CEP (Brazilian ZIP code)")]
    public async Task CepSearchAsync([Summary("cep", "The CEP to search for")] string cep)
    {
        await DeferAsync();

        if (!MyRegex().IsMatch(cep))
        {
            await Context.SendError("Invalid CEP format", true);
            return;
        }

        var response = await $"https://brasilapi.com.br/api/cep/v2/{cep}".GetAsync<CepResponse>();
        if (response.IsDefault())
        {
            await Context.SendError("Something went wrong while searching for the CEP", true);
            return;
        }

        if (response.Name is not null)
        {
            var errors = $"""
                          **Errors:**
                          **Name:** `{response.Name}`
                          **Message:** `{response.Message}`
                          **Type:** `{response.Type}`
                          """;
            await Context.SendError(errors, true);
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
            .SetQueryParam("api", 1)
            .SetQueryParam("query", response.Location.Coordinates is { Latitude: null, Longitude: null }
                ? $"{response.Street}, {response.City}, {response.State}"
                : $"{response.Location.Coordinates.Latitude},{response.Location.Coordinates.Longitude}");

        await FollowupAsync(
            embed: new EmbedBuilder()
                .WithColor(config.EmbedColor)
                .WithTitle("CEP Search")
                .AddField(":zap: **Main**", mainField)
                .AddField(":earth_americas: **Location**", locationField)
                .Build(),
            components: new ComponentBuilder()
                .WithButton("Open in Google Maps", style: ButtonStyle.Link, url: mapsUrl.ToString(),
                    emote: new Emoji("🌎"))
                .Build());
    }

    [GeneratedRegex(@"^\d{5}-?\d{3}$")]
    private static partial Regex MyRegex();

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
            public Coordinatestype Coordinates { get; set; }

            internal struct Coordinatestype
            {
                public string? Latitude { get; set; }
                public string? Longitude { get; set; }
            }
        }
    }
}