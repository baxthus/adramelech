using System.Text;
using NetCord;
using NetCord.Rest;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Extensions;

public static class InteractionExtension
{
    private static async Task SendError(this Interaction interaction, bool deferred, string? description,
        bool toDm = false)
    {
        var embed = new EmbedProperties()
            .WithColor(new Color(255, 0, 0))
            .WithTitle("Error")
            .WithDescription(description ?? "An error occurred while executing the command");

        if (toDm)
        {
            try
            {
                var dm = await interaction.User.GetDMChannelAsync();
                await dm.SendMessageAsync(new MessageProperties().AddEmbeds(embed));
            }
            catch
            {
                // ignored
            }
        }

        if (deferred)
        {
            // Delete the original response because whe need it to be ephemeral
            try
            {
                var msg = await interaction.SendFollowupMessageAsync(
                    new InteractionMessageProperties().WithContent("opps..."));
                await msg.DeleteAsync();
                await interaction.SendFollowupMessageAsync(
                    new InteractionMessageProperties()
                        .AddEmbeds(embed)
                        .WithFlags(MessageFlags.Ephemeral)
                );
            }
            catch
            {
                // ignored
            }
        }
        else
        {
            try
            {
                await interaction.SendResponseAsync(InteractionCallback.Message(new InteractionMessageProperties()
                    .AddEmbeds(embed)
                    .WithFlags(MessageFlags.Ephemeral)
                ));
            }
            catch
            {
                // ignored
            }
        }
    }

    public static async Task SendError(this Interaction interaction, string? description = null,
        bool deferred = false, bool toDm = false)
    {
        await interaction.SendError(deferred, description, toDm);
    }

    public static string GetUniqueCommandName(this SlashCommandContext context)
    {
        var sb = new StringBuilder();
        sb.Append(context.Interaction.Data.Name);
        foreach (var option in context.Interaction.Data.Options)
            GetNameRecursive(sb, option);
        return sb.ToString();
    }

    private static void GetNameRecursive(StringBuilder sb, ApplicationCommandInteractionDataOption option)
    {
        if (option.Type != ApplicationCommandOptionType.SubCommand &&
            option.Type != ApplicationCommandOptionType.SubCommandGroup)
            return;

        sb.Append($"-{option.Name}");
        if (option.Options == null) return;

        foreach (var subOption in option.Options) GetNameRecursive(sb, subOption);
    }
}