using System.Text;
using System.Text.Json;
using Serilog;

namespace adramelech.Utilities;

public class HttpUtils(IHttpClientFactory clientFactory, Configuration config)
{
    public async Task<T?> GetAsync<T>(string url, HttpOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        using var client = clientFactory.CreateClient();
        client.Timeout = options?.Timeout ?? config.DefaultRequestTimeout;

        if (options?.UserAgent != null)
            client.DefaultRequestHeaders.UserAgent.ParseAdd(options.Value.UserAgent);

        HttpResponseMessage? response;
        try
        {
            response = await client.GetAsync(url, cancellationToken).ConfigureAwait(false);
        }
        catch (TaskCanceledException) // Timeout
        {
            Log.Debug("Request to {Url} timed out", url);
            return default;
        }

        if (!response.IsSuccessStatusCode)
            return default;

        return await DeserializaContent<T>(response, options?.ResponseNamingPolicy);
    }

    public async Task<TF?> PostAsync<T, TF>(string url, T data, HttpOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        using var client = clientFactory.CreateClient();
        client.Timeout = options?.Timeout ?? config.DefaultRequestTimeout;

        if (options?.UserAgent != null)
            client.DefaultRequestHeaders.UserAgent.ParseAdd(options.Value.UserAgent);

        using var content = CreateHttpContent(data, options?.DataNamingPolicy);

        HttpResponseMessage? response;
        try
        {
            response = await client.PostAsync(url, content, cancellationToken).ConfigureAwait(false);
        }
        catch (TaskCanceledException) // Timeout
        {
            Log.Debug("Request to {Url} timed out", url);
            return default;
        }

        if (!response.IsSuccessStatusCode)
            return default;

        return await DeserializaContent<TF>(response, options?.ResponseNamingPolicy);
    }

    private static async Task<T?> DeserializaContent<T>(HttpResponseMessage response, JsonNamingPolicy? namingPolicy)
    {
        if (typeof(T) == typeof(byte[]))
            return (T)(object)await response.Content.ReadAsByteArrayAsync();

        var content = await response.Content.ReadAsStringAsync();

        return typeof(T) == typeof(string) ? (T)(object)content : content.FromJson<T>(namingPolicy);
    }

    private static StringContent CreateHttpContent<T>(T data, JsonNamingPolicy? namingPolicy)
    {
        return typeof(T) == typeof(string)
            ? new StringContent((string)(object)data!, Encoding.UTF8, "application/json")
            : new StringContent(data!.ToJson(namingPolicy), Encoding.UTF8, "application/json");
    }
}

public struct HttpOptions
{
    public string? UserAgent { get; set; }
    public JsonNamingPolicy? DataNamingPolicy { get; set; }
    public JsonNamingPolicy? ResponseNamingPolicy { get; set; }
    public TimeSpan? Timeout { get; set; }
}