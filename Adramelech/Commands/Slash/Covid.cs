using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Flurl;

namespace Adramelech.Commands.Slash;

public class Covid(Config config, HttpUtils httpUtils)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("covid", "Get Covid-19 statistics")]
    public async Task CovidAsync([Summary("country", "Country to get statistics for")] string country = "worldwide")
    {
        await DeferAsync();

        var url = new Url("https://disease.sh/v3/covid-19");

        if (country.Equals("worldwide", StringComparison.CurrentCultureIgnoreCase))
            url.AppendPathSegment("all");
        else
            url.AppendPathSegments("countries", country);

        var response = await httpUtils.GetAsync<CovidResponse>(url, namingPolicy: JsonNamingPolicy.CamelCase);
        if (response.IsDefault())
        {
            await Context.SendError("There was an error getting the Covid-19 statistics", true);
            return;
        }

        if (!response.Message.IsNullOrEmpty())
        {
            await Context.SendError($"`{response.Message}`", true);
            return;
        }

        await FollowupAsync(embed: new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithTitle($"Covid-19 Statistics for {response.Country}")
            .WithDescription($"""
                              **Cases:** `{response.Cases}` (`{response.CasesPerOneMillion}` per million)
                              **Deaths:** `{response.Deaths}` (`{response.DeathsPerOneMillion}` per million)
                              **Recovered:** `{response.Recovered}`
                              **Active:** `{response.Active}` (`{response.Critical}` critical)
                              **Tests:** `{response.Tests}` (`{response.TestsPerOneMillion}` per million)
                              """)
            .WithFooter("Powered by disease.sh")
            .Build());
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct CovidResponse
    {
        public string? Message { get; set; }
        public string? Country { get; set; }
        public double Cases { get; set; }
        public double Deaths { get; set; }
        public double Recovered { get; set; }
        public double Active { get; set; }
        public double Critical { get; set; }
        public double CasesPerOneMillion { get; set; }
        public double DeathsPerOneMillion { get; set; }
        public double Tests { get; set; }
        public double TestsPerOneMillion { get; set; }
    }
}