/**
 * Provider-agnostic AI types. Nothing here imports a vendor SDK, so the
 * abstraction can be swapped (Lovable AI Gateway -> OpenAI -> Anthropic -> ...)
 * without touching agents or application code.
 */
export type AiRole = "system" | "user" | "assistant";

export interface AiMessage {
  role: AiRole;
  content: string;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
  /** JSON schema the provider must conform to, when structured output is needed. */
  jsonSchema?: { name: string; schema: Record<string, unknown> };
}

export interface AiCompletionResult {
  text: string;
  model: string;
  provider: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
}

export interface AiProvider {
  readonly id: string;
  readonly defaultModel: string;
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}

export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiUnavailableError";
  }
}

export class AiRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiRateLimitError";
  }
}