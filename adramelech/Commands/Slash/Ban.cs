using adramelech.Extensions;
using NetCord;
using NetCord.Rest;
using NetCord.Services;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Ban(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("ban", "Ban a member", Contexts = [InteractionContextType.Guild])]
    [RequireUserPermissions<SlashCommandContext>(Permissions.BanUsers)]
    [RequireBotPermissions<SlashCommandContext>(Permissions.BanUsers)]
    public async Task BanAsync(
        [SlashCommandParameter(Name = "user", Description = "The user to ban")]
        GuildUser user,
        [SlashCommandParameter(Name = "reason", Description = "The reason for the ban")]
        string reason = "No reason provided",
        [SlashCommandParameter(Name = "prune_days", Description = "The number of days to prune messages for")]
        int pruneDays = 0,
        [SlashCommandParameter(Name = "ephemeral", Description = "Whether the response should be ephemeral")]
        bool ephemeral = false
    )
    {
        if (user.Id == Context.User.Id)
        {
            await Context.Interaction.SendError("You can't ban yourself");
            return;
        }

        var bot = await Context.Guild!.GetUserAsync(Context.Client.Id);
        if (user.Id == bot.Id)
        {
            await Context.Interaction.SendError("I can't ban myself");
            return;
        }

        if (user.Id == Context.Guild!.OwnerId)
        {
            await Context.Interaction.SendError("I can't ban the owner");
            return;
        }

        if (user.GetRoles(Context.Guild).Max(x => x.Position) >= bot.GetRoles(Context.Guild).Max(x => x.Position))
        {
            await Context.Interaction.SendError("I can't ban a user with a higher role than me");
            return;
        }

        try
        {
            await Context.Guild.BanUserAsync(user.Id, pruneDays, new RestRequestProperties
            {
                AuditLogReason = $"Banned by {Context.User.Username}: {reason}"
            });
        }
        catch
        {
            await Context.Interaction.SendError("Failed to ban user");
            return;
        }

        await RespondAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Member Banned")
                .WithDescription($"User `{user.Username}` has been banned")
                .AddFields(
                    new EmbedFieldProperties()
                        .WithName("> Reason")
                        .WithValue($"`{reason}`"),
                    new EmbedFieldProperties()
                        .WithName("> Author")
                        .WithValue(Context.User.ToString())
                )
            )
            .WithFlags(ephemeral ? MessageFlags.Ephemeral : null)
        ));

        try
        {
            var dmChannel = await user.GetDMChannelAsync();
            await dmChannel.SendMessageAsync(new MessageProperties()
                .WithContent($"You have been banned from {Context.Guild.Name}. Reason: `{reason}`")
            );
        }
        catch
        {
            await Context.Interaction.SendError("Failed to notify the user about the ban");
        }
    }
}