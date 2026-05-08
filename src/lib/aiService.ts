// ============================================================
// Spritely.AI — Stability AI (SDXL) Inference Service
// ------------------------------------------------------------
// All requests run client-side. The user's API key is stored in
// localStorage and never sent to our server.
// ============================================================

export type Provider = "stability";

export const STABILITY_ENDPOINT =
  "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";

export const BASE_STYLE =
  "Clean 2D game sprite, full body, flat cel-shaded vector art, isolated on white background, high contrast, game-ready.";

export const POSE_PHRASES: Record<string, string> = {
  Front: "standing front view, symmetrical",
  Side: "side profile view, walking pose silhouette",
  Back: "view from behind, showing rear details",
  Attack: "dynamic action pose, mid-combat swing",
};

export interface GenerateParams {
  apiKey: string;
  prompt: string;
  position: string;
}

/** Build a Stability-ready prompt with character "DNA" anchoring. */
export function buildPrompt(characterDNA: string, position: string): string {
  const pose = POSE_PHRASES[position] ?? position;
  return `${BASE_STYLE} ((${characterDNA.trim()})), ${pose}`;
}

const PLACEHOLDER_PALETTE = [
  ["#7c3aed", "#4f46e5"],
  ["#a855f7", "#6366f1"],
  ["#8b5cf6", "#3b82f6"],
  ["#c084fc", "#818cf8"],
];

function makePlaceholder(label: string, seed: number): string {
  const [c1, c2] = PLACEHOLDER_PALETTE[seed % PLACEHOLDER_PALETTE.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${c1}'/>
        <stop offset='100%' stop-color='${c2}'/>
      </linearGradient>
      <pattern id='p' width='32' height='32' patternUnits='userSpaceOnUse'>
        <rect width='32' height='32' fill='url(#g)'/>
        <rect width='16' height='16' fill='rgba(255,255,255,0.06)'/>
        <rect x='16' y='16' width='16' height='16' fill='rgba(0,0,0,0.06)'/>
      </pattern>
    </defs>
    <rect width='512' height='512' fill='#18181b'/>
    <rect x='32' y='32' width='448' height='448' rx='24' fill='url(#p)'/>
    <g fill='rgba(255,255,255,0.95)' font-family='ui-monospace,monospace' text-anchor='middle'>
      <text x='256' y='250' font-size='28' font-weight='700'>SPRITELY.AI</text>
      <text x='256' y='290' font-size='22' opacity='0.85'>${label}</text>
      <text x='256' y='460' font-size='14' opacity='0.6'>placeholder mode · add Stability AI key</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export class GenerationError extends Error {}

/**
 * Test the Stability AI key with a minimal account-info call.
 * Returns true if authorized, throws otherwise.
 */
export async function testStabilityKey(apiKey: string): Promise<boolean> {
  if (!apiKey) throw new GenerationError("No API key provided");
  const res = await fetch("https://api.stability.ai/v1/user/account", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new GenerationError(`Stability returned ${res.status}`);
  return true;
}

/**
 * Generate a single sprite via Stability AI SDXL.
 * Falls back to a branded placeholder if the key is missing or the call fails.
 */
export async function generateSprite(
  params: { apiKey?: string; characterDNA: string; position: string },
  index = 0
): Promise<{ url: string; mocked: boolean; error?: string }> {
  const { apiKey, characterDNA, position } = params;
  const fullPrompt = buildPrompt(characterDNA, position);

  // ---- Mock mode: no API key ------------------------------
  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 600));
    return { url: makePlaceholder(position, index), mocked: true };
  }

  // ---- Live: Stability AI SDXL text-to-image --------------
  try {
    const response = await fetch(STABILITY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [
          { text: fullPrompt, weight: 1 },
          { text: "blurry, low quality, deformed, extra limbs, watermark, text", weight: -1 },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
      }),
    });

    if (!response.ok) {
      throw new GenerationError(`Stability returned ${response.status}`);
    }
    const data = await response.json();
    const b64 = data?.artifacts?.[0]?.base64;
    if (!b64) throw new GenerationError("No image returned");
    return { url: `data:image/png;base64,${b64}`, mocked: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.warn("[Spritely] Stability call failed:", msg);
    return {
      url: makePlaceholder(position, index),
      mocked: true,
      error: msg,
    };
  }
}
