// AI Model Fallback System
export const AI_MODELS = {
  PRIMARY: 'meta-llama/llama-3.2-3b-instruct:free',
  FALLBACK_1: 'microsoft/wizardlm-2-8x22b:free',
  FALLBACK_2: 'mistralai/mistral-7b-instruct:free'
};

export const MODEL_PRIORITIES = [
  AI_MODELS.PRIMARY,
  AI_MODELS.FALLBACK_1,
  AI_MODELS.FALLBACK_2
];

class ModelFallbackManager {
  constructor() {
    this.currentModelIndex = 0;
    this.failureCount = new Map();
    this.maxFailures = 3;
    this.cooldownPeriod = 5 * 60 * 1000; // 5 minutes
    this.lastFailureTime = new Map();
  }

  getCurrentModel() {
    const model = MODEL_PRIORITIES[this.currentModelIndex];
    const failures = this.failureCount.get(model) || 0;
    const lastFailure = this.lastFailureTime.get(model) || 0;
    const now = Date.now();

    // If model has failed too many times recently, try next model
    if (failures >= this.maxFailures && (now - lastFailure) < this.cooldownPeriod) {
      this.currentModelIndex = (this.currentModelIndex + 1) % MODEL_PRIORITIES.length;
      return MODEL_PRIORITIES[this.currentModelIndex];
    }

    return model;
  }

  recordFailure(model) {
    const currentFailures = this.failureCount.get(model) || 0;
    this.failureCount.set(model, currentFailures + 1);
    this.lastFailureTime.set(model, Date.now());

    console.warn(`Model ${model} failed (${currentFailures + 1}/${this.maxFailures} failures)`);

    // If this model has failed too many times, switch to next model
    if (currentFailures + 1 >= this.maxFailures) {
      console.log(`Switching away from failing model ${model}`);
      this.currentModelIndex = (this.currentModelIndex + 1) % MODEL_PRIORITIES.length;
    }
  }

  recordSuccess(model) {
    // Reset failure count on success
    if (this.failureCount.has(model)) {
      this.failureCount.delete(model);
      this.lastFailureTime.delete(model);
      console.log(`Model ${model} recovered successfully`);
    }
  }

  reset() {
    this.currentModelIndex = 0;
    this.failureCount.clear();
    this.lastFailureTime.clear();
  }
}

export const modelFallbackManager = new ModelFallbackManager();

// Enhanced AI call function with fallback support
export const callAIWithFallback = async (prompt, options = {}) => {
  const maxRetries = options.maxRetries || 2;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const model = modelFallbackManager.getCurrentModel();

    try {
      console.log(`Attempting AI call with model: ${model} (attempt ${attempt + 1}/${maxRetries + 1})`);

      // Make the API call (this would be your actual API call)
      const response = await fetch('/api/llm/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      // On success, record it and return
      modelFallbackManager.recordSuccess(model);
      return response;

    } catch (error) {
      console.error(`AI call failed with model ${model}:`, error);
      lastError = error;

      // Record failure and try next model
      modelFallbackManager.recordFailure(model);

      if (attempt < maxRetries) {
        console.log(`Retrying with next available model...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
      }
    }
  }

  // All models failed
  throw new Error(`All AI models failed. Last error: ${lastError?.message}`);
};

// Health check for AI models
export const checkModelHealth = async (model) => {
  try {
    const response = await fetch('/api/llm/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Hello',
        model,
        timeout: 5000 // Short timeout for health check
      }),
    });

    return response.ok;
  } catch (error) {
    console.warn(`Health check failed for model ${model}:`, error);
    return false;
  }
};

// Auto-recovery: periodically check and recover failed models
export const startModelHealthMonitoring = () => {
  setInterval(async () => {
    for (const model of MODEL_PRIORITIES) {
      const isHealthy = await checkModelHealth(model);
      if (isHealthy) {
        modelFallbackManager.recordSuccess(model);
      }
    }
  }, 10 * 60 * 1000); // Check every 10 minutes
};