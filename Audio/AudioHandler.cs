using System.Diagnostics;
using Discord.Audio;

namespace Adramelech.Audio;

public class AudioHandler(IAudioClient audioClient)
{
    private Process? _ffmpeg;
    private AudioOutStream? _stream;
    public IAudioClient AudioClient { get; } = audioClient;

    public async Task PlayAsync(string path)
    {
        ResetStream();

        _ffmpeg = await CreateStream(path);
        await using var output = _ffmpeg.StandardOutput.BaseStream;

        _stream = AudioClient.CreatePCMStream(AudioApplication.Mixed);
        try
        {
            await output.CopyToAsync(_stream);
        }
        finally
        {
            await _stream.FlushAsync();
        }
    }

    public async Task StopAsync()
    {
        ResetStream();
        await AudioClient.StopAsync();
    }

    private void ResetStream()
    {
        _ffmpeg?.Kill();
        _stream?.Close();
    }

    private static async Task<Process> CreateStream(string url)
    {
        // remove quotes if the path is wrapped in them
        if (url.StartsWith('"') && url.EndsWith('"'))
            url = url[1..^1];

        using var httpClient = new HttpClient();
        var stream = await httpClient.GetStreamAsync(url);

        var process = Process.Start(new ProcessStartInfo
        {
            FileName = "ffmpeg",
            Arguments = "-hide_banner -loglevel panic -i pipe:0 -ac 2 -f s16le -ar 48000 pipe:1",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardInput = true
        }) ?? throw new InvalidOperationException("Failed to start ffmpeg process.");

        // garbage collector is crying in the corner
        _ = Task.Run(async () =>
        {
            await stream.CopyToAsync(process.StandardInput.BaseStream);
            process.StandardInput.Close();
        });

        return process;
    }
}