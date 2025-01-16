using System.Net.Sockets;
using adramelech.Common;
using NetCord;

namespace adramelech.Tools;

public class PortScanner
{
    public static async Task<Result<List<int>>> Scan(string target, List<int> ports, User user,
        CancellationToken cancellationToken = default)
    {
        if (ports.Any(port => port is < 1 or > 65535))
            return new Exception("Invalid port range");
        if (BadAddresses.Hosts.Any(target.Contains) || BadAddresses.TlDs.Any(target.EndsWith))
            return new Exception("Invalid target");

        var logger = Logger.UserContext.ForContext("User", user.Username);
        logger.Debug("User started scanning {Target}", target);

        while (!cancellationToken.IsCancellationRequested)
        {
            var openPorts = new List<int>();

            try
            {
                foreach (var port in ports)
                {
                    using var tcpClient = new TcpClient();

                    try
                    {
                        await tcpClient.ConnectAsync(target, port, cancellationToken);
                    }
                    catch (OperationCanceledException)
                    {
                        throw;
                    }
                    catch
                    {
                        continue;
                    }

                    openPorts.Add(port);
                }
            }
            catch (OperationCanceledException)
            {
                logger.Debug("Port scan for {Target} was cancelled", target);
                return new TaskCanceledException();
            }
            catch (Exception e)
            {
                logger.Error(e, "Port scan for {Target} failed", target);
                return e;
            }
            
            logger.Debug("Port scan for {Target} completed", target);
            
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