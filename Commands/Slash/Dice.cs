using Adramelech.Configuration;
using Adramelech.Extensions;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Dice : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("dice", "Roll a dice")]
    public async Task DiceAsync([Summary("sides", "The number of sides of the dice")] int sides = 6)
    {
        if (sides < 2)
        {
            await Context.SendError("The number of sides must be at least 2");
            return;
        }

        var result = new Random().Next(1, sides + 1);

        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(Config.EmbedColor)
                .WithTitle("Dice Roll")
                .WithDescription($"You rolled a {result} on a {sides}-sided dice")
                .Build());
    }
}