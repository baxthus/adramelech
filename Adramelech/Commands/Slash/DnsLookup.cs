using System.Text;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Services;
using Adramelech.Tools;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class DnsLookup(Config config, HttpUtils httpUtils, CooldownService cooldownService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("dns-lookup", "Lookup the IP address of a domain")]
    public async Task DnsLookupAsync([Summary("domain", "The domain to lookup")] string domain,
        [Summary("separate-rows", "Whether to separate the rows")]
        bool separateRows = false)
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        await DeferAsync();

        var response = await httpUtils.GetAsync<string>($"https://da.gd/dns/{domain}");
        if (response.IsNullOrEmpty())
        {
            await Context.SendError("Invalid domain", true);
            return;
        }

        var records = ParseResponse(response!).ToList();

        string content;
        try
        {
            content = new UnicodeSheet(separateRows)
                .AddColumn("Type", records.Select(x => x.Type))
                .AddColumn("Revalidate In", records.Select(x => x.RevalidateIn))
                .AddColumn("Content", records.Select(x => x.Content))
                .Build();
        }
        catch
        {
            await Context.SendError("An error occurred while building the sheet", true);
            return;
        }

        await FollowupWithFileAsync(
            embed: new EmbedBuilder()
                .WithColor(config.EmbedColor)
                .WithTitle("DNS Lookup")
                .WithDescription($"DNS records for `{domain}`")
                .WithFooter("Powered by da.gd")
                .Build(),
            fileName: "domain.zone",
            fileStream: new MemoryStream(Encoding.UTF8.GetBytes(content)));
        Context.SetCooldown(cooldownService);
    }

    // Format: <DOMAIN> <REVALIDATE_IN> IN <TYPE> <CONTENT>
    private static IEnumerable<DnsRecord> ParseResponse(string text)
    {
        return from line in text.Split('\n').Where(x => !string.IsNullOrWhiteSpace(x))
            let parts = line.Split(' ')
            where parts.Length >= 5
            select new DnsRecord
            {
                Type = parts[3],
                RevalidateIn = parts[1],
                Content = string.Join(' ', parts.Skip(4)).TrimEnd(' ')
            };
    }

    private record DnsRecord
    {
        public required string Type { get; init; }
        public required string RevalidateIn { get; init; }
        public required string Content { get; init; }
    }
}