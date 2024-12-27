using System.Text;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

[Group("fun", "Fun commands")]
public class Fun : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("clap", "👏makes👏your👏text👏clap👏")]
    public async Task ClapAsync([Summary("sentence", "The sentence to clap")] string text)
    {
        await RespondAsync(string.Join(" 👏 ", $" {text} ".Split(' ')));
    }

    [SlashCommand("aesthetics", "ｍａｋｅｓ ｙｏｕｒ ｔｅｘｔ ａｅｓｔｈｅｔｉｃ")]
    public async Task AestheticsAsync([Summary("sentence", "The sentence to make aesthetic")] string text)
    {
        await RespondAsync(string.Join(" ", text.Select(c => c == ' ' ? ' ' : (char)(c + 65248))));
    }

    [SlashCommand("bold-fancy", "𝓶𝓪𝓴𝓮𝓼 𝔂𝓸𝓾𝓻 𝓽𝓮𝔁𝓽 𝓫𝓸𝓵𝓭 𝓪𝓷𝓭 𝓯𝓪𝓷𝓬𝔂")]
    public async Task BoldFancyAsync([Summary("sentence", "The sentence to make bold and fancy")] string text)
    {
        var result = new StringBuilder();
        foreach (var c in text)
            if (char.IsLetter(c))
            {
                var unicodeValue = char.IsLower(c) ? 0x1D4EA : 0x1D4D0;
                result.Append(char.ConvertFromUtf32(unicodeValue + c - (char.IsLower(c) ? 'a' : 'A')));
            }
            else
            {
                result.Append(c);
            }

        await RespondAsync(result.ToString());
    }

    [SlashCommand("eight-ball", "🎱 Ask the magic 8-ball a yes/no question")]
    public async Task EightBallAsync([Summary("question", "The question to ask the 8-ball")] string question)
    {
        var responses = new[]
        {
            "It is certain", "It is decidedly so", "Without a doubt", "Yes, definitely", "You may rely on it",
            "As I see it, yes", "Most likely", "Outlook good", "Yes", "Signs point to yes", "Reply hazy, try again",
            "Ask again later", "Better not tell you now", "Cannot predict now", "Concentrate and ask again",
            "Don't count on it", "My reply is no", "My sources say no", "Outlook not so good", "Very doubtful"
        };

        await RespondAsync(responses[new Random().Next(responses.Length)]);
    }

    [SlashCommand("pick", "Pick a random item from a list")]
    public async Task PickAsync([Summary("items", "The list of items to pick from, separated by commas")] string items)
    {
        var itemsArray = items.Split(',').Select(i => i.Trim()).ToArray();
        var item = itemsArray[new Random().Next(itemsArray.Length)];
        await RespondAsync($"I choose: {item}");
    }
}