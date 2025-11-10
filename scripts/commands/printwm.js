import { SlashCommandBuilder } from "discord.js";
import { sendTextMessage } from "../discord.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("printwm")
    .setDescription("Print todays data force"),

  async execute(interaction) {
    const now = new Date();
    let tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    await sendTextMessage(tomorrow, true);
    await interaction.reply("Data printed successfully!");
  },
};
