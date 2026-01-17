import { stepsConfig } from "./stepsConfig.js";
import logger from '../logger.js';


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
  uiMessage: "Ready to start the 60-step accelerator process",
  uiStatus: "idle",
  currentPrompt: "",
  llmResponse: "",
  totalCredits: 600,
  consumedCredits: 0,
  totalTime: 18900,
  consumedTime: 0,
  // Chat mode fields
  chatMessages: [],
  chatPausedStep: undefined,
  chatPausedStepName: undefined,
};

// Fields that should be persisted to the database
export const persistableFields = [
  'problem', 'solution', 'currentStep', 'completedSteps', 'stepName',
  'currentModel', 'currentSection', 'uiProgress', 'uiMessage', 'uiStatus',
  'totalCredits', 'consumedCredits', 'totalTime', 'consumedTime',
  'currentPrompt', 'llmResponse'
];

export const getNextStep = (currentStep) => {
  logger.trace('getNextStep: Starting');
  const index = stepOrder.indexOf(currentStep);
  return stepOrder[index + 1] || "done";
};
