using Adramelech.Audio;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash.Voice;

[Group("music", "Music commands")]
public class Music(Config config, AudioService audioService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("play", "Play an audio file")]
    public async Task PlayAsync([Summary("URL", "URL of the audio file to play")] string url)
    {
        var channel = (Context.User as IVoiceState)?.VoiceChannel;
        if (channel == null)
        {
            await Context.SendError("You must be in a voice channel to use this command.");
            return;
        }

        var handler = await audioService.ConnectAsync(channel);
        await handler.PlayAsync(url);

        await ReplyAsync(embed: new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithDescription($"Playing from url in {channel.Mention}")
            .AddField("> :link: URL", $"```{url}```")
            .Build());
    }

    [SlashCommand("stop", "Stop the audio")]
    public async Task StopAsync()
    {
        var channel = (Context.User as IVoiceState)?.VoiceChannel;
        if (channel == null)
        {
            await Context.SendError("You must be in a voice channel to use this command.");
            return;
        }

        await audioService.DisconnectAsync(channel);

        await ReplyAsync(embed: new EmbedBuilder()
            .WithColor(config.EmbedColor)
            .WithDescription($"Stopped the audio in {channel.Mention}")
            .Build());
    }
}