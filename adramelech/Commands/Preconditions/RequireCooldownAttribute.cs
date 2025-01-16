using adramelech.Extensions;
using adramelech.Services;
using Humanizer;
using Microsoft.Extensions.DependencyInjection;
using NetCord.Services;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Preconditions;

public class RequireCooldownAttribute : PreconditionAttribute<SlashCommandContext>
{
    public int CooldownSeconds { get; set; } = -1;
    
    public override ValueTask<PreconditionResult> EnsureCanExecuteAsync(SlashCommandContext context, IServiceProvider? serviceProvider)
    {
        if (serviceProvider is null)
            throw new InvalidOperationException("The service provider is not available.");
        var cooldownService = serviceProvider.GetRequiredService<CooldownService>();
        
        var result = cooldownService.IsOnCooldown(context.GetUniqueCommandName(), context.User.Id, out var remaining);
        if (result)
            return new ValueTask<PreconditionResult>(PreconditionResult.Fail($"You are on cooldown for {remaining.Humanize(2)}"));

        TimeSpan? cooldown = CooldownSeconds != -1 ? TimeSpan.FromSeconds(CooldownSeconds) : null;
        cooldownService.SetCooldown(context.GetUniqueCommandName(), context.User.Id, cooldown);
        return new ValueTask<PreconditionResult>(PreconditionResult.Success);
    }
}
