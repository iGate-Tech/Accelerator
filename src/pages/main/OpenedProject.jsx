import {
  createSignal,
  createResource,
  onMount,
  onCleanup,
  createEffect,
  Show,
  createMemo,
  batch,
} from 'solid-js';
import { useParams } from '@solidjs/router';
import {
  steps,
  stepNames,
  buildPrompt,
  createStepHook,
} from '@lib/business.js';
import { logger } from '@lib/core';
import { LoadingOverlay, AgentInterface, ResponseSection } from '@components';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import {
  getTasks,
  addTask,
  clearAllTasks,
  updateTask,
  deleteTask,
  addProject,
  updateProject,
  getProjects,
  updateEntity,
} from '@lib/database';
import { useUser } from '@context/UserContext';
import { toastManager } from '@lib/ui/feedback';
import { useActivityLogger } from '@lib/business.js';
import { extractTemplateData } from '@lib/ui/llm-template.js';
import { normalizeLLMResponse } from '@lib/ui/response-normalizer.js';
import { updateStepData, getStepData } from '@lib/ui/stepDataStore.js';
import { useContext } from 'solid-js';
import { LangContext } from '@context/LangContext';
import { translations } from '@assets/translations/translations-index.js';
import {
  projectsStore,
  setProjectsStore,
  clearPendingProjectId,
} from '@stores/projectsStore';

const getStepName = task => {
  return task.step_name || 'Unknown Step';
};

