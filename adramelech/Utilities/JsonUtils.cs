using System.Text.Json;
using Serilog;

namespace adramelech.Utilities;

public static class JsonUtils
{
    private static readonly JsonSerializerOptions DefaultOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public static string ToJson(this object obj, JsonNamingPolicy? namingPolicy = null)
    {
        try
        {
            return JsonSerializer.Serialize(obj, namingPolicy switch
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