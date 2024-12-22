using System.Diagnostics.CodeAnalysis;
using System.Text;
using Adramelech.Common;
using Adramelech.Configuration;
using Adramelech.Extensions;
using Adramelech.Services;
using Adramelech.Utilities;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using Humanizer;

namespace Adramelech.Commands.Slash;

[Group("github", "Get Github information")]
// ReSharper disable once ClassNeverInstantiated.Global
public class Github(Config config, HttpUtils httpUtils, CooldownService cooldownService)
    : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    public const string BaseUrl = "https://api.github.com";

    [SlashCommand("repo", "Get information about a repository")]
    public async Task RepoAsync([Summary("user", "The github user")] string user,
        [Summary("repo", "The repository name")]
        string repo)
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        await DeferAsync();

        var response = await httpUtils.GetAsync<Repository>($"{BaseUrl}/repos/{user}/{repo}", Config.UserAgent);
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
                .WithColor(config.EmbedColor)
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
        Context.SetCooldown(cooldownService);
    }

    [SlashCommand("user", "Get information about a user")]
    public async Task UserAsync([Summary("user", "The github user")] string user)
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        await DeferAsync();

        var response = await httpUtils.GetAsync<User>($"{BaseUrl}/users/{user}", Config.UserAgent);
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
                .WithColor(config.EmbedColor)
                .WithTitle("User Information")
                .WithThumbnailUrl(response.AvatarUrl)
                .AddField(":zap: **Main**", mainField)
                .AddField(":bar_chart: **Stats**", statsField)
                .AddField(":link: **Socials**", socialField)
                .Build(),
            components: components.Build());
        Context.SetCooldown(cooldownService);
    }

    [SlashCommand("gists", "Get information about a gists")]
    public async Task GistsAsync([Summary("user", "The github user")] string user)
    {
        if (await Context.VerifyCooldown(cooldownService)) return;
        await DeferAsync();

        var response = await httpUtils.GetAsync<Gist[]>($"{BaseUrl}/users/{user}/gists", Config.UserAgent);
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
                .WithColor(config.EmbedColor)
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
                    .WithButton(content.Owner.Login, "_getAllGists", ButtonStyle.Secondary, disabled: true))
                .Build());
        Context.SetCooldown(cooldownService);
    }

    private async Task<Result<(List<Social>, string)>> GetSocials(string user)
    {
        var response = await httpUtils.GetAsync<Social[]>($"{BaseUrl}/users/{user}/social_accounts", Config.UserAgent);
        if (response.IsDefault())
            return new Exception("User not found");

        var builder = new StringBuilder();

        foreach (var social in response!)
            builder.AppendLine($"**{social.Provider.Capitalize()}:** {social.Url}");

        return (response.ToList(), builder.ToString().TrimEnd('\n'));
    }

    private async Task<Result<string>> GetLicense(string key)
    {
        var response = await httpUtils.GetAsync<License>($"{BaseUrl}/licenses/{key}", Config.UserAgent);
        if (response.IsDefault())
            return new Exception("License not found");

        return $"""
                **Name:** {response.Name}
                **Permissions:** {response.Permissions.Humanize().Capitalize()}
                **Conditions:** {response.Conditions.Humanize().Capitalize()}
                **Limitations:** {response.Limitations.Humanize().Capitalize()}
                """;
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct Repository
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string HtmlUrl { get; set; }
        public string Description { get; set; }
        public bool Fork { get; set; }
        public string Language { get; set; }
        public int StargazersCount { get; set; }
        public int WatchersCount { get; set; }
        public int ForksCount { get; set; }
        public SOwner Owner { get; set; }

        [SuppressMessage("ReSharper", "MemberHidesStaticFromOuterClass")]
        public SLicense? License { get; set; }

        internal struct SOwner
        {
            public string Login { get; set; }
            public int Id { get; set; }
            public string Type { get; set; }
            public string AvatarUrl { get; set; }
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
        public int PublicRepos { get; set; }
        public int PublicGists { get; set; }
        public int Followers { get; set; }
        public int Following { get; set; }
        public string AvatarUrl { get; set; }
        public string HtmlUrl { get; set; }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Global")]
    public struct Gist
    {
        public string HtmlUrl { get; set; }
        public string Description { get; set; }
        public string Id { get; set; }
        public int Comments { get; set; }
        public SOwner Owner { get; set; }

        public struct SOwner
        {
            public string Login { get; set; }
            public int Id { get; set; }
            public string Type { get; set; }
            public string AvatarUrl { get; set; }
            public string HtmlUrl { get; set; }
        }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct Social
    {
        public string Provider { get; set; }
        public string Url { get; set; }
    }
}

public class GithubComponents(HttpUtils httpUtils)
    : InteractionModuleBase<SocketInteractionContext<SocketMessageComponent>>
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

        var response =
            await httpUtils.GetAsync<Github.Gist[]>($"{Github.BaseUrl}/users/{user}/gists", Config.UserAgent);
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