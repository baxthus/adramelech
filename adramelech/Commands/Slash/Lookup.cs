using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;
using adramelech.Commands.Preconditions;
using adramelech.Common;
using adramelech.Extensions;
using adramelech.Utilities;
using Flurl;
using NetCord;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Lookup(Configuration config, HttpUtils httpUtils) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("lookup", "Lookup a ip or domain")]
    [RequireCooldown]
    public async Task LookupAsync(
        [SlashCommandParameter(Name = "target", Description = "The target to lookup")]
        string target
    )
    {
        await RespondAsync(InteractionCallback.DeferredMessage());

        var ip = LookupHelper.IpRegex().Match(target).Success
            ? target
            : await GetIpFromDomain(target);
        if (ip.IsFailure)
        {
            await Context.Interaction.SendError("Failed to get ip from domain", true);
            return;
        }

        var response = await httpUtils.GetAsync<Whois>($"https://ipwho.is/{ip.Value}", new HttpOptions
        {
            UserAgent = "curl"
        });
        if (response.IsDefault() || !response.Success)
        {
            await Context.Interaction.SendError("Failed to get whois information", true);
            return;
        }

        var mainField = $"""
                         **IP:** {ip.Value}
                         **Domain:** {(target != ip.Value ? target : "N/A")}
                         **Type:** {response.Type}
                         """;
        var locationField = $"""
                             **Continent:** {response.Continent}
                             **Country:** {response.Country} :flag_{response.CountryCode.ToLower()}:
                             **Region:** {response.Region}
                             **City:** {response.City}
                             **Latitude:** {response.Latitude}
                             **Longitude:** {response.Longitude}
                             **Postal:** {response.Postal}
                             """;
        var connectionField = $"""
                               **ASN:** {response.Connection.Asn}
                               **Organization:** {response.Connection.Org}
                               **ISP:** {response.Connection.Isp}
                               **Domain:** {response.Connection.Domain}
                               """;
        var timezoneField = $"""
                             **ID:** {response.Timezone.Id}
                             **Offset:** {response.Timezone.Offset}
                             **UTC:** {response.Timezone.Utc}
                             """;

        var mapsUrl = new Url("https://www.google.com")
            .AppendPathSegments("maps", "search", "/")
            .SetQueryParam("api", "1")
            .SetQueryParam("query", $"{response.Latitude},{response.Longitude}");

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Lookup")
                .WithDescription("For best results, search by ip")
                .AddFields(
                    new EmbedFieldProperties()
                        .WithName("> :zap: Main")
                        .WithValue(mainField),
                    new EmbedFieldProperties()
                        .WithName("> :earth_americas: Location")
                        .WithValue(locationField),
                    new EmbedFieldProperties()
                        .WithName("> :satellite: Connection")
                        .WithValue(connectionField),
                    new EmbedFieldProperties()
                        .WithName("> :clock1: Timezone")
                        .WithValue(timezoneField)
                )
                .WithFooter(new EmbedFooterProperties()
                    .WithText("Powered by ipwho.is and da.gd")
                )
            )
            .AddComponents(new ActionRowProperties()
                .AddButtons(
                    new LinkButtonProperties(mapsUrl, "Open in Google Maps", new EmojiProperties("🌎"))
                )
            )
        );
    }

    private async Task<Result<string>> GetIpFromDomain(string domain)
    {
        var response = await httpUtils.GetAsync<string>($"https://da.gd/host/{domain}");
        if (string.IsNullOrWhiteSpace(response)) return new Exception("Failed to get ip from domain");

        response = response.Trim();

        if (response.StartsWith("No")) return new Exception("Failed to get ip from domain");

        return response.Contains(',') ? response[..response.IndexOf(',')] : response;
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct Whois
    {
        public bool Success { get; init; }
        public string Type { get; init; }
        public string Continent { get; init; }
        public string Country { get; init; }
        public string CountryCode { get; init; }
        public string Region { get; init; }
        public string City { get; init; }
        public double Latitude { get; init; }
        public double Longitude { get; init; }
        public string Postal { get; init; }
        public ConnectionType Connection { get; init; }
        public TimezoneType Timezone { get; init; }

        internal struct ConnectionType
        {
            public int Asn { get; init; }
            public string Org { get; init; }
            public string Isp { get; init; }
            public string Domain { get; init; }
        }

        internal struct TimezoneType
        {
            public string Id { get; init; }
            public int Offset { get; init; }
            public string Utc { get; init; }
        }
    }
}

// ReSharper disable once ClassNeverInstantiated.Global
internal partial class LookupHelper
{
    [GeneratedRegex(@"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b")]
    public static partial Regex IpRegex();
}