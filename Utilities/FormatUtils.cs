namespace Adramelech.Utilities;

/// <summary>
///     Utilities for formatting strings
/// </summary>
public static class FormatUtils
{
    /// <summary>
    ///     Capitalize the first letter of a string
    /// </summary>
    /// <param name="text">The text to capitalize (can be implicit)</param>
    /// <returns>The capitalized string</returns>
    public static string Capitalize(this string text)
    {
        return text.Length switch
        {
            0 => text,
            1 => text.ToUpper(),
            _ => text[0].ToString().ToUpper() + text[1..]
        };
    }
}