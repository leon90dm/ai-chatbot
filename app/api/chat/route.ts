import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'


export const runtime = 'edge'


const botToken = process.env.CDP_TOKEN; // Replace with your Discord bot token
const SEND_TOKEN = process.env.SEND_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const POT_ID = process.env.POT_ID
const INDEX_GEN_DELAY = process.env.INDEX_GEN_DELAY;

function sleep(ms: number | undefined) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function* indexGenerator(delay: number): AsyncGenerator<number> {
  let i = 0;
  while (true) {
    yield i++;
    await sleep(delay);
  }
}

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

    const responseUrl = `https://discord.com/api/v9/channels/${channelId}/messages?after=${messageId}`;
    const reqHeader = {
      method: 'GET',
      headers: {
        'Authorization': 'Bot ' + botToken,
      },
    }
    let featchTimes = 0
    let streamDone = false;
    let messageContent = '';

    const indexIterator = indexGenerator(INDEX_GEN_DELAY ? parseInt(INDEX_GEN_DELAY) : 100);
    const callFn = async function () {
      while (featchTimes++ < 300) {
        const botResponse = await fetch(responseUrl, reqHeader).then(res => res.json())
        if (botResponse) {
          for (const message of botResponse) {
            if (message.referenced_message && message.referenced_message.id === messageId) {
              console.log(message.id, ":", message.components.length, "->", message.content);
              messageContent = message.content;
              if (message.components && message.components.length > 0) {
                streamDone = true;
                return;
              }
            }
          }
        }
        await sleep(3000);
      }
      streamDone = true;
    }
    callFn();
    // Wraps a generator into a ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        let previous = '';
        for await (const v of indexIterator) {
          if (v <= messageContent.length) {
            const delta = messageContent.slice(previous.length);
            controller.enqueue(delta);
            previous = messageContent;
          }
          if (streamDone) {
            const delta = messageContent.slice(previous.length);
            controller.enqueue(delta);
            controller.close();
            return;
          }
        }
        controller.close();
      },
    });
    return new Response(stream, { status: 200 });
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
  return DisChat(messages)


}
