using System.Diagnostics.CodeAnalysis;
using System.Text;
using adramelech.Commands.Preconditions;
using adramelech.Common;
using adramelech.Extensions;
using adramelech.Utilities;
using Humanizer;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

[SlashCommand("github", "Get Github information")]
[RequireCooldown]
public class Github(Configuration config, HttpUtils httpUtils) : ApplicationCommandModule<SlashCommandContext>
{
    private const string BaseUrl = "https://api.github.com";

    [SubSlashCommand("repo", "Get information about a repository")]
    public async Task RepoAsync(
        [SlashCommandParameter(Name = "user", Description = "The user or organization that owns the repository")]
        string user,
        [SlashCommandParameter(Name = "repo", Description = "The repository name")]
        string repo
    )
    {
        await RespondAsync(InteractionCallback.DeferredMessage());

        var response = await httpUtils.GetAsync<Repository>($"{BaseUrl}/repos/{user}/{repo}", new HttpOptions
        {
            UserAgent = config.UserAgent
        });
        if (response.IsDefault())
        {
            await Context.Interaction.SendError("Failed to get repository information", true);
            return;
        }

        var mainField = $"""
                         **Name:** {response.Name}
                         **ID:** {response.Id}
                         **Description:** {response.Description.OrElse("No Description")}
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

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Repository Information")
                .WithThumbnail(new EmbedThumbnailProperties(response.Owner.AvatarUrl))
                .AddFields(
                    new EmbedFieldProperties()
                        .WithName("> :zap: Main")
                        .WithValue(mainField),
                    new EmbedFieldProperties()
                        .WithName("> :bust_in_silhouette: Owner")
                        .WithValue(ownerField),
                    new EmbedFieldProperties()
                        .WithName("> :scroll: License")
                        .WithValue(licenseField)
                )
            )
            .AddComponents(new ActionRowProperties()
                .AddButtons(
                    new LinkButtonProperties(response.HtmlUrl, "Repository"),
                    new LinkButtonProperties($"https://github.com/{response.Owner.Login}", "Owner")
                )
            )
        );
    }

    [SubSlashCommand("user", "Get information about a user")]
    public async Task UserAsync(
        [SlashCommandParameter(Name = "user", Description = "The user to get information about")]
        string user
    )
    {
        await RespondAsync(InteractionCallback.DeferredMessage());

        var response = await httpUtils.GetAsync<User>($"{BaseUrl}/users/{user}", new HttpOptions
        {
            UserAgent = config.UserAgent
        });
        if (response.IsDefault())
        {
            await Context.Interaction.SendError("Failed to get user information", true);
            return;
        }

        var rawSocials = await GetSocials(user);
        if (rawSocials.IsFailure)
        {
            await Context.Interaction.SendError("Failed to get social accounts", true);
            return;
        }

        var (socials, socialField) = rawSocials.Value;

        var mainField = $"""
                         **Username:** {response.Login}
                         **ID:** {response.Id}
                         **Type:** {response.Type}
                         **Name:** {response.Name.OrElse("N/A")}
                         **Company:** {response.Company.OrElse("N/A")}
                         **Website:** {response.Blog.OrElse("N/A")}
                         **Location:** {response.Location.OrElse("N/A")}
                         **Bio:** {response.Bio.OrElse("N/A")}
                         """;
        var statsField = $"""
                          **Public Repos:** {response.PublicRepos}
                          **Public Gists:** {response.PublicGists}
                          **Followers:** {response.Followers}
                          **Following:** {response.Following}
                          """;

        var components = new ActionRowProperties();
        components.AddButtons(new LinkButtonProperties(response.HtmlUrl, "Profile"));
        if (!string.IsNullOrWhiteSpace(response.Blog))
            components.AddButtons(new LinkButtonProperties($"https://{response.Blog}", "Website"));
        socials.ForEach(social =>
            components.AddButtons(new LinkButtonProperties(social.Url, social.Provider.Transform(To.SentenceCase))));

        await FollowupAsync(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("User Information")
                .WithThumbnail(new EmbedThumbnailProperties(response.AvatarUrl))
                .AddFields(
                    new EmbedFieldProperties()
                        .WithName("> :zap: Main")
                        .WithValue(mainField),
                    new EmbedFieldProperties()
                        .WithName("> :bar_chart: Stats")
                        .WithValue(statsField),
                    new EmbedFieldProperties()
                        .WithName("> :link: Socials")
                        .WithValue(socialField)
                )
            )
            .AddComponents(components)
        );
    }

    private async Task<Result<string>> GetLicense(string key)
    {
        var response = await httpUtils.GetAsync<License>($"{BaseUrl}/licenses/{key}", new HttpOptions
        {
            UserAgent = config.UserAgent
        });
        if (response.IsDefault())
            return new Exception("Failed to get license information");

        return $"""
                **Name:** {response.Name}
                **Permissions:** {response.Permissions.Humanize().Transform(To.SentenceCase)}
                **Conditions:** {response.Conditions.Humanize().Transform(To.SentenceCase)}
                **Limitations:** {response.Limitations.Humanize().Transform(To.SentenceCase)}
                """;
    }

    private async Task<Result<(List<Social>, string)>> GetSocials(string user)
    {
        var response = await httpUtils.GetAsync<Social[]>($"{BaseUrl}/users/{user}/social_accounts", new HttpOptions
        {
            UserAgent = config.UserAgent
        });
        if (response.IsDefault())
            return new Exception("Failed to get social accounts");

        var builder = new StringBuilder();
        foreach (var social in response!)
            builder.AppendLine($"**{social.Provider.Transform(To.SentenceCase)}:** {social.Url}");

        return (response.ToList(), builder.ToString().TrimEnd('\n'));
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct Repository
    {
        public int Id { get; init; }
        public string Name { get; init; }
        public string HtmlUrl { get; init; }
        public string Description { get; init; }
        public bool Fork { get; init; }
        public string Language { get; init; }
        public int StargazersCount { get; init; }
        public int WatchersCount { get; init; }
        public int ForksCount { get; init; }
        public OwnerType Owner { get; init; }

        // ReSharper disable once MemberHidesStaticFromOuterClass
        public LicenseType? License { get; init; }

        internal struct OwnerType
        {
            public string Login { get; init; }
            public int Id { get; init; }
            public string Type { get; init; }
            public string AvatarUrl { get; init; }
        }

        // ReSharper disable once MemberCanBePrivate.Local (it's wrong lol)
        internal struct LicenseType
        {
            public string Key { get; init; }
        }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct License
    {
        public string Name { get; init; }
        public string[] Permissions { get; init; }
        public string[] Conditions { get; init; }
        public string[] Limitations { get; init; }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct User
    {
        public string Login { get; init; }
        public int Id { get; init; }
        public string Type { get; init; }
        public string? Name { get; init; }
        public string? Company { get; init; }
        public string? Blog { get; init; }
        public string? Location { get; init; }
        public string? Bio { get; init; }
        public int PublicRepos { get; init; }
        public int PublicGists { get; init; }
        public int Followers { get; init; }
        public int Following { get; init; }
        public string AvatarUrl { get; init; }
        public string HtmlUrl { get; init; }
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local")]
    private struct Social
    {
        public string Provider { get; init; }
        public string Url { get; init; }
    }
}