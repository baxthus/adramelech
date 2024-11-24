using adramelech.Configuration;
using adramelech.Extensions;
using adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Flurl;

namespace adramelech.Commands;

public class Covid : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
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

        var response = await url.ToString().GetAsync<CovidResponse>();
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
            .WithColor(Config.EmbedColor)
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

    private struct CovidResponse
    {
        public string? Message { get; set; }
        public string? Country { get; set; }
        public string Cases { get; set; }
        public string Deaths { get; set; }
        public string Recovered { get; set; }
        public string Active { get; set; }
        public string Critical { get; set; }
        public string CasesPerOneMillion { get; set; }
        public string DeathsPerOneMillion { get; set; }
        public string Tests { get; set; }
        public string TestsPerOneMillion { get; set; }
    }
}