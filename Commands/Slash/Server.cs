using Adramelech.Configuration;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Server(Config config) : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("server", "Display info about the current server")]
    [RequireContext(ContextType.Guild)]
    public async Task ServerAsync()
    {
        var createdAt = Context.Guild.CreatedAt.ToUnixTimeSeconds();
        var premiumTier = Context.Guild.PremiumTier == PremiumTier.None
            ? string.Empty
            : $" (Level {Context.Guild.PremiumTier})";

        await RespondAsync(embed: new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithAuthor(Context.Guild.Name, Context.Guild.IconUrl)
            .AddField("> Owner", $"```{Context.Guild.Owner.Username}```", true)
            .AddField("> ID", $"```{Context.Guild.Id}```", true)
            .AddField("> Members", $"```{Context.Guild.MemberCount}```", true)
            .AddField("> Roles", $"```{Context.Guild.Roles.Count}```", true)
            .AddField("> Channels", $"```{Context.Guild.Channels.Count}```", true)
            .AddField("> Boosts", $"```{Context.Guild.PremiumSubscriptionCount}{premiumTier}```", true)
            .AddField("> Created at", $"<t:{createdAt}:F> (<t:{createdAt}:R>)")
            .Build());
    }
}