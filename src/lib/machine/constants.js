import { stepsConfig } from "./stepsConfig.js";

// Auto-generated stepOrder from stepsConfig
export const stepOrder = stepsConfig.map((step) => step.id);

export const initialContext = {
  problem: "",
  solution: "",
  currentStep: "system",
  completedSteps: 0,
  stepName: "System Initialization",
  currentModel: "System",
  currentSection: "Initialization",
  uiProgress: 0,
  uiMessage: "Ready to start the 48-step accelerator process",
  uiStatus: "idle",
  currentPrompt: "",
  llmResponse: "",
  strugglers: "",
  alternatives: "",
  gaps: "",
  persona: "",
  urgency: "",
  evidence: "",
  valueProp: "",
  features: "",
  modelType: "",
  revenue: "",
  pricing: "",
  moat: "",
  risks: "",
};

export const getNextStep = (currentStep) => {
  const index = stepOrder.indexOf(currentStep);
  return stepOrder[index + 1] || "done";
};
