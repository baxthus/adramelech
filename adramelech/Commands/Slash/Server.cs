using NetCord;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Server(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("server", "Display information about the current server", Contexts = [InteractionContextType.Guild])]
    public async Task ServerAsync()
    {
        var owner = await Context.Guild!.GetUserAsync(Context.Guild.OwnerId);
        var region = await Context.Guild.GetVoiceRegionsAsync();
        var premiumTier = Context.Guild.PremiumTier > 0 ? $" (Tier {Context.Guild.PremiumTier})" : string.Empty;
        var createdAt = Context.Guild.CreatedAt.ToUnixTimeSeconds();

        await RespondAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithAuthor(new EmbedAuthorProperties()
                    .WithName(Context.Guild.Name)
                    .WithIconUrl(Context.Guild.GetIconUrl()?.ToString())
                )
                .AddFields(
                    new EmbedFieldProperties()
                        .WithName("> Owner")
                        .WithValue($"```{owner.Username}```")
                        .WithInline(),
                    new EmbedFieldProperties()
                        .WithName("> ID")
                        .WithValue($"```{Context.Guild.Id}```")
                        .WithInline(),
                    new EmbedFieldProperties()
                        .WithName("> Region")
                        .WithValue($"```{region.FirstOrDefault()?.Name}```")
                        .WithInline(),
                    new EmbedFieldProperties()
                        .WithName("> Members")
                        .WithValue($"```{Context.Guild.UserCount}```")
                        .WithInline(),
                    new EmbedFieldProperties()
                        .WithName("> Roles")
                        .WithValue($"```{Context.Guild.Roles.Count}```")
                        .WithInline(),
                    new EmbedFieldProperties()
                        .WithName("> Channels")
                        .WithValue($"```{Context.Guild.Channels.Count}```")
                        .WithInline(),
                    new EmbedFieldProperties()
                        .WithName("> Boosts")
                        .WithValue($"```{Context.Guild.PremiumSubscriptionCount}{premiumTier}```")
                        .WithInline(),
                    new EmbedFieldProperties()
                        .WithName("> Created at")
                        .WithValue($"<t:{createdAt}:F> (<t:{createdAt}:R>)")
                )
            )
        ));
    }
}