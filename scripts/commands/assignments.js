import { SlashCommandBuilder } from "discord.js";
import { fetchAssignments, fetchSubjects } from "../api.js";
import { generateAssignmentsMessage, jstTimestamp } from "../message.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("assignments")
    .setDescription("締切が近い課題を表示します")
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("表示する件数（1〜10、既定は5）")
        .setMinValue(1)
        .setMaxValue(10),
    ),

  async execute(interaction) {
    // Fetching from the API can exceed Discord's 3s reply limit, so acknowledge first.
    await interaction.deferReply();

    const count = interaction.options.getInteger("count") ?? 5;
    const now = new Date();

    try {
      const [assignments, subjects] = await Promise.all([
        fetchAssignments({ count, since: jstTimestamp(now) }),
        // subject names are nice-to-have: fall back to "#id"
        fetchSubjects().catch((error) => {
          console.warn(`⚠️ Cannot get subjects, showing IDs: ${error.message}`);
          return [];
        }),
      ]);

      await interaction.editReply(
        generateAssignmentsMessage(assignments, subjects, now),
      );
    } catch (error) {
      console.error("⚠️ ERROR: Cannot get assignments from API:", error);
      await interaction.editReply("課題データの取得に失敗しました。");
    }
  },
};
