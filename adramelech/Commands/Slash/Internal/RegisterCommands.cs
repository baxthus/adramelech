using adramelech.Commands.Preconditions;
using adramelech.Extensions;
using adramelech.Services;
using NetCord;
using NetCord.Gateway;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;
using Serilog;

namespace adramelech.Commands.Slash.Internal;

public class RegisterCommands(Configuration config, InteractionService interactionService, GatewayClient client)
    : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("register-commands", "Force the registration of commands globally",
        Contexts = [InteractionContextType.BotDMChannel])]
    [RequireOwner<SlashCommandContext>]
    public async Task RegisterCommandsAsync()
    {
        await RespondAsync(InteractionCallback.DeferredMessage(MessageFlags.Ephemeral));

        IReadOnlyList<ApplicationCommand> commands;
        try
        {
            commands = await interactionService.ApplicationCommandServiceManager.CreateCommandsAsync(client.Rest,
                client.Id);
        }
        catch (Exception e)
        {
            Log.Error(e, "Failed to register commands");
            await Context.Interaction.SendError("Failed to register commands", true);
            return;
        }

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(
                new EmbedProperties()
                    .WithColor(config.EmbedColor)
                    .WithTitle("Commands Registered")
                    .WithDescription($"Registered {commands.Count} commands")
            )
            .WithFlags(MessageFlags.Ephemeral)
        );
    }
}