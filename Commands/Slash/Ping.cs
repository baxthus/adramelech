using Adramelech.Configuration;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Ping : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("ping", "Reply with pong!")]
    public async Task PingAsync()
    {
        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(Config.EmbedColor)
                .WithTitle("Pong!")
                .Build(),
            components: new ComponentBuilder()
                .WithButton("Velocity", "velocity")
                .WithButton("Author", style: ButtonStyle.Link, url: Config.Instance.AuthorUrl)
                .Build());
    }
}

public class Velocity : InteractionModuleBase<SocketInteractionContext<SocketMessageComponent>>
{
    [ComponentInteraction("velocity")]
    public async Task Button()
    {
        await Context.Interaction.UpdateAsync(p =>
        {
            p.Components = new ComponentBuilder()
                .WithButton("Velocity", "velocity", ButtonStyle.Success, disabled: true)
                .WithButton("Author", style: ButtonStyle.Link, url: Config.Instance.AuthorUrl)
                .Build();
        });

        await ReplyAsync(
            embed: new EmbedBuilder()
                .WithColor(Config.EmbedColor)
                .WithTitle("Velocity")
                .WithDescription($"Latency: {Context.Client.Latency}ms")
                .Build());
    }
}