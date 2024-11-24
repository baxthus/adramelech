using adramelech.Configuration;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace adramelech.Commands;

public class Avatar : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("avatar", "Get the avatar of a user")]
    public async Task AvatarAsync([Summary("user", "The user to get the avatar of")] SocketUser? user = null)
    {
        user ??= Context.User;

        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(Config.EmbedColor)
                .WithTitle($"Avatar of {user.Username}")
                .WithImageUrl(user.GetAvatarUrl(size: 2048))
                .Build(),
            components: new ComponentBuilder()
                .WithButton("PNG", style: ButtonStyle.Link, url: user.GetAvatarUrl(ImageFormat.Png, 4096))
                .WithButton("JPEG", style: ButtonStyle.Link, url: user.GetAvatarUrl(ImageFormat.Jpeg, 4096))
                .WithButton("WEBP", style: ButtonStyle.Link, url: user.GetAvatarUrl(ImageFormat.WebP, 4096))
                .WithButton("GIF", style: ButtonStyle.Link, url: user.GetAvatarUrl(ImageFormat.Gif, 4096))
                .Build());
    }
}