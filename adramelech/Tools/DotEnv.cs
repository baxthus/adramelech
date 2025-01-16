namespace adramelech.Tools;

public static class DotEnv
{
    public static async Task Load(string? filePath = null, CancellationToken cancellationToken = default)
    {
        filePath ??= Path.Combine(Directory.GetCurrentDirectory(), ".env");
        
        if (!File.Exists(filePath)) return;

        await foreach (var line in File.ReadLinesAsync(filePath, cancellationToken))
        {
            var trimmed = line.Trim();
            
            // Skip empty lines and comments
            if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith('#')) continue;
            
            var parts = trimmed.Split('=', 2);
            if (parts.Length != 2) continue;
            
            Format(ref parts[1]);
            
            Environment.SetEnvironmentVariable(parts[0], parts[1]);
        }
    }

    private static void Format(ref string value)
    {
        if (value.StartsWith('"') && value.EndsWith('"'))
            value = value[1..^1];
    }
}