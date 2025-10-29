import axios from 'axios'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const LINE_API_URL = 'https://api.line.me/v2/bot/message/push'
const ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN
const GROUP_ID = process.env.LINE_GROUP_ID

const today = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
const dateStr = today.toISOString().split('T')[0];

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function shouldSendMorning(now) {
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = now.getDay();
  
  // 08:00 ~ 09:00 に拡大
  const isCorrectTime = hour === 8;
  
  // 月〜金のみ
  const isValidDay = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  return isCorrectTime && isValidDay;
}

function shouldSendEvening(now) {
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = now.getDay();
  
  // 16:00 ~ 17:00 に拡大
  const isCorrectTime = hour === 16;
  
  // 月〜金、または日曜日
  const isValidDay = (dayOfWeek >= 1 && dayOfWeek <= 5) || dayOfWeek === 0;
  
  return isCorrectTime && isValidDay;
}

async function main() {
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Tokyo"}))
    const dayOfWeek = now.getDay()

    if (dayOfWeek === 6) {
        console.log("It's Saturday. No messages will be sent.")
        return
    }

    let targetDate;
    let isMorning = shouldSendMorning(now)
    let isEvenig = shouldSendEvening(now)

    if (isMorning) {
        targetDate = now;
    } else if (isEvenig) {
        targetDate = new Date(now)
        targetDate.setDate(now.getDate() + 1)
    } else {
        console.log("Not the right time to send messages.")
        return
    }

    const dateStr = formatDate(targetDate)
    const filePath = `./schedules/${dateStr}.json`

    if (!fs.existsSync(filePath)) {
        console.log(`No schedule file for ${dateStr}.`)
        return
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const message = generateMessage(dateStr, data);
    await sendToLine(message)
}

function generateMessage(dateStr, data) {
    let message = `[${dateStr}]\n`;

    for (let i=1; i<=data.data.class; i++) {
        const content = data.text[String(i)] || ""
        message += `${i}限: ${content}\n`
    }

    return message.trim()
}

async function sendToLine(message) {
    try {
        await axios.post (
            LINE_API_URL,
            {
                to: GROUP_ID,
                messages: [
                    {
                        type: 'text',
                        text: message
                   }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ACCESS_TOKEN}`
                }
            }
        )
        console.log('Message sent successfully.')
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message)
    }
}

main().catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
})