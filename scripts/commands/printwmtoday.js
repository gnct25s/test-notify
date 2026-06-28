import { SlashCommandBuilder } from "discord.js";
import { sendTextMessage } from "../discord.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("printwm")
    .setDescription("Print todays data force with mention everyone."),

  async execute(interaction) {
    const now = new Date();

    await sendTextMessage(now, true);
    await interaction.reply({
      content: "Data printed successfully!",
      ephemeral: true,
    });
  },
};
