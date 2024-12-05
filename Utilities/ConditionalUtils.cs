namespace Adramelech.Utilities;

/// <summary>
///     A collection of utility methods for working with conditional statements.
/// </summary>
public static class ConditionalUtils
{
    /// <summary>
    ///     Run multiple check on <see cref="value" /> to determine if it is invalid.
    /// </summary>
    /// <param name="value">The value to check (can be implicit).</param>
    /// <typeparam name="T">The type of the value to check (can be implicit).</typeparam>
    /// <returns>True if the value is invalid, false otherwise.</returns>
    /// <remarks>This is a very expensive method and should be used sparingly.</remarks>
    public static bool IsInvalid<T>(this T value)
    {
        // Deal with normal scenarios
        if (value is null) return true;
        if (Equals(value, default(T))) return true;

        var methodType = typeof(T);

        // Deal with empty strings
        // Also do whitespace check because of the Github API
        if (methodType == typeof(string))
            return string.IsNullOrEmpty(value as string) || string.IsNullOrWhiteSpace(value as string);

        // Deal with empty arrays
        if (methodType.IsArray) return value as Array is { Length: 0 };

        // Deal with non-null nullable
        if (Nullable.GetUnderlyingType(methodType) is not null) return false;

        // Deal with boxed value types
        var argumentType = value.GetType();
        if (!argumentType.IsValueType || argumentType == methodType) return false;

        // Deal with wrapped types
        var obj = Activator.CreateInstance(value.GetType())!;
        return obj.Equals(value);
    }

    /// <summary>
    ///     Check if the value is null or empty.
    /// </summary>
    /// <param name="value">The value to check (can be implicit).</param>
    /// <returns>True if the value is null or empty, false otherwise.</returns>
    public static bool IsNullOrEmpty(this string? value)
    {
        return string.IsNullOrEmpty(value) || string.IsNullOrWhiteSpace(value);
    }

    /// <summary>
    ///     Check if the value is the default value for its type.
    /// </summary>
    /// <param name="value">The value to check (can be implicit).</param>
    /// <typeparam name="T">The type of the value to check (can be implicit).</typeparam>
    /// <returns>True if the value is the default value, false otherwise.</returns>
    /// <remarks>This also checks for empty arrays.</remarks>
    public static bool IsDefault<T>(this T value)
    {
        return Equals(value, default(T)) || value is Array { Length: 0 };
    }

    /// <summary>
    ///     Returns the value if it valid, otherwise returns the fallback value.
    /// </summary>
    /// <param name="value">The value to check (can be implicit).</param>
    /// <param name="fallback">The fallback value to return if the value is invalid.</param>
    /// <typeparam name="T">The type of the value to check (can be implicit).</typeparam>
    /// <returns>The value if it is valid, otherwise the fallback value.</returns>
    /// <remarks>For a more in-depth check, use <see cref="IsInvalid{T}" />.</remarks>
    public static T OrElse<T>(this T value, T fallback)
    {
        return value is null || value.IsDefault() ? fallback : value;
    }

    /// <summary>
    ///     Returns the value if it is not null or empty, otherwise returns the fallback value.
    /// </summary>
    /// <param name="value">The value to check (can be implicit).</param>
    /// <param name="fallback">The fallback value to return if the value is null or empty.</param>
    /// <returns>The value if it is not null or empty, otherwise the fallback value.</returns>
    public static string OrElse(this string? value, string fallback)
    {
        return value.IsNullOrEmpty() ? fallback : value!;
    }
}