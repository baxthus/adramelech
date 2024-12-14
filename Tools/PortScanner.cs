using System.Net.Sockets;
using Adramelech.Common;
using Adramelech.Logging;
using Discord.WebSocket;

namespace Adramelech.Tools;

public static class PortScanner
{
    public static async Task<Result<List<int>>> Scan(string target, List<int> ports, SocketUser user,
        CancellationToken cancellationToken = default)
    {
        if (ports.Any(port => port is < 1 or > 65535))
            return new Exception("Invalid port range");
        if (BadAddresses.Hosts.Any(target.StartsWith) || BadAddresses.TlDs.Any(target.EndsWith))
            return new Exception("Invalid target address");

        var logger = Loggers.UserContext.ForContext("User", user);

        logger.Debug("User started a port scan on {Target}", target);

        while (!cancellationToken.IsCancellationRequested)
        {
            var openPorts = new List<int>();

            foreach (var port in ports)
            {
                using var tcpClient = new TcpClient();

                try
                {
                    await tcpClient.ConnectAsync(target, port, cancellationToken);
                }
                catch
                {
                    continue;
                }

                openPorts.Add(port);

                tcpClient.Close();
            }

            logger.Debug("Port scan on {Target} completed", target);

            return openPorts;
        }

        return new TaskCanceledException();
    }

    // https://en.wikipedia.org/wiki/Special-use_domain_name
    // https://www.arin.net/reference/research/statistics/address_filters
    private static class BadAddresses
    {
        public static readonly List<string> Hosts =
        [
            // Basic hostnames
            "localhost", "routes", "gateway",
            // Private/internal DNS Namespaces
            "intranet", "internal", "private", "corp", "home", "lan", "local", "office", "site", "web", "work",
            // Onion addresses
            "onion",
            // Network testing
            "test",
            // Reserved Ipv4
            "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.",
            "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.", "127."
        ];

        public static readonly List<string> TlDs =
            ["local", "onion", "test", "arpa", "example", "invalid", "localhost"];
    }
}