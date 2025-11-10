import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import cron from "node-cron";

dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = "1369128482092617838";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

async function sendMessage(text) {
  try {
    if (!client.isReady()) {
      console.warn("Client not ready yet, waiting...");
      await new Promise((resolve) => client.once(Events.ClientReady, resolve));
    }

    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error("Channel not found or not text-based");
      return;
    }

    await channel.send(text);
    console.log(`✅ Message sent: \n ${text}`);
  } catch (err) {
    console.error("❌ Failed to send message:", err);
  }
}

async function main() {
  const now = getJSTDate();

  let tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  console.log(
    `--- ${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${now.getHours()} : ${now.getMinutes()} ---`,
  );

  console.log("🚀 Starting bot...");

  await client.login(DISCORD_TOKEN);
  console.log("🔑 Login successful!");

  await new Promise((resolve) => client.once(Events.ClientReady, resolve));
  console.log(`✅ Logged in as ${client.user.tag}`);

  cron.schedule("15 16 * * 0-4", () => {
    sendTextMessage(tomorrow);
  });
}

function sendTextMessage(_targetDate) {
  const filePath = `./schedules/${_targetDate.getFullYear()}-${String(_targetDate.getMonth() + 1).padStart(2, "0")}-${String(_targetDate.getDate()).padStart(2, "0")}.json`;
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  let message = generateMessage(_targetDate, data);

  sendMessage(message);
}

function getJSTDate() {
  const now = new Date();

  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  return now;
}

function generateMessage(_targetDate, _data) {
  let message = "";

  message = `[${_targetDate.getFullYear()}-${String(_targetDate.getMonth() + 1).padStart(2, "0")}-${String(_targetDate.getDate()).padStart(2, "0")}の予定]\n`;

  for (let i = 1; i <= _data.data.class; i++) {
    const content = _data.text[String(i)] || "";
    message += `${i}限: ${content}\n`;
  }

  return message.trim();
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
