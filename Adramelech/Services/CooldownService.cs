using System.Collections.Concurrent;
using Adramelech.Configuration;
using Serilog;

namespace Adramelech.Services;

public class CooldownService : IDisposable
{
    private readonly CancellationTokenSource _cancellationTokenSource = new();
    private readonly TimeSpan _cleanupInternal;
    private readonly Task _cleanupTask;
    private readonly Config _config;
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<ulong, DateTime>> _cooldowns = new();

    public CooldownService(Config config)
    {
        _config = config;
        _cleanupInternal = config.CooldownCleanupInterval;
        _cleanupTask = StartCleanupTask(_cancellationTokenSource.Token);
    }

    public void Dispose()
    {
        GC.SuppressFinalize(this);
        _cancellationTokenSource.Cancel();
        _cleanupTask.Wait(TimeSpan.FromSeconds(5)); // Wait for the task to finish
        _cleanupTask.Dispose();
        _cancellationTokenSource.Dispose();
    }

    public bool IsOnCooldown(string command, ulong userId, out TimeSpan remaining)
    {
        remaining = TimeSpan.Zero;
        if (!_cooldowns.TryGetValue(command, out var users) ||
            !users.TryGetValue(userId, out var expiration)) return false;
        remaining = expiration.Subtract(DateTime.UtcNow);
        return DateTime.UtcNow < expiration;
    }

    public void SetCooldown(string command, ulong userId, TimeSpan? cooldown = null)
    {
        cooldown ??= _config.DefaultCooldown;
        var users = _cooldowns.GetOrAdd(command, _ => new ConcurrentDictionary<ulong, DateTime>());
        users[userId] = DateTime.UtcNow + cooldown.Value;
    }

    private Task StartCleanupTask(CancellationToken cancellationToken)
    {
        return Task.Run(async () =>
        {
            while (!cancellationToken.IsCancellationRequested)
                try
                {
                    CleanupExpiredCooldowns();
                    await Task.Delay(_cleanupInternal, cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    // Task was cancelled
                    break;
                }
                catch (Exception ex)
                {
                    Log.Error(ex, "Failed to cleanup expired cooldowns.");
                }
        }, cancellationToken);
    }

    private void CleanupExpiredCooldowns()
    {
        var now = DateTime.UtcNow;
        foreach (var commandCooldowns in _cooldowns)
        {
            var expiredUsers = commandCooldowns.Value.Where(x => now > x.Value).Select(x => x.Key).ToList();
            foreach (var user in expiredUsers) commandCooldowns.Value.TryRemove(user, out _);
        }
    }
}