
// ==============================================================================
// API KEY CONFIGURATION
// ==============================================================================

// Helper to debug missing keys
const getEnvVar = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return "";
};

export const CONFIG = {
  // ---------------------------------------------------------------------------
  // AI PROVIDER SELECTION
  // Options: 'gemini' | 'openai' | 'deepseek'
  // ---------------------------------------------------------------------------
  PROVIDER: 'gemini', 

  // ---------------------------------------------------------------------------
  // GOOGLE GEMINI (Recommended for Multimodal/Images/Video)
  // Get your key here: https://aistudio.google.com/
  // ---------------------------------------------------------------------------
  GEMINI_API_KEY: getEnvVar('GEMINI_API_KEY'),

  // ---------------------------------------------------------------------------
  // OPENAI (GPT-4o)
  // ---------------------------------------------------------------------------
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY'),

  // ---------------------------------------------------------------------------
  // DEEPSEEK (DeepSeek-V3 / R1)
  // ---------------------------------------------------------------------------
  DEEPSEEK_API_KEY: getEnvVar('DEEPSEEK_API_KEY'),
};
