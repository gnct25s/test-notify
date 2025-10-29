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
}

function shouldSendMorning(now) {
    return true; // 一時的に常にtrueに設定
    /*
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = now.getDay();
  
  // 08:00 ~ 09:00 に拡大
  const isCorrectTime = hour === 8;
  
  // 月〜金のみ
  const isValidDay = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  return isCorrectTime && isValidDay;
  */
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
    const now = getJSTDate()
    const dayOfWeek = now.getDay()
    
    // ===== デバッグ出力 =====
  console.log('=== Debug Info ===');
  console.log('Current JST:', now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
  console.log('Hour:', now.getHours());
  console.log('Minute:', now.getMinutes());
    console.log('Date:', now.getDate())
    console.log('Tomorrow', now.getDate() + 1)
  console.log('Day of Week:', now.getDay(), '(0=Sun, 6=Sat)');
  console.log('ISO String:', now.toISOString());
  console.log('==================');
  // ====================

    if (dayOfWeek === 6) {
        console.log("It's Saturday. No messages will be sent.")
        return
    }

    let targetDate;
    let isMorning = shouldSendMorning(now)
    let isEvenig = shouldSendEvening(now)

    if (isMorning) {
        targetDate = new Date(now)
    } else if (isEvenig) {
        targetDate = new Date(now)
        targetDate.setDate(now.getDate() + 1)
    } else {
        console.log("Not the right time to send messages.")
        return
    }
    
    const filePath = `./schedules/${targetDate.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-{String(now.getDate()).padStart(2, '0')}.json`

    if (!fs.existsSync(filePath)) {
        console.log(`No schedule file for ${dateStr}.`)
        return
    }
    
    console.log(filePath)

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

function getJSTDate() {
  // 日本時間の文字列を取得してDateオブジェクト化
  const now = new Date()
  const jst = new Date(now.getTime() + 9*60*60*1000)

  return jst
}

main().catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
})