using System.Text;
using System.Text.Json;

namespace Adramelech.Utilities;

/// <summary>
///     A collection of utility methods for working with HTTP requests.
/// </summary>
public class HttpUtils(IHttpClientFactory clientFactory)
{
    /// <summary>
    ///     Sends a GET request to the specified URL.
    /// </summary>
    /// <param name="url">The URL to send the request to (can be implicit).</param>
    /// <param name="userAgent">The user agent to use for the request (optional).</param>
    /// <param name="namingPolicy">The naming policy to use for the response deserialization (optional).</param>
    /// <param name="timeout">The timeout for the request (optional).</param>
    /// <param name="cancellationToken">The cancellation token to use for the request (optional).</param>
    /// <typeparam name="T">The type of the response to expect (can be inferred).</typeparam>
    /// <returns>The response from the request, or default if the request failed.</returns>
    /// <remarks>This method don't support returning an int, because I don't fell like it.</remarks>
    public async Task<T?> GetAsync<T>(string url, string? userAgent = null,
        JsonNamingPolicy? namingPolicy = null, TimeSpan? timeout = null, CancellationToken cancellationToken = default)
    {
        using var client = clientFactory.CreateClient();
        if (timeout.HasValue)
            client.Timeout = timeout.Value;

        if (userAgent is not null)
            client.DefaultRequestHeaders.UserAgent.ParseAdd(userAgent);

        var response = await client.GetAsync(url, cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
            return default;

        return await DeserializeContent<T>(response, namingPolicy);
    }

    /// <summary>
    ///     Sends a POST request to the specified URL.
    /// </summary>
    /// <param name="url">The URL to send the request to (can be implicit).</param>
    /// <param name="data">The data to send with the request.</param>
    /// <param name="userAgent">The user agent to use for the request (optional).</param>
    /// <param name="dataNamingPolicy">The naming policy to use for the data serialization (optional).</param>
    /// <param name="responseNamingPolicy">The naming policy to use for the response deserialization (optional).</param>
    /// <param name="timeout">The timeout for the request (optional).</param>
    /// <param name="cancellationToken">The cancellation token to use for the request (optional).</param>
    /// <typeparam name="T">The type of the data to send with the request (can be inferred).</typeparam>
    /// <typeparam name="TF">The type of the response to expect.</typeparam>
    /// <returns>The response from the request, or default if the request failed.</returns>
    public async Task<TF?> PostAsync<T, TF>(string url, T data, string? userAgent = null,
        JsonNamingPolicy? dataNamingPolicy = null, JsonNamingPolicy? responseNamingPolicy = null,
        TimeSpan? timeout = null, CancellationToken cancellationToken = default)
    {
        using var client = clientFactory.CreateClient();
        if (timeout.HasValue)
            client.Timeout = timeout.Value;

        if (userAgent is not null)
            client.DefaultRequestHeaders.UserAgent.ParseAdd(userAgent);

        using var httpContent = CreateHttpContent(data, dataNamingPolicy);

        var response = await client.PostAsync(url, httpContent, cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
            return default;

        return await DeserializeContent<TF>(response, responseNamingPolicy);
    }

    private static async Task<T?> DeserializeContent<T>(HttpResponseMessage response, JsonNamingPolicy? namingPolicy)
    {
        if (typeof(T) == typeof(byte[]))
            return (T)(object)await response.Content.ReadAsByteArrayAsync();

        var content = await response.Content.ReadAsStringAsync();

        // If T is string, don't serialize
        return typeof(T) == typeof(string) ? (T)(object)content : content.FromJson<T>(namingPolicy);
    }

    private static StringContent CreateHttpContent<T>(T data, JsonNamingPolicy? namingPolicy)
    {
        return typeof(T) == typeof(string)
            ? new StringContent((string)(object)data!, Encoding.UTF8, "application/json")
            : new StringContent(data!.ToJson(namingPolicy), Encoding.UTF8, "application/json");
    }
}