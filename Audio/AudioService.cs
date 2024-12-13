using Adramelech.Tools;
using Discord;

namespace Adramelech.Audio;

public class AudioService
{
    private readonly Dictionary<ulong, AudioHandler> _audioHandlers = new();

    public async Task<AudioHandler> ConnectAsync(IVoiceChannel channel)
    {
        // if we're already connected to this guild, return the handler
        if (_audioHandlers.TryGetValue(channel.GuildId, out var audio))
            return audio;

        var audioClient = await channel.ConnectAsync();
        var handler = new AudioHandler(audioClient);
        _audioHandlers[channel.GuildId] = handler;
        return handler;
    }

    public AudioHandler? GetAudioHandler(IVoiceChannel channel)
    {
        return _audioHandlers.GetValueOrDefault(channel.GuildId);
    }

    public async Task DisconnectAsync(IVoiceChannel channel)
    {
        var handler = _audioHandlers.GetValueOrDefault(channel.GuildId);
        if (handler == null) return;

        await handler.StopAsync();
        handler.AudioClient.Dispose();
        _audioHandlers.Remove(channel.GuildId);
    }
}