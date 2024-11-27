using Adramelech.Configuration;
using Discord;

namespace Adramelech.Commands.Shared;

public static class Avatar
{
    public static (Embed, MessageComponent) Execute(IUser user)
    {
        return (
            new EmbedBuilder()
                .WithColor(Config.EmbedColor)
                .WithTitle($"Avatar of {user.Username}")
                .WithImageUrl(user.GetAvatarUrl(size: 2048))
                .Build(),
            new ComponentBuilder()
                .WithButton("PNG", style: ButtonStyle.Link, url: user.GetAvatarUrl(ImageFormat.Png, 4096))
                .WithButton("JPEG", style: ButtonStyle.Link, url: user.GetAvatarUrl(ImageFormat.Jpeg, 4096))
                .WithButton("WEBP", style: ButtonStyle.Link, url: user.GetAvatarUrl(ImageFormat.WebP, 4096))
                .WithButton("GIF", style: ButtonStyle.Link, url: user.GetAvatarUrl(ImageFormat.Gif, 4096))
                .Build()
        );
    }
}