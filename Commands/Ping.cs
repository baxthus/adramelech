using adramelech.Configuration;
using adramelech.Extensions;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace adramelech.Commands;

public class Ping : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("ping", "Reply with pong!")]
    public async Task PingAsync(
        [Summary("ephemeral", "Whether the response should only appear to you")]
        bool ephemeral = false)
    {
        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(BotConfig.EmbedColor)
                .WithTitle("Pong!")
                .Build(),
            components: new ComponentBuilder()
                .WithButton("Velocity", "velocity")
                .WithButton("Author", style: ButtonStyle.Link, url: "https://abysmal.eu.org")
                .Build(),
            ephemeral: ephemeral);
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
                .WithButton("Author", style: ButtonStyle.Link, url: "https://abysmal.eu.org")
                .Build();
        });

        var ephemeral = (Context.Interaction.Message.Flags & MessageFlags.Ephemeral) != 0;

        await ReplyAsync(
            embed: new EmbedBuilder()
                .WithColor(BotConfig.EmbedColor)
                .WithTitle("Velocity")
                .WithDescription($"Latency: {Context.Client.Latency}ms")
                .Build(),
            flags: ephemeral ? MessageFlags.Ephemeral : MessageFlags.None,
            messageReference: Context.MessageReference());
    }
}