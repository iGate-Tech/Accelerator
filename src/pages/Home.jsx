import {
    createSignal,
    For,
    createResource,
    onMount,
    onCleanup,
    createEffect, 
    Show,
    createMemo
} from "solid-js";
import { logger } from "../lib/core";
import { errorHandler, LoadingOverlay, AgentInterface } from "../components";
import {
    steps,
    stepNames
} from "../lib/business/steps.js";
import {
    buildPrompt,
    fillPrompt,
    extractData
} from "../lib/business/machine.js";
import { createStepHook } from "../lib/business/useStep.js";
import {
    getTasks,
    addTask,
    clearAllTasks,
    updateTask,
    addProject,
    updateProject,
    getProjectByName,
    getProjectById,
    getProjects,
    updateEntity,
    getUserProfile
} from "../lib/database";
import { useUser } from "../context/UserContext";
import { toastManager } from "../lib/ui/feedback";
import { useActivityLogger } from "../lib/business/activity.js";
import { streamQuickLLMCall } from "../lib/utils/general.js";
import {renderFilledTemplate} from '../lib/ui/llm-template.js';
import { ResponseSection, RouteGuard, ProtectedRoute } from '../components';
import { useContext } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
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
    const location = useLocation();
    const navigate = useNavigate();

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
    const [projectName, setProjectName] = createSignal('');
    const [projectDescription, setProjectDescription] = createSignal('');
    const [aiSuggestions, setAiSuggestions] = createSignal([]);
    const [gettingSuggestions, setGettingSuggestions] = createSignal(false);
    const [switchingProject, setSwitchingProject] = createSignal(false);
    const [selectedTaskId, setSelectedTaskId] = createSignal(null);
    const [projectData, setProjectData] = createSignal(null);

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

    createEffect(() => {
      const desc = projectDescription();
      if (desc && desc.trim().length >= 10 && showProjectModal()) {
        getProjectSuggestions(desc);
      }
    });

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

    const handleImprove = async () => {
      if (!user()?.id) {
        toastManager.error('Please log in to use AI features');
        return;
      }
      
      const improvedPrompt = `Improve this startup idea for better clarity, specificity, and market potential. Start with the improved idea name followed by ': ' and then provide a concise description in simple English, in only 3 lines. Do not generate in markdown: ${prompt()}`;
      
       setLoading(true);
       setActiveCardId('streaming');

       try {
         const improvedText = await streamQuickLLMCall(
           improvedPrompt,
           user()?.id,
           (chunk) => {
             // Handle streaming chunks if needed
           }
        );
        
        setPrompt(improvedText);
        
        if (currentProjectId()) {
          const colonIndex = improvedText.indexOf(': ');
          let name = '', description = improvedText;
          if (colonIndex !== -1) {
            name = improvedText.substring(0, colonIndex).trim();
            description = improvedText.substring(colonIndex + 2).trim();
          }
          await updateProject(currentProjectId(), { name, description });
          window.dispatchEvent(new CustomEvent('projectUpdated'));
        }
        
        setLoading(false);
        setActiveCardId(null);
        toastManager.success('Project improved successfully!');
      } catch (error) {
        setLoading(false);
        setActiveCardId(null);
        logger.error('Improve error:', error);
        toastManager.error('Failed to improve project: ' + error.message);
      }
    };

    const handleSuggest = async () => {
      if (!user()?.id) {
        toastManager.error('Please log in to use AI features');
        return;
      }
      
      logger.info('Starting AI suggestion process for prompt:', prompt().substring(0, 50) + '...');
      const suggestPrompt = `Suggest a compelling startup idea in the legal tech space. Start with the idea name followed by ': ' and then provide a brief description, target market, and unique value proposition in simple English, in only 3 lines. Do not generate in markdown.`;
      
      setLoading(true);
      setActiveCardId('streaming');

      try {
        const suggestedText = await streamQuickLLMCall(
          suggestPrompt,
          user()?.id,
          (chunk) => {
            // Handle streaming chunks if needed
          }
        );
        
        logger.info('AI suggestion received:', suggestedText.substring(0, 100) + '...');
        setPrompt(suggestedText);
        
        const name = suggestedText.length > 50 ? suggestedText.substring(0, 50) + '...' : suggestedText;
        const projectId = await addProject({
          name: name,
          description: suggestedText,
          createdAt: new Date()
        });
        await activityLogger.logProject('created', projectId, name, { source: 'ai_suggestion' });
        _setCurrentProjectId(projectId);
        
        setLoading(false);
        setActiveCardId(null);
        logger.info('Project created from AI suggestion, ID:', projectId);
        toastManager.success('New project created with AI suggestion!');
      } catch (error) {
        setLoading(false);
        setActiveCardId(null);
        logger.error('AI suggestion process failed:', error.message);
        toastManager.error('Failed to get AI suggestion: ' + error.message);
      }
    };



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
      console.log('=== INSTRUCT SUBMIT DEBUG ===');
      console.log('1. selectedTaskId():', taskId);
      console.log('2. tasksList():', tasksList());
      if (taskId) {
        const task = tasksList().find(t => t.id === taskId);
        console.log('3. Found task:', task ? task.id : 'not found');
        if (task) {
          console.log('4. Task ID:', task.id);
          console.log('5. Task title:', task.title);
          console.log('6. Current task content length:', task.content?.length || 0);
          console.log('7. User instruction:', prompt());

          // Create instruction prompt to modify existing content
          const instructionPrompt = `Take this existing content and apply the following instruction: "${prompt()}"

Existing content:
${task.content || task.llm_response || ''}

Please provide the modified content that follows the instruction.`;

          console.log('8. Instruction prompt:', instructionPrompt.substring(0, 200) + '...');
          console.log('9. Calling LLM...');
          try {
            const modifiedContent = await callLLMForStep(instructionPrompt);
            console.log('10. Modified content received, length:', modifiedContent.length);
            console.log('11. Calling updateTask with taskId:', taskId);
            await updateTask(taskId, {
              content: modifiedContent,
              llm_response: modifiedContent,
              prompt: instructionPrompt,
              last_modified: new Date().toISOString()
            });
            console.log('12. Task updated successfully');
            console.log('13. Refreshing tasks list...');
            setTasksList(await getTasks(currentProjectId()));
            console.log('14. Tasks list refreshed');
            setSelectedTaskId(null);
            console.log('15. Selection cleared');
            toastManager.success('Task modified successfully');
          } catch (error) {
            console.error('16. Error:', error);
            logger.error('Error modifying task:', error);
            toastManager.error('Failed to modify task');
          }
        } else {
          console.log('3b. Task not found in tasksList');
        }
      } else {
        console.log('3b. No taskId selected');
      }
      console.log('=== END INSTRUCT SUBMIT DEBUG ===');
    };



    const handleConfirm = async (taskId) => {
      console.log('=== handleConfirm called with taskId:', taskId, '===');
      logger.debug('Home: handleConfirm called with taskId:', taskId);
      const step = getStepHook();
      console.log('step:', step, 'isComplete:', step?.isComplete());
      if (step && !step.isComplete()) {
        console.log('Advancing to next step...');
        toastManager.info('Advancing to next step...');
        try {
          await step.confirm();
          console.log('step.confirm() completed, step.isComplete() now:', step.isComplete());
        } catch (error) {
          console.error('Error in step.confirm():', error);
          return;
        }

        if (!step.isComplete()) {
          console.log('Creating new task for next step');
          try {
            // Create a new streaming task for the next step
            const projectId = currentProjectId();
            const userId = user()?.id;
            console.log('projectId:', projectId, 'userId:', userId);
            console.log('currentStep:', step.currentStep());
            console.log('stepName:', step.stepName());

            const newTaskId = await addTask({
              projectId: projectId,
              title: step.stepName(),
              content: '',
              prompt: buildPrompt(step.currentStep(), step.stepData(), prompt()),
              llm_response: '',
              model: step.currentStep()?.model || 'System',
              section: step.currentStep()?.section || 'Processing',
              stepName: step.stepName()
            }, projectId, userId);
            console.log('New task created with ID:', newTaskId);

            // Start streaming the response for the next step
            let accumulatedResponse = '';
            try {
              const stepPrompt = buildPrompt(step.currentStep(), step.stepData(), prompt());
              console.log('Starting streaming for prompt:', stepPrompt.substring(0, 100) + '...');
              const response = await callLLMForStep(stepPrompt, (chunk) => {
                accumulatedResponse += chunk;

                // Update the task content in the UI progressively
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

              console.log('Streaming completed, response length:', response?.length);
              if (response && typeof response === 'string' && response.trim().length > 0) {
                // Update the task in DB with the final response
                await updateTask(newTaskId, {
                  content: response,
                  llm_response: response
                });

                // Refresh tasks list from DB
                setTasksList(await getTasks(currentProjectId()));
              }
            } catch (streamError) {
              console.error('Streaming failed for next step:', streamError);
              if (accumulatedResponse.trim().length > 0) {
                await updateTask(newTaskId, {
                  content: accumulatedResponse,
                  llm_response: accumulatedResponse
                });
                setTasksList(await getTasks(currentProjectId()));
              }
            }
          } catch (error) {
            console.error('Error creating task for next step:', error);
            toastManager.error('Failed to create next step task');
          }
        }
      }
    };

    const callLLMForStep = async (promptText, onChunk) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let responseText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          responseText += chunk;
          if (onChunk) {
            onChunk(chunk);
          }
        }

        clearTimeout(timeoutId);

        return responseText;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    };







    const getProjectSuggestions = async (idea) => {
      if (!idea || idea.trim().length < 5) return;

      setAiSuggestions([]);
      setGettingSuggestions(true);

      const timeoutId = setTimeout(() => {
        console.warn('AI suggestions timeout, using fallback');
        setGettingSuggestions(false);
        setAiSuggestions([
          { title: "Market Research", description: "Conduct thorough market research to validate your target audience and competitive landscape." },
          { title: "Value Proposition", description: "Clearly define what makes your solution unique and why customers will choose it." },
          { title: "MVP Development", description: "Focus on building a minimum viable product to test your core assumptions quickly." }
        ]);
      }, 15000);

      try {
        const suggestionPrompt = `Analyze this startup idea and provide 3 specific suggestions to improve and refine it: "${idea}"

Return your response as a JSON array of objects, each with "title" and "description" fields. Keep each suggestion concise but actionable.`;

        const response = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: suggestionPrompt })
        });

        if (!response.ok) {
          throw new Error('Failed to get AI suggestions');
        }

        const reader = response.body.getReader();
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            try {
              const codeBlockMatch = accumulatedText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
              let jsonText = null;

              if (codeBlockMatch) {
                jsonText = codeBlockMatch[1];
              } else {
                const arrayMatch = accumulatedText.match(/(\[[\s\S]*?\])/);
                if (arrayMatch) jsonText = arrayMatch[1];
              }

              if (jsonText) {
                const suggestions = JSON.parse(jsonText);
                if (Array.isArray(suggestions) && suggestions.length > 0) {
                  setAiSuggestions(suggestions.slice(0, 3));
                }
              }
            } catch (e) {
              console.warn('Could not parse AI suggestions:', e.message);
            }
            break;
          }

          const chunk = new TextDecoder().decode(value);
          accumulatedText += chunk;
        }

      } catch (error) {
        logger.error('Failed to get AI suggestions:', error);
        setAiSuggestions([
          { title: "Market Research", description: "Conduct thorough market research to validate your target audience and competitive landscape." },
          { title: "Value Proposition", description: "Clearly define what makes your solution unique and why customers will choose it." },
          { title: "MVP Development", description: "Focus on building a minimum viable product to test your core assumptions quickly." }
        ]);
      } finally {
        clearTimeout(timeoutId);
        setGettingSuggestions(false);
      }
    };

    const createProjectWithSetup = async () => {
      try {
        const name = projectName().trim() || 'Untitled Project';
        const description = projectDescription().trim() || 'No description provided';

        const projectId = await addProject({
          name: name,
          description: description,
          createdAt: new Date()
        }, user().id);

        await activityLogger.logProject('created', String(projectId), name, { source: 'manual' });
        _setCurrentProjectId(projectId);
        setPrompt(description);

        setShowProjectModal(false);
        setProjectName('');
        setProjectDescription('');
        setAiSuggestions([]);

        toastManager.success(`Project "${name}" created successfully!`);
        logger.info('Project created with setup, ID:', projectId);

        setStartPressed(true);
        setLoading(true);

        const step = getStepHook();
        if (step && currentProjectId() && user()?.id) {
          // Create task first with empty content
           const taskId = await addTask({
             projectId: currentProjectId(),
             title: step.stepName(),
             content: '',
             prompt: buildPrompt(step.currentStep(), {}, description),
             llm_response: '',
             model: step.currentStep()?.model || 'System',
             section: step.currentStep()?.section || 'Initialization',
             stepName: step.stepName()
           }, currentProjectId(), user()?.id);

          // Update tasks list to show the new task
          setTasksList(await getTasks(currentProjectId()));

            // Now start the streaming process that updates the task
            let accumulatedResponse = '';
            const prompt = buildPrompt(step.currentStep(), {}, description);

            try {
              const response = await callLLMForStep(prompt, (chunk) => {
                accumulatedResponse += chunk;

                // Update the task content in the UI progressively
                setTasksList(currentTasks => {
                  const updatedTasks = currentTasks.map(task => {
                    if (task.id === taskId) {
                      return { ...task, content: accumulatedResponse, last_modified: new Date().toISOString() };
                    }
                    return task;
                  });
                  return [...updatedTasks]; // Ensure new array reference
                });
              });

              if (response && typeof response === 'string' && response.trim().length > 0) {
               // Update the existing task in DB with the final response
               await updateTask(taskId, {
                 content: response,
                 llm_response: response
               });

               // Refresh tasks list from DB
               setTasksList(await getTasks(currentProjectId()));
               toastManager.success('First step completed!');
             } else {
               console.error('Invalid response:', response);
               toastManager.error('Failed to generate response');
             }
           } catch (streamError) {
             console.error('Streaming failed:', streamError);
             // Still save whatever we got
             if (accumulatedResponse.trim().length > 0) {
               console.log('Saving accumulated response due to error:', accumulatedResponse);
               await updateTask(taskId, {
                 content: accumulatedResponse,
                 llm_response: accumulatedResponse
               });
               setTasksList(await getTasks(currentProjectId()));
             }
             throw streamError;
           }
        }

      } catch (error) {
        logger.error('Project creation failed:', error);
        toastManager.error('Failed to create project');
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
        console.log('[handleStart] FUNCTION ENTERED');
        const problemText = prompt();
        console.log('[handleStart] prompt text:', problemText ? problemText.substring(0, 30) + '...' : 'EMPTY');
        if (!problemText || !problemText.trim()) {
            toastManager.error('Please enter a problem statement first');
            return;
        }

        console.log('[handleStart] 1. Starting project creation with problem:', problemText.substring(0, 50) + '...');
        setStartPressed(true);
        setLoading(true);

        try {
            // Create a new project with the problem statement
            const projectData = {
                name: problemText.trim().substring(0, 50) + (problemText.length > 50 ? '...' : ''),
                description: problemText.trim()
            };
            console.log('[handleStart] 2. Creating project with data:', projectData);
            
            const projectId = await addProject(projectData, user()?.id);
            console.log('[handleStart] 3. Project created with ID:', projectId);

            // Set the current project
            _setCurrentProjectId(projectId);
            console.log('[handleStart] 4. currentProjectId set to:', currentProjectId());
            setPrompt(problemText);

            // Create step hook for the new project
            const newStepHook = createStepHook(projectId, () => {
                // onStepChange callback
            });
            stepHook = newStepHook;
            console.log('[handleStart] 5. Step hook created');

            const step = getStepHook();
            if (step && currentProjectId() && user()?.id) {
                console.log('[handleStart] 6. Creating initial task for first step...');
                
                // Create task first with empty content (same as createProjectWithSetup)
                const taskId = await addTask({
                    projectId: currentProjectId(),
                    title: step.stepName(),
                    content: '',
                    prompt: buildPrompt(step.currentStep(), {}, problemText),
                    llm_response: '',
                    model: step.currentStep()?.model || 'System',
                    section: step.currentStep()?.section || 'Initialization',
                    stepName: step.stepName()
                }, currentProjectId(), user()?.id);
                
                console.log('[handleStart] 7. Task created with ID:', taskId);

                // Update tasks list to show the new task
                await setTasksList(await getTasks(currentProjectId()));
                console.log('[handleStart] 8. Tasks list updated:', tasksList());

                // Now start the streaming process that updates the task progressively
                let accumulatedResponse = '';
                const streamingPrompt = buildPrompt(step.currentStep(), {}, problemText);
                console.log('[handleStart] 9. Starting streaming with prompt length:', streamingPrompt.length);

                try {
                    const response = await callLLMForStep(streamingPrompt, (chunk) => {
                        accumulatedResponse += chunk;
                        console.log('[handleStart] Streaming chunk received, length:', accumulatedResponse.length);

                        // Update the task content in the UI progressively
                        setTasksList(currentTasks => {
                            const updatedTasks = currentTasks.map(task => {
                                if (task.id === taskId) {
                                    return { ...task, content: accumulatedResponse, llm_response: accumulatedResponse, last_modified: new Date().toISOString() };
                                }
                                return task;
                            });
                            return [...updatedTasks]; // Ensure new array reference
                        });
                    });

                    console.log('[handleStart] 10. Streaming completed, total length:', accumulatedResponse.length);

                    if (response && typeof response === 'string' && response.trim().length > 0) {
                        // Update the existing task in DB with the final response
                        console.log('[handleStart] 11. Updating task in DB with final response...');
                        await updateTask(taskId, {
                            content: response,
                            llm_response: response
                        });

                        // Refresh tasks list from DB
                        await setTasksList(await getTasks(currentProjectId()));
                        console.log('[handleStart] 12. Final tasks list:', tasksList());
                        toastManager.success('First step completed!');
                    } else {
                        console.error('[handleStart] Invalid response:', response);
                        toastManager.error('Failed to generate response');
                    }
                } catch (streamError) {
                    console.error('[handleStart] Streaming failed:', streamError);
                    // Still save whatever we got
                    if (accumulatedResponse.trim().length > 0) {
                        console.log('[handleStart] Saving partial response to task...');
                        await updateTask(taskId, {
                            content: accumulatedResponse,
                            llm_response: accumulatedResponse
                        });
                        await setTasksList(await getTasks(currentProjectId()));
                        toastManager.warning('Saved partial response due to streaming error');
                    } else {
                        toastManager.error('Streaming failed: ' + streamError.message);
                    }
                }
            } else {
                console.warn('[handleStart] No step hook available, falling back to regenerate');
                // Fallback to original regenerate logic if something went wrong
                await newStepHook.regenerate(callLLMForStep, { problem: problemText });
            }
            
            console.log('[handleStart] 13. Final tasksList:', tasksList());
            console.log('[handleStart] 14. Final startPressed:', startPressed());
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('[handleStart] Failed to start project:', error);
            logger.error('[handleStart] Failed to start project:', error);
            toastManager.error('Failed to start project: ' + error.message);
            setStartPressed(false);
        }
    };

    const handleStartConfirmed = async () => {
      logger.info('Starting AI agent process with confirmed project');
      setStartPressed(true);
      setLoading(true);
      setShowProjectModal(false);

      try {
        await createProjectWithSetup();
        logger.info('Instructions set, starting AI process...');
      } catch (error) {
        logger.error('Start process error:', error);
        toastManager.error('Failed to start process');
        setStartPressed(false);
        setLoading(false);
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

    onMount(() => {
        window.addEventListener('projectDeleted', onProjectDeleted);
        window.addEventListener('openProject', onOpenProject);
        window.addEventListener('projectAdded', () => refetchProjects());

        if (projectsStore.pendingProjectId) {
          const pendingId = projectsStore.pendingProjectId;
          clearPendingProjectId();
          onOpenProject({ detail: pendingId });
        }

        setTimeout(() => {
            if (window.lucide) window.lucide.createIcons();
        }, 100);
    });

    onCleanup(() => {
        window.removeEventListener('projectDeleted', onProjectDeleted);
        window.removeEventListener('openProject', onOpenProject);
        window.removeEventListener('projectAdded', () => refetchProjects());
    });



    createEffect(() => {
        currentProjectId();
        tasks();
        if (Array.isArray(tasks())) {
            setTasksList(filteredTasks());
        }
    });

    createEffect(() => {
      const pid = currentProjectId();
      const projectsList = projects();
      
      if (!pid || !projectsList) return;
      
      const project = projectsList.find(p => p.id === pid);
      
      if (!project) return;
      
      setProjectData(project);
      
      if (project.description && !prompt()) {
        setPrompt(project.description);
      }
      
      if (project.current_step || project.completed_steps !== undefined) {
        if ((project.completed_steps !== undefined && project.completed_steps > 0) || (project.current_step && project.current_step !== 'system')) {
          const step = getStepHook();
          if (step) step.loadFromProject(project);
        }
      }
     });

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

    const stepHookMemo = createMemo(() => getStepHook());

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
                     !!currentProjectId() && (startPressed() || (tasksList && tasksList().length > 0))
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
                         stepName={stepHookMemo()?.stepName || (() => 'Unknown Step')}
                        callLLMForStep={callLLMForStep}
                        refreshTasks={async () => setTasksList(await getTasks(currentProjectId()))}
                        projectName={projectData()?.name}
                        handleInstruct={handleInstruct}
                        handleRegenerate={handleRegenerate}
                        handleConfirm={handleConfirm}
                      />
                </Show>
                 <div style={{display: 'none'}} data-debug-show={(() => {
                     console.log('[DEBUG-UI] shouldShowResponseSection:', !!(currentProjectId() && (startPressed() || (tasksList && tasksList().length > 0))));
                     console.log('[DEBUG-UI] currentProjectId:', currentProjectId());
                     console.log('[DEBUG-UI] startPressed:', startPressed());
                     console.log('[DEBUG-UI] tasksList:', tasksList());
                     console.log('[DEBUG-UI] tasksList.length:', tasksList ? tasksList().length : 'N/A');
                     return '';
                 })()}></div>


              {/* Project Creation Modal */}
              <Show when={showProjectModal()}>
                <div class="modal modal-open">
                  <div class="modal-box max-w-4xl">
                    <h3 class="font-bold text-xl mb-4">Create Your Startup Project</h3>
                    <p class="text-sm text-base-content/70 mb-6">
                      Let's refine your startup idea and create a structured project. Our AI has analyzed your idea and provided suggestions below.
                    </p>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div class="space-y-4">
                        <div>
                          <label class="label">
                            <span class="label-text font-medium">Project Name</span>
                          </label>
                          <input
                            type="text"
                            class="input input-bordered w-full"
                            placeholder="Enter a catchy name for your project"
                            value={projectName()}
                            onInput={(e) => setProjectName(e.target.value)}
                          />
                        </div>

                        <div>
                          <label class="label">
                            <span class="label-text font-medium">Project Description</span>
                          </label>
                          <textarea
                            class="textarea textarea-bordered w-full h-32 resize-none"
                            placeholder="Describe your startup idea in detail..."
                            value={projectDescription()}
                            onInput={(e) => setProjectDescription(e.target.value)}
                          ></textarea>
                        </div>
                      </div>

                      <div class="space-y-4">
                        <div class="flex items-center gap-2">
                          <i data-lucide="sparkles" class="w-5 h-5 text-primary"></i>
                          <h4 class="font-medium">AI Improvement Suggestions</h4>
                          <Show when={gettingSuggestions()}>
                            <span class="loading loading-spinner loading-sm"></span>
                          </Show>
                        </div>

                        <div class="space-y-3 max-h-64 overflow-y-auto">
                          <For each={aiSuggestions()}>
                            {(suggestion, index) => (
                              <div class="card bg-base-200 border border-base-300">
                                <div class="card-body p-4">
                                  <h5 class="card-title text-sm font-medium text-primary">
                                    {index() + 1}. {suggestion.title}
                                  </h5>
                                  <p class="text-sm text-base-content/80">
                                    {suggestion.description}
                                  </p>
                                  <button
                                    class="btn btn-xs btn-outline mt-2"
                                    onClick={() => {
                                      setProjectDescription(prev =>
                                        prev ? prev + '\n\nImprovement: ' + suggestion.description : suggestion.description
                                      );
                                    }}
                                  >
                                    Apply Suggestion
                                  </button>
                                </div>
                              </div>
                            )}
                          </For>

                          <Show when={aiSuggestions().length === 0 && !gettingSuggestions()}>
                            <div class="text-center py-8 text-base-content/60">
                              <i data-lucide="lightbulb" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                              <p>Enter your idea above to get AI-powered improvement suggestions</p>
                            </div>
                          </Show>
                        </div>
                      </div>
                    </div>

                    <div class="modal-action mt-6">
                      <button
                        class="btn btn-ghost"
                        onClick={() => {
                          setShowProjectModal(false);
                          setAiSuggestions([]);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        class="btn btn-primary"
                        onClick={handleStartConfirmed}
                        disabled={!projectName().trim() || !projectDescription().trim()}
                      >
                        Create Project & Start Accelerator
                      </button>
                    </div>
                  </div>
                  <div class="modal-backdrop bg-black/50" onClick={() => setShowProjectModal(false)}></div>
                </div>
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
                 tasksList={tasksList}
                 startPressed={startPressed}
                  handleImprove={handleImprove}
                  handleSuggest={handleSuggest}
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
