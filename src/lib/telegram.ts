import axios from "axios";
import chats from './telegram_chats.json'
export const sendMessage = (text: string, type: 'audits' | 'sales' | 'general') => {
    let thread_id = chats[type]?.thread_id
    const encodedText = encodeURIComponent(text);

    axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT}&text=${encodedText}&thread_id=${thread_id}`).catch((err) => {
        console.log("[ERROR] Could not send Telegram notification",err)
    })
}