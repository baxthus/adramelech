using adramelech.Commands.Preconditions;
using adramelech.Common;
using adramelech.Extensions;
using adramelech.Tools;
using Humanizer;
using NetCord;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

[SlashCommand("port-scan", "Scan a port on a host")]
[RequireCooldown(CooldownSeconds = 30 * 60)] // 30 minutes
public class PortScan(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    // List from https://www.speedguide.net/ports_common.php (accessed on 2024-11-22)
    // The list may be shorted in the future for performance and resource reasons
    // While the bot still private, this is not a concern
    private static readonly List<int> CommonOpenPorts =
    [
        443, 80, 22, 5060, 8080, 53, 1723, 21, 8082, 3389, 8000, 8081, 993, 25, 4567, 81, 995, 23, 143, 5000, 10000,
        445, 139, 7547, 111, 135, 110, 1024, 7676, 1025, 30005, 44158, 389, 4444, 1026, 5678, 20, 28960, 27374, 29900,
        18067, 1027, 1029, 1028, 1002, 113, 1050, 8594, 1863, 4
    ];

    private static InteractionCallback<InteractionMessageProperties> DefaultResponse(string target)
    {
        return InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(new Color(211, 211, 211)) // light gray
                .WithTitle($"Port scan on `{target}` started")
                .WithDescription("""
                                 You will receive a DM when the scan is complete.
                                 Please be sure to have DMs enabled.
                                 """)
            )
            .WithFlags(MessageFlags.Ephemeral)
        );
    }

    [SubSlashCommand("in-range", "Scan a range of ports on a host")]
    public async Task InRangeAsync(
        [SlashCommandParameter(Name = "target", Description = "The target host to scan")]
        string target,
        [SlashCommandParameter(Name = "start", Description = "The start of the port range")]
        int start,
        [SlashCommandParameter(Name = "end", Description = "The end of the port range")]
        int end
    )
    {
        var ports = Enumerable.Range(start, end - start + 1).ToList();
        
        RunPostScanAsync(target, ports);
        
        await RespondAsync(DefaultResponse(target));
    }

    [SubSlashCommand("in-list", "Scan a list of ports on a host")]
    public async Task InListAsync(
        [SlashCommandParameter(Name = "target", Description = "The target host to scan")]
        string target,
        [SlashCommandParameter(Name = "ports", Description = "The list of ports to scan separated by spaces")]
        string ports
    )
    {
        var portsList = ParsePorts(ports);
        if (portsList.IsFailure)
        {
            await Context.Interaction.SendError(portsList.Exception!.Message);
            return;
        }
        
        RunPostScanAsync(target, portsList.Value!);
        
        await RespondAsync(DefaultResponse(target));
    }

    [SubSlashCommand("common", "Scan common open ports on a host")]
    public async Task CommonAsync(
        [SlashCommandParameter(Name = "target", Description = "The target host to scan")]
        string target
    )
    {
        RunPostScanAsync(target, CommonOpenPorts);
        
        await RespondAsync(DefaultResponse(target));
    }

    private void RunPostScanAsync(string target, List<int> ports)
    {
        // Don't await this task, so the interaction can be responded to
        Task.Run(async () =>
        {
            // Cancel the task after 5 minutes
            var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));

            var result = await PortScanner.Scan(target, ports, Context.User, cts.Token);
            if (result.IsFailure)
            {
                await Context.Interaction.SendError(result.Exception!.Message, toDm: true);
                return;
            }

            if (result.Value!.Count == 0)
            {
                await Context.Interaction.SendError("No open ports found", toDm: true);
                return;
            }

            // ReSharper disable MethodSupportsCancellation
            var dmChannel = await Context.User.GetDMChannelAsync();
            await dmChannel.SendMessageAsync(new MessageProperties()
                .AddEmbeds(new EmbedProperties()
                    .WithColor(config.EmbedColor)
                    .WithTitle($"Port scan on `{target}` completed")
                    .WithDescription("""
                                     The port can tha you requested has been completed, you can find the results below
                                     Be aware that some ports may be closed, but still show up as open
                                     Also, rate limiting may have caused some ports to be skipped
                                     """)
                    .AddFields(new EmbedFieldProperties()
                        .WithName("> :unlock: Open ports")
                        .WithValue($"```{result.Value.Humanize()}```")
                    )
                ));
            // ReSharper restore MethodSupportsCancellation
        });
    }

    private static Result<List<int>> ParsePorts(string ports)
    {
        try
        {
            return ports.Split(' ').Select(int.Parse).ToList();
        }
        catch
        {
            return new Exception("Invalid format");
        }
    }
}