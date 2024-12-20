using System.Text.Json;
using Serilog;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace Adramelech.Utilities;

/// <summary>
///     A collection of utility methods for working with JSON.
/// </summary>
public static class JsonUtils
{
    private static readonly JsonSerializerOptions DefaultOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    /// <summary>
    ///     Serializes an object to a JSON string.
    /// </summary>
    /// <param name="obj">The object to serialize (can be implicit).</param>
    /// <param name="namingPolicy">The naming policy to use for the JSON properties (default is camel case).</param>
    /// <returns>The JSON string representation of the object.</returns>
    public static string ToJson(this object obj, JsonNamingPolicy? namingPolicy = null)
    {
        try
        {
            return JsonSerializer.Serialize(
                obj, namingPolicy switch
                {
                    null => DefaultOptions,
                    _ => new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = namingPolicy
                    }
                });
        }
        catch
        {
            Log.Error("Failed to serialize object to JSON: {Object}", obj);
            return string.Empty;
        }
    }

    /// <summary>
    ///     Deserializes a JSON string to an object.
    /// </summary>
    /// <param name="json">The JSON string to deserialize (can be implicit).</param>
    /// <param name="namingPolicy">The naming policy to use for the JSON properties (default is camel case).</param>
    /// <typeparam name="T">The type of the object to deserialize to (can be implicit).</typeparam>
    /// <returns>The deserialized object.</returns>
    public static T? FromJson<T>(this string json, JsonNamingPolicy? namingPolicy = null)
    {
        try
        {
            return JsonSerializer.Deserialize<T>(json, namingPolicy switch
            {
                null => DefaultOptions,
                _ => new JsonSerializerOptions
                {
                    PropertyNamingPolicy = namingPolicy
                }
            });
        }
        catch
        {
            Log.Error("Failed to deserialize JSON to object: {Json}", json);
            return default;
        }
    }
}