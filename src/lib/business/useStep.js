import { createSignal } from 'solid-js';
import { steps, stepNames } from './steps.js';
import { _updateProject } from '../database/projects.js';
import { getStepData, updateStepData } from '../ui/stepDataStore.js';
import { extractTemplateData, injectTemplateData } from '../ui/llm-template.js';
import { standardPromptTemplateWithProblem } from './templates.js';
import { logger } from '../core';
import {
  enrichContext,
  enrichContextForStep,
  validateRequiredVariables,
  getMappedValue,
  stepRequiredVariables,
  stepDependencies,
  getMissingVariablesReport
} from './variableMapping.js';

export function createStepHook(projectId, onStepChange) {
  const [stepIndex, setStepIndex] = createSignal(0);
  const [uiState, setUiState] = createSignal('idle');
  const [currentResponse, setCurrentResponse] = createSignal(null);
  const [stepData, setStepData] = createSignal({});
  const [isSaving, setIsSaving] = createSignal(false);
  const [validationWarnings, setValidationWarnings] = createSignal([]);
  const [missingVariables, setMissingVariables] = createSignal([]);

  const currentStep = () => steps[stepIndex()];
  const currentStepId = () => currentStep()?.id || 'unknown';
  const isFirst = () => stepIndex() === 0;
  const isLast = () => stepIndex() >= steps.length - 1;
  const isComplete = async () => {
  const currentState = uiState();
  if (currentState === 'completed') return true;

  // Additional check: verify if current step task is populated
  if (projectId) {
    try {
      const { getTasks } = await import('../database');
      const tasks = await getTasks(projectId);
      const currentStepName = stepName('en'); // Default to English for task matching
      const currentTask = tasks.find(t => t.stepName === currentStepName);
      return !!(currentTask && currentTask.content && currentTask.content.trim().length > 0);
    } catch (e) {
      console.warn('isComplete: Failed to check tasks:', e);
      return currentState === 'completed';
    }
  }
  return false;
};
  const progress = () => Math.round((stepIndex() / steps.length) * 100);
  const stepName = (lang = 'en') => {
    const current = currentStep();
    if (!current) return 'Unknown';

    // Try to get the localized name from stepNames first
    try {
      const localizedStepNames = stepNames(lang);
      const nameFromMap = localizedStepNames[current.id];

      if (nameFromMap) return nameFromMap;
    } catch (e) {
      console.warn('stepName: Error getting localized step names:', e);
      // Fallback to English if there's an error
      const englishStepNames = stepNames('en');
      const nameFromMap = englishStepNames[current.id];
      if (nameFromMap) return nameFromMap;
    }

    // If not found in map, try to get localized name directly from step
    if (typeof current.name === 'object' && current.name !== null) {
      return current.name[lang] || current.name['en'] || 'Unknown';
    }

    // Fallback to original name
    return current.name || 'Unknown';
  };

  const initializeData = async () => {
    try {
      // Add a small delay to ensure the store is properly initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      const data = await getStepData(projectId);
      const dataWithProblem = {
        ...data,
        problem: data.problem || data.originalProblem,
        originalProblem: data.originalProblem
      };
      // Reduced logging for performance
      // Reduced logging for performance
      setStepData(dataWithProblem);
      checkMissingVariables(dataWithProblem);
    } catch (e) {
      console.warn('createStepHook: Failed to load initial data:', e);
    }
  };
  initializeData();

  const checkMissingVariables = (context) => {
    const stepId = currentStepId();
    const requiredVars = stepRequiredVariables[stepId] || [];
    const validation = validateRequiredVariables(context, requiredVars);

    setMissingVariables(validation.issues);
    setValidationWarnings([]);

    if (validation.issues.length > 0) {
      const warningMessages = validation.issues.map(i => `${i.variable}: ${i.message}`);
      setValidationWarnings(warningMessages);
      console.warn('checkMissingVariables: Missing variables for step', stepId, ':', warningMessages);
    }

    return validation;
  };

const persist = async (state = uiState()) => {
    if (!projectId) return;
    const projectIdString = typeof projectId === 'string' ? projectId : String(projectId);
    if (!projectIdString) return;
    const currentStepValue = currentStep();
    const stepIndexValue = Number(stepIndex()) || 0;
    const progressValue = Number(progress()) || 0;
    const stepNameValue = String(stepName('en')) || 'Unknown'; // Use English for persistence
    const uiStateValue = typeof state === 'function' ? String(state()) : String(state);
    const completeValue = Boolean(isComplete());
    const lastValue = Boolean(isLast());
 
    const missing = missingVariables();
    const uiMessageValue = completeValue
      ? 'Completed'
      : lastValue
        ? 'Final Step'
        : `Step ${stepIndexValue + 1} of ${steps.length}${missing.length > 0 ? ' (⚠️ ' + missing.length + ' missing)' : ''}`;
 
    const updates = {
      currentStep: String(currentStepValue?.id || 'system'),
      completedSteps: stepIndexValue,
      stepName: stepNameValue,
      uiProgress: progressValue,
      uiStatus: uiStateValue,
      uiMessage: uiMessageValue,
      validationWarnings: missing.length > 0 ? JSON.stringify(missing) : null
    };
    await _updateProject({ id: projectIdString, updates });
  };

  const resetStep = async () => {
    setUiState('idle');
    setCurrentResponse(null);
    setValidationWarnings([]);
    setMissingVariables([]);
    await persist('idle');
  };

  const resetProject = async () => {
    setStepIndex(0);
    setUiState('idle');
    setCurrentResponse(null);
    setValidationWarnings([]);
    setMissingVariables([]);
    await persist('idle');
  };

  const setInstructions = async (instructions) => {
    await persist('idle');
    return instructions;
  };

  const regenerate = async (callLLM, instructions, lang = 'en') => {
    setUiState('processing');
    setIsSaving(true);
    try {
      let context = stepData();
      console.log('regenerate: Current stepData keys:', Object.keys(context).length);
      console.log('regenerate: problem in context:', context?.problem?.substring(0, 50) + '...');

      const contextWithProblem = {
        ...context,
        problem: context?.problem || context?.originalProblem || instructions?.problem || ''
      };

      const currentStepValue = currentStep();
      const stepId = currentStepId();

      // EXTENDED ENRICHMENT: Enrich context for ALL steps with fallbacks
      const enrichedContext = enrichContextForStep(contextWithProblem, stepId, currentStepValue?.variables);
      console.log('regenerate: Enriched context for step', stepId, '- missing vars now:', enrichedContext._missingVariables);

      logger.debug('regenerate: stepData context keys:', Object.keys(enrichedContext).length);
      logger.debug('regenerate: problem in context:', enrichedContext?.problem?.substring(0, 50) + '...');
      console.log('regenerate: Current stepData keys:', Object.keys(enrichedContext).length);

      const prompt = buildPrompt(currentStep(), enrichedContext, instructions, lang);
      logger.debug('regenerate: Built prompt, length:', prompt?.length);

      const response = await callLLM(prompt);
      setCurrentResponse(response);

      const extracted = extractTemplateData(response);
      console.log('regenerate: Extracted data from response:', Object.keys(extracted).length, 'keys');
      logger.debug('regenerate: Extracted', Object.keys(extracted).length, 'keys from response');

      if (Object.keys(extracted).length > 0) {
        const problem = enrichedContext.problem || enrichedContext.originalProblem || '';
        const validatedExtracted = validateExtractedData(extracted, problem);

        if (Object.keys(validatedExtracted).length === 0) {
          console.warn('regenerate: All extracted data was off-topic, preserving existing data');
        }

        const dataToSave = {
          ...validatedExtracted,
          problem: validatedExtracted.problem || enrichedContext.problem,
          originalProblem: enrichedContext.originalProblem || enrichedContext.problem
        };
        const newData = { ...stepData(), ...dataToSave };
        console.log('regenerate: Merged data to save:', Object.keys(newData).length, 'keys');
        setStepData(newData);
        await updateStepData(projectId, dataToSave);
        logger.debug('regenerate: Saved extracted data to storage');
      } else {
        console.log('regenerate: No data extracted from response, preserving existing stepData');
      }

      // Check for missing variables AFTER regeneration
      checkMissingVariables(stepData());

      setUiState('confirm');
      await persist('confirm');
      logger.debug('regenerate: Step completed, ready for confirmation');
      return response;
    } finally {
      setIsSaving(false);
    }
  };

  const confirm = async (output = currentResponse()) => {
    if (isSaving()) {
      logger.warn('confirm: Blocked - still saving data');
      throw new Error('Please wait while data is being saved');
    }

    const enrichedData = enrichContext(stepData());
    const currentValidation = validateRequiredVariables(enrichedData, stepRequiredVariables[currentStepId()] || []);

    const errors = currentValidation.issues.filter(i => i.severity === 'error');
    if (errors.length > 0) {
      const errorMsg = 'Cannot proceed: Missing required data: ' + errors.map(e => e.variable).join(', ');
      console.error('confirm: Blocked - validation errors:', errors);
      setValidationWarnings(errors.map(e => `${e.variable}: ${e.message}`));
      throw new Error(errorMsg);
    }

    setUiState('idle');
    setCurrentResponse(null);

    if (!isLast()) {
      setStepIndex(s => s + 1);
      await persist('idle');
      await refreshStepData(); // Refresh data and validate for next step
      if (onStepChange) onStepChange();
    } else {
      setUiState('completed');
      await persist('completed');
    }
  };

  const goToStep = async (index) => {
    if (index >= 0 && index < steps.length) {
      setStepIndex(index);
      setUiState('idle');
      setCurrentResponse(null);
      await persist('idle');
      checkMissingVariables(stepData());
    }
  };

  const loadFromProject = async (project) => {
    console.log('loadFromProject: Project data:', {
      currentStep: project?.currentStep,
      completedSteps: project?.completedSteps,
      uiStatus: project?.uiStatus
    });
    
    let stepIndexToSet = 0; // Default to first step
    
    const normalizeIndex = (value) => {
      const numeric = Number.isFinite(value) ? value : Number(value) || 0;
      return Math.min(Math.max(numeric, 0), Math.max(steps.length - 1, 0));
    };

    const taskKey = (value) => (value || '').toString().trim().toLowerCase();

    const resolveTaskForStep = (stepInfo, resolvedName, tasks = []) => {
      const targetName = taskKey(resolvedName);
      const targetId = taskKey(stepInfo.id);

      const match = tasks.find((task) => {
        if (!task) return false;
        const taskNames = [task.stepName, task.step_name, task.title].map(taskKey);
        const taskIdMatch = taskKey(task.step) === targetId;
        const nameMatch = taskNames.some((name) => name.length > 0 && name === targetName);
        return taskIdMatch || nameMatch;
      });

      return match;
    };

    const tasks = project?.tasks || [];

    const findFirstIncompleteStepIndex = () => {
      for (let i = 0; i < steps.length; i++) {
        const stepInfo = steps[i];
        const stepNameValue = stepNames('en')[stepInfo.id] || stepInfo.name || `Step ${i + 1}`;
        const taskForStep = resolveTaskForStep(stepInfo, stepNameValue, tasks);
        if (!taskForStep) {
          return i;
        }
        const contentOk = typeof taskForStep.content === 'string' && taskForStep.content.trim().length > 0;
        const llmOk = typeof taskForStep.llm_response === 'string' && taskForStep.llm_response.trim().length > 0;
        if (!(contentOk && llmOk)) {
          return i;
        }
      }
      return steps.length - 1;
    };

    if (project?.currentStep) {
      const idx = steps.findIndex(s => s.id === project.currentStep);
      console.log('loadFromProject: Found currentStep in project:', project.currentStep, 'mapped to index:', idx);
      if (idx >= 0) {
        stepIndexToSet = normalizeIndex(idx);
      }
    }

    if (project?.completedSteps !== undefined) {
      const completedIndex = normalizeIndex(project.completedSteps);
      stepIndexToSet = Math.max(stepIndexToSet, completedIndex);
    }

    const firstIncomplete = findFirstIncompleteStepIndex();
    stepIndexToSet = Math.min(stepIndexToSet, firstIncomplete);
    console.log('loadFromProject: First incomplete step index:', firstIncomplete, 'final index to set:', stepIndexToSet);
    
    setStepIndex(stepIndexToSet);
    
    if (project?.uiStatus) {
      setUiState(project.uiStatus);
    }
    logger.debug('loadFromProject: Loading step data for projectId:', projectId);
    const data = await getStepData(projectId);
    const dataWithProblem = {
      ...data,
      problem: data.problem || data.originalProblem || project.description,
      originalProblem: data.originalProblem || project.description
    };
console.log('loadFromProject: Loaded step data for project', projectId, ':', Object.keys(dataWithProblem).length, 'keys');
      logger.debug('loadFromProject: Loaded step data keys:', Object.keys(dataWithProblem).length);
      logger.debug('loadFromProject: problem value:', dataWithProblem?.problem?.substring(0, 50) + '...');
    setStepData(dataWithProblem);
    checkMissingVariables(dataWithProblem);
  };

  const refreshStepData = async () => {
    console.log('refreshStepData: Refreshing data for project', projectId);
    const data = await getStepData(projectId);
    const dataWithProblem = {
      ...data,
      problem: data.problem || data.originalProblem,
      originalProblem: data.originalProblem
    };
    console.log('refreshStepData: Fresh data:', Object.keys(dataWithProblem).length, 'keys');
    setStepData(dataWithProblem);
    checkMissingVariables(dataWithProblem);
    return dataWithProblem;
  };

  const getValidationStatus = () => {
    return validateRequiredVariables(stepData(), stepRequiredVariables[currentStepId()] || []);
  };

  const getFullDataReport = () => {
    return getMissingVariablesReport(stepData(), stepRequiredVariables);
  };

return {
    stepIndex,
    setStepIndex,
    uiState,
    setUiState,
    currentResponse,
    setCurrentResponse,
    stepData,
    setStepData,
    isSaving,
    validationWarnings,
    missingVariables,
    currentStep,
    currentStepId,
    isFirst,
    isLast,
    isComplete,
    progress,
    stepName,
    initializeData,
    checkMissingVariables,
    getValidationStatus,
    getFullDataReport,
    resetStep,
    resetProject,
    setInstructions,
    regenerate,
    confirm,
    goToStep,
    loadFromProject,
    persist,
    refreshStepData
  };
}

export function buildPrompt(step, context, instructions, lang = 'en') {
  if (!step) return '';

  const mergedContext = {
    ...context,
    ...instructions,
    problem: instructions?.problem || context?.problem || context?.originalProblem || ''
  };

  // Check for missing variables with enhanced logging
  if (step.variables && step.variables.length > 0) {
    const missingVars = step.variables.filter(v => {
      const value = getMappedValue(mergedContext, v);
      return value === undefined || value === null || value === '';
    });

    if (missingVars.length > 0) {
      logger.warn('buildPrompt: Missing required variables for step', step.id, ':', missingVars);
      console.warn('buildPrompt: Missing variables for step', step.id, ':', missingVars);
      console.warn('buildPrompt: Available context keys:', Object.keys(mergedContext));
      console.warn('buildPrompt: context.problem:', mergedContext.problem?.substring(0, 50) + '...');

      // Log what fallback values will be used
      const fallbacks = missingVars.map(v => {
        const fallback = getMappedValue(mergedContext, v);
        return `${v}: ${fallback ? 'will use fallback' : 'no fallback'}`;
      });
      console.log('buildPrompt: Fallback status:', fallbacks.join(', '));
    }
  }

  const problemStatement = mergedContext.problem || mergedContext.originalProblem || '';

  // Determine which prompt to use based on language
  let promptContent;
  if (step.detailedPrompt && typeof step.detailedPrompt === 'object') {
    // Use bilingual prompt structure
    promptContent = step.detailedPrompt[lang] || step.detailedPrompt['en'] || step.instructions || '';
  } else {
    // Use original prompt structure
    promptContent = step.detailedPrompt || step.instructions || '';
  }

  const baseTemplate = step.promptTemplate(promptContent, step.variables, problemStatement, lang);
  const result = injectTemplateData(baseTemplate, mergedContext);

  if (step.variables?.includes('problem')) {
    console.log('buildPrompt: Step', step.id, 'needs problem, context has:', mergedContext.problem?.substring(0, 50) + '...');
  }

  return result;
}

function validateExtractedData(extracted, problemStatement) {
  if (!problemStatement || problemStatement.trim() === '') {
    console.log('validateExtractedData: No problem statement to validate against');
    return extracted;
  }

  const validated = {};
  const problemLower = problemStatement.toLowerCase();

  const problemWords = problemLower
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  console.log('validateExtractedData: Problem keywords:', problemWords.slice(0, 10));

  for (const [key, value] of Object.entries(extracted)) {
    if (typeof value === 'string' && value.trim() !== '') {
      const valueLower = value.toLowerCase();
      const hasRelevantContent = problemWords.some(word => valueLower.includes(word));

      const genericOffTopicPatterns = [
        'http://', 'https://', 'www.',
        '{{', '}}',
        'null', 'undefined',
      ];

      const hasOffTopicPattern = genericOffTopicPatterns.some(pattern => valueLower.includes(pattern));
      const isLikelyPlaceholder = value.length < 10 && !hasRelevantContent;

      if (!hasRelevantContent && !isLikelyPlaceholder) {
        console.warn(`validateExtractedData: Key "${key}" may be off-topic:`, value.substring(0, 80));
        console.warn(`validateExtractedData: Problem keywords found:`, problemWords.slice(0, 5));
        validated[key] = value;
        validated[key + '_needsReview'] = true;
      } else {
        validated[key] = value;
      }
    }
  }

  const inputKeys = Object.keys(extracted);
  const outputKeys = Object.keys(validated).filter(k => !k.endsWith('_needsReview'));
  console.log(`validateExtractedData: Input: ${inputKeys.length} keys, Output: ${outputKeys.length} keys`);

  return validated;
}
