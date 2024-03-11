import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { Worker, isMainThread, workerData } from 'worker_threads';


export const runtime = 'edge'
export const maxDuration = 300; // 300 seconds (5min)



const botToken = process.env.CDP_TOKEN; // Replace with your Discord bot token
const SEND_TOKEN = process.env.SEND_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const POT_ID = process.env.POT_ID
const INDEX_GEN_DELAY = process.env.INDEX_GEN_DELAY;
const DISCORD_FETCH_DELAY = process.env.DISCORD_FETCH_DELAY;

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

    const discordFetchDelay = DISCORD_FETCH_DELAY ? parseInt(DISCORD_FETCH_DELAY) : 1000;
    const signalIterator = indexGenerator(INDEX_GEN_DELAY ? parseInt(INDEX_GEN_DELAY) : 100);
    const callFn = async function () {
      let lastMessageLength = -1;
      while (featchTimes++ < 300 && !streamDone) {
        let botResponse = undefined;
        try{
          botResponse = await fetch(responseUrl, reqHeader).then(res => res.json()).catch(console.error);
        }catch(err){
          console.error(err)
        }
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
        await sleep(Math.min(discordFetchDelay*2, 
          Math.max(Math.floor(discordFetchDelay/2), Math.floor((messageContent.length - lastMessageLength)*discordFetchDelay/30))));
        lastMessageLength = messageContent.length;
      }
      streamDone = true;
    }
    callFn();
    // Wraps a generator into a ReadableStream
    const stream = new ReadableStream({
      async pull(controller) {
        let start = 0;
        let end = 0;
        for await (const _ of signalIterator) {
          if(end < messageContent.length){
            end = end + Math.floor((messageContent.length - end)/10);
          }
          if (start < end) {
            const delta = messageContent.slice(start, end);
            console.log("start", start, "end", end, "delta", delta)
            controller.enqueue(delta);
            start = end;
          }
          if (streamDone) {
            const delta = messageContent.slice(start);
            controller.enqueue(delta);
            controller.close();
            console.log("stream done, start", start, "end", end, "delta", delta)
            return;
          }
        }
        controller.close();
        console.log("stream closed")
      },
    });
    return new StreamingTextResponse(stream);
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
