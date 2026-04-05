import { ENV } from "./env";

export type SpeechGenerationParams = {
  text: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  speed?: number;
};

export type SpeechGenerationResult = {
  url: string;
};

const resolveApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/audio/speech`
    : "https://forge.manus.im/v1/audio/speech";

const assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};

export async function generateSpeech(params: SpeechGenerationParams): Promise<SpeechGenerationResult> {
  assertApiKey();

  const { text, voice = "alloy", speed = 1.0 } = params;

  const payload = {
    model: "tts-1",
    input: text,
    voice,
    speed,
  };

  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Speech generation failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  const result = await response.json();
  
  return {
    url: result.url,
  };
}
