using Humanizer;
using NetCord;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;
using NetCord.Services.ComponentInteractions;

namespace adramelech.Commands.Slash;

public class Ping(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("ping", "Reply with Pong!")]
    public async Task PingAsync()
    {
        await RespondAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Pong!")
            )
            .AddComponents(new ActionRowProperties()
                .AddButtons(
                    new ButtonProperties("velocity", "Velocity", ButtonStyle.Primary),
                    new LinkButtonProperties(config.AuthorUrl, "Author")
                )
            )
        ));
    }
}

public class Velocity(Configuration config) : ComponentInteractionModule<ButtonInteractionContext>
{
    [ComponentInteraction("velocity")]
    public async Task VelocityAsync()
    {
        await Context.Message.ModifyAsync(o =>
        {
            o.Components =
            [
                new ActionRowProperties()
                    .AddButtons(
                        new ButtonProperties("velocity", "Velocity", ButtonStyle.Primary)
                            .WithDisabled(),
                        new LinkButtonProperties(config.AuthorUrl, "Author")
                    )
            ];
        });

        await RespondAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Velocity")
                .WithDescription($"Latency: {Context.Client.Latency.Humanize()}")
            )
        ));
    }
}