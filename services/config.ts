
// ==============================================================================
// API KEY CONFIGURATION
// ==============================================================================

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
  // Important: If process.env.API_KEY is not working, paste your key string directly below.
  GEMINI_API_KEY: "AIzaSyCy-lvF9iGZ1SidX2_KsihkLRyB_U8Qp3o", 

  // ---------------------------------------------------------------------------
  // OPENAI (GPT-4o)
  // Get your key here: https://platform.openai.com/
  // ---------------------------------------------------------------------------
  OPENAI_API_KEY: "",

  // ---------------------------------------------------------------------------
  // DEEPSEEK (DeepSeek-V3 / R1)
  // Get your key here: https://platform.deepseek.com/
  // ---------------------------------------------------------------------------
  DEEPSEEK_API_KEY: "",
};
