// Edge Function "chat": a secure proxy between the Cornell Notes app and the
// Claude API. The Anthropic key only lives in the Supabase secret
// ANTHROPIC_API_KEY — never in the browser, never in the repo.
//
// Request (POST, JSON):
//   headers: x-access-code: <ACCESS_CODE>
//            Authorization: Bearer <the logged-in user's Supabase access token>
//   body:    { "messages": [{ "role": "user" | "assistant", "content": "..." }, ...] }
//
// Response: Server-Sent Events (text/event-stream)
//   event: meta  data: {"remaining": 29}          (messages left today)
//   event: text  data: {"text": "a piece of the answer"}   (repeated)
//   event: done  data: {"stop_reason": "end_turn"}
//   event: error data: {"error": "..."}           (if Claude fails mid-way)

import Anthropic from "npm:@anthropic-ai/sdk@1.9.0";
import { createClient } from "npm:@supabase/supabase-js@2.119.0";

const ALLOWED_ORIGIN = "https://artcodingclaude.github.io";
const MODEL = "claude-haiku-5-5";
const MAX_TOKENS = 1000;
const MAX_HISTORY = 10; // only the last 10 messages are sent to Claude
const DAILY_LIMIT = 30; // messages per person per day
const MAX_MESSAGE_CHARS = 8000; // guard against huge pastes
const SYSTEM_PROMPT =
  "You are a study assistant inside a Cornell Notes app. " +
  "Answer clearly and concisely, in the language the student writes in.";

const ACCESS_CODE = Deno.env.get("ACCESS_CODE") ?? "";
const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-access-code, content-type, apikey, x-client-info",
  "Access-Control-Expose-Headers": "x-remaining-messages",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

function json(status: number, body: unknown, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });
}

// Compares two strings in constant time so the access code can't be guessed
// character by character from response timings.
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

// Checks the body and keeps only the last MAX_HISTORY messages, starting with
// a user message (the API requires that). Returns null if the body is invalid.
function parseMessages(body: unknown): Anthropic.MessageParam[] | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const messages: Anthropic.MessageParam[] = [];
  for (const m of raw) {
    if (typeof m !== "object" || m === null) return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.trim() === "") return null;
    if (content.length > MAX_MESSAGE_CHARS) return null;
    messages.push({ role, content });
  }

  const recent = messages.slice(-MAX_HISTORY);
  while (recent.length > 0 && recent[0].role !== "user") recent.shift();
  if (recent.length === 0 || recent[recent.length - 1].role !== "user") return null;
  return recent;
}

Deno.serve(async (req) => {
  // 1. CORS: only the GitHub Pages site may call this from a browser.
  const origin = req.headers.get("Origin");
  if (origin !== null && origin !== ALLOWED_ORIGIN) {
    return new Response("Forbidden origin", { status: 403 });
  }
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  // 2. Access code.
  const code = req.headers.get("x-access-code") ?? "";
  if (ACCESS_CODE === "" || !safeEqual(code, ACCESS_CODE)) {
    return json(401, { error: "Invalid access code" });
  }

  // 3. Who is this? The user's Supabase login token gives us their user_id.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (token === "") {
    return json(401, { error: "Not logged in" });
  }
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return json(401, { error: "Not logged in" });
  }
  const userId = userData.user.id;

  // 4. Validate the conversation before counting anything.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Body must be JSON" });
  }
  const messages = parseMessages(body);
  if (messages === null) {
    return json(400, {
      error:
        "Body must be { messages: [{ role, content }] } ending with a user message",
    });
  }

  // 5. Daily limit: counts this message, or refuses if already at 30.
  const { data: remaining, error: usageError } = await supabase.rpc(
    "consume_message",
    { p_user_id: userId, p_limit: DAILY_LIMIT },
  );
  if (usageError || typeof remaining !== "number") {
    console.error("usage check failed", usageError);
    return json(500, { error: "Could not check the daily limit" });
  }
  if (remaining < 0) {
    return json(
      429,
      { error: `Daily limit of ${DAILY_LIMIT} messages reached`, remaining: 0 },
      { "x-remaining-messages": "0" },
    );
  }

  // 6. Ask Claude and stream the answer back as Server-Sent Events.
  const encoder = new TextEncoder();
  const sse = (event: string, data: unknown) =>
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  const claudeStream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: "low" },
    system: SYSTEM_PROMPT,
    messages,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sse("meta", { remaining }));
      try {
        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(sse("text", { text: event.delta.text }));
          }
        }
        const final = await claudeStream.finalMessage();
        controller.enqueue(sse("done", { stop_reason: final.stop_reason }));
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) {
          console.error("Anthropic rate limit", err.message);
          controller.enqueue(sse("error", { error: "Claude is busy, try again in a moment" }));
        } else if (err instanceof Anthropic.APIError) {
          console.error(`Anthropic API error ${err.status}`, err.message);
          controller.enqueue(sse("error", { error: "Claude returned an error" }));
        } else {
          console.error("stream failed", err);
          controller.enqueue(sse("error", { error: "Connection to Claude failed" }));
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      // The browser closed the tab or stopped reading: stop paying for tokens.
      claudeStream.abort();
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "x-remaining-messages": String(remaining),
    },
  });
});