const OpenedProject = props => {
  const { lang } = useContext(LangContext);
  const { user } = useUser();
  const activityLogger = useActivityLogger();
  const params = useParams();

  // Set document title
  useDocumentTitle('Project');

  const [currentLang, setCurrentLang] = createSignal(lang());
  const t = createMemo(() => translations[currentLang()]);

  createEffect(() => {
    setCurrentLang(lang());
  });

  // Get project ID from URL parameter or store
  const [currentProjectId, setCurrentProjectId] = createSignal(
    params.id || projectsStore.currentProjectId
  );
  const [projectName, setProjectName] = createSignal('');

  // Update the currentProjectId when the store changes or URL parameter changes
  createEffect(() => {
    if (params.id) {
      // If there's an ID in the URL, use it
      setCurrentProjectId(params.id);
      // Also update the store to keep it in sync
      setProjectsStore('currentProjectId', params.id);
    } else if (projectsStore.currentProjectId) {
      // Otherwise, use the store value
      setCurrentProjectId(projectsStore.currentProjectId);
    }
  });

  // Debug wrapper for setCurrentProjectId - ensures we store only the ID string
  const _setCurrentProjectId = value => {
    let idValue = value;
    if (typeof value === 'object' && value !== null && value.id) {
      idValue = value.id;
    }
    if (idValue !== null && typeof idValue !== 'string') {
      return;
    }
    setCurrentProjectId(idValue);
    setProjectsStore('currentProjectId', idValue);
    return idValue;
  };

  const [prompt, setPrompt] = createSignal('');
  const [startPressed, setStartPressed] = createSignal(false);

  const [tasksList, setTasksList] = createSignal([]);
  const [editingTaskId, setEditingTaskId] = createSignal(null);
  const [editContent, setEditContent] = createSignal('');
  const [activeCardId, setActiveCardId] = createSignal(null);
  const [expandedTaskId, setExpandedTaskId] = createSignal(null);
  const [loading, setLoading] = createSignal(false);

  const [showProjectModal, setShowProjectModal] = createSignal(false);
  const [switchingProject, setSwitchingProject] = createSignal(false);
  const [selectedTaskId, setSelectedTaskId] = createSignal(null);
  const [projectData, setProjectData] = createSignal(null);
  const [streamingTaskId, setStreamingTaskId] = createSignal(null);
  const [instructPrompt, setInstructPrompt] = createSignal('');

  // Helper function to check if content is placeholder/empty
  const isPlaceholderContent = content => {
    if (!content) return true;

    // Common placeholder indicators
    const lowerContent = content.toLowerCase();
    return (
      lowerContent.includes('generating') ||
      lowerContent.includes('loading') ||
      lowerContent.includes('waiting') ||
      lowerContent.includes('no response') ||
      lowerContent.includes('no content') ||
      lowerContent.includes('empty') ||
      lowerContent.includes('placeholder') ||
      lowerContent.includes('draft') ||
      content.trim().length < 20 || // Very short content
      /^[\.\s\-\—_=]+$/.test(content.trim()) || // Just punctuation/spaces
      /^loading[\.\s\w\d]*$/.test(lowerContent) // Starts with loading
    );
  };

  // Helper function to determine which tasks remain to be completed
  const getRemainingTasks = projectTasks => {
    // Create a map of completed step IDs/names
    const completedSteps = new Set();

    for (const task of projectTasks) {
      // Check if task has meaningful content (considered completed)
      // A task is considered complete if it has substantial, non-placeholder content
      const content = task.content?.trim() || '';
      const llmResponse = task.llm_response?.trim() || '';

      // Check if content is substantial and not just placeholder text
      const hasValidContent =
        content.length > 20 && !isPlaceholderContent(content);
      const hasValidLlmResponse =
        llmResponse.length > 20 && !isPlaceholderContent(llmResponse);

      const isCompleted = hasValidContent || hasValidLlmResponse;

      if (isCompleted) {
        // Add all possible identifiers for this task to the completed set
        if (task.step) completedSteps.add(task.step.toLowerCase());
        if (task.step_name) completedSteps.add(task.step_name.toLowerCase());
        if (task.stepName) completedSteps.add(task.stepName.toLowerCase());
        if (task.title) completedSteps.add(task.title.toLowerCase());

        console.log(
          `Task marked as completed: ${task.title || task.stepName || task.step || 'Unknown'} - Content length: ${content.length}, LLM response length: ${llmResponse.length}`
        );
      } else {
        console.log(
          `Task marked as incomplete: ${task.title || task.stepName || task.step || 'Unknown'} - Content length: ${content.length}, LLM response length: ${llmResponse.length}`
        );
      }
    }

    // Find steps that are not completed yet
    const remainingSteps = [];
    console.log(
      `Total steps to check: ${steps.length}, Completed steps set:`,
      completedSteps
    );

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepId = step.id.toLowerCase();
      const stepNameEn = (
        stepNames('en')[step.id] ||
        step.name ||
        ''
      ).toLowerCase();

      // Check if this step has been completed by looking for any of its identifiers in completedSteps
      // We check multiple possible identifiers to ensure proper matching
      const isStepCompleted =
        completedSteps.has(stepId) ||
        completedSteps.has(stepNameEn) ||
        completedSteps.has(step.name?.toLowerCase()) ||
        completedSteps.has(stepNames('ar')[step.id]?.toLowerCase());

      if (isStepCompleted) {
        console.log(`Step completed: ${step.id} - ${stepNameEn}`);
      } else {
        console.log(`Step remaining: ${step.id} - ${stepNameEn}`);
        remainingSteps.push({ ...step, index: i });
      }
    }

    console.log(`Total remaining steps: ${remainingSteps.length}`);

    return remainingSteps;
  };

  let stepHook = null;

  const getStepHook = () => {
    const pid = currentProjectId();
    if (!pid) return null;
    if (!stepHook || stepHook.projectId !== pid) {
      stepHook = createStepHook(pid);
      stepHook.projectId = pid;
    }
    return stepHook;
  };

  // Initialize the first step when the project is loaded
  onMount(async () => {
    // Wait for the project ID to be properly set
    const checkAndStart = async () => {
      // Use microtask instead of setTimeout for initialization
      await new Promise(resolve => queueMicrotask(resolve));

      if (currentProjectId() && !startPressed()) {
        // Load project details to use as prompt
        try {
          // Wait for the project resource to load if needed
          if (project.state === 'pending') {
            // Use microtask instead of setTimeout for better performance
            await new Promise(resolve => queueMicrotask(resolve));
          }

          // Try to get the project from the resource first, then fall back to direct DB query
          let projectDetails = project();
          if (!projectDetails) {
            // If the resource hasn't loaded yet, query directly
            const allProjects = await getProjects(user()?.id);
            projectDetails = allProjects.find(p => p.id === currentProjectId());
          }

          if (projectDetails && projectDetails.description) {
            setPrompt(projectDetails.description);
          }

          // Force tasks to load first to ensure proper step determination
          await refetchTasks();

          // Wait for tasks to be loaded (using the resource state)
          if (tasks.state === 'pending') {
            // Wait a bit more for the tasks to load
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          // Check if there are no tasks yet, meaning this is a brand new project
          const projectTasks = tasks() || []; // Use the reactive tasks instead of fetching again
          console.log(`Found ${projectTasks.length} tasks for project`);

          if (projectTasks.length === 0) {
            // This is a new project, start the first step automatically
            console.log('No tasks found, starting first step');
            await handleStart();
          } else {
            // Project has existing tasks, determine which tasks remain to be completed
            const remainingTasks = getRemainingTasks(projectTasks);
            console.log(
              `Project has ${projectTasks.length} total tasks, ${remainingTasks.length} remaining`
            );

            if (remainingTasks.length > 0) {
              // There are remaining tasks, but we don't start them automatically
              // The user will need to press "Confirm" to continue with the next task
              console.log(
                `Project has ${remainingTasks.length} remaining tasks`
              );
            } else {
              // All tasks are completed
              console.log('All tasks completed for this project');
            }
          }
        } catch (error) {
          logger.error('Error initializing project:', error);
          // Still try to start if we have a project ID
          try {
            const projectTasks = tasks() || [];
            if (projectTasks.length === 0) {
              // If we can't load tasks due to auth error, try to start fresh
              await handleStart();
            } else {
              // Even if there's an error, determine remaining tasks
              const remainingTasks = getRemainingTasks(projectTasks);
              console.log(
                `After error, project has ${remainingTasks.length} remaining tasks`
              );
            }
          } catch (taskError) {
            logger.error('Error in fallback initialization:', taskError);
            console.error('Detailed fallback error:', taskError);
            // If all else fails, try to start the first step
            try {
              await handleStart();
            } catch (finalError) {
              logger.error('Failed to start first step:', finalError);
              console.error('Detailed start error:', finalError);
            }
          }
        }
      }
    };

    // Try to start immediately
    await checkAndStart();
  });

  // Load tasks for the current project
  const [tasks, { refetch: refetchTasks, mutate }] = createResource(
    currentProjectId,
    async projectId => {
      if (!projectId) return [];
      try {
        const result = await getTasks(String(projectId));
        console.log(
          `Loaded ${result?.length || 0} tasks for project ${projectId}`
        );
        return result || [];
      } catch (error) {
        logger.error('Error loading tasks:', error);
        // Log the specific error for debugging
        console.error('Detailed error loading tasks:', error);
        return [];
      }
    }
  );

  const filteredTasks = createMemo(() => {
    return tasks() || [];
  });

  // Load the specific project to get its name
  const [project, { refetch: refetchProject }] = createResource(
    currentProjectId,
    async projectId => {
      if (!projectId) return null;
      try {
        // Get user information
        const currentUser = user();
        console.log('Current user:', currentUser);

        // Assuming there's a function to get a single project by ID
        // If not available, we can get all projects and find the specific one
        const allProjects = await getProjects(currentUser?.id);
        console.log(`Found ${allProjects?.length || 0} projects for user`);

        const proj = allProjects.find(p => p.id === projectId);
        console.log('Found project:', proj);

        if (proj) {
          setProjectName(proj.name);
        }
        return proj || null;
      } catch (error) {
        logger.error('Error loading project:', error);
        console.error('Detailed error loading project:', error);
        return null;
      }
    }
  );

  let textareaRef;

  // Handle regeneration of a task
  const handleRegenerate = async taskId => {
    logger.debug('OpenedProject: handleRegenerate called with taskId:', taskId);
    if (taskId) {
      const task = tasksList().find(t => t.id === taskId);
      if (task) {
        try {
          const rawResponse = await callLLMForStep(task.prompt);
          const newResponse = normalizeLLMResponse(rawResponse);
          await updateTask(taskId, {
            llm_response: newResponse,
            content: newResponse,
            last_modified: new Date().toISOString(),
          });
          await refreshTasks();
          toastManager.success('Task regenerated successfully');
        } catch (error) {
          logger.error('Error regenerating task:', error);
          toastManager.error('Failed to regenerate task');
        }
      }
    } else {
      const hook = getStepHook();
      if (hook) {
        await hook.regenerate(
          callLLMForStep,
          { problem: prompt() },
          currentLang()
        );
      } else {
        logger.warn('handleRegenerate: No step hook available');
        toastManager.error('No active step to regenerate');
      }
    }
  };

  // Handle reset of a task
  const handleReset = async taskId => {
    logger.debug('OpenedProject: handleReset called with taskId:', taskId);
    if (taskId) {
      const task = tasksList().find(t => t.id === taskId);
      if (task) {
        // Clear the response, keep content as old response
        await updateTask(taskId, { llm_response: '' });
        // Select the task for new instructions
        setSelectedTaskId(taskId);
        // Refresh tasks
        await refreshTasks();
        toastManager.success('Task reset and selected for new instructions');
      }
    } else {
      // Reset current step
      // Implement if needed
    }
  };

  // Handle instruct for a task
  const handleInstruct = async taskId => {
    logger.debug('OpenedProject: handleInstruct called with taskId:', taskId);
    setSelectedTaskId(taskId);
  };

  // Submit instructions for a task
  const handleInstructSubmit = async () => {
    const taskId = selectedTaskId();
    // Use instructPrompt when task is selected, otherwise use prompt
    const userPrompt = taskId ? instructPrompt() : prompt();

    // Only process if there's an open project and a selected task
    const hasOpenProject = currentProjectId() && currentProjectId() !== null;
    const hasSelectedTask = taskId && taskId !== null;

    if (hasOpenProject && hasSelectedTask) {
      const task = tasksList().find(t => t.id === taskId);
      if (task) {
        console.log('[Journey] ============================================');
        console.log(
          '[Journey] INSTRUCT: Modifying task based on user instruction'
        );

        const instructionPrompt = `Take this existing content and apply the following instruction: "${userPrompt}"

Existing content:
${task.content || task.llm_response || ''}

Please provide the modified content that follows the instruction.`;

        setStreamingTaskId(taskId);
        let accumulatedResponse = '';

        try {
          console.log(
            '[Journey] Calling LLM to apply instruction with streaming...'
          );
          await callLLMForStep(instructionPrompt, chunk => {
            accumulatedResponse += chunk;
            const normalized = normalizeLLMResponse(accumulatedResponse);
            batch(() => {
              setTasksList(currentTasks => {
                const updatedTasks = currentTasks.map(t => {
                  if (t.id === taskId) {
                    return {
                      ...t,
                      content: normalized,
                      llm_response: normalized,
                      last_modified: new Date().toISOString(),
                    };
                  }
                  return t;
                });
                return [...updatedTasks];
              });

              // Also update the resource directly for real-time UI updates
              const updatedResourceTasks = tasks().map(t => {
                if (t.id === taskId) {
                  return {
                    ...t,
                    content: normalized,
                    llm_response: normalized,
                    last_modified: new Date().toISOString(),
                  };
                }
                return t;
              });
              mutate(updatedResourceTasks);
            });
          });

          console.log(
            '[Journey] Streaming complete, length:',
            accumulatedResponse.length
          );
          setStreamingTaskId(null);
          setInstructPrompt('');

          console.log('[Journey] Saving updated task...');
          await updateTask(taskId, {
            content: normalizeLLMResponse(accumulatedResponse),
            llm_response: normalizeLLMResponse(accumulatedResponse),
            prompt: instructionPrompt,
            last_modified: new Date().toISOString(),
          });

          console.log('[Journey] Refreshing task list...');
          await refreshTasks();
          setSelectedTaskId(null);
          console.log('[Journey] Task modified successfully');
          console.log('[Journey] ============================================');
          toastManager.success('Task modified successfully');
        } catch (error) {
          setStreamingTaskId(null);
          console.error('[Journey] Error modifying task:', error.message);
          logger.error('Error modifying task:', error);
          toastManager.error('Failed to modify task: ' + error.message);
        }
      }
    }
  };

  // Handle confirmation of a task
  const handleConfirm = async taskId => {
    console.log('[Journey] ============================================');
    console.log(
      '[Journey] STEP CONFIRM: User confirmed task, determining next step to process'
    );

    try {
      const projectId = currentProjectId();
      if (!projectId) return;

      // Get all tasks for the project to determine remaining tasks
      // Use the resource to get the most up-to-date tasks
      await refetchTasks(); // Ensure tasks are refreshed
      if (tasks.state === 'pending') {
        // Wait for tasks to load
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      const allTasks = tasks() || [];
      console.log(`Handle confirm: Found ${allTasks.length} tasks for project`);
      const remainingSteps = getRemainingTasks(allTasks);

      if (remainingSteps.length > 0) {
        // Process the next remaining step
        const nextStepInfo = remainingSteps[0]; // Take the first remaining step
        const stepName =
          stepNames(currentLang())[nextStepInfo.id] ||
          nextStepInfo.name ||
          `Step ${nextStepInfo.index + 1}`;

        console.log('[Journey] Processing next remaining step:', stepName);
        toastManager.info(`Processing ${stepName}...`);

        // Create new task for the next step
        const userId = user()?.id || 'unknown_user'; // Use a fallback if user is not available
        const taskPrompt = buildPrompt(nextStepInfo.id, {
          problem: prompt(),
          lang: currentLang(),
        });

        const taskId = await addTask(
          {
            projectId: projectId,
            title: stepName,
            content: '',
            prompt: taskPrompt,
            llm_response: '',
            model: nextStepInfo.model || 'System',
            section: nextStepInfo.section || 'Processing',
            stepName: stepName,
          },
          projectId,
          userId
        );

        console.log(
          '[Journey] Created new task for next step',
          taskId,
          'with prompt length:',
          taskPrompt?.length || 0
        );

        // Add to local state immediately
        const newTask = {
          id: taskId,
          projectId,
          title: stepName,
          content: '',
          prompt: taskPrompt,
          llm_response: '',
          model: nextStepInfo.model || 'System',
          section: nextStepInfo.section || 'Processing',
          stepName,
          last_modified: new Date().toISOString(),
        };
        setTasksList(prev => [...prev, newTask]);

        // Refresh to ensure UI updates immediately to show the new task
        await refreshTasks();

        // Set the streaming task ID to the new task to start streaming
        setStreamingTaskId(taskId);

        // Process the task with LLM
        let accumulatedResponse = '';
        try {
          await callLLMForStep(taskPrompt, chunk => {
            accumulatedResponse += chunk;
            const normalized = normalizeLLMResponse(accumulatedResponse);
            batch(() => {
              setTasksList(currentTasks => {
                const updatedTasks = currentTasks.map(t => {
                  if (t.id === taskId) {
                    return {
                      ...t,
                      content: normalized,
                      llm_response: normalized,
                      last_modified: new Date().toISOString(),
                    };
                  }
                  return t;
                });
                return [...updatedTasks];
              });

              // Also update the resource directly for real-time UI updates
              const updatedResourceTasks = tasks().map(t => {
                if (t.id === taskId) {
                  return {
                    ...t,
                    content: normalized,
                    llm_response: normalized,
                    last_modified: new Date().toISOString(),
                  };
                }
                return t;
              });
              mutate(updatedResourceTasks);
            });
          });

          setStreamingTaskId(null);
          const normalizedFinal = normalizeLLMResponse(accumulatedResponse);
          await updateTask(taskId, {
            content: normalizedFinal,
            llm_response: normalizedFinal,
          });

          const extractedData = extractTemplateData(normalizedFinal);
          if (Object.keys(extractedData).length > 0 && currentProjectId()) {
            await updateStepData(currentProjectId(), extractedData);
          }

          await refreshTasks();
          toastManager.success(`${stepName} completed!`);

          // Check if there are more remaining tasks
          await refetchTasks(); // Refresh the resource
          const updatedTasks = tasks() || [];
          const stillRemaining = getRemainingTasks(updatedTasks);

          if (stillRemaining.length > 0) {
            toastManager.info(
              `${stillRemaining.length} more tasks remaining...`
            );
          } else {
            toastManager.success('All tasks completed!');
          }
        } catch (streamError) {
          setStreamingTaskId(null);
          if (accumulatedResponse.trim().length > 0) {
            const normalized = normalizeLLMResponse(accumulatedResponse);
            await updateTask(taskId, {
              content: normalized,
              llm_response: normalized,
            });
            await refreshTasks();
            toastManager.warning('Saved partial response');
          } else {
            toastManager.error('Streaming failed: ' + streamError.message);
          }
        }
      } else {
        // No remaining tasks - all steps are completed
        console.log('[Journey] All steps completed');
        toastManager.success('All steps completed!');
      }

      console.log('[Journey] ============================================');
    } catch (error) {
      console.error('[Journey] Error in confirm process:', error);
      logger.error('Error in confirm process:', error);
      toastManager.error('Error confirming step: ' + error.message);
    }
  };

  // Handle starting a new task for the project
  const handleStart = async () => {
    if (!currentProjectId()) {
      toastManager.error('No project selected');
      return;
    }

    const step = getStepHook();
    if (!step) {
      toastManager.error('Could not initialize step hook');
      return;
    }

    const stepInfo = step.currentStep();
    if (!stepInfo) {
      toastManager.error('No current step available');
      return;
    }

    try {
      setStartPressed(true);

      // Create new task
      const userId = user()?.id || 'unknown_user'; // Use a fallback if user is not available
      const taskPrompt = buildPrompt(stepInfo.id, {
        problem: prompt(),
        lang: currentLang(),
      });

      const taskId = await addTask(
        {
          projectId: currentProjectId(),
          title: step.stepName(currentLang()),
          content: '',
          prompt: taskPrompt,
          llm_response: '',
          model: stepInfo.model || 'System',
          section: stepInfo.section || 'Initialization',
          stepName: step.stepName('en'), // Use English for database consistency
        },
        currentProjectId(),
        userId
      );

      // Update local state
      const newTask = {
        id: taskId,
        projectId: currentProjectId(),
        title: step.stepName(currentLang()), // Use current language for UI display
        content: '',
        prompt: taskPrompt,
        llm_response: '',
        model: stepInfo.model || 'System',
        section: stepInfo.section || 'Initialization',
        stepName: step.stepName('en'), // Use English for database consistency
        last_modified: new Date().toISOString(),
      };

      setTasksList(prev => [...prev, newTask]);

      // Process the task with LLM
      setStreamingTaskId(taskId);
      let accumulatedResponse = '';

      try {
        await callLLMForStep(taskPrompt, chunk => {
          accumulatedResponse += chunk;
          const normalized = normalizeLLMResponse(accumulatedResponse);
          batch(() => {
            setTasksList(currentTasks => {
              const updatedTasks = currentTasks.map(t => {
                if (t.id === taskId) {
                  return {
                    ...t,
                    content: normalized,
                    llm_response: normalized,
                    last_modified: new Date().toISOString(),
                  };
                }
                return t;
              });
              return [...updatedTasks];
            });

            // Also update the resource directly for real-time UI updates
            const updatedResourceTasks = tasks().map(t => {
              if (t.id === taskId) {
                return {
                  ...t,
                  content: normalized,
                  llm_response: normalized,
                  last_modified: new Date().toISOString(),
                };
              }
              return t;
            });
            mutate(updatedResourceTasks);
          });
        });

        setStreamingTaskId(null);
        const normalizedFinal = normalizeLLMResponse(accumulatedResponse);
        await updateTask(taskId, {
          content: normalizedFinal,
          llm_response: normalizedFinal,
        });

        const extractedData = extractTemplateData(normalizedFinal);
        if (Object.keys(extractedData).length > 0 && currentProjectId()) {
          await updateStepData(currentProjectId(), extractedData);
        }

        await refreshTasks();
        toastManager.success('Task completed!');
      } catch (streamError) {
        setStreamingTaskId(null);
        if (accumulatedResponse.trim().length > 0) {
          const normalized = normalizeLLMResponse(accumulatedResponse);
          await updateTask(taskId, {
            content: normalized,
            llm_response: normalized,
          });
          await refreshTasks();
          toastManager.warning('Saved partial response');
        } else {
          toastManager.error('Streaming failed: ' + streamError.message);
        }
      }
    } catch (error) {
      setStartPressed(false);
      logger.error('Error starting task:', error);
      toastManager.error('Error starting task: ' + error.message);
    }
  };

  // Call LLM function
  const callLLMForStep = async (promptText, onChunk, options = {}) => {
    const controller = new AbortController();
    const { timeoutMs = 180000 } = options; // default 3 minutes, refreshed on each chunk

    let timeoutId;
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    };

    let reader = null;
    let response = null;

    try {
      let attempt = 0;
      const maxAttempts = 3;
      let lastError = null;

      while (attempt < maxAttempts) {
        attempt += 1;
        console.log(
          '[Journey] LLM request attempt',
          attempt,
          'prompt length:',
          promptText?.length || 0
        );
        try {
          resetTimeout();
          response = await fetch('/api/llm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Connection: 'close',
            },
            body: JSON.stringify({
              prompt: promptText,
              language: currentLang(),
            }),
            signal: controller.signal,
          });
          if (!response.ok) {
            const errorText = await response
              .text()
              .catch(() => 'Unknown error');
            throw new Error(
              JSON.stringify({ status: response.status, message: errorText })
            );
          }
          break;
        } catch (attemptError) {
          lastError = attemptError;
          console.error(
            '[Journey] LLM request attempt',
            attempt,
            'failed with stack:',
            attemptError.stack || attemptError.message
          );
          if (attempt >= maxAttempts) {
            throw attemptError;
          }
          // Use exponential backoff with a more efficient sleep implementation
          await new Promise(resolve => setTimeout(resolve, Math.min(2000 * attempt, 10000))); // Cap at 10 seconds
        }
      }

      if (!response?.body) {
        throw new Error('LLM response stream unavailable');
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';

      while (true) {
        resetTimeout(); // Refresh timeout on every chunk received
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        responseText += chunk;

        if (onChunk) {
          onChunk(chunk);
        }
      }

      return responseText;
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error(
          'LLM streaming timed out after 3 minutes. The response may be taking longer than expected.'
        );
      }
      throw fetchError;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (reader) {
        try {
          await reader.cancel();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  };

  // Update task function
  const updateTaskLocal = async (taskId, updates) => {
    await updateTask(taskId, updates);
    // Refresh the tasks list
    setTasksList(await getTasks(currentProjectId()));
  };

  // Refresh tasks function
  const refreshTasks = async () => {
    const tasksData = await getTasks(currentProjectId());
    console.log(
      `RefreshTasks: Loaded ${tasksData?.length || 0} tasks for project ${currentProjectId()}`
    );
    setTasksList(tasksData);
    mutate(tasksData);
  };

  // Delete task function
  const deleteTaskHandler = async taskId => {
    try {
      await deleteTask(taskId);
      await refreshTasks();
      toastManager.success('Task deleted successfully');
    } catch (error) {
      logger.error('Error deleting task:', error);
      toastManager.error('Failed to delete task');
    }
  };

  return (
    <div class="bg-base-100 mx-auto flex h-screen max-w-full flex-col lg:max-w-6xl">
      {/* Response Section - Shows the tasks and responses */}
      <div class="flex-1 overflow-y-auto">
        <ResponseSection
          tasksList={tasks}
          startPressed={startPressed}
          currentProjectId={currentProjectId}
          projectName={projectName()}
          editingTaskId={editingTaskId}
          editContent={editContent}
          setEditingTaskId={setEditingTaskId}
          setEditContent={setEditContent}
          selectedTaskId={selectedTaskId}
          callLLMForStep={callLLMForStep}
          setTasksList={setTasksList}
          setSelectedTaskId={setSelectedTaskId}
          handleConfirm={handleConfirm}
          updateTask={updateTaskLocal}
          refreshTasks={refreshTasks}
          streamingTaskId={streamingTaskId}
          setStreamingTaskId={setStreamingTaskId}
          onDelete={deleteTaskHandler}
          expandedTaskId={expandedTaskId}
          setExpandedTaskId={setExpandedTaskId}
        />
      </div>

      {/* Agent Interface - For interacting with the project/tasks */}
      <div class="sticky bottom-3 z-50 w-full">
        <AgentInterface
          currentProjectId={currentProjectId}
          tasksList={tasks}
          startPressed={startPressed}
          prompt={prompt}
          setPrompt={setPrompt}
          selectedTaskId={selectedTaskId}
          setSelectedTaskId={setSelectedTaskId}
          instructPrompt={instructPrompt}
          setInstructPrompt={setInstructPrompt}
          handleInstructSubmit={handleInstructSubmit}
          handleStart={handleStart}
          handleConfirm={handleConfirm}
          handleReset={handleReset}
          handleRegenerate={handleRegenerate}
          handleInstruct={handleInstruct}
          editingTaskId={editingTaskId}
          editContent={editContent}
          setEditingTaskId={setEditingTaskId}
          setEditContent={setEditContent}
          streamingTaskId={streamingTaskId}
          setStreamingTaskId={setStreamingTaskId}
          showGreeting={false} // Explicitly hide the greeting when a project is open
        />
      </div>
    </div>
  );
};

export default OpenedProject;
