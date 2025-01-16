using adramelech.Common;
using NetCord.Gateway;
using Serilog;

namespace adramelech.Events;

public class Ready(GatewayClient client, Configuration config) : Event
{
    public override void Initialize()
    {
        client.Ready += OnReady;
    }
    
    private ValueTask OnReady(ReadyEventArgs args)
    {
        Log.Information("Ready as {Username}#{Discriminator}", args.User.Username, args.User.Discriminator);
        Log.Information("API Version: {Version}", args.Version);
        var activity = config.Presence.Activities!.First();
        Log.Information("Activity: {Type} {Name}", activity.Type, activity.Name);
        
        return ValueTask.CompletedTask;
    }
}