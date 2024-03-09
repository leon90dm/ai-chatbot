import {
  AIStream,
  type AIStreamParser,
  type AIStreamCallbacksAndOptions,
} from 'ai';

function parseDiscStream(): AIStreamParser {
  let previous = '';

  return data => {
    const json = JSON.parse(data) as {
      completion: string;
      stop: string | null;
      stop_reason: string | null;
      truncated: boolean;
      log_id: string;
      model: string;
      exception: string | null;
    };

    // Disc's `completion` field is cumulative unlike OpenAI's
    // deltas. In order to compute the delta, we must slice out the text
    // we previously received.
    const text = json.completion;
    const delta = text.slice(previous.length);
    previous = text;

    return delta;
  };
}

export function DiscStream(
  res: Response,
  cb?: AIStreamCallbacksAndOptions,
): ReadableStream {
  return AIStream(res, parseDiscStream(), cb);
}