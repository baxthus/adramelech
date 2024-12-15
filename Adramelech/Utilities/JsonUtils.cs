using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Adramelech.Utilities;

/// <summary>
///     A collection of utility methods for working with JSON.
/// </summary>
public static class JsonUtils
{
    private static readonly JsonSerializerSettings DefaultSettings = new()
    {
        ContractResolver = new DefaultContractResolver
        {
            NamingStrategy = new CamelCaseNamingStrategy()
        }
    };

    /// <summary>
    ///     Serializes an object to a JSON string.
    /// </summary>
    /// <param name="obj">The object to serialize (can be implicit).</param>
    /// <param name="namingStrategy">The naming strategy to use for the JSON properties (default is camel case).</param>
    /// <returns>The JSON string representation of the object.</returns>
    public static string ToJson(this object obj, NamingStrategy? namingStrategy = null)
    {
        return JsonConvert.SerializeObject(
            obj, namingStrategy switch
            {
                null => DefaultSettings,
                _ => new JsonSerializerSettings
                {
                    ContractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = namingStrategy
                    }
                }
            });
    }

    /// <summary>
    ///     Deserializes a JSON string to an object.
    /// </summary>
    /// <param name="json">The JSON string to deserialize (can be implicit).</param>
    /// <param name="namingStrategy">The naming strategy to use for the JSON properties (default is camel case).</param>
    /// <typeparam name="T">The type of the object to deserialize to (can be implicit).</typeparam>
    /// <returns>The deserialized object.</returns>
    public static T? FromJson<T>(this string json, NamingStrategy? namingStrategy = null)
    {
        return JsonConvert.DeserializeObject<T>(json, namingStrategy switch
        {
            null => DefaultSettings,
            _ => new JsonSerializerSettings
            {
                ContractResolver = new DefaultContractResolver
                {
                    NamingStrategy = namingStrategy
                }
            }
        });
    }
}