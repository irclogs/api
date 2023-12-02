import { Message } from './types';

export type ChangesResponse = {
  results: { doc: Message }[];
  last_seq: string;
};

export async function fetchFeed(
  couchUrl: URL,
  channel: string,
  since: string,
  signal?: AbortSignal,
): Promise<ChangesResponse> {
  const feedUrl = new URL('_changes', couchUrl);
  const query = {
    feed: 'longpoll',
    timeout: '90000',
    include_docs: 'true',
    filter: '_selector',
    since: since,
  };
  feedUrl.search = new URLSearchParams(query).toString();

  const options: RequestInit = {
    signal,
    mode: 'cors',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ selector: { channel: channel } }),
    method: 'POST',
  };
  const response = await fetch(`${feedUrl}`, options);
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }
  return await response.json();
}

/*
 * Experimental Feed using the Server-Sent-Events stream from CouchDB
 */

function parseSseEvent(data: string) {
  const tmp: Record<string, string> = {};
  const lines = data.split(/\n/);
  for (const line of lines) {
    if (line) {
      const [key, value] = line.split(/: /, 2);
      tmp[key] = value;
    }
  }
  return new MessageEvent<string>('message', tmp);
}

function asEventSourceStream() {
  let buffer: string;
  const transformer: Transformer<string, MessageEvent<string>> = {
    start() {
      buffer = '';
    },
    transform(chunk, controller) {
      buffer += chunk;
      while (true) {
        const [event, sep, rest] = buffer.split(/(\n\n)/, 3);
        if (sep !== '\n\n') break;
        buffer = rest;
        controller.enqueue(parseSseEvent(event));
        if (rest === '') break;
      }
    },
  };
  return new TransformStream(transformer);
}

export async function fetchEventStream(url: URL, heartbeat?: number, init?: RequestInit) {
  const heartbeat_ = heartbeat ?? 60000;

  const headers = { ...init?.headers, Accept: 'text/event-stream' };
  const u = new URL(url);
  u.searchParams.set('feed', 'eventsource');
  u.searchParams.set('heartbeat', `${heartbeat_}`);
  u.searchParams.set('since', 'now');

  const controller = new AbortController();
  const signal = controller.signal;

  const resp = await fetch(u, { ...init, headers, signal });
  if (!resp.ok) return;

  const reader = resp.body!.pipeThrough(new TextDecoderStream()).pipeThrough(asEventSourceStream()).getReader();

  while (true) {
    let timeoutID = setTimeout(() => controller.abort(), heartbeat_ * 2);
    const { done, value } = await reader.read();
    clearTimeout(timeoutID);
    if (done) break;
    console.log(value);
  }
  console.log('Stream done');
}
