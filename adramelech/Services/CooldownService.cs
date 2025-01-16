using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;
using Serilog;

#pragma warning disable CS0162 // Unreachable code detected

namespace adramelech.Services;

public class CooldownService : IDisposable
{
    private readonly CancellationTokenSource _cts = new();
    private readonly TimeSpan _cleanupInterval;
    private readonly Task _cleanupTask;
    private readonly Configuration _config;
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<ulong, DateTime>> _cooldowns = new();

    public CooldownService(Configuration config)
    {
        _config = config;
        _cleanupInterval = config.CooldownCleanupInterval;
        _cleanupTask = StartCleanupTask(_cts.Token);
    }

    public void Dispose()
    {
        GC.SuppressFinalize(this);
        _cts.Cancel();
        _cleanupTask.Wait(TimeSpan.FromSeconds(5)); // Wait 5 seconds for the cleanup task to finish
        _cleanupTask.Dispose();
        _cts.Dispose();
    }

    [SuppressMessage("ReSharper", "HeuristicUnreachableCode")]
    public bool IsOnCooldown(string command, ulong userId, out TimeSpan remaining)
    {
        remaining = TimeSpan.Zero;
#if DEBUG
        // Bypass cooldowns in debug mode
        return false;
#endif
        if (!_cooldowns.TryGetValue(command, out var users) || !users.TryGetValue(userId, out var expiration))
            return false;
        
        remaining = expiration.Subtract(DateTime.UtcNow);
        return DateTime.UtcNow < expiration;
    }

    public void SetCooldown(string command, ulong userId, TimeSpan? cooldown = null)
    {
        cooldown ??= _config.DefaultCooldown;
        var users = _cooldowns.GetOrAdd(command, _ => new ConcurrentDictionary<ulong, DateTime>());
        users[userId] = DateTime.UtcNow.Add(cooldown.Value);
    }

    private Task StartCleanupTask(CancellationToken cancellationToken)
    {
        return Task.Run(async () =>
        {
            while (!cancellationToken.IsCancellationRequested)
                try
                {
                    CleanupExpiredCooldowns();
                    await Task.Delay(_cleanupInterval, cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    // Task was cancelled
                    break;
                }
                catch (Exception e)
                {
                    Log.Error(e, "An error occurred while cleaning up expired cooldowns");
                }
        }, cancellationToken);
    }

    private void CleanupExpiredCooldowns()
    {
        var now = DateTime.UtcNow;
        foreach (var cooldown in _cooldowns)
        {
            var expiredUsers = cooldown.Value.Where(x => x.Value < now).Select(x => x.Key).ToList();
            foreach (var user in expiredUsers)
                cooldown.Value.TryRemove(user, out _);
        }
    }
}