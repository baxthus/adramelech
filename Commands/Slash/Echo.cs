using Adramelech.Configuration;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;

namespace Adramelech.Commands.Slash;

public class Echo : InteractionModuleBase<SocketInteractionContext<SocketSlashCommand>>
{
    [SlashCommand("echo", "Echoes a message.")]
    [RequireUserPermission(GuildPermission.ManageMessages)]
    [RequireBotPermission(ChannelPermission.SendMessages)]
    public async Task EchoAsync()
    {
        await RespondWithModalAsync<EchoModal>("echo_modal");
    }

    public class EchoModal : IModal
    {
        [InputLabel("Message")]
        [ModalTextInput("message", TextInputStyle.Paragraph, "Enter the message to echo.")]
        public required string Message { get; set; }

        public string Title => "Echo";
    }
}

public class EchoModalResponse : InteractionModuleBase<SocketInteractionContext<SocketModal>>
{
    [ModalInteraction("echo_modal")]
    public async Task ModalAsync(Echo.EchoModal modal)
    {
        var message = modal.Message;

        var final = $"{message}\n\n\\- {Context.User.Mention}";

        await ReplyAsync(final);

        await RespondAsync(
            embed: new EmbedBuilder()
                .WithColor(Config.EmbedColor)
                .WithTitle("Message sent")
                .Build(),
            ephemeral: true);
    }
}