using Sentry.Serilog;
using Serilog;
using Serilog.Events;

namespace adramelech;

public static class Logger
{
    private static readonly Action<SentrySerilogOptions> SentryOptions = o =>
    {
        o.MinimumBreadcrumbLevel = LogEventLevel.Debug;
        o.MinimumEventLevel = LogEventLevel.Error;
        o.Dsn = Environment.GetEnvironmentVariable("SENTRY_DSN");
        o.AttachStacktrace = true;
        o.SendDefaultPii = true;
    };

    public static readonly Serilog.Core.Logger Default = new LoggerConfiguration()
        .MinimumLevel.Debug()
        .Enrich.FromLogContext()
        .WriteTo.Console()
#if !DEBUG
        .WriteTo.Sentry(SentryOptions)
#endif
        .CreateLogger();

    public static readonly Serilog.Core.Logger UserContext = new LoggerConfiguration()
        .MinimumLevel.Debug()
        .Enrich.FromLogContext()
        .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] ({User}) {Message:lj}{NewLine}{Exception}")
        .CreateLogger();
}