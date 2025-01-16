namespace adramelech.Utilities;

public static class ConditionalUtils
{
    public static bool IsInvalid<T>(this T value)
    {
        // Deal with normal scenarios
        if (value is null) return true;
        if (Equals(value, default(T))) return true;

        var methodType = typeof(T);

        // Deal with string scenarios
        // Whitespace check because of the GitHub API
        if (methodType == typeof(string)) return string.IsNullOrWhiteSpace(value as string);

        // Deal with empty array
        if (methodType.IsArray) return value as Array is { Length: 0 };

        // Deal with non-null nullable
        if (Nullable.GetUnderlyingType(methodType) is not null) return false;

        // Deal with boxed value types
        var argumentType = value.GetType();
        if (!argumentType.IsValueType || argumentType == methodType) return false;

        // Deal with wrapped types
        var obj = Activator.CreateInstance(value.GetType())!;
        return Equals(obj, value);
    }

    public static bool IsDefault<T>(this T value) => Equals(value, default(T)) || value is Array { Length: 0 };

    public static T OrElse<T>(this T value, T fallback) => value is null || value.IsDefault() ? fallback : value;

    public static string OrElse(this string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value;
}