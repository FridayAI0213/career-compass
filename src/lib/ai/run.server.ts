import { getAiProvider } from "./provider.server";
import { PROMPTS, type AgentName } from "./prompts";
import type { AiMessage } from "./types";

export interface AgentRunOptions<T = unknown> {
  agent: AgentName;
  userPrompt: string;
  model?: string;
  temperature?: number;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  /**
   * Structural validation for the model response. Model output is never trusted:
   * when a validator is supplied the parsed JSON must satisfy it or the run fails
   * with AiValidationError so callers can fall back to deterministic data.
   */
  validate?: (raw: unknown) => T;
}

export class AiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiValidationError";
  }
}

export interface AgentRunResult<T> {
  data: T;
  meta: {
    agent: string;
    promptVersion: string;
    provider: string;
    model: string;
    inputTokens?: number | undefined;
    outputTokens?: number | undefined;
    latencyMs: number;
  };
}

function parseJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? text).trim();
  const start = candidate.search(/[[{]/);
  const body = start >= 0 ? candidate.slice(start) : candidate;
  return JSON.parse(body) as T;
}

/** Runs a logical agent and returns parsed, validated structured output plus run metadata. */
export async function runAgent<T>(options: AgentRunOptions<T>): Promise<AgentRunResult<T>> {
  const definition = PROMPTS[options.agent];
  const provider = getAiProvider();

  const messages: AiMessage[] = [
    { role: "system", content: definition.system },
    { role: "user", content: options.userPrompt },
  ];

  const result = await provider.complete({
    messages,
    model: options.model,
    temperature: options.temperature,
    jsonSchema: options.jsonSchema,
  });

  let parsed: unknown;
  try {
    parsed = parseJson<unknown>(result.text);
  } catch {
    throw new AiValidationError(`${definition.agent} returned output that is not valid JSON.`);
  }

  let data: T;
  if (options.validate) {
    try {
      data = options.validate(parsed);
    } catch {
      throw new AiValidationError(`${definition.agent} returned output that failed schema validation.`);
    }
  } else {
    data = parsed as T;
  }

  return {
    data,
    meta: {
      agent: definition.agent,
      promptVersion: definition.version,
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
    },
  };
}