import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { sendTextMessage } from "../discord.js";
import { jstDate } from "../message.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("print")
    .setDescription("Print tomorrows data force"),

  async execute(interaction) {
    // Fetching from the API can exceed Discord's 3s reply limit, so acknowledge first.
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    await sendTextMessage(jstDate(1));

    await interaction.editReply("Data printed successfully!");
  },
};
