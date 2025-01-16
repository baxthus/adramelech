using System.Text;
using adramelech.Extensions;
using adramelech.Utilities;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Whois(Configuration config, HttpUtils httpUtils) : ApplicationCommandModule<SlashCommandContext>
{
    private static readonly string[] BadStrings =
    [
        "Malformed",
        "Wrong",
        "The queried object does not",
        "Invalid",
        "No match",
        "Domain not",
        "NOT FOUND",
        "Did not get"
    ];

    [SlashCommand("whois", "Get whois information about a domain or ip")]
    public async Task WhoisAsync(
        [SlashCommandParameter(Name = "target", Description = "The domain or ip to get whois information about")]
        string target
    )
    {
        await RespondAsync(InteractionCallback.DeferredMessage());

        var response = await httpUtils.GetAsync<string>($"https://da.gd/w/{target}");
        if (string.IsNullOrWhiteSpace(response) || BadStrings.Any(response.Trim().Contains))
        {
            await Context.Interaction.SendError("No whois information found for the given target.", true);
            return;
        }

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Whois Information")
                .AddFields(new EmbedFieldProperties()
                    .WithName("> :mag: Target")
                    .WithValue($"`{target}`")
                )
                .WithFooter(new EmbedFooterProperties()
                    .WithText("Powered by da.gd")
                )
            )
            .AddAttachments(new AttachmentProperties("whois.txt", new MemoryStream(Encoding.UTF8.GetBytes(response))))
        );
    }
}