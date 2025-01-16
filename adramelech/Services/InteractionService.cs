using NetCord.Gateway;
using NetCord.Services.ApplicationCommands;
using NetCord.Services.ComponentInteractions;
using Serilog;

namespace adramelech.Services;

public class InteractionService
{
    private readonly GatewayClient _client;
    public readonly ApplicationCommandServiceManager ApplicationCommandServiceManager = new();
    public readonly ApplicationCommandService<SlashCommandContext> SlashCommandService = new();
    public readonly ApplicationCommandService<UserCommandContext> UserCommandService = new();
    public readonly ComponentInteractionService<ButtonInteractionContext> ButtonService = new();
    public readonly ComponentInteractionService<ModalInteractionContext> ModalService = new();

    public InteractionService(GatewayClient client)
    {
        _client = client;
        ApplicationCommandServiceManager.AddService(SlashCommandService);
        ApplicationCommandServiceManager.AddService(UserCommandService);
        var assembly = typeof(Adramelech).Assembly;
        SlashCommandService.AddModules(assembly);
        UserCommandService.AddModules(assembly);
        ButtonService.AddModules(assembly);
        ModalService.AddModules(assembly);
    }

    public async Task Activate()
    {
        try
        {
            var commands = await ApplicationCommandServiceManager.CreateCommandsAsync(_client.Rest, _client.Id);
            Log.Information("Registered {Count} commands", commands.Count);
        }
        catch (Exception e)
        {
            Log.Error(e, "Failed to register commands");
        }
    }
}