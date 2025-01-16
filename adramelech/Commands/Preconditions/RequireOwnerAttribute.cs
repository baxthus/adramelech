using Microsoft.Extensions.DependencyInjection;
using NetCord.Gateway;
using NetCord.Services;

namespace adramelech.Commands.Preconditions;

public class RequireOwnerAttribute<TContext> : PreconditionAttribute<TContext> where TContext : IUserContext
{
    public override async ValueTask<PreconditionResult> EnsureCanExecuteAsync(TContext context,
        IServiceProvider? serviceProvider)
    {
        if (serviceProvider is null)
            throw new InvalidOperationException("The service provider is not available.");
        var client = serviceProvider.GetRequiredService<GatewayClient>();
        var application = await client.Rest.GetCurrentBotApplicationInformationAsync();
        var ownerId = application.Owner?.Id ?? 0;
        if (context.User.Id == ownerId)
            return await new ValueTask<PreconditionResult>(PreconditionResult.Success);

        return await new ValueTask<PreconditionResult>(
            PreconditionResult.Fail("You must be the owner of the bot to execute this command."));
    }
}