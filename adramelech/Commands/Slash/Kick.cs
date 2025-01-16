using adramelech.Extensions;
using NetCord;
using NetCord.Rest;
using NetCord.Services;
using NetCord.Services.ApplicationCommands;

namespace adramelech.Commands.Slash;

public class Kick(Configuration config) : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("kick", "Kick a member", Contexts = [InteractionContextType.Guild])]
    [RequireUserPermissions<SlashCommandContext>(Permissions.KickUsers)]
    [RequireBotPermissions<SlashCommandContext>(Permissions.KickUsers)]
    public async Task KickAsync(
        [SlashCommandParameter(Name = "user", Description = "The user to kick")]
        GuildUser user,
        [SlashCommandParameter(Name = "reason", Description = "The reason for the kick")]
        string reason = "No reason provided",
        [SlashCommandParameter(Name = "ephemeral", Description = "Whether the response should be ephemeral")]
        bool ephemeral = false
    )
    {
        if (user.Id == Context.User.Id)
        {
            await Context.Interaction.SendError("You can't kick yourself");
            return;
        }

        var bot = await Context.Guild!.GetUserAsync(Context.Client.Id);
        if (user.Id == bot.Id)
        {
            await Context.Interaction.SendError("I can't kick myself");
            return;
        }

        if (user.Id == Context.Guild!.OwnerId)
        {
            await Context.Interaction.SendError("I can't kick the owner");
            return;
        }

        if (user.GetRoles(Context.Guild).Max(x => x.Position) >= bot.GetRoles(Context.Guild).Max(x => x.Position))
        {
            await Context.Interaction.SendError("I can't kick a user with a higher role than me");
            return;
        }

        try
        {
            await Context.Guild.KickUserAsync(user.Id, new RestRequestProperties
            {
                AuditLogReason = $"Kicked by {Context.User.Username}: {reason}"
            });
        }
        catch
        {
            await Context.Interaction.SendError("Failed to kick user");
            return;
        }

        await RespondAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Member Kicked")
                .WithDescription($"User `{user.Username}` has been banned")
                .AddFields(
                    new EmbedFieldProperties()
                        .WithName("> Reason")
                        .WithValue($"`{reason}`"),
                    new EmbedFieldProperties()
                        .WithName("> Author")
                        .WithValue($"`{Context.User.ToString()}`")
                )
            )
            .WithFlags(ephemeral ? MessageFlags.Ephemeral : null)
        ));

        try
        {
            var dmChannel = await user.GetDMChannelAsync();
            await dmChannel.SendMessageAsync(new MessageProperties()
                .WithContent($"You have been kicked from {Context.Guild.Name}. Reason: `{reason}`")
            );
        }
        catch
        {
            await Context.Interaction.SendError("Failed to notify the user about the kick");
        }
    }
}