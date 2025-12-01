import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import cron from "node-cron";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const OPERATION_USERID = process.env.OPERATION_USERID;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection();

const commandPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandPath)
  .filter((file) => file.endsWith(".js"));

let alreadyPostToday = false;

export function setalreadyPostToday(value) {
  alreadyPostToday = value;
}

async function sendMessage(text, isMention = false, mentionUser = "@everyone") {
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

    const finalMessage = isMention ? `<${mentionUser}>\n${text}` : text;

    await channel.send(finalMessage);
    console.log(`✅ Message sent: \n ${text}`);
  } catch (err) {
    console.error("❌ Failed to send message:", err);
  }
}

async function main() {
  let now = getJSTDate();
  let tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  console.log(
    `--- ${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${now.getHours()} : ${now.getMinutes()} ---`,
  );

  console.log("🚀 Starting bot...");

  const commandsData = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandPath, file);
    const { command } = await import(filePath);
    client.commands.set(command.data.name, command);
    commandsData.push(command.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

  try {
    console.log(`Refreshing ${commandsData.length} commands`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commandsData,
    });

    console.log(`✅ Commands refreshed`);
  } catch (err) {
    console.error("❌ Failed to refresh commands:", err);
  }

  await client.login(DISCORD_TOKEN);
  console.log("🔑 Login successful!");

  await new Promise((resolve) => client.once(Events.ClientReady, resolve));
  console.log(`✅ Logged in as ${client.user.tag}`);

  cron.schedule("15 16 * * 0-4", () => {
    now = new Date();

    tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (!alreadyPostToday) {
      sendTextMessage(tomorrow, true);
    }
  });

  cron.schedule("05 00 * * *", () => {
    alreadyPostToday = false;
  });

  // コマンドが送られてきた際の処理
  client.on(Events.InteractionCreate, async (interaction) => {
    // コマンドでなかった場合は処理せずさよなら。
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    // 一致するコマンドがなかった場合
    if (!command) {
      console.error(
        ` ${interaction.commandName} というコマンドは存在しません。`,
      );
      return;
    }

    try {
      // コマンドを実行
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "コマンドを実行中にエラーが発生しました。",
        ephemeral: true,
      });
    }
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
  });
}

export async function sendTextMessage(_targetDate, isMention = false) {
  const url = `https://raw.githubusercontent.com/gnct25s/test-notify/refs/heads/main/schedules/${_targetDate.getFullYear()}-${String(_targetDate.getMonth() + 1).padStart(2, "0")}-${String(_targetDate.getDate()).padStart(2, "0")}.json`;

  console.log("⬇️ Get Schedule Data from:");
  console.log(` -> ${url}`);

  const res = await fetch(url);
  let data;

  try {
    data = await res.json();
  } catch (error) {
    console.error(`⚠️ ERROR: Cannot get schedule from URL:`);
    console.error(` -> ${error.message}`);

    await sendMessage(
      "予定データの取得に失敗しました。",
      true,
      `@${OPERATION_USERID}`,
    );

    return;
  }
  let message = generateMessage(_targetDate, data);

  await sendMessage(message, isMention);

  return;
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
