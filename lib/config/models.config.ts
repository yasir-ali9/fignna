// AI Models Configuration
export const modelsConfig = {
  // Default AI model
  defaultModel: "moonshotai/kimi-k2-instruct",

  // Available models
  availableModels: [
    "openai/gpt-5",
    "moonshotai/kimi-k2-instruct",
    "anthropic/claude-sonnet-4-20250514",
    "google/gemini-2.5-pro",
  ],

  // Model display names
  modelDisplayNames: {
    "openai/gpt-5": "GPT-5",
    "moonshotai/kimi-k2-instruct": "Kimi K2 Instruct",
    "anthropic/claude-sonnet-4-20250514": "Sonnet 4",
    "google/gemini-2.5-pro": "Gemini 2.5 Pro",
  },
};

export default modelsConfig;
