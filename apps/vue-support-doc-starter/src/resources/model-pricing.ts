import type { ProviderProtocol } from "@/stores/provider";

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheReadPerMillion?: number;
  cacheWritePerMillion?: number;
}

export interface ModelPricingEntry {
  patterns: RegExp[];
  pricing: ModelPricing;
  protocol?: ProviderProtocol;
}

export const MODEL_PRICING_RULES: ModelPricingEntry[] = [
  // ===== GPT-4o Family =====
  { patterns: [/^gpt-4o(?!-mini)/i], pricing: { inputPerMillion: 2.5, outputPerMillion: 10, cacheReadPerMillion: 1.25 } },
  { patterns: [/^gpt-4o-mini/i], pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6, cacheReadPerMillion: 0.075 } },
  { patterns: [/^gpt-4(?!o)/i], pricing: { inputPerMillion: 30, outputPerMillion: 60 } },
  { patterns: [/^gpt-4\.\d/i], pricing: { inputPerMillion: 10, outputPerMillion: 30 } },
  { patterns: [/^gpt-4\.1/i], pricing: { inputPerMillion: 2, outputPerMillion: 8 } },
  { patterns: [/^gpt-4\.1-mini/i], pricing: { inputPerMillion: 0.4, outputPerMillion: 1.6 } },
  { patterns: [/^gpt-4\.1-nano/i], pricing: { inputPerMillion: 0.1, outputPerMillion: 0.4 } },

  // ===== GPT-5 Family =====
  { patterns: [/^gpt-5/i], pricing: { inputPerMillion: 25, outputPerMillion: 100 } },
  { patterns: [/^o5/i], pricing: { inputPerMillion: 25, outputPerMillion: 100 } },

  // ===== o1/o3/o4 Reasoning =====
  { patterns: [/^o1/i], pricing: { inputPerMillion: 15, outputPerMillion: 60, cacheReadPerMillion: 7.5 } },
  { patterns: [/^o1-mini/i], pricing: { inputPerMillion: 1.1, outputPerMillion: 4.4 } },
  { patterns: [/^o1-preview/i], pricing: { inputPerMillion: 15, outputPerMillion: 60 } },
  { patterns: [/^o3/i], pricing: { inputPerMillion: 10, outputPerMillion: 40 } },
  { patterns: [/^o4/i], pricing: { inputPerMillion: 10, outputPerMillion: 40 } },
  { patterns: [/^o4-mini/i], pricing: { inputPerMillion: 1.1, outputPerMillion: 4.4 } },

  // ===== Claude =====
  { patterns: [/^claude.*haiku/i], pricing: { inputPerMillion: 0.25, outputPerMillion: 1.25, cacheReadPerMillion: 0.03, cacheWritePerMillion: 0.3 } },
  { patterns: [/^claude.*sonnet/i], pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 } },
  { patterns: [/^claude.*opus/i], pricing: { inputPerMillion: 15, outputPerMillion: 75, cacheReadPerMillion: 1.5, cacheWritePerMillion: 18.75 } },
  { patterns: [/^claude/i], pricing: { inputPerMillion: 3, outputPerMillion: 15, cacheReadPerMillion: 0.3, cacheWritePerMillion: 3.75 } },

  // ===== DeepSeek =====
  { patterns: [/^deepseek.*reasoner/i], pricing: { inputPerMillion: 0.55, outputPerMillion: 2.19, cacheReadPerMillion: 0.14 } },
  { patterns: [/^deepseek.*v[34]/i], pricing: { inputPerMillion: 0.27, outputPerMillion: 1.1, cacheReadPerMillion: 0.07 } },
  { patterns: [/^deepseek.*v4.*flash/i], pricing: { inputPerMillion: 0.05, outputPerMillion: 0.3, cacheReadPerMillion: 0.01 } },
  { patterns: [/^deepseek.*v4.*pro/i], pricing: { inputPerMillion: 0.27, outputPerMillion: 1.1 } },
  { patterns: [/^deepseek/i], pricing: { inputPerMillion: 0.27, outputPerMillion: 1.1, cacheReadPerMillion: 0.07 } },

  // ===== Gemini =====
  { patterns: [/^gemini.*2\.5.*pro/i], pricing: { inputPerMillion: 1.25, outputPerMillion: 10, cacheReadPerMillion: 0.03 } },
  { patterns: [/^gemini.*2\.5.*flash/i], pricing: { inputPerMillion: 0.075, outputPerMillion: 0.3, cacheReadPerMillion: 0.01 } },
  { patterns: [/^gemini.*2\.0.*flash/i], pricing: { inputPerMillion: 0.075, outputPerMillion: 0.3 } },
  { patterns: [/^gemini.*2\.0/i], pricing: { inputPerMillion: 0.5, outputPerMillion: 1.5 } },
  { patterns: [/^gemini.*3\.5.*flash/i], pricing: { inputPerMillion: 0.075, outputPerMillion: 0.3 } },
  { patterns: [/^gemini.*3/i], pricing: { inputPerMillion: 1.25, outputPerMillion: 10 } },
  { patterns: [/^gemini/i], pricing: { inputPerMillion: 0.5, outputPerMillion: 1.5 } },

  // ===== Qwen =====
  { patterns: [/^qwen3/i], pricing: { inputPerMillion: 0.5, outputPerMillion: 2 } },
  { patterns: [/^qwen2/i], pricing: { inputPerMillion: 0.5, outputPerMillion: 2 } },
  { patterns: [/^qwq/i], pricing: { inputPerMillion: 0.5, outputPerMillion: 2 } },

  // ===== Grok =====
  { patterns: [/^grok/i], pricing: { inputPerMillion: 2, outputPerMillion: 10 } },

  // ===== Mistral =====
  { patterns: [/^mistral/i], pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 } },
  { patterns: [/^codestral/i], pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 } },

  // ===== Other =====
  { patterns: [/^doubao/i], pricing: { inputPerMillion: 0.3, outputPerMillion: 0.6 } },
  { patterns: [/^kimi/i], pricing: { inputPerMillion: 0.5, outputPerMillion: 2 } },
  { patterns: [/^ministral/i], pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 } },
  { patterns: [/^command/i], pricing: { inputPerMillion: 0.15, outputPerMillion: 0.6 } },
  { patterns: [/^llama/i], pricing: { inputPerMillion: 0.25, outputPerMillion: 1 } },
  { patterns: [/^miMo/i], pricing: { inputPerMillion: 0.5, outputPerMillion: 2 } },

  // ===== Fallback: anything else =====
  { patterns: [/.*/], pricing: { inputPerMillion: 1, outputPerMillion: 4, cacheReadPerMillion: 0.1, cacheWritePerMillion: 0.5 } },
];

export function getModelPricing(modelName: string): ModelPricing {
  for (const rule of MODEL_PRICING_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(modelName)) return rule.pricing;
    }
  }
  return { inputPerMillion: 1, outputPerMillion: 4 };
}
