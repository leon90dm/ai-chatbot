import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'


export const runtime = 'edge'


const botToken = process.env.CDP_TOKEN; // Replace with your Discord bot token
const SEND_TOKEN = process.env.SEND_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const POT_ID = process.env.POT_ID

// Function to send a message to the Discord bot
async function SendMessage(channelId: string | undefined, message: string) {
  try {
    console.log('sendmessage,', channelId, ' message,', message)
    const response = fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `${SEND_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: message })
    });

    // Wait for the bot's response 
    const messageId = await response.then(res => res.json()).then(data => data.id).catch(console.error);
    console.log('messageId:', messageId);

    let botResponse;
    let i = 200;
    while (i-- > 0) {
      const responseUrl = `https://discord.com/api/v9/channels/${channelId}/messages?after=${messageId}`;
      botResponse = await fetch(responseUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Bot ' + botToken,
        },
      }).then(res => res.json())
      if (botResponse) {
        for (const message of botResponse) {
          if (message.referenced_message && message.referenced_message.id === messageId) {
            //log(message.content);
            console.log(message.id, ":", ":", message.components.length, "->", message.content);
            if (message.components && message.components.length > 0) {
              return message.content;
            }
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

async function DisChat(messages: string | any[]) {
  var message = messages[messages.length - 1].content
  console.log("sending message: ", message)
  return SendMessage(CHANNEL_ID, `<@${POT_ID}> ${message}`)
}

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  // const authResponse = (await auth());
  // console.log("auth response", authResponse)
  // const userId = authResponse?.user.id

  // if (!userId) {
  //   return new Response('Unauthorized', {
  //     status: 401
  //   })
  // }
  debugger
  var discRes = await DisChat(messages)
  console.log("discRes:", discRes)
  const res = new Response(discRes, {
    status: 200
  })
  // console.log('chat response', res)
  return res
  // const res = await openai.chat.completions.create({
  //   model: 'gpt-3.5-turbo',
  //   messages,
  //   temperature: 0.7,
  //   stream: true
  // })
  // const stream = OpenAIStream(res, {
  //   async onCompletion(completion) {
  //     const title = json.messages[0].content.substring(0, 100)
  //     const id = json.id ?? nanoid()
  //     const createdAt = Date.now()
  //     const path = `/chat/${id}`
  //     const payload = {
  //       id,
  //       title,
  //       userId,
  //       createdAt,
  //       path,
  //       messages: [
  //         ...messages,
  //         {
  //           content: completion,
  //           role: 'assistant'
  //         }
  //       ]
  //     }
  //     await kv.hmset(`chat:${id}`, payload)
  //     await kv.zadd(`user:chat:${userId}`, {
  //       score: createdAt,
  //       member: `chat:${id}`
  //     })
  //   }
  // })

  // return new StreamingTextResponse(stream)
}
