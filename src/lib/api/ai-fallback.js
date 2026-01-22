// AI Model Fallback System - Reserved for future use
// These functions are not currently used but kept for potential future implementation

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