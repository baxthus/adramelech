using System.Diagnostics.CodeAnalysis;
using System.Text;
using adramelech.Common;
using adramelech.Configuration;
using adramelech.Extensions;
using adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Newtonsoft.Json;

namespace Adramelech.Commands;

[Group("github", "Get Github information")]
public class Github : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    public const string BaseUrl = "https://api.github.com";

    [SlashCommand("repo", "Get information about a repository")]
    public async Task RepoAsync([Summary("user", "The github user")] string user,
        [Summary("repo", "The repository name")]
        string repo)
    {
        await DeferAsync();

        var response = await $"{BaseUrl}/repos/{user}/{repo}".GetAsync<Repository>(Config.UserAgent);
        if (repo.IsDefault())
        {
            await Context.SendError("Failed to get repository information", true);
            return;
        }

        var mainField = $"""
                         **Name:** {response.Name}
                         **ID:** {response.Id}
                         **Description:** {response.Description}
                         **Is Fork:** {response.Fork}
                         **Main Language:** {response.Language}
                         **Stars:** {response.StargazersCount}
                         **Watchers:** {response.WatchersCount}
                         **Forks:** {response.ForksCount}
                         """;
        var ownerField = $"""
                          **Username:** {response.Owner.Login}
                          **ID:** {response.Owner.Id}
                          **Type:** {response.Owner.Type}
                          """;

        var licenseField = response.License switch
        {
            { Key: "other" } => "Other",
            not null => (await GetLicense(response.License.Value.Key)).Value.OrElse(
                "Failed to get license information"),
            _ => "No License"
        };

        await FollowupAsync(
            embed: new EmbedBuilder()
                .WithColor(Config.EmbedColor)
                .WithTitle("Repository Information")
                .WithThumbnailUrl(response.Owner.AvatarUrl)
                .AddField(":zap: **Main**", mainField)
                .AddField(":bust_in_silhouette: **Owner**", ownerField)
                .AddField(":scroll: **License**", licenseField)
                .Build(),
            components: new ComponentBuilder()
                .WithButton("Repository", style: ButtonStyle.Link, url: response.HtmlUrl)
                .WithButton("Owner", style: ButtonStyle.Link, url: $"https://github.com/{response.Owner.Login}")
                .Build());
    }

    [SlashCommand("user", "Get information about a user")]
    public async Task UserAsync([Summary("user", "The github user")] string user)
    {
        await DeferAsync();

        var response = await $"{BaseUrl}/users/{user}".GetAsync<User>(Config.UserAgent);
        if (response.IsDefault())
        {
            await Context.SendError("Failed to get user information", true);
            return;
        }

        var rawSocials = await GetSocials(user);
        if (rawSocials.IsFailure)
        {
            await Context.SendError("Failed to get user information", true);
            return;
        }

        var (socials, socialField) = rawSocials.Value;

        var mainField = $"""
                         **Username:** {response.Login}
                         **ID:** {response.Id}
                         **Type:** {response.Type}
                         **Name:** {response.Name ?? "N/A"}
                         **Company:** {response.Company ?? "N/A"}
                         **Website:** {response.Blog ?? "N/A"}
                         **Location:** {response.Location ?? "N/A"}
                         **Bio:** {response.Bio ?? "N/A"}
                         """;
        var statsField = $"""
                          **Public Repos:** {response.PublicRepos}
                          **Public Gists:** {response.PublicGists}
                          **Followers:** {response.Followers}
                          **Following:** {response.Following}
                          """;

        var components = new ComponentBuilder();
        components.WithButton("Github", style: ButtonStyle.Link, url: response.HtmlUrl);
        socials.ForEach(x => components.WithButton(x.Provider.Capitalize(), style: ButtonStyle.Link, url: x.Url));

        await FollowupAsync(
            embed: new EmbedBuilder()
                .WithColor(Config.EmbedColor)
                .WithTitle("User Information")
                .WithThumbnailUrl(response.AvatarUrl)
                .AddField(":zap: **Main**", mainField)
                .AddField(":bar_chart: **Stats**", statsField)
                .AddField(":link: **Socials**", socialField)
                .Build(),
            components: components.Build());
    }

    [SlashCommand("gists", "Get information about a gists")]
    public async Task GistsAsync([Summary("user", "The github user")] string user)
    {
        await DeferAsync();

        var response = await $"{BaseUrl}/users/{user}/gists".GetAsync<Gist[]>(Config.UserAgent);
        if (response.IsDefault())
        {
            await Context.SendError("Failed to get gists information or user has no gists", true);
            return;
        }

        var content = response![0];

        var userField = $"""
                         **Username:** {content.Owner.Login}
                         **ID:** {content.Owner.Id}
                         **Type:** {content.Owner.Type}
                         """;
        var latestGistField = $"""
                               **Description:** {content.Description.OrElse("No description")}
                               **ID:** {content.Id}
                               **Comments:** {content.Comments}
                               """;

        await FollowupAsync(
            embed: new EmbedBuilder()
                .WithColor(Config.EmbedColor)
                .WithTitle("Gists Information")
                .WithThumbnailUrl(content.Owner.AvatarUrl)
                .AddField(":bust_in_silhouette: **User**", userField)
                .AddField(":1234: **Number of Gists**", response.Length.ToString())
                .AddField(":arrow_up: **Latest Gist**", latestGistField)
                .Build(),
            components: new ComponentBuilder()
                .WithButton("Gists", style: ButtonStyle.Link, url: content.HtmlUrl)
                .WithButton("User", style: ButtonStyle.Link, url: content.Owner.HtmlUrl)
                .WithButton("Latest Gist", style: ButtonStyle.Link, url: content.HtmlUrl)
                .AddRow(new ActionRowBuilder()
                    .WithButton("Get all Gists", "getAllGists", ButtonStyle.Secondary)
                    // hacky way to get the username in the callback
                    // is the same id, so Discord will not show the button
                    .WithButton(content.Owner.Login, "_getAllGists", ButtonStyle.Secondary, disabled: true))
                .Build());
    }

    private static async Task<Result<(List<Social>, string)>> GetSocials(string user)
    {
        var response = await $"{BaseUrl}/users/{user}/social_accounts".GetAsync<Social[]>(Config.UserAgent);
        if (response.IsDefault())
            return new Exception("User not found");

        var builder = new StringBuilder();

        foreach (var social in response!)
            builder.AppendLine($"**{social.Provider.Capitalize()}:** {social.Url}");

        return (response.ToList(), builder.ToString().TrimEnd('\n'));
    }

    private static async Task<Result<string>> GetLicense(string key)
    {
        var response = await $"{BaseUrl}/licenses/{key}".GetAsync<License>(Config.UserAgent);
        if (response.IsDefault())
            return new Exception("License not found");

        return $"""
                **Name:** {response.Name}
                **Permissions:** {FormatArray(response.Permissions)}
                **Conditions:** {FormatArray(response.Conditions)}
                **Limitations:** {FormatArray(response.Limitations)}
                """;
    }

    private static string FormatArray(string[] array)
    {
        return string.Join(", ", array
            .Select(x => x.Capitalize())
            .Select(x => x.Replace("-", " ")));
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct Repository
    {
        public int Id { get; set; }
        public string Name { get; set; }
        [JsonProperty("html_url")] public string HtmlUrl { get; set; }
        public string Description { get; set; }
        public string Fork { get; set; }
        public string Language { get; set; }
        [JsonProperty("stargazers_count")] public int StargazersCount { get; set; }
        [JsonProperty("watchers_count")] public int WatchersCount { get; set; }
        [JsonProperty("forks_count")] public int ForksCount { get; set; }
        public SOwner Owner { get; set; }

        [SuppressMessage("ReSharper", "MemberHidesStaticFromOuterClass")]
        public SLicense? License { get; set; }

        internal struct SOwner
        {
            public string Login { get; set; }
            public int Id { get; set; }
            public string Type { get; set; }
            [JsonProperty("avatar_url")] public string AvatarUrl { get; set; }
        }

        // ReSharper disable once MemberCanBePrivate.Local
        internal struct SLicense
        {
            public string Key { get; set; }
        }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct License
    {
        public string Name { get; set; }
        public string[] Permissions { get; set; }
        public string[] Conditions { get; set; }
        public string[] Limitations { get; set; }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct User
    {
        public string Login { get; set; }
        public int Id { get; set; }
        public string Type { get; set; }
        public string? Name { get; set; }
        public string? Company { get; set; }
        public string? Blog { get; set; }
        public string? Location { get; set; }
        public string? Bio { get; set; }
        [JsonProperty("public_repos")] public int PublicRepos { get; set; }
        [JsonProperty("public_gists")] public int PublicGists { get; set; }
        public int Followers { get; set; }
        public int Following { get; set; }
        [JsonProperty("avatar_url")] public string AvatarUrl { get; set; }
        [JsonProperty("html_url")] public string HtmlUrl { get; set; }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
    public struct Gist
    {
        [JsonProperty("html_url")] public string HtmlUrl { get; set; }
        public string Description { get; set; }
        public string Id { get; set; }
        public int Comments { get; set; }
        public SOwner Owner { get; set; }

        public struct SOwner
        {
            public string Login { get; set; }
            public int Id { get; set; }
            public string Type { get; set; }
            [JsonProperty("avatar_url")] public string AvatarUrl { get; set; }
            [JsonProperty("html_url")] public string HtmlUrl { get; set; }
        }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct Social
    {
        public string Provider { get; set; }
        public string Url { get; set; }
    }
}

public class GithubComponents : InteractionModuleBase<SocketInteractionContext<SocketMessageComponent>>
{
    [ComponentInteraction("getAllGists")]
    public async Task GetAllGistsAsync()
    {
        // unholy syntax
        var component = Context.Interaction.Message.Components
            .FirstOrDefault(x => x.Components.Any(c => c.CustomId == "_getAllGists"))
            ?.Components.FirstOrDefault(x => x.CustomId == "_getAllGists");
        if (component.IsDefault())
        {
            await Context.SendError("Failed to get gists information");
            return;
        }

        var user = (component as ButtonComponent)?.Label;

        var response = await $"{Github.BaseUrl}/users/{user}/gists".GetAsync<Github.Gist[]>(Config.UserAgent);
        if (response.IsDefault())
        {
            await Context.SendError("Failed to get gists information or user has no gists");
            return;
        }

        var builder = new StringBuilder();
        builder.AppendLine($"""
                            User: {user}
                            Number of Gists: {response!.Length}
                            """);
        builder.AppendLine();

        foreach (var gist in response)
        {
            builder.AppendLine($"""
                                Description: {gist.Description.OrElse("No description")}
                                ID: {gist.Id}
                                Comments: {gist.Comments}
                                URL: {gist.HtmlUrl}
                                """);
            builder.AppendLine();
        }

        await Context.Interaction.UpdateAsync(p =>
        {
            // Hate the Discord API for this
            p.Components = new ComponentBuilder()
                .WithButton("Gists", style: ButtonStyle.Link, url: $"https://gist.github.com/{user}")
                .WithButton("User", style: ButtonStyle.Link, url: response[0].Owner.HtmlUrl)
                .WithButton("Latest Gist", style: ButtonStyle.Link, url: response[0].HtmlUrl)
                .AddRow(new ActionRowBuilder()
                    .WithButton("Get all Gists", "getAllGists", ButtonStyle.Secondary, disabled: true))
                .Build();
        });

        await Context.Channel.SendFileAsync(
            new MemoryStream(Encoding.UTF8.GetBytes(builder.ToString())),
            "gists.txt",
            messageReference: Context.MessageReference());
    }
}