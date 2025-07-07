import Anthropic from "@anthropic-ai/sdk";

// For demonstration: simple in-memory cache and rate limit (replace with Redis in production)
const cache = new Map<string, { result: any; expires: number }>();
const rateLimits = new Map<string, { count: number; reset: number }>();

const API_KEY = process.env.ANTHROPIC_API_KEY!;
const anthropic = new Anthropic({ apiKey: API_KEY });

export interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  key_phrases: string[];
  processing_time_ms: number;
  tokens_used: number;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT = 100; // 100 requests per hour per user

function getCacheKey(userId: string, text: string) {
  return `${userId}:${text}`;
}

export async function analyzeSentiment({
  userId,
  text,
}: {
  userId: string;
  text: string;
}): Promise<SentimentResult> {
  const startTime = Date.now();
  const cacheKey = getCacheKey(userId, text);

  // Rate limiting (per user)
  const now = Date.now();
  let rl = rateLimits.get(userId);
  if (!rl || rl.reset < now) {
    rl = { count: 0, reset: now + 60 * 60 * 1000 };
    console.log(`[ClaudeAPI] Rate limit window reset for user ${userId}`);
  }
  if (rl.count >= RATE_LIMIT) {
    console.warn(`[ClaudeAPI] Rate limit exceeded for user ${userId}`);
    throw new Error("Rate limit exceeded");
  }
  rl.count++;
  rateLimits.set(userId, rl);
  console.log(`[ClaudeAPI] Rate limit count for user ${userId}: ${rl.count}/${RATE_LIMIT}`);

  // Caching
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > now) {
    console.log(`[ClaudeAPI] Cache HIT for user ${userId}`);
    return cached.result;
  }
  console.log(`[ClaudeAPI] Cache MISS for user ${userId}`);

  // Prepare prompt
  const prompt = `Analyze the sentiment of the following text and provide a JSON response with the following structure:\n{\n  \"sentiment\": \"positive\" | \"negative\" | \"neutral\",\n  \"confidence\": number between 0 and 1,\n  \"key_phrases\": [\"phrase1\", \"phrase2\", \"phrase3\"]\n}\n\nText to analyze: \"${text}\"\n\nProvide only the JSON response, no additional text.`;

  let message, responseText, analysisResult;
  try {
    console.log(`[ClaudeAPI] Sending request to Claude API for user ${userId}`);
    message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    responseText =
      message.content[0].type === "text" ? message.content[0].text : "";
    try {
      analysisResult = JSON.parse(responseText);
      console.log(`[ClaudeAPI] Successfully parsed JSON response from Claude API for user ${userId}`);
    } catch {
      // Fallback parsing if JSON is malformed
      const sentiment = responseText.toLowerCase().includes("positive")
        ? "positive"
        : responseText.toLowerCase().includes("negative")
        ? "negative"
        : "neutral";
      analysisResult = {
        sentiment,
        confidence: 0.7,
        key_phrases: [],
      };
      console.warn(`[ClaudeAPI] Fallback parsing used for user ${userId}.`);
    }
  } catch (err: any) {
    console.error(`[ClaudeAPI] Claude API error for user ${userId}:`, err?.message || err);
    throw new Error(
      `Claude API error: ${err?.message || "Unknown error"}`
    );
  }

  const processingTime = Date.now() - startTime;
  const tokensUsed = message?.usage?.input_tokens || 0;

  const result: SentimentResult = {
    sentiment: analysisResult.sentiment,
    confidence: analysisResult.confidence,
    key_phrases: analysisResult.key_phrases || [],
    processing_time_ms: processingTime,
    tokens_used: tokensUsed,
  };

  // Store in cache
  cache.set(cacheKey, { result, expires: now + CACHE_TTL });
  console.log(`[ClaudeAPI] Result cached for user ${userId}`);

  return result;
} 