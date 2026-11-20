import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { sendTextMessage, setalreadyPostToday } from "../discord.js";
import { jstDate } from "../message.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("printwm")
    .setDescription("Print tomorrow data force with mention everyone."),

  async execute(interaction) {
    // Fetching from the API can exceed Discord's 3s reply limit, so acknowledge first.
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    await sendTextMessage(jstDate(1), true);
    setalreadyPostToday(true);
    await interaction.editReply("Data printed successfully!");
  },
};
