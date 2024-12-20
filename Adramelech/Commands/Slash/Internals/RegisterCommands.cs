using Adramelech.Configuration;
using Adramelech.Extensions;
using Discord;
using Discord.Interactions;
using Discord.Rest;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash.Internals;

public class RegisterCommands(Config config, InteractionService interactionService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("register-commands", "Force the registration of commands globally")]
    [RequireContext(ContextType.DM)]
    [RequireOwner]
    public async Task RegisterCommandsAsync()
    {
        IReadOnlyCollection<RestGlobalCommand>? commands;
        try
        {
            commands = await interactionService.RegisterCommandsGloballyAsync();
        }
        catch (Exception e)
        {
            await Context.SendError($"```{e.Message}```");
            return;
        }

        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(config.EmbedColor)
                .WithTitle("Commands registered")
                .WithDescription($"Registered {commands.Count} commands")
                .Build(),
            ephemeral: true);
    }
}