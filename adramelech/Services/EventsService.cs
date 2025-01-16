using adramelech.Common;
using Microsoft.Extensions.DependencyInjection;

namespace adramelech.Services;

public class EventsService(IEnumerable<Event> events)
{
    public void Activate()
    {
        foreach (var @event in events) @event.Initialize();
    }

    public static void Register(IServiceCollection services)
    {
        foreach (var type in typeof(Adramelech).Assembly.GetTypes())
            if (typeof(Event).IsAssignableFrom(type) && !type.IsAbstract)
                services.AddSingleton(typeof(Event), type);
        
        services.AddSingleton<EventsService>();
    }
}