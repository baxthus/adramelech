﻿using Microsoft.Extensions.DependencyInjection;

namespace Adramelech.Common;

public class EventsActivator(IEnumerable<Event> events)
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

        services.AddSingleton(typeof(EventsActivator));
    }
}