using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;
using Adramelech.Common;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Flurl;

namespace Adramelech.Commands.Slash;

public class Lookup(Config config, HttpUtils httpUtils)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("lookup", "Lookup a ip or domain")]
    public async Task LookupAsync([Summary("target", "The target to lookup")] string target)
    {
        await DeferAsync();

        var ip = LookupHelper.IpRegex().Match(target).Success
            ? target
            : await GetIpFromDomain(target);
        if (ip.IsFailure)
        {
            await Context.SendError("Failed to get ip from domain", true);
            return;
        }

        var response = await httpUtils.GetAsync<Whois>($"https://ipwho.is/{ip.Value}", "curl");
        if (response.IsDefault() || !response.Success)
        {
            await Context.SendError("Failed to get whois information", true);
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
            .SetQueryParam("api", 1)
            .SetQueryParam("query", $"{response.Latitude},{response.Longitude}");

        await FollowupAsync(
            embed: new EmbedBuilder()
                .WithColor(config.EmbedColor)
                .WithTitle("Lookup")
                .WithDescription("For best results, search by ip")
                .AddField(":zap: Main", mainField)
                .AddField(":earth_americas: Location", locationField)
                .AddField(":satellite: Connection", connectionField)
                .AddField(":clock1: Timezone", timezoneField)
                .WithFooter("Powered by ipwho.is and da.gd")
                .Build(),
            components: new ComponentBuilder()
                .WithButton("Open in Google Maps", style: ButtonStyle.Link, url: mapsUrl.ToString(),
                    emote: new Emoji("🌎"))
                .Build());
    }

    private async Task<Result<string>> GetIpFromDomain(string domain)
    {
        var response = await httpUtils.GetAsync<string>($"https://da.gd/host/{domain}");
        if (response.IsNullOrEmpty()) return new Exception("Failed to get ip from domain");

        response = response!.Trim();

        if (response.StartsWith("No"))
            return new Exception("No ip found for domain");

        return response.Contains(',') ? response[..response.IndexOf(',')] : response;
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct Whois
    {
        public bool Success { get; set; }
        public string Type { get; set; }
        public string Continent { get; set; }
        public string Country { get; set; }
        public string CountryCode { get; set; }
        public string Region { get; set; }
        public string City { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Postal { get; set; }
        public SConnection Connection { get; set; }
        public STimezone Timezone { get; set; }

        internal struct SConnection
        {
            public int Asn { get; set; }
            public string Org { get; set; }
            public string Isp { get; set; }
            public string Domain { get; set; }
        }

        internal struct STimezone
        {
            public string Id { get; set; }
            public int Offset { get; set; }
            public string Utc { get; set; }
        }
    }
}

// ReSharper disable once ClassNeverInstantiated.Global
internal partial class LookupHelper
{
    [GeneratedRegex(@"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b")]
    public static partial Regex IpRegex();
}