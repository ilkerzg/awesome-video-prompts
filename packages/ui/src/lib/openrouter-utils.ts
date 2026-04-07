import { getFalApiKey } from "@workspace/ui/lib/fal-api-utils";

export async function callLlmRouter(params: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}): Promise<string> {
  const falKey = getFalApiKey();
  if (!falKey) {
    throw new Error(
      "Please set your FAL API key first using the key icon in the header.",
    );
  }

  const response = await fetch(
    "https://fal.run/openrouter/router/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
        temperature: params.temperature ?? 0.7,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `LLM Router API error: ${response.status}`,
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No response from LLM");
  }

  return content;
}
