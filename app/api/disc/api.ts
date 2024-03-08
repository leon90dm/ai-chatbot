import axios from 'axios'; 
import { log } from 'console';

const botToken = process.env.CDP_TOKEN; // Replace with your Discord bot token
const SEND_TOKEN = process.env.SEND_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const POT_ID = process.env.POT_ID


// Function to send a message to the Discord bot
async function SendMessage(channelId: String|undefined, message: String) {
    try {
        console.log('sendmessage,',channelId,' message,', message)
        const response = await axios.post(`https://discord.com/api/v9/channels/${channelId}/messages`, {
            content: message,
        }, {
            headers: {
                'Authorization': SEND_TOKEN,
                'Content-Type': 'application/json',
            },
        });

        // Wait for the bot's response 
        const messageId = response.data.id;
        console.log('messageId:', messageId);

        let botResponse;
        let i = 20;
        while (i-- > 0) {
            const responseUrl = `https://discord.com/api/v9/channels/${channelId}/messages?after=${messageId}`;
            botResponse = await axios.get(responseUrl, {
                headers: {
                    'Authorization': 'Bot ' + botToken,
                },
            });
            for (const message of botResponse.data) {
                if (message.referenced_message && message.referenced_message.id === messageId) {
                    //log(message.content);
                    console.log(message.id,":",":",message.components.length,"->",message.content);
                    if (message.components && message.components.length > 0) {
                        return message.content;
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        console.log("end----")
    } catch (error) {
        console.error(error);
    }
}

export async function DisChat(messages: { content: String; }[]){
    var message = messages[messages.length-1].content
    console.log("sending message: ", message);
    return SendMessage(CHANNEL_ID, `<@${POT_ID}> ${message}`);
}
