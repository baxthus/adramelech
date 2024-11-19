using System.Text;
using Newtonsoft.Json.Serialization;

namespace adramelech.Utilities;

/// <summary>
///     A collection of utility methods for working with HTTP requests.
/// </summary>
public static class HttpUtils
{
    /// <summary>
    ///     Sends a GET request to the specified URL.
    /// </summary>
    /// <param name="url">The URL to send the request to (can be implicit).</param>
    /// <param name="userAgent">The user agent to use for the request (optional).</param>
    /// <param name="namingStrategy">The naming strategy to use for JSON serialization (optional).</param>
    /// <typeparam name="T">The type of the response to expect (can be inferred).</typeparam>
    /// <returns>The response from the request, or default if the request failed.</returns>
    /// <remarks>This method don't support returning a int, because I don't fell like it.</remarks>
    public static async Task<T?> Request<T>(this string url, string? userAgent = null,
        NamingStrategy? namingStrategy = null)
    {
        using var client = new HttpClient();

        if (userAgent is not null)
            client.DefaultRequestHeaders.UserAgent.ParseAdd(userAgent);

        var response = await client.GetAsync(url);
        if (!response.IsSuccessStatusCode)
            return default;

        if (typeof(T) == typeof(byte[]))
            return (T)(object)await response.Content.ReadAsByteArrayAsync();

        var content = await response.Content.ReadAsStringAsync();

        // If T is string, don't serialize
        return typeof(T) == typeof(string) ? (T)(object)content : content.FromJson<T>(namingStrategy);
    }

    /// <summary>
    ///     Sends a POST request to the specified URL.
    /// </summary>
    /// <param name="url">The URL to send the request to (can be implicit).</param>
    /// <param name="data">The data to send with the request.</param>
    /// <param name="userAgent">The user agent to use for the request (optional).</param>
    /// <param name="dataNamingStrategy">The naming strategy to use for the data serialization (optional).</param>
    /// <param name="responseNamingStrategy">The naming strategy to use for the response serialization (optional).</param>
    /// <typeparam name="T">The type of the data to send with the request (can be inferred).</typeparam>
    /// <typeparam name="TF">The type of the response to expect.</typeparam>
    /// <returns>The response from the request, or default if the request failed.</returns>
    public static async Task<TF?> Request<T, TF>(this string url, T data, string? userAgent = null,
        NamingStrategy? dataNamingStrategy = null, NamingStrategy? responseNamingStrategy = null)
    {
        using var client = new HttpClient();

        if (userAgent is not null)
            client.DefaultRequestHeaders.UserAgent.ParseAdd(userAgent);

        // If the content is a string, don't serialize
        using var httpContent = typeof(T) == typeof(string)
            ? new StringContent((string)(object)data!, Encoding.UTF8, "application/json")
            : new StringContent(data!.ToJson(dataNamingStrategy), Encoding.UTF8, "application/json");

        var response = await client.PostAsync(url, httpContent);
        if (!response.IsSuccessStatusCode)
            return default;

        var content = await response.Content.ReadAsStringAsync();

        // If TF is string, don't serialize
        return typeof(TF) == typeof(string) ? (TF)(object)content : content.FromJson<TF>(responseNamingStrategy);
    }
}