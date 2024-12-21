using System.Text;
using Adramelech.Extensions;
using Adramelech.Tools;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Help : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("help", "Shows a list of commands")]
    public async Task HelpAsync([Summary("separate-rows", "Whether to separate rows")] bool separateRows = false)
    {
        var commands = await Context.Client.GetGlobalApplicationCommandsAsync();
        if (commands.Count == 0)
        {
            await Context.SendError("No commands found");
            return;
        }

        // Remove user commands
        commands = commands.Where(x => x.Type != ApplicationCommandType.User).ToList();

        string content;
        try
        {
            content = new UnicodeSheet(separateRows)
                .AddColumn("Command", commands.Select(x => x.Name))
                .AddColumn("Description", commands.Select(x => x.Description))
                .Build();
        }
        catch
        {
            await Context.SendError("An error occurred while building the sheet");
            return;
        }

        await RespondWithFileAsync(
            text: "> ## Help",
            fileName: "commands.diff",
            fileStream: new MemoryStream(Encoding.UTF8.GetBytes(content)),
            ephemeral: true);
    }
}