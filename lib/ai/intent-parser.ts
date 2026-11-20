import {
  extractStellarEntities,
  isValidAccountAddress,
  isValidContractId,
  isValidTxHash,
} from "../stellar/validation";
import { ParsedIntentSchema, type ParsedIntent } from "./schemas";

function resolveRelativeTimeRange(
  text: string,
  now: Date
): { from?: string; to?: string; label?: string } | undefined {
  const lower = text.toLowerCase();
  const end = now.toISOString();

  if (/\btoday\b/.test(lower)) {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: end, label: "today" };
  }

  if (/\byesterday\b/.test(lower)) {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 1);
    start.setUTCHours(0, 0, 0, 0);
    const yEnd = new Date(start);
    yEnd.setUTCHours(23, 59, 59, 999);
    return {
      from: start.toISOString(),
      to: yEnd.toISOString(),
      label: "yesterday",
    };
  }

  const daysMatch = lower.match(/(?:last|past)\s+(\d+)\s+days?/);
  if (daysMatch) {
    const days = Math.min(Number(daysMatch[1]), 90);
    const start = new Date(now.getTime() - days * 86_400_000);
    return {
      from: start.toISOString(),
      to: end,
      label: `during the last ${days} days`,
    };
  }

  if (/\b(?:this\s+week|last\s+week|past\s+week|7\s+days|seven\s+days)\b/.test(lower)) {
    const start = new Date(now.getTime() - 7 * 86_400_000);
    return {
      from: start.toISOString(),
      to: end,
      label: "during the last 7 days",
    };
  }

  if (/\b(?:this\s+month|last\s+month|30\s+days|thirty\s+days)\b/.test(lower)) {
    const start = new Date(now.getTime() - 30 * 86_400_000);
    return {
      from: start.toISOString(),
      to: end,
      label: "during the last 30 days",
    };
  }

  return undefined;
}

function extractAssetCode(text: string): { code: string } | undefined {
  const commonAssets = ["USDC", "XLM", "EURC", "USDT", "AQUA", "yXLM", "BTC", "ETH"];
  for (const code of commonAssets) {
    const regex = new RegExp(`\\b${code}\\b`, "i");
    if (regex.test(text)) {
      return { code: code.toUpperCase() === "YXLM" ? "yXLM" : code.toUpperCase() };
    }
  }
  const customMatch = text.match(/\bonly\s+([A-Za-z0-9]{2,12})\b/i);
  if (customMatch) {
    return { code: customMatch[1].toUpperCase() };
  }
  return undefined;
}

function extractLimit(text: string): number | undefined {
  const lower = text.toLowerCase();
  const wordNumbers: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  const numMatch = lower.match(
    /(?:last|recent|top|show)\s+(\d+)(?!\s+(?:days?|weeks?|months?|hours?)\b)/
  );
  if (numMatch) {
    return Math.min(Math.max(Number(numMatch[1]), 1), 50);
  }

  for (const [word, val] of Object.entries(wordNumbers)) {
    if (
      new RegExp(
        `(?:last|recent|top|show)\\s+${word}\\b(?!\\s+(?:days?|weeks?|months?|hours?)\\b)`
      ).test(lower)
    ) {
      return val;
    }
  }
  return undefined;
}

export function parseIntentDeterministic(
  question: string,
  context?: { address?: string; txHash?: string },
  now = new Date()
): ParsedIntent {
  const entities = extractStellarEntities(question);
  const address =
    entities.addresses[0] ??
    (context?.address && isValidAccountAddress(context.address)
      ? context.address
      : undefined);
  const txHash =
    entities.txHashes[0] ??
    (context?.txHash && isValidTxHash(context.txHash)
      ? context.txHash
      : undefined);
  const contractId = entities.contractIds[0];

  const lower = question.toLowerCase();
  const asset = extractAssetCode(question);
  const timeRange = resolveRelativeTimeRange(question, now);
  const limit = extractLimit(question);

  // Transaction questions
  if (
    txHash &&
    (/\b(?:transaction|tx|succeed|succeeded|fail|failed|happen|happened|explain)\b/.test(
      lower
    ) ||
      !address)
  ) {
    return ParsedIntentSchema.parse({
      intent: "transaction_details",
      txHash,
      direction: "all",
      aggregation: "list",
    });
  }

  // Contract event questions
  if (contractId && isValidContractId(contractId)) {
    return ParsedIntentSchema.parse({
      intent: "contract_events",
      contractId,
      direction: "all",
      aggregation: "list",
      limit: limit ?? 20,
    });
  }

  // Balance questions
  if (
    /\b(?:balance|balances|hold|holds|holding|have|has|how much.*in this wallet)\b/.test(
      lower
    ) &&
    !/\b(?:send|sent|receive|received|transfer|transfers)\b/.test(lower)
  ) {
    if (!address) {
      return ParsedIntentSchema.parse({
        intent: "ambiguous",
        clarification_needed:
          "Please include a Stellar wallet address (starting with G...) to check its balances.",
      });
    }
    return ParsedIntentSchema.parse({
      intent: "account_balances",
      address,
      asset,
      direction: "all",
      aggregation: "list",
    });
  }

  // Account transfer questions
  if (!address) {
    return ParsedIntentSchema.parse({
      intent: "ambiguous",
      clarification_needed:
        "Please include a Stellar wallet address (G...) or transaction hash so I know which account or transaction you are asking about.",
    });
  }

  let direction: "incoming" | "outgoing" | "all" = "all";
  if (/\b(?:receive|received|incoming|sent me|sent to|got)\b/.test(lower)) {
    direction = "incoming";
  } else if (/\b(?:send|sent|outgoing|paid|spent)\b/.test(lower)) {
    direction = "outgoing";
  }

  let aggregation: "sum" | "count" | "list" | "senders" | "failed_count" = "list";
  if (/\b(?:how many.*fail|failed)\b/.test(lower)) {
    aggregation = "failed_count";
  } else if (/\bwho\b/.test(lower)) {
    aggregation = "senders";
  } else if (/\b(?:how much|total)\b/.test(lower)) {
    aggregation = "sum";
  } else if (/\bhow many\b/.test(lower)) {
    aggregation = "count";
  }

  return ParsedIntentSchema.parse({
    intent: "account_transfers",
    address,
    direction,
    asset,
    time_range: timeRange,
    aggregation,
    limit,
  });
}

async function parseWithOpenAI(
  question: string,
  context?: { address?: string; txHash?: string },
  now = new Date()
): Promise<ParsedIntent | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const systemPrompt = [
    "You are an intent parser for a read-only Stellar blockchain explorer.",
    "Extract structured JSON matching this exact schema:",
    JSON.stringify({
      intent: "account_transfers | account_balances | transaction_details | contract_events | ambiguous",
      address: "optional G... Stellar account",
      txHash: "optional 64-char hex transaction hash",
      contractId: "optional C... contract ID",
      direction: "incoming | outgoing | all",
      asset: "{ code: string } optional",
      time_range: "{ from?: ISO8601, to?: ISO8601, label?: string } optional",
      aggregation: "sum | count | list | senders | failed_count",
      limit: "optional integer 1..50",
      clarification_needed: "optional string if ambiguous",
    }),
    `Current UTC time: ${now.toISOString()}.`,
    context?.address ? `Current page wallet address context: ${context.address}` : "",
    context?.txHash ? `Current page transaction hash context: ${context.txHash}` : "",
    "If the user asks about a wallet without providing an address and there is no address context, return intent='ambiguous' with clarification_needed.",
    "Return ONLY valid JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsedJson = JSON.parse(content);
  return ParsedIntentSchema.parse(parsedJson);
}

async function parseWithGemini(
  question: string,
  context?: { address?: string; txHash?: string },
  now = new Date()
): Promise<ParsedIntent | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const prompt = [
    "Extract structured JSON intent for a Stellar blockchain explorer.",
    `Current UTC time: ${now.toISOString()}.`,
    context?.address ? `Wallet context: ${context.address}` : "",
    context?.txHash ? `Tx context: ${context.txHash}` : "",
    `User question: ${question}`,
    "Return JSON with fields: intent (account_transfers|account_balances|transaction_details|contract_events|ambiguous), address?, txHash?, contractId?, direction (incoming|outgoing|all), asset? ({code}), time_range? ({from,to,label}), aggregation (sum|count|list|senders|failed_count), limit?, clarification_needed?.",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  const parsedJson = JSON.parse(text);
  return ParsedIntentSchema.parse(parsedJson);
}

export async function parseNaturalLanguageIntent(
  question: string,
  context?: { address?: string; txHash?: string }
): Promise<ParsedIntent> {
  try {
    const llmResult =
      (await parseWithOpenAI(question, context)) ??
      (await parseWithGemini(question, context));
    if (llmResult) {
      // Ensure context address/hash is preserved if LLM omitted it
      if (!llmResult.address && context?.address && llmResult.intent !== "ambiguous") {
        llmResult.address = context.address;
      }
      if (!llmResult.txHash && context?.txHash && llmResult.intent === "transaction_details") {
        llmResult.txHash = context.txHash;
      }
      return llmResult;
    }
  } catch {
    // Fall back to deterministic parser if LLM call or schema validation fails
  }

  return parseIntentDeterministic(question, context);
}
