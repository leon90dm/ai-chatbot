import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const SEND_TOKEN = process.env.SEND_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const CHAT_URL = process.env.CHAT_URL

async function DisChat(messages: string | any[]) {
  var messageToUse = messages.length <= 1 ? messages: messages.slice(messages.length -1)
  console.log("sending message: ", messageToUse)
  const response =await fetch(`${CHAT_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        "channelId": CHANNEL_ID,
        messages: messageToUse,
        "model": "gpt-4-turbo",
        "stream": true 
      })
    });

  return new StreamingTextResponse(OpenAIStream(response));
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
  return DisChat(messages)


}
