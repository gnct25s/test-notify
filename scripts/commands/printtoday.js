import { SlashCommandBuilder } from "discord.js";
import { sendTextMessage } from "../discord.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("print")
    .setDescription("Print todays data force"),

  async execute(interaction) {
    const now = new Date();

    await sendTextMessage(now);
    await interaction.reply({
      content: "Data printed successfully!",
      ephemeral: true,
    });
  },
};
