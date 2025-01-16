using adramelech.Extensions;
using NetCord;
using NetCord.Rest;
using NetCord.Services;
using NetCord.Services.ApplicationCommands;
using NetCord.Services.ComponentInteractions;

namespace adramelech.Commands.Slash;

public class Echo : ApplicationCommandModule<SlashCommandContext>
{
    [SlashCommand("echo", "Echoes a message.")]
    [RequireUserPermissions<SlashCommandContext>(Permissions.ManageMessages)]
    [RequireBotPermissions<SlashCommandContext>(Permissions.SendMessages)]
    public async Task EchoAsync()
    {
        await RespondAsync(InteractionCallback.Modal(new ModalProperties("echo_modal", "Echo")
            .AddComponents(
                new TextInputProperties("message", TextInputStyle.Paragraph, "Message")
                    .WithPlaceholder("Enter a message...")
                    .WithRequired()
            )
        ));
    }
}

public class EchoHandler(Configuration config) : ComponentInteractionModule<ModalInteractionContext>
{
    [ComponentInteraction("echo_modal")]
    public async Task ModalAsync()
    {
        var message = Context.Components.OfType<TextInput>().First().Value;

        try
        {
            await Context.Channel.SendMessageAsync(new MessageProperties()
                .WithContent($"{message}\n> {Context.User}")
            );
        }
        catch
        {
            await Context.Interaction.SendError("Failed to send message.");
            return;
        }

        await RespondAsync(InteractionCallback.Message(new InteractionMessageProperties()
            .AddEmbeds(new EmbedProperties()
                .WithColor(config.EmbedColor)
                .WithTitle("Message sent")
            )
            .WithFlags(MessageFlags.Ephemeral)
        ));
    }
}