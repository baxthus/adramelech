import {
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
  type APIComponentInMessageActionRow,
  type ChatInputCommandInteraction,
} from 'discord.js';
import ky from 'ky';
import v from 'voca';
import z from 'zod';
import {
  executeCommandFromTree,
  type Command,
  type CommandExecutors,
} from '~/types/command';
import config from '~/config';
import { stripIndents } from 'common-tags';
import { sendError } from '~/utils/sendError';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';

const BASE_URL = 'https://api.github.com';

const repositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  html_url: z.url(),
  description: z.string().nullish(),
  fork: z.boolean(),
  language: z.string().nullish(),
  stargazers_count: z.number(),
  watchers_count: z.number(),
  forks_count: z.number(),
  owner: z.object({
    id: z.number(),
    login: z.string(),
    type: z.string(),
    avatar_url: z.url(),
  }),
  license: z
    .object({
      key: z.string(),
    })
    .nullish(),
});

const licenseSchema = z.object({
  name: z.string(),
  html_url: z.url(),
  permissions: z.array(z.string()),
  conditions: z.array(z.string()),
  limitations: z.array(z.string()),
});

const userSchema = z.object({
  id: z.number(),
  login: z.string(),
  type: z.string(),
  name: z.string().nullish(),
  company: z.string().nullish(),
  blog: z.string().nullish(),
  location: z.string().nullish(),
  bio: z.string().nullish(),
  public_repos: z.number(),
  public_gists: z.number(),
  followers: z.number(),
  following: z.number(),
  avatar_url: z.url(),
  html_url: z.url(),
});

const socialsSchema = z.array(
  z.object({
    provider: z.string().transform((value) => v.titleCase(value)),
    url: z.url(),
  }),
);

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('github')
    .setDescription('Get GitHub information')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('repo')
        .setDescription('Get information about a repository')
        .addStringOption((option) =>
          option
            .setName('user')
            .setDescription('The user or organization name')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('repo')
            .setDescription('The repository name')
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('user')
        .setDescription('Get information about a user')
        .addStringOption((option) =>
          option
            .setName('user')
            .setDescription('The user name')
            .setRequired(true),
        ),
    ),
  uses: ['GitHub API'],
  cooldown: true,
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    await executeCommandFromTree(executors, intr);
  },
};

const executors: CommandExecutors = {
  repo,
  user,
};

async function repo(intr: ChatInputCommandInteraction) {
  const user = intr.options.getString('user', true);
  const repo = intr.options.getString('repo', true);

  const response = await fetchGitHubData(
    `/repos/${user}/${repo}`,
    repositorySchema,
  );
  if (response.isErr()) return await sendError(intr, response.error);
  const data = response.value;

  const container = new ContainerBuilder({
    accent_color: config.EMBED_COLOR,
    components: [
      {
        type: ComponentType.TextDisplay,
        content: '# Repository information',
      },
      {
        type: ComponentType.TextDisplay,
        content: stripIndents`
        **Name:** ${data.name}
        **ID:** ${data.id}
        **Description:** \`${data.description || 'None'}\`
        **Fork:** ${data.fork ? 'Yes' : 'No'}
        **Main Language:** ${data.language}
        **Stars:** ${data.stargazers_count}
        **Watchers:** ${data.watchers_count}
        **Forks:** ${data.forks_count}
        `,
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Link,
            label: 'Repository',
            url: data.html_url,
          },
        ],
      },
      { type: ComponentType.Separator },
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: stripIndents`
            ## Owner
            **Username:** \`${data.owner.login}\`
            **ID:** ${data.owner.id}
            **Type:** ${data.owner.type}
            `,
          },
        ],
        accessory: {
          type: ComponentType.Thumbnail,
          media: {
            url: data.owner.avatar_url,
          },
        },
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Link,
            label: 'GitHub Profile',
            url: `https://github.com/${data.owner.login}`,
          },
        ],
      },
    ],
  });

  if (response.value.license) {
    const licenseResult = await getLicenseInfo(response.value.license.key);
    if (licenseResult.isOk()) {
      container.addSeparatorComponents({ type: ComponentType.Separator });
      container.addTextDisplayComponents({
        type: ComponentType.TextDisplay,
        content: `## License\n${licenseResult.value.content}`,
      });

      if (licenseResult.value.html_url) {
        container.addActionRowComponents({
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Link,
              label: 'License Page',
              url: licenseResult.value.html_url,
            },
          ],
        });
      }
    }
  }

  container.addTextDisplayComponents({
    type: ComponentType.TextDisplay,
    content: '> Powered by GitHub API',
  });

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
  });
}

async function user(intr: ChatInputCommandInteraction) {
  const username = intr.options.getString('user', true);

  const [userResult, socialsResult] = await Promise.all([
    fetchGitHubData(`/users/${username}`, userSchema),
    fetchGitHubData(`/users/${username}/social_accounts`, socialsSchema),
  ]);

  if (userResult.isErr()) return await sendError(intr, userResult.error);
  const user = userResult.value;

  const socials = socialsResult.unwrapOr([]);

  const userActionRow: APIComponentInMessageActionRow[] = [
    {
      type: ComponentType.Button,
      style: ButtonStyle.Link,
      label: 'GitHub Profile',
      url: user.html_url,
    },
  ];
  if (user.blog && !v.isEmpty(user.blog)) {
    const url = user.blog.startsWith('http')
      ? user.blog
      : `http://${user.blog}`;
    userActionRow.push({
      type: ComponentType.Button,
      style: ButtonStyle.Link,
      label: 'Website',
      url,
    });
  }

  const container = new ContainerBuilder({
    accent_color: config.EMBED_COLOR,
    components: [
      {
        type: ComponentType.TextDisplay,
        content: '# User information',
      },
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: stripIndents`
            **Username:** \`${user.login}\`
            **ID:** ${user.id}
            **Type:** ${user.type}
            **Name:** \`${user.name || 'None'}\`
            **Company:** \`${user.company || 'None'}\`
            **Website:** \`${user.blog || 'None'}\`
            **Location:** \`${user.location || 'None'}\`
            **Bio:** \`${user.bio || 'None'}\`
            `,
          },
        ],
        accessory: {
          type: ComponentType.Thumbnail,
          media: {
            url: user.avatar_url,
          },
        },
      },
      {
        type: ComponentType.ActionRow,
        components: userActionRow,
      },
    ],
  });

  if (socials.length > 0) {
    container.addActionRowComponents({
      type: ComponentType.ActionRow,
      components: socials
        .slice(0, 5) // Limit to 5 buttons
        .map((social) => ({
          type: ComponentType.Button,
          style: ButtonStyle.Link,
          label: social.provider === 'Generic' ? 'Social' : social.provider,
          url: social.url,
        })),
    });
  }

  container.addSeparatorComponents({ type: ComponentType.Separator });
  container.addTextDisplayComponents({
    type: ComponentType.TextDisplay,
    content: stripIndents`
    ## Stats
    **Public Repos:** ${user.public_repos}
    **Public Gists:** ${user.public_gists}
    **Followers:** ${user.followers}
    **Following:** ${user.following}
    `,
  });
  container.addTextDisplayComponents({
    type: ComponentType.TextDisplay,
    content: '> Powered by GitHub API',
  });

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
  });
}

const fetchGitHubData = <T>(
  endpoint: string,
  schema: z.ZodType<T>,
): ResultAsync<T, string> =>
  ResultAsync.fromThrowable(
    ky.get(BASE_URL + endpoint, {
      headers: { 'User-Agent': config.USER_AGENT },
    }).json,
    (e) => `Failed to fetch data from GitHub:\n${String(e)}`,
  )().andThen((response) => {
    const parsed = schema.safeParse(response);
    return parsed.success
      ? okAsync(parsed.data)
      : errAsync(parsed.error.message);
  });

const getLicenseInfo = (
  key: string,
): ResultAsync<
  {
    content: string;
    html_url: string;
  },
  string
> => {
  if (key === 'other') return okAsync({ content: 'Other', html_url: '' });
  return fetchGitHubData(`/licenses/${key}`, licenseSchema).map((result) => ({
    content: stripIndents`
      **Name:** ${v.titleCase(result.name)}
      **Permissions:** ${result.permissions.join(', ')}
      **Conditions:** ${result.conditions.join(', ')}
      **Limitations:** ${result.limitations.join(', ')}
      `,
    html_url: result.html_url,
  }));
};
