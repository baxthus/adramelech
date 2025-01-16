using System.Text;
using adramelech.Commands.Preconditions;
using adramelech.Extensions;
using adramelech.Tools;
using adramelech.Utilities;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class DnsLookup(Configuration config, HttpUtils httpUtils) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("dns-lookup", "Lookup DNS records for a domain")]
    [RequireCooldown]
    public async Task DnsLookupAsync(
        [SlashCommandParameter(Name = "domain", Description = "The domain to lookup")]
        string domain,
        [SlashCommandParameter(Name = "separate-rows", Description = "Whether to separate the rows")]
        bool separateRows = false
    )
    {
        await RespondAsync(InteractionCallback.DeferredMessage());

        var response = await httpUtils.GetAsync<string>($"https://da.gd/dns/{domain}");
        if (string.IsNullOrWhiteSpace(response))
        {
            await Context.Interaction.SendError("Invalid domain.", true);
            return;
        }

        var records = ParseResponse(response).ToList();
        if (records.Count == 0)
        {
            await Context.Interaction.SendError("No records found.", true);
            return;
        }

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
            await Context.Interaction.SendError("An error occurred while building the response.", true);
            return;
        }

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("DNS Lookup")
                .WithDescription($"DNS records for `{domain}`")
                .WithFooter(new EmbedFooterProperties()
                    .WithText("Powered by da.gd")
                )
            )
            .AddAttachments(new AttachmentProperties(
                "domain.zone",
                new MemoryStream(Encoding.UTF8.GetBytes(content))
            ))
        );
    }

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