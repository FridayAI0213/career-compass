import { getAiProvider } from "./provider.server";
import { PROMPTS, type AgentName } from "./prompts";
import type { AiMessage } from "./types";

export interface AgentRunOptions {
  agent: AgentName;
  userPrompt: string;
  model?: string;
  temperature?: number;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
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

/** Runs a logical agent and returns parsed structured output plus run metadata. */
export async function runAgent<T>(options: AgentRunOptions): Promise<AgentRunResult<T>> {
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

  return {
    data: parseJson<T>(result.text),
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