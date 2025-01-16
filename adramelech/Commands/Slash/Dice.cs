using adramelech.Extensions;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Dice(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("dice", "Roll a dice")]
    public async Task DiceAsync(
        [SlashCommandParameter(Name = "sides", Description = "Number of sides of the dice")]
        int sides = 6
    )
    {
        if (sides < 2)
        {
            await Context.Interaction.SendError("The dice must have at least 2 sides.");
            return;
        }

        var result = new Random().Next(1, sides + 1);

        await RespondAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Dice Roll")
                .WithDescription($"You rolled a {sides}-sided dice and got {result}.")
            )
        ));
    }
}