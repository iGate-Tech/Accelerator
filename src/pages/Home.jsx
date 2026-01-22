import {
    createSignal,
    createResource,
    onMount,
    onCleanup,
    createEffect,
    Show,
    createMemo,
    batch
} from "solid-js";
import { logger } from "../lib/core";
import { LoadingOverlay, AgentInterface } from "../components";
import {
    steps,
    stepNames
} from "../lib/business/steps.js";
import {
    buildPrompt
} from "../lib/business/machine.js";
import { createStepHook } from "../lib/business/useStep.js";
import {
    getTasks,
    addTask,
    clearAllTasks,
    updateTask,
    addProject,
    updateProject,
    getProjects,
    updateEntity
} from "../lib/database";
import { useUser } from "../context/UserContext";
import { toastManager } from "../lib/ui/feedback";
import { useActivityLogger } from "../lib/business/activity.js";
import { extractTemplateData} from '../lib/ui/llm-template.js';
import { updateStepData } from '../lib/ui/stepDataStore.js';
import { ResponseSection, RouteGuard, ProtectedRoute } from '../components';
import { useContext } from "solid-js";
import { LangContext } from "../context/LangContext";
import { translations } from "../assets/translations/translations-index.js";
import { projectsStore, setProjectsStore, clearPendingProjectId } from "../stores/projectsStore";

const getStepName = (task) => {
  return task.step_name || "Unknown Step";
};

const TasksContent = () => {
    const { lang } = useContext(LangContext);
    const { user } = useUser();
    const activityLogger = useActivityLogger();

    const [currentLang, setCurrentLang] = createSignal(lang());
    const t = createMemo(() => translations[currentLang()]);

    createEffect(() => {
        setCurrentLang(lang());
    });

    const [currentProjectId, setCurrentProjectId] = createSignal(null);

    // Debug wrapper for setCurrentProjectId - ensures we store only the ID string
    const _setCurrentProjectId = (value) => {
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
    const [prompt, setPrompt] = createSignal("");
    const [startPressed, setStartPressed] = createSignal(false);

    const [tasksList, setTasksList] = createSignal([]);
    const [editingTaskId, setEditingTaskId] = createSignal(null);
    const [editContent, setEditContent] = createSignal("");
    const [activeCardId, setActiveCardId] = createSignal(null);
    const [loading, setLoading] = createSignal(false);

    const [showProjectModal, setShowProjectModal] = createSignal(false);
    const [switchingProject, setSwitchingProject] = createSignal(false);
    const [selectedTaskId, setSelectedTaskId] = createSignal(null);
    const [projectData, setProjectData] = createSignal(null);
    const [streamingTaskId, setStreamingTaskId] = createSignal(null);
    const [instructPrompt, setInstructPrompt] = createSignal('');

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

    const [tasks] = createResource(currentProjectId, async (projectId) => {
        if (!projectId) return [];
        try {
            const result = await getTasks(String(projectId));
            return result || [];
        } catch (error) {
            logger.error('Error loading tasks:', error);
            return [];
        }
    });

    const filteredTasks = createMemo(() => {
        return tasks() || [];
    });

    const [projects, { refetch: refetchProjects }] = createResource(
        () => user()?.id,
        async (userId) => {
            if (!userId) return [];
            try {
                const result = await getProjects(userId);
                return result || [];
            } catch (error) {
                logger.error('Error loading projects:', error);
                return [];
            }
        }
    );

    const agentBoxClass = createMemo(() => {
        const hasProject = currentProjectId() !== null;
        const step = getStepHook();
        const isActive = hasProject && (startPressed() || (tasksList() && tasksList().length > 0 && step?.stepIndex() >= steps.length - 1));
        const base = hasProject ? "w-full max-w-3xl " : "w-full max-w-4xl flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]";
        const expanded = "";
        return `${base} ${expanded}`.trim();
    });

    const agentContentClass = createMemo(() => {
        return "flex flex-col gap-4 w-full";
    });

    const greetingClass = createMemo(() => {
        return "text-center mb-8 fade-in";
    });

    let textareaRef;



    const handleRegenerate = async (taskId) => {
      logger.debug('Home: handleRegenerate called with taskId:', taskId);
      if (taskId) {
        const task = tasksList().find(t => t.id === taskId);
        if (task) {
          try {
            const newResponse = await callLLMForStep(task.prompt);
            await updateTask(taskId, { llm_response: newResponse, last_modified: new Date().toISOString() });
            setTasksList(await getTasks(currentProjectId()));
            toastManager.success('Task regenerated successfully');
          } catch (error) {
            logger.error('Error regenerating task:', error);
            toastManager.error('Failed to regenerate task');
          }
        }
      } else {
        const hook = getStepHook();
        if (hook) {
          await hook.regenerate(callLLMForStep, { problem: prompt() });
        } else {
          logger.warn('handleRegenerate: No step hook available');
          toastManager.error('No active step to regenerate');
        }
      }
    };









    const handleReset = async (taskId) => {
      logger.debug('Home: handleReset called with taskId:', taskId);
      if (taskId) {
        const task = tasksList().find(t => t.id === taskId);
        if (task) {
          // Clear the response, keep content as old response
          await updateTask(taskId, { llm_response: '' });
          // Select the task for new instructions
          setSelectedTaskId(taskId);
          // Refresh tasks
          setTasksList(await getTasks(currentProjectId()));
          toastManager.success('Task reset and selected for new instructions');
        }
      } else {
        // Reset current step
        // Implement if needed
      }
    };

    const handleInstruct = async (taskId) => {
      logger.debug('Home: handleInstruct called with taskId:', taskId);
      setSelectedTaskId(taskId);
    };

    const handleInstructSubmit = async () => {
      const taskId = selectedTaskId();
      // Use instructPrompt when task is selected, otherwise use prompt
      const userPrompt = taskId ? instructPrompt() : prompt();
      
      // Only create new project if no project is open AND no task is selected
      const hasOpenProject = currentProjectId() && currentProjectId() !== null;
      const hasSelectedTask = taskId && taskId !== null;
      
      if (!hasOpenProject && !hasSelectedTask) {
        // Create new project for the instruction
        try {
          const projectData = {
            name: userPrompt.trim().substring(0, 50) + (userPrompt.length > 50 ? '...' : ''),
            description: userPrompt.trim()
          };
          const projectId = await addProject(projectData, user()?.id);
          _setCurrentProjectId(projectId);
          // Dispatch events to notify sidebar to refresh
          window.dispatchEvent(new CustomEvent('projectAdded', { detail: projectId }));
          window.dispatchEvent(new CustomEvent('refreshProjects'));
          setPrompt(userPrompt);
          
          // Create initial task and stream
          const newStepHook = createStepHook(projectId, () => {});
          stepHook = newStepHook;
          const step = getStepHook();
          
          if (step && currentProjectId() && user()?.id) {
            const taskId = await addTask({
              projectId: currentProjectId(),
              title: step.stepName(),
              content: '',
              prompt: buildPrompt(step.currentStep(), {}, { problem: userPrompt }),
              llm_response: '',
              model: step.currentStep()?.model || 'System',
              section: step.currentStep()?.section || 'Initialization',
              stepName: step.stepName()
            }, currentProjectId(), user()?.id);
            
            setTasksList(currentTasks => [...currentTasks, {
              id: taskId,
              projectId: currentProjectId(),
              title: step.stepName(),
              content: '',
              prompt: buildPrompt(step.currentStep(), {}, { problem: userPrompt }),
              llm_response: '',
              model: step.currentStep()?.model || 'System',
              section: step.currentStep()?.section || 'Initialization',
              stepName: step.stepName(),
              last_modified: new Date().toISOString()
            }]);
            
            setStreamingTaskId(taskId);
            let accumulatedResponse = '';
            const streamingPrompt = buildPrompt(step.currentStep(), {}, { problem: userPrompt });
            
            try {
              await callLLMForStep(streamingPrompt, (chunk) => {
                accumulatedResponse += chunk;
                batch(() => {
                  setTasksList(currentTasks => {
                    const updatedTasks = currentTasks.map(t => {
                      if (t.id === taskId) {
                        return { ...t, content: accumulatedResponse, llm_response: accumulatedResponse, last_modified: new Date().toISOString() };
                      }
                      return t;
                    });
                    return [...updatedTasks];
                  });
                });
              });
              
              setStreamingTaskId(null);
              await updateTask(taskId, {
                content: accumulatedResponse,
                llm_response: accumulatedResponse
              });
              
              const extractedData = extractTemplateData(accumulatedResponse);
              if (Object.keys(extractedData).length > 0 && currentProjectId()) {
                await updateStepData(currentProjectId(), extractedData);
              }
              
              setTasksList(await getTasks(currentProjectId()));
              toastManager.success('First step completed!');
            } catch (streamError) {
              setStreamingTaskId(null);
              if (accumulatedResponse.trim().length > 0) {
                await updateTask(taskId, {
                  content: accumulatedResponse,
                  llm_response: accumulatedResponse
                });
                setTasksList(await getTasks(currentProjectId()));
                toastManager.warning('Saved partial response');
              } else {
                toastManager.error('Streaming failed: ' + streamError.message);
              }
            }
          }
          
          setSelectedTaskId(null);
          return;
        } catch (error) {
          logger.error('Error creating project for instruction:', error);
          toastManager.error('Failed to create project');
          return;
        }
      }
      
      // Update existing task if task is selected
      if (taskId) {
        const task = tasksList().find(t => t.id === taskId);
        if (task) {
          console.log('[Journey] ============================================');
          console.log('[Journey] INSTRUCT: Modifying task based on user instruction');
          
          const instructionPrompt = `Take this existing content and apply the following instruction: "${userPrompt}"

Existing content:
${task.content || task.llm_response || ''}

Please provide the modified content that follows the instruction.`;

          setStreamingTaskId(taskId);
          let accumulatedResponse = '';
          
          try {
            console.log('[Journey] Calling LLM to apply instruction with streaming...');
            await callLLMForStep(instructionPrompt, (chunk) => {
              accumulatedResponse += chunk;
              batch(() => {
                setTasksList(currentTasks => {
                  const updatedTasks = currentTasks.map(t => {
                    if (t.id === taskId) {
                      return { ...t, content: accumulatedResponse, llm_response: accumulatedResponse, last_modified: new Date().toISOString() };
                    }
                    return t;
                  });
                  return [...updatedTasks];
                });
              });
            });
            
            console.log('[Journey] Streaming complete, length:', accumulatedResponse.length);
            setStreamingTaskId(null);
            setInstructPrompt('');
            
            console.log('[Journey] Saving updated task...');
            await updateTask(taskId, {
              content: accumulatedResponse,
              llm_response: accumulatedResponse,
              prompt: instructionPrompt,
              last_modified: new Date().toISOString()
            });
            
            console.log('[Journey] Refreshing task list...');
            setTasksList(await getTasks(currentProjectId()));
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


    const handleConfirm = async (taskId) => {
      const step = getStepHook();
      if (step && !step.isComplete()) {
        console.log('[Journey] ============================================');
        console.log('[Journey] STEP CONFIRM: User confirmed task, advancing to next step');
        toastManager.info('Advancing to next step...');
        try {
          await step.confirm();
          console.log('[Journey] Step confirmed');
        } catch (error) {
          console.error('[Journey] Error in step.confirm():', error.message);
          return;
        }

        const currentStepIndex = step.stepIndex();
        const totalSteps = steps.length;
        const isLastStep = currentStepIndex >= totalSteps - 1;
        
        console.log('[Journey] Step index after confirm:', currentStepIndex);
        console.log('[Journey] Total steps:', totalSteps);
        console.log('[Journey] Is last step:', isLastStep);
        
        // Double-check using the step hook's isLast() method
        const stepHookIsLast = step.isLast();
        console.log('[Journey] Step hook isLast():', stepHookIsLast);
        
        if (isLastStep || stepHookIsLast) {
          console.log('[Journey] Last step confirmed (index: ' + currentStepIndex + '), no more steps to create');
          toastManager.success('Project completed!');
          // Ensure step stays at current index and doesn't reset
          if (step.isComplete()) {
            console.log('[Journey] Step is complete, marking final state');
          }
          return;
        }

        if (!step.isComplete()) {
          console.log('[Journey] Checking for existing next task...');
          const projectId = currentProjectId();
          const allTasks = tasksList();
          
          // Find if there's already a task for a later step
          const existingNextTask = allTasks.find(t => {
            const taskStepIndex = steps.findIndex(s => s.name === t.stepName);
            return taskStepIndex > currentStepIndex && t.content && t.content.trim().length > 0;
          });

          if (existingNextTask) {
            console.log('[Journey] Found existing next task:', existingNextTask.id, '- showing it instead of creating new one');
            // Select the existing task instead of creating a new one
            setSelectedTaskId(existingNextTask.id);
            return;
          }

          console.log('[Journey] No existing next task found, creating new task...');
          try {
            const userId = user()?.id;
            const currentStep = step.currentStep();
            const stepName = step.stepName();
            const currentStepData = step.stepData();
            
            console.log('[Journey] Next step:', currentStep?.name || stepName);
            console.log('[Journey] Step data for prompt:', Object.keys(currentStepData));
            
            const promptForStep = buildPrompt(currentStep, currentStepData, prompt());
            console.log('[Journey] Prompt length:', promptForStep.length);

            const newTaskId = await addTask({
              projectId: projectId,
              title: stepName,
              content: '',
              prompt: promptForStep,
              llm_response: '',
              model: currentStep?.model || 'System',
              section: currentStep?.section || 'Processing',
              stepName: stepName
            }, projectId, userId);
            console.log('[Journey] Task created:', newTaskId);

            // Immediately add the new task to tasksList so streaming can update it
            const newTask = {
              id: newTaskId,
              projectId: projectId,
              title: stepName,
              content: '',
              prompt: promptForStep,
              llm_response: '',
              model: currentStep?.model || 'System',
              section: currentStep?.section || 'Processing',
              stepName: stepName,
              last_modified: new Date().toISOString()
            };
            setTasksList(currentTasks => [...currentTasks, newTask]);
            console.log('[Journey] Added new task to tasksList for streaming');

            console.log('[Journey] Starting LLM streaming for step...');
            setStreamingTaskId(newTaskId);
            let accumulatedResponse = '';
            try {
              const stepPrompt = buildPrompt(step.currentStep(), step.stepData(), prompt());
              const response = await callLLMForStep(stepPrompt, (chunk) => {
                accumulatedResponse += chunk;
                batch(() => {
                  setTasksList(currentTasks => {
                    const updatedTasks = currentTasks.map(task => {
                      if (task.id === newTaskId) {
                        return { ...task, content: accumulatedResponse, last_modified: new Date().toISOString() };
                      }
                      return task;
                    });
                    return [...updatedTasks];
                  });
                });
              });

              console.log('[Journey] Streaming complete, length:', accumulatedResponse.length);
              setStreamingTaskId(null);
              if (response && typeof response === 'string' && response.trim().length > 0) {
                console.log('[Journey] Saving response to task...');
                await updateTask(newTaskId, {
                  content: response,
                  llm_response: response
                });

                console.log('[Journey] Extracting template data...');
                const extractedData = extractTemplateData(response);
                console.log('[Journey] Extracted data:', JSON.stringify(extractedData));
                
                if (Object.keys(extractedData).length > 0 && currentProjectId()) {
                  await updateStepData(currentProjectId(), extractedData);
                  console.log('[Journey] Data saved to step_data');
                }

                console.log('[Journey] Refreshing task list...');
                setTasksList(await getTasks(currentProjectId()));
                console.log('[Journey] Task ID in list:', newTaskId);
                console.log('[Journey] ============================================');
              }
            } catch (streamError) {
              console.error('[Journey] Streaming failed:', streamError.message);
              setStreamingTaskId(null);
              if (accumulatedResponse.trim().length > 0) {
                await updateTask(newTaskId, {
                  content: accumulatedResponse,
                  llm_response: accumulatedResponse
                });
                const extractedData = extractTemplateData(accumulatedResponse);
                if (Object.keys(extractedData).length > 0 && currentProjectId()) {
                  await updateStepData(currentProjectId(), extractedData);
                }
                setTasksList(await getTasks(currentProjectId()));
                toastManager.warning('Saved partial response due to streaming error');
              } else {
                toastManager.error('Streaming failed: ' + streamError.message);
              }
            }
          } catch (taskError) {
            console.error('[Journey] Error creating task:', taskError.message);
            toastManager.error('Failed to advance to next step');
          }
        }
      }
    };

    const callLLMForStep = async (promptText, onChunk) => {
      const controller = new AbortController();
      const timeoutMs = 120000; // 2 minutes for step processing
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let reader = null;
      let response = null;

      try {
        response = await fetch('/api/llm', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Connection': 'close' // Prevent connection pool reuse
          },
          body: JSON.stringify({ prompt: promptText }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let responseText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          responseText += chunk;
          
          if (onChunk) {
            onChunk(chunk);
          }
        }

        clearTimeout(timeoutId);
        return responseText;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Attempt to clean up reader if it exists
        if (reader) {
          try {
            reader.cancel();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        
        throw fetchError;
      }
    };







    const handleBeforeUnload = (e) => {
      const step = getStepHook();
      if (currentProjectId() && step && step.isDirty && step.isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    let stateSaveInterval;
    onMount(() => {
      const backupInterval = setInterval(() => performAutoBackup(), 30 * 60 * 1000);
      stateSaveInterval = setInterval(() => {
        const step = getStepHook();
        if (currentProjectId() && step) {
          step.persist();
        }
      }, 5 * 60 * 1000);

      window.addEventListener('beforeunload', handleBeforeUnload);

      onCleanup(() => {
        clearInterval(backupInterval);
        clearInterval(stateSaveInterval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      });
    });

    const handleStart = async () => {
        console.log('[Journey] ============================================');
        console.log('[Journey] STEP 1: User input received');
        const problemText = prompt();
        console.log('[Journey] Input:', `"${problemText?.substring(0, 50)}${problemText?.length > 50 ? '...' : ''}"`);
        
        if (!problemText || !problemText.trim()) {
            toastManager.error('Please enter a problem statement first');
            return;
        }

        console.log('[Journey] STEP 2: Creating project...');
        setStartPressed(true);
        setLoading(true);

        try {
            const projectData = {
                name: problemText.trim().substring(0, 50) + (problemText.length > 50 ? '...' : ''),
                description: problemText.trim()
            };
            const projectId = await addProject(projectData, user()?.id);
            console.log('[Journey] Project created:', projectId);
            _setCurrentProjectId(projectId);
            setProjectData({ id: projectId, ...projectData });  // Set projectData so project name shows in ResponseSection
            setPrompt(problemText);

            console.log('[Journey] STEP 3: Creating task...');
            const newStepHook = createStepHook(projectId, () => {});
            stepHook = newStepHook;

            // Save problem statement immediately to step data store
            console.log('[Journey] Saving problem to step_data store...');
            await updateStepData(projectId, { 
              problem: problemText.trim(),
              originalProblem: problemText.trim() 
            });
            console.log('[Journey] Problem saved to step_data store');
            console.log('[Journey] Original problem:', problemText.trim().substring(0, 50) + '...');

            // Force refresh stepData to ensure the hook has the latest data
            const step = getStepHook();
            if (step) {
              const freshData = await getStepData(projectId);
              console.log('[Journey] Fresh step data after saving problem:', Object.keys(freshData));
              step.setStepData(freshData);
            }

            if (step && currentProjectId() && user()?.id) {
                const taskId = await addTask({
                    projectId: currentProjectId(),
                    title: step.stepName(),
                    content: '',
                    prompt: buildPrompt(step.currentStep(), {}, { problem: problemText }),
                    llm_response: '',
                    model: step.currentStep()?.model || 'System',
                    section: step.currentStep()?.section || 'Initialization',
                    stepName: step.stepName()
                }, currentProjectId(), user()?.id);
                console.log('[Journey] Task created:', taskId);
                await setTasksList(await getTasks(currentProjectId()));

                console.log('[Journey] STEP 4: Starting LLM streaming...');
                setStreamingTaskId(taskId);
                let accumulatedResponse = '';
                const streamingPrompt = buildPrompt(step.currentStep(), {}, { problem: problemText });

                try {
                    const response = await callLLMForStep(streamingPrompt, (chunk) => {
                        accumulatedResponse += chunk;
                        batch(() => {
                            setTasksList(currentTasks => {
                                const updatedTasks = currentTasks.map(task => {
                                    if (task.id === taskId) {
                                        return { ...task, content: accumulatedResponse, llm_response: accumulatedResponse, last_modified: new Date().toISOString() };
                                    }
                                    return task;
                                });
                                return [...updatedTasks];
                            });
                        });
                    });

                    console.log('[Journey] STEP 5: Streaming complete, length:', accumulatedResponse.length);
                    setStreamingTaskId(null);
                    console.log('[Journey] Raw response preview:', accumulatedResponse.substring(0, 150) + '...');

                    if (response && typeof response === 'string' && response.trim().length > 0) {
                        console.log('[Journey] STEP 6: Saving final response to task...');
                        await updateTask(taskId, {
                            content: accumulatedResponse,
                            llm_response: accumulatedResponse
                        });

                        console.log('[Journey] STEP 7: Extracting template data...');
                        const extractedData = extractTemplateData(response);
                        console.log('[Journey] Extracted data:', JSON.stringify(extractedData));
                        
                        if (Object.keys(extractedData).length > 0 && currentProjectId()) {
                            await updateStepData(currentProjectId(), extractedData);
                            console.log('[Journey] Data saved to step_data');
                        }

                        console.log('[Journey] STEP 8: Refreshing task list...');
                        const finalTasks = await getTasks(currentProjectId());
                        await setTasksList(finalTasks);
                        console.log('[Journey] Task ID in list:', finalTasks[0]?.id);
                        console.log('[Journey] ============================================');
                        toastManager.success('First step completed!');
                    } else {
                        console.error('[Journey] Invalid response received');
                        toastManager.error('Failed to generate response');
                    }
                } catch (streamError) {
                    console.error('[Journey] Streaming failed:', streamError.message);
                    setStreamingTaskId(null);
                    if (accumulatedResponse.trim().length > 0) {
                        console.log('[Journey] Saving partial response...');
                        await updateTask(taskId, {
                            content: accumulatedResponse,
                            llm_response: accumulatedResponse
                        });
                        const extractedData = extractTemplateData(accumulatedResponse);
                        if (Object.keys(extractedData).length > 0 && currentProjectId()) {
                            await updateStepData(currentProjectId(), extractedData);
                        }
                        await setTasksList(await getTasks(currentProjectId()));
                        toastManager.warning('Saved partial response due to streaming error');
                    } else {
                        toastManager.error('Streaming failed: ' + streamError.message);
                    }
                }
            } else {
                console.warn('[Journey] No step hook available, using fallback');
                await newStepHook.regenerate(callLLMForStep, { problem: problemText });
            }
            
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('[Journey] Failed:', error.message);
            logger.error('[Journey] Failed to start project:', error);
            toastManager.error('Failed to start project: ' + error.message);
            setStartPressed(false);
        }
    };

    const onProjectDeleted = (e) => {
      if (currentProjectId() === e.detail.projectId) {
        _setCurrentProjectId(null);
        setPrompt('');
        setTasksList([]);
        stepHook = null;
      }
    };
    

    
    const onOpenProject = async (e) => {
      const pid = e.detail;
      if (currentProjectId() === pid) {
        return;
      }

      setSwitchingProject(true);
      try {
        logger.info('Switching to project:', pid);

        if (currentProjectId()) {
          const step = getStepHook();
          if (step) step.persist();
        }

        _setCurrentProjectId(pid);
        stepHook = null;

        await updateEntity({
          table: 'profiles',
          idField: 'user_id',
          id: user().id,
          updates: { current_project_id: pid }
        });

        await loadProjectState(pid);
        toastManager.success('Switched to project successfully');
        logger.info('Successfully switched to project:', pid);

      } catch (error) {
        logger.error('Project switching failed:', error);
        toastManager.error('Failed to switch project');
      } finally {
        setSwitchingProject(false);
      }
    };

    const loadProjectState = async (projectId) => {
      console.log('[loadProjectState] 1. Starting to load project state for:', projectId);
      try {
        const currentUser = user();
        if (!currentUser?.id) {
          console.log('[loadProjectState] User not authenticated, skipping');
          return;
        }
        
        console.log('[loadProjectState] 2. Fetching projects for user:', currentUser.id);
        const projectsList = await getProjects(currentUser.id);
        console.log('[loadProjectState] 3. Projects fetched:', projectsList?.length || 0);
        
        const project = projectsList.find(p => p.id === projectId);
        console.log('[loadProjectState] 4. Found project:', !!project);

        if (!project) {
          logger.warn('Project not found:', projectId);
          return;
        }

        setProjectData(project);
        setPrompt(project.description || '');
        setStartPressed((project.current_step || 0) > 0);
        console.log('[loadProjectState] 5. setStartPressed to:', (project.current_step || 0) > 0);

        console.log('[loadProjectState] 6. Fetching tasks for project:', projectId);
        const tasks = await getTasks(projectId);
        console.log('[loadProjectState] 7. Tasks fetched:', tasks?.length || 0);
        setTasksList(tasks);

        const step = getStepHook();
        if (step && project.current_step) {
          step.loadFromProject(project);
          console.log('[loadProjectState] 8. Loaded step from project');
        }

        logger.debug('Project state restored for:', projectId);
        console.log('[loadProjectState] 9. Project state fully restored');
      } catch (error) {
        console.error('[loadProjectState] Error loading project state:', error);
        logger.error('Failed to load project state:', error);
      }
    };

    const performAutoBackup = async () => {
      try {
        const u = user();
        if (!u?.id) return;

        const projectsList = await getProjects(u.id);
        const backupData = {
          backupDate: new Date().toISOString(),
          userId: u.id,
          projects: []
        };

        for (const project of projectsList) {
          const tasks = await getTasks(project.id);
          backupData.projects.push({ ...project, tasks });
        }

        const backupKey = `accelerator_backup_${u.id}`;
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        logger.info('Auto-backup completed for user:', u.id);

      } catch (error) {
        logger.error('Auto-backup failed:', error);
      }
    };

    const [processedPendingId, setProcessedPendingId] = createSignal(null);

    const onProjectAdded = () => refetchProjects();

    onMount(() => {
        window.addEventListener('projectDeleted', onProjectDeleted);
        window.addEventListener('openProject', onOpenProject);
        window.addEventListener('projectAdded', onProjectAdded);

        if (projectsStore.pendingProjectId && projectsStore.pendingProjectId !== processedPendingId()) {
          const pendingId = projectsStore.pendingProjectId;
          setProcessedPendingId(pendingId);
          clearPendingProjectId();
          onOpenProject({ detail: pendingId });
        }

        createEffect(() => {
          const pendingId = projectsStore.pendingProjectId;
          if (pendingId && pendingId !== processedPendingId()) {
            console.log('[Home] Detected pending project while mounted:', pendingId);
            setProcessedPendingId(pendingId);
            clearPendingProjectId();
            onOpenProject({ detail: pendingId });
          }
        });

        setTimeout(() => {
            if (window.lucide) window.lucide.createIcons();
        }, 100);
    });

    onCleanup(() => {
        window.removeEventListener('projectDeleted', onProjectDeleted);
        window.removeEventListener('openProject', onOpenProject);
        window.removeEventListener('projectAdded', onProjectAdded);
    });



     const stepHookMemo = createMemo(() => getStepHook());

     const isLoading = () => {
         try {
             if (!currentProjectId()) return false;
             const stepHook = getStepHook();
             if (!stepHook) return true;
             return !tasksList || currentLang() === undefined;
         } catch {
             return false;
         }
     };

     createEffect(() => {
         if (isLoading()) {
            setActiveCardId('streaming');
         } else {
            const currentStep = stepHookMemo()?.currentStep();
            const currentStepName = currentStep?.name;
            const matchingTask = [...tasksList()].reverse().find(task => getStepName(task) === currentStepName);
            setActiveCardId(matchingTask ? matchingTask.id : null);
        }
     });

    const isUserReady = () => !!user()?.id;

    return (
        <RouteGuard requireAuth={true}>
        <Show when={isUserReady()} fallback={
            <div class="flex justify-center items-center min-h-screen">
                <div class="loading loading-spinner loading-lg text-primary"></div>
                <span class="ms-4 text-lg">Loading your workspace...</span>
            </div>
        }>

        <LoadingOverlay
          isLoading={switchingProject}
          message="Switching Projects..."
          timeout={15000}
          onTimeout={() => {
            toastManager.warning('Project switching is taking longer than expected. Please try refreshing the page.');
          }}
        />

        <div class="flex flex-col items-center mx-auto" style='max-width:760px;'>
                  <Show when={
                      !!currentProjectId() && (startPressed() || (tasksList() && tasksList().length > 0))
                   } fallback={
                       <div style={{"display": "none"}}></div>
                   }>
                         <ResponseSection
                           tasksList={tasksList}
                           startPressed={startPressed}
                           isLoading={loading}
                          updateTask={updateTask}
                          setEditContent={setEditContent}
                          editingTaskId={editingTaskId}
                          setEditingTaskId={setEditingTaskId}
                          selectedTaskId={selectedTaskId}
                          setSelectedTaskId={setSelectedTaskId}
                           stepName={stepHookMemo()?.stepName?.() || 'Unknown Step'}
                          callLLMForStep={callLLMForStep}
                         refreshTasks={async () => setTasksList(await getTasks(currentProjectId()))}
                         projectName={projectData()?.name}
                         handleInstruct={handleInstruct}
                         handleRegenerate={handleRegenerate}
                         handleConfirm={handleConfirm}
                         streamingTaskId={streamingTaskId}
                         setStreamingTaskId={setStreamingTaskId}
                        />
                </Show>


                <AgentInterface
                  key={currentProjectId() || 'no-project'}
                  agentBoxClass={agentBoxClass}
                  currentProjectId={currentProjectId}
                  agentContentClass={agentContentClass}
                  greetingClass={greetingClass}
                  projectData={projectData}
                   agentStore={stepHookMemo()}
                  textareaRef={textareaRef}
                  prompt={prompt}
                  setPrompt={setPrompt}
                  instructPrompt={instructPrompt}
                  setInstructPrompt={setInstructPrompt}
                  tasksList={tasksList}
                  startPressed={startPressed}
                   handleInstruct={handleInstruct}
                   handleConfirm={handleConfirm}
                   handleStart={handleStart}
                  handleRegenerate={handleRegenerate}

                  steps={steps}
                  stepNames={stepNames}
                  selectedTaskId={selectedTaskId}
                  setSelectedTaskId={setSelectedTaskId}
                  handleInstructSubmit={handleInstructSubmit}
                  callLLMForStep={callLLMForStep}
                  refreshTasks={async () => setTasksList(await getTasks(currentProjectId()))}
                />
      </div>
        </Show>
          </RouteGuard>
      );
};


const Tasks = () => {
    return (
        <ProtectedRoute>
            <TasksContent />
        </ProtectedRoute>
    );
};

export default Tasks;
