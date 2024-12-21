using Adramelech.Common;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Services;
using Adramelech.Tools;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

[Group("port-scan", "Scan ports on a target host")]
public class PortScan(Config config, CooldownService cooldownService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    // list from https://www.speedguide.net/ports_common.php (accessed on 2024-11-22)
    // the list maybe be shorted in the future for performance and resource reasons
    // while the bot still private, this is not a concern
    private static readonly List<int> CommonOpenPorts =
    [
        443, 80, 22, 5060, 8080, 53, 1723, 21, 8082, 3389, 8000, 8081, 993, 25, 4567, 81, 995, 23, 143, 5000, 10000,
        445, 139, 7547, 111, 135, 110, 1024, 7676, 1025, 30005, 44158, 389, 4444, 1026, 5678, 20, 28960, 27374, 29900,
        18067, 1027, 1029, 1028, 1002, 113, 1050, 8594, 1863, 4
    ];

    private readonly TimeSpan _cooldown = TimeSpan.FromMinutes(30);

    private static Embed _defaultResponse(string target)
    {
        return new EmbedBuilder()
            .WithColor(Color.LightGrey)
            .WithTitle($"Port can on `{target}` started")
            .WithDescription("""
                             You will receive a DM when the can is completed.
                             Please be sure to enable DMs from server members.
                             """)
            .Build();
    }


    [SlashCommand("in-range", "Scan ports in a range")]
    public async Task InRangeAsync([Summary("host", "The target host")] string target,
        [Summary("start", "The start of the range")] [MinValue(1)] [MaxValue(65535)]
        int start,
        [Summary("end", "The end of the range")] [MinValue(1)] [MaxValue(65535)]
        int end)
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        var ports = Enumerable.Range(start, end - start + 1).ToList();

        RunPortScanAsync(target, ports);

        await RespondAsync(embed: _defaultResponse(target), ephemeral: true);
        Context.SetCooldown(cooldownService, _cooldown);
    }

    [SlashCommand("in-list", "Scan ports in a list")]
    public async Task InListAsync([Summary("host", "The target host")] string target,
        [Summary("ports", "The ports to can separated by spaces")]
        string ports)
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        var portsList = ParsePorts(ports);
        if (portsList.IsFailure)
        {
            await Context.SendError(portsList.Exception!.Message);
            return;
        }

        RunPortScanAsync(target, portsList.Value!);

        await RespondAsync(embed: _defaultResponse(target), ephemeral: true);
        Context.SetCooldown(cooldownService, _cooldown);
    }

    [SlashCommand("common", "Scan common ports")]
    public async Task CommonAsync([Summary("host", "The target host")] string target)
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        RunPortScanAsync(target, CommonOpenPorts);

        await RespondAsync(embed: _defaultResponse(target), ephemeral: true);
        Context.SetCooldown(cooldownService, _cooldown);
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

    private void RunPortScanAsync(string target, List<int> ports)
    {
        // don't await this task, so the interaction can be responded to immediately
        Task.Run(async () =>
        {
            // cancel the task after 5 minutes
            var cts = new CancellationTokenSource(TimeSpan.FromMinutes(5));

            var result = await PortScanner.Scan(target, ports, Context.User, cts.Token);
            if (result.IsFailure)
            {
                await Context.SendError(result.Exception!.Message, toDm: true);
                return;
            }

            if (result.Value!.Count == 0)
            {
                await Context.SendError("No open ports found", toDm: true);
                return;
            }

            await Context.User.SendMessageAsync(embed: new EmbedBuilder()
                .WithColor(config.EmbedColor)
                .WithTitle($"Port scan on `{target}` completed")
                .WithDescription("""
                                 The port scan that you requested has been completed, you can find the results below.
                                 Be aware that some ports may be closed, but still show up as open.
                                 Also, rate limiting may cause some ports to not be scanned.
                                 """)
                .AddField(":unlock: Open ports", $"```{string.Join(", ", result.Value)} ```")
                .Build());
        });
    }
}