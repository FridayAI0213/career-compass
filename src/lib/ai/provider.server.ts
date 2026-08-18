import {
  AiRateLimitError,
  AiUnavailableError,
  type AiCompletionRequest,
  type AiCompletionResult,
  type AiProvider,
} from "./types";

/**
 * Lovable AI Gateway provider. Server-only: the API key never leaves the
 * server. Additional providers implement the same `AiProvider` interface and
 * are selected in `getAiProvider()`.
 */
function createGatewayProvider(): AiProvider {
  return {
    id: "lovable-ai-gateway",
    defaultModel: "google/gemini-3.5-flash",
    async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
      const apiKey = process.env["LOVABLE_API_KEY"];
      if (!apiKey) throw new AiUnavailableError("AI gateway is not configured.");

      const model = request.model ?? "google/gemini-3.5-flash";
      const startedAt = Date.now();

      const body: Record<string, unknown> = {
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.2,
      };
      if (request.jsonSchema) {
        body["response_format"] = {
          type: "json_schema",
          json_schema: {
            name: request.jsonSchema.name,
            strict: false,
            schema: request.jsonSchema.schema,
          },
        };
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) throw new AiRateLimitError("AI rate limit reached. Try again shortly.");
      if (response.status === 402) throw new AiUnavailableError("AI credits exhausted for this workspace.");
      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error("AI gateway error", response.status, detail.slice(0, 500));
        throw new AiUnavailableError("The AI service returned an error.");
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      return {
        text: payload.choices?.[0]?.message?.content ?? "",
        model,
        provider: "lovable-ai-gateway",
        inputTokens: payload.usage?.prompt_tokens,
        outputTokens: payload.usage?.completion_tokens,
        latencyMs: Date.now() - startedAt,
      };
    },
  };
}

let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (!cached) cached = createGatewayProvider();
  return cached;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env["LOVABLE_API_KEY"]);
}