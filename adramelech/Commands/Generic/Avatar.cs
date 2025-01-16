using NetCord;
using NetCord.Rest;
using NetCord.Services;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Generic;

public class AvatarSlashCommand(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("avatar", "Get the avatar of a user")]
    public async Task AvatarAsync(
        [SlashCommandParameter(Name = "user", Description = "The user to get the avatar of")] User? user = null)
    {
        user ??= Context.User;

        await new AvatarHelper(config).Execute(Context, user);
    }
}

public class AvatarUserCommand(Configuration config) : ApplicationCommandModule<UserCommandContext>
{
    [UserCommand("Avatar")]
    public async Task AvatarAsync(User user)
    {
        await new AvatarHelper(config).Execute(Context, user);
    }
}

internal class AvatarHelper(Configuration config)
{
    public Task Execute(IInteractionContext context, User user)
    {
        return context.Interaction.SendResponseAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle($"Avatar of {user.Username}")
                .WithImage(new EmbedImageProperties(user.GetAvatarUrl()?.ToString(1024)))
            )
            .AddComponents(new ActionRowProperties()
                .AddButtons(
                    new LinkButtonProperties(user.GetAvatarUrl(ImageFormat.Png)?.ToString(4096) ?? "", "PNG"),
                    new LinkButtonProperties(user.GetAvatarUrl(ImageFormat.Jpeg)?.ToString(4096) ?? "", "JPEG"),
                    new LinkButtonProperties(user.GetAvatarUrl(ImageFormat.WebP)?.ToString(4096) ?? "", "WEBP"),
                    new LinkButtonProperties(user.GetAvatarUrl(ImageFormat.Gif)?.ToString() ?? "", "GIF")
                )
            )
        ));
    }
}