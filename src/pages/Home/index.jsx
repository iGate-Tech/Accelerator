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
import logger from "../../lib/logger.js";
import { errorHandler, handleAsyncError } from "../../components/ui/ErrorHandler";
import { Skeleton, TaskSkeleton, LoadingOverlay, ProgressLoader } from "../../components/ui/Skeleton";
import {
    agentStore,
    resetAgent,
    enterInstructions,
    regenerate,
    confirm,
    steps,
    stepNames,
    modelMap,
    sectionMap,
    persistableFields,
    extractDataFromTasks,
    stepPrompts,
    fillPrompt,
    initialContext
} from "../../lib/machine";
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
} from "../../lib/db";
import { useUser } from "../../context/UserContext";
import { toastManager } from "../../lib/feedback";
import { useActivityLogger } from "../../lib/activity";
import { handleLLMProjectUpdate, extractProjectName, handleQuickLLMCall, streamQuickLLMCall } from "../../lib/utils";
import {setAgentStore} from "../../lib/machine";
import {marked} from 'marked';
import { confirmReset } from "../../components/ui/GlobalConfirm";
import {renderFilledTemplate} from '../../lib/llm-template';
import { validateLLMPrompt } from '../../lib/security';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import ResponseSection from '../../components/ui/ResponseSection';
import AgentInterface from '../../components/features/home/AgentInterface';
import RouteGuard from '../../components/common/RouteGuard';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { useContext } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";

// Generate prompt to step name mapping dynamically
const promptToStepName = Object.fromEntries(
  Object.entries(stepPrompts).map(([key, prompt]) => [
    prompt.split('\n')[0].trim(),
    stepNames[key]
  ])
);

const getStepName = (task) => {
  logger.trace('getStepName: Starting');
    for (let key in promptToStepName) {
        if (task.prompt && task.prompt.includes(key)) {
            return promptToStepName[key];
        }
    }
    return "Unknown Step";
};

const TasksContent = () => {
    const { lang } = useContext(LangContext);
    const { user } = useUser();
    const activityLogger = useActivityLogger();
    const location = useLocation();
    const navigate = useNavigate();

    // Create logged version of updateTask
    const loggedUpdateTask = async (taskId, updates) => {
      try {
        const result = await updateTask(taskId, updates);
        // Log task update activity
        if (updates.content) {
          await activityLogger.logTask('updated', taskId, updates.content, currentProjectId(), {
            field: 'content',
            length: updates.content.length
          });
        }
        return result;
      } catch (error) {
        await activityLogger.logError('task_update_failed', error, { taskId, updates });
        throw error;
      }
    };

    const [currentLang, setCurrentLang] = createSignal(lang());

    const t = createMemo(() => translations[currentLang()]);

    createEffect(() => {
        setCurrentLang(lang());
    });

    const [currentProjectId, setCurrentProjectId] = createSignal(null);
    const [prompt, setPrompt] = createSignal("");
    const [startPressed, setStartPressed] = createSignal(false);
    const [streamingContent, setStreamingContent] = createSignal("");
  const [streamingError, setStreamingError] = createSignal(null);
    const [tasksList, setTasksList] = createSignal([]);
    const [editingTaskId, setEditingTaskId] = createSignal(null);
    const [editContent, setEditContent] = createSignal("");
    const [activeCardId, setActiveCardId] = createSignal(null);
    const [loading, setLoading] = createSignal(false);
    const [showInstructionsModal, setShowInstructionsModal] = createSignal(false);
    const [instructionsText, setInstructionsText] = createSignal(agentStore.instructions || "");
    const [showProjectModal, setShowProjectModal] = createSignal(false);
    const [projectName, setProjectName] = createSignal('');
    const [projectDescription, setProjectDescription] = createSignal('');
    const [aiSuggestions, setAiSuggestions] = createSignal([]);
    const [gettingSuggestions, setGettingSuggestions] = createSignal(false);
    const [switchingProject, setSwitchingProject] = createSignal(false);
    const [priorityFilter, setPriorityFilter] = createSignal('all');

    // Project data signal
    const [projectData, setProjectData] = createSignal(null);

    // Tasks resource
    const [tasks] = createResource(currentProjectId, async (projectId) => {
        if (!projectId) return [];
        try {
            const result = await getTasks(projectId);
            return result || [];
        } catch (error) {
            logger.error('Error loading tasks:', error);
            return [];
        }
    });

    // Filtered tasks based on priority
    const filteredTasks = createMemo(() => {
        const allTasks = tasks() || [];
        const filter = priorityFilter();
        if (filter === 'all') return allTasks;
        return allTasks.filter(task => task.priority === filter);
    });

    // Projects list resource (for state restoration)
    const [projects] = createResource(
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

    // Agent interface class names
    const agentBoxClass = createMemo(() => {
        const hasProject = currentProjectId() !== null;
        const isActive = hasProject && (startPressed() || (tasksList() && tasksList().length > 0 && agentStore.stepIndex >= steps.length - 1));
        const base = hasProject ? "w-full max-w-6xl " : "w-full max-w-4xl flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]";
        const expanded = "";
        return `${base} ${expanded}`.trim();
    });

    const agentContentClass = createMemo(() => {
        return "flex flex-col gap-4 w-full";
    });

    const greetingClass = createMemo(() => {
        return "text-center mb-8 fade-in";
    });

    // Refs
    let streamingRef;
    let taskRefs = {};
    let textareaRef;

    // Handler functions
    const handleImprove = async () => {
      if (!user()?.id) {
        toastManager.error('Please log in to use AI features');
        return;
      }
      
      const improvedPrompt = `Improve this startup idea for better clarity, specificity, and market potential. Start with the improved idea name followed by ': ' and then provide a concise description in simple English, in only 3 lines. Do not generate in markdown: ${prompt()}`;
      
      setLoading(true);
      setActiveCardId('streaming');
      setStreamingContent('');
      
      try {
        const improvedText = await streamQuickLLMCall(
          improvedPrompt,
          user()?.id,
          (chunk) => {
            setStreamingContent(chunk);
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
        setStreamingContent('');
        toastManager.success('Project improved successfully!');
      } catch (error) {
        setLoading(false);
        setActiveCardId(null);
        setStreamingContent('');
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
      setStreamingContent('');
      
      try {
        const suggestedText = await streamQuickLLMCall(
          suggestPrompt,
          user()?.id,
          (chunk) => {
            setStreamingContent(chunk);
          }
        );
        
        logger.info('AI suggestion received:', suggestedText.substring(0, 100) + '...');
        setPrompt(suggestedText);
        
        const projectName = suggestedText.length > 50 ? suggestedText.substring(0, 50) + '...' : suggestedText;
        const projectId = await addProject({
          name: projectName,
          description: suggestedText,
          createdAt: new Date()
        });
        await activityLogger.logProject('created', projectId, projectName, { source: 'ai_suggestion' });
        setCurrentProjectId(projectId);
        
        setLoading(false);
        setActiveCardId(null);
        setStreamingContent('');
        
        logger.info('Project created from AI suggestion, ID:', projectId);
        toastManager.success('New project created with AI suggestion!');
      } catch (error) {
        setLoading(false);
        setActiveCardId(null);
        setStreamingContent('');
        logger.error('AI suggestion process failed:', error.message);
        toastManager.error('Failed to get AI suggestion: ' + error.message);
      }
    };
      const handleReset = async () => {
        const confirmed = await confirmReset(t().resetAgent, "All current progress and tasks will be cleared.", "This action cannot be undone.");
        if (confirmed) {
          resetAgent();
          setCurrentProjectId(null);
          setPrompt('');
          setTasksList([]);
          setStreamingContent("");
          toastManager.success(t().resetSuccessful);
        }
      };

      const handleRegenerate = async () => {
        if (!currentProjectId()) return;
        setLoading(true);
        setStreamingContent("");
        try {
          await regenerate(callLLMForStep, updateProject, currentProjectId());
          // After regenerate, state becomes confirm
        } catch (error) {
          logger.error('Regenerate error:', error);
          toastManager.error('Regeneration failed');
        } finally {
          setLoading(false);
        }
      };

      const handleConfirmAccept = async () => {
        try {
          await confirm('accept', callLLMForStep, updateProject, currentProjectId());
          // After accept, advances or completes
        } catch (error) {
          logger.error('Confirm accept error:', error);
          toastManager.error('Confirmation failed');
        }
      };

      const handleConfirmRetry = async () => {
        await handleRegenerate();
      };

      const handleConfirmEdit = () => {
        setAgentStore('state', 'instructions');
      };

       const handleConfirmReset = async () => {
         await handleReset();
       };

        const handleInstruct = async () => {
          logger.debug('Home: handleInstruct called');
          setInstructionsText(agentStore.instructions || "");
          setShowInstructionsModal(true);
        };

        const handleSaveInstructions = async () => {
          logger.debug('Home: handleSaveInstructions called');
          enterInstructions(instructionsText());
          setShowInstructionsModal(false);
          toastManager.success('Instructions saved successfully!');
        };

       const handleConfirm = async () => {
         logger.debug('Home: handleConfirm called');
         // TODO: Implement confirmation functionality
         alert('Confirm functionality not yet implemented');
       };

      const processLLMResponse = async (responseText, stepDuration = 1000) => {
        await receiveResponse(
          responseText,
          undefined, // setAutoProgress removed
          setTasksList,
          tasksList,
          addTask,
          updateProject,
          currentProjectId(),
          user()?.id,
          stepDuration
        );

        if (agentStore.stepIndex >= steps.length - 1) {
          setAgentStore('state', 'completed');
          setLoading(false);
          toastManager.success('All 51 steps completed successfully!');
          return false;
        }

        return true;
      };

      const callLLMForStep = async (prompt, isFirstStep = false) => {

        setStreamingContent("");

        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        try {
          const response = await fetch('/api/llm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(errorText || `HTTP ${response.status}`);
          }

        } catch (fetchError) {
          clearTimeout(timeoutId);

          if (fetchError.name === 'AbortError') {
            throw new Error('Request timed out. The AI service is taking too long to respond. Please try again.');
          }

          // Re-throw other errors
          throw fetchError;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let responseText = '';
        let chunkCount = 0;
        const startTime = Date.now();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          chunkCount++;
          responseText += chunk;
          setStreamingContent(responseText);
        }



        return responseText;
      };

      const runNextStep = async () => {
        const currentState = agentStore.state;
        const currentStep = steps[agentStore.stepIndex];
        if (!currentStep) {
          logger.error('No current step');
          setLoading(false);
          return;
        }

        const prompt = buildPrompt(currentStep, agentStore.context, agentStore.instructions);
        if (!prompt) {
          logger.error('No prompt available for current step');
          setLoading(false);
          return;
        }

        try {
          const responseText = await callLLMForStep(prompt);
          if (responseText && responseText.trim().length > 0) {
            await processLLMResponse(responseText);
          } else {
            await processLLMResponse('No response generated.');
          }
          setLoading(false);
        } catch (error) {
          await errorHandler.handleError(error, {
            action: 'llm_call',
            step: agentStore.stepIndex,
            promptLength: prompt()?.length
          }, {
            category: 'ai',
            recoverable: true,
            recoveryAction: 'retry'
          });

          setStreamingError(error.message || 'Failed to get AI response');

           // Auto-retry for certain errors after a delay
           const shouldAutoRetry = error.message.includes('busy') ||
                                   error.message.includes('temporarily unavailable') ||
                                   error.message.includes('connection');

           if (shouldAutoRetry && !agentStore.retryAttempted) {
             logger.info('Auto-retrying LLM call in 5 seconds...');
             setAgentStore('retryAttempted', true);
             setTimeout(() => {
               toastManager.info('Auto-retrying your request...');
               // TODO: Implement auto-retry
               setAgentStore('retryAttempted', false);
             }, 5000);
           }

          setLoading(false);
          setAgentStore('state', 'error');
          setAgentStore('context', 'uiStatus', 'error');
        }
      };

      // Data Export and Backup functionality
      const exportProjectData = async () => {
        try {
          const user = user();
          if (!user?.id) {
            toastManager.error('User not authenticated');
            return;
          }

          // Get all projects for the user
          const projects = await getProjects(user.id);

          // Get tasks for each project
          const exportData = {
            exportDate: new Date().toISOString(),
            userId: user.id,
            projects: []
          };

          for (const project of projects) {
            const tasks = await _getTasks({ projectId: project.id });
            exportData.projects.push({
              ...project,
              tasks: tasks
            });
          }

          // Create and download JSON file
          const dataStr = JSON.stringify(exportData, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

          const exportFileDefaultName = `accelerator-backup-${new Date().toISOString().split('T')[0]}.json`;

          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();

          toastManager.success('Project data exported successfully!');
          logger.info('Project data exported for user:', user.id);

        } catch (error) {
          await errorHandler.handleError(error, {
            action: 'export_project',
            projectId: currentProjectId()
          }, {
            category: 'storage',
            recoverable: true
          });
        }
      };

      const importProjectData = async (event) => {
        try {
          const file = event.target.files[0];
          if (!file) return;

          const text = await file.text();
          const importData = JSON.parse(text);

          const user = user();
          if (!user?.id || importData.userId !== user.id) {
            toastManager.error('Invalid backup file or user mismatch');
            return;
          }

          // Import projects and tasks
          for (const projectData of importData.projects) {
            // Create project (skip if it already exists)
            const existingProject = await getProjectById(projectData.id);
            if (!existingProject) {
              const projectId = await addProject({
                name: projectData.name,
                description: projectData.description,
                createdAt: new Date()
              });
              // Update with additional fields if needed
              await updateProject(projectId, {
                currentModel: projectData.current_model,
                totalSteps: projectData.total_steps,
                completedSteps: projectData.completed_steps,
                consumedCredits: projectData.consumed_credits,
                totalCredits: projectData.total_credits,
                public: projectData.public
              });
            }

            // Import tasks
            for (const task of projectData.tasks) {
              await addTask({
                projectId: projectData.id,
                content: task.content,
                prompt: task.prompt,
                llmResponse: task.llm_response,
                model: task.model,
                section: task.section,
                stepName: task.step_name
              });
            }
          }

          // Refresh data
          refetchProjects();
          toastManager.success('Project data imported successfully!');
          logger.info('Project data imported for user:', user.id);

        } catch (error) {
          logger.error('Import failed:', error);
          toastManager.error('Failed to import project data');
        }
      };

      // Auto-backup functionality (runs periodically)
      const performAutoBackup = async () => {
        try {
          const user = user();
          if (!user?.id) return;

          const projects = await getProjects(user.id);
          const backupData = {
            backupDate: new Date().toISOString(),
            userId: user.id,
            projects: []
          };

          for (const project of projects) {
            const tasks = await _getTasks({ projectId: project.id });
            backupData.projects.push({
              ...project,
              tasks: tasks
            });
          }

          // Store backup in localStorage (could be extended to cloud storage)
          const backupKey = `accelerator_backup_${user.id}`;
          localStorage.setItem(backupKey, JSON.stringify(backupData));

          logger.info('Auto-backup completed for user:', user.id);

        } catch (error) {
          logger.error('Auto-backup failed:', error);
        }
      };

      // Project creation with AI suggestions
      const getProjectSuggestions = async (idea) => {
        if (!idea || idea.trim().length < 5) return;

        setGettingSuggestions(true);
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

          // Parse the streaming response to extract suggestions
          const reader = response.body.getReader();
          let accumulatedText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            accumulatedText += chunk;

            // Try to parse JSON from accumulated text
            try {
              const jsonMatch = accumulatedText.match(/\[.*\]/s);
              if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                if (Array.isArray(suggestions) && suggestions.length > 0) {
                  setAiSuggestions(suggestions.slice(0, 3)); // Limit to 3 suggestions
                  break;
                }
              }
            } catch (e) {
              // Continue accumulating
            }
          }

        } catch (error) {
          logger.error('Failed to get AI suggestions:', error);
          // Provide fallback suggestions
          setAiSuggestions([
            {
              title: "Market Research",
              description: "Conduct thorough market research to validate your target audience and competitive landscape."
            },
            {
              title: "Value Proposition",
              description: "Clearly define what makes your solution unique and why customers will choose it."
            },
            {
              title: "MVP Development",
              description: "Focus on building a minimum viable product to test your core assumptions quickly."
            }
          ]);
        } finally {
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
          });

          await activityLogger.logProject('created', projectId, name, { source: 'manual' });
          setCurrentProjectId(projectId);
          setPrompt(description);
          enterInstructions(description);

          setShowProjectModal(false);
          setProjectName('');
          setProjectDescription('');
          setAiSuggestions([]);

          toastManager.success(`Project "${name}" created successfully!`);
          logger.info('Project created with setup, ID:', projectId);

        } catch (error) {
          logger.error('Project creation failed:', error);
          toastManager.error('Failed to create project');
        }
      };

      // Set up auto-save interval for project state (every 5 minutes)
      let stateSaveInterval;
      onMount(() => {
        const backupInterval = setInterval(performAutoBackup, 30 * 60 * 1000);
        stateSaveInterval = setInterval(() => {
          if (currentProjectId()) {
            saveCurrentProjectState();
          }
        }, 5 * 60 * 1000); // Save state every 5 minutes
        onCleanup(() => {
          clearInterval(backupInterval);
          clearInterval(stateSaveInterval);
        });
      });

      // Save state when window unloads
      onMount(() => {
        const handleBeforeUnload = () => {
          if (currentProjectId()) {
            saveCurrentProjectState();
          }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        onCleanup(() => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        });
      });

      const handleStart = async () => {
        if (!prompt() || prompt().trim().length < 5) {
          toastManager.error('Please enter a valid startup idea (at least 5 characters)');
          return;
        }

        // Open project creation modal instead of direct creation
        setProjectDescription(prompt());
        setProjectName(prompt().length > 30 ? prompt().substring(0, 30) + '...' : prompt());
        setShowProjectModal(true);

        // Get AI suggestions in background
        getProjectSuggestions(prompt());
      };

      const handleStartConfirmed = async () => {
        logger.info('Starting AI agent process with confirmed project');
        setStartPressed(true);
        setLoading(true);
        setStreamingContent("");
        setStreamingError(null);
        setShowProjectModal(false);

        try {
          await createProjectWithSetup();

          // Now start the AI process
          enterInstructions(prompt());
          logger.info('Instructions set, ready to regenerate...');
          // Note: User now manually clicks regenerate in UI
        } catch (error) {
          logger.error('Start process error:', error);
          toastManager.error('Failed to start process');
          setStartPressed(false);
          setLoading(false);
          setAgentStore('state', 'error');
          setAgentStore('context', 'uiStatus', 'error');
        }
      };


      

      
      const onProjectDeleted = (e) => {
        if (currentProjectId() === e.detail.projectId) {
          setCurrentProjectId(null);
          setPrompt('');
          setTasksList([]);
          setAgentStore('context', initialContext);
        }
      };
      
      const onResetAgent = () => {
        handleReset();
      };
      
      const onOpenProject = async (e) => {
        const pid = e.detail;
        if (currentProjectId() === pid) {
          return;
        }

        setSwitchingProject(true);
        try {
          logger.info('Switching to project:', pid);

          // Save current project state before switching
          if (currentProjectId()) {
            await saveCurrentProjectState();
          }

          // Switch to new project
          setCurrentProjectId(pid);

          // Update user profile with current project
          await updateEntity({
            table: 'profiles',
            idField: 'user_id',
            id: user().id,
            updates: { current_project_id: pid }
          });

          // Load and restore project state
          await loadProjectState(pid);

           // Refresh UI and data

          toastManager.success('Switched to project successfully');
          logger.info('Successfully switched to project:', pid);

        } catch (error) {
          logger.error('Project switching failed:', error);
          toastManager.error('Failed to switch project');
        } finally {
          setSwitchingProject(false);
        }
      };

      // Save current project state
      const saveCurrentProjectState = async () => {
        const projectId = currentProjectId();
        if (!projectId) return;

        try {
          const projectState = {
            current_step: agentStore.stepIndex,
            completed_steps: agentStore.completedSteps || 0,
            instructions: agentStore.instructions,
            ui_progress: agentStore.uiProgress || 0,
            ui_message: agentStore.uiMessage || '',
            ui_status: agentStore.uiStatus || 'idle',
            last_updated: new Date().toISOString()
          };

          await updateEntity({
            table: 'projects',
            idField: 'id',
            id: projectId,
            updates: projectState
          });

          logger.debug('Project state saved for:', projectId);
        } catch (error) {
          logger.error('Failed to save project state:', error);
        }
      };

      // Load and restore project state
      const loadProjectState = async (projectId) => {
        try {
          const projects = await getProjects(user().id);
          const project = projects.find(p => p.id === projectId);

          if (!project) {
            logger.warn('Project not found:', projectId);
            return;
          }

          // Restore agent state
          setAgentStore('stepIndex', project.current_step || 0);
          setAgentStore('completedSteps', project.completed_steps || 0);
          setAgentStore('instructions', project.instructions || '');
          setAgentStore('uiProgress', project.ui_progress || 0);
          setAgentStore('uiMessage', project.ui_message || '');
          setAgentStore('uiStatus', project.ui_status || 'idle');

          // Restore UI state
          setPrompt(project.instructions || '');
          setStartPressed(project.current_step > 0);

          // Load project tasks
          const tasks = await getTasks(projectId);
          setTasksList(tasks);

          // Update project data for UI
          setProjectData(project);

          logger.debug('Project state restored for:', projectId);
        } catch (error) {
          logger.error('Failed to load project state:', error);
        }
      };

       onMount(() => {
           window.addEventListener('projectDeleted', onProjectDeleted);
           window.addEventListener('resetAgent', onResetAgent);
           window.addEventListener('openProject', onOpenProject);

            // Create Lucide icons after a delay to ensure script loaded
            setTimeout(() => {
                if (window.lucide)
                    window.lucide.createIcons();
            }, 100);

            // Load selected project from user profile
            if (user()?.id) {
              getUserProfile(user().id).then(profile => {
                if (profile?.current_project_id) {
                  setCurrentProjectId(profile.current_project_id);
                }
              });
            }

            // Load priority filter from URL
            const urlParams = new URLSearchParams(location.search);
            const priority = urlParams.get('priority') || 'all';
            setPriorityFilter(priority);
        });

       onCleanup(() => {
           window.removeEventListener('projectDeleted', onProjectDeleted);
           window.removeEventListener('resetAgent', onResetAgent);
           window.removeEventListener('openProject', onOpenProject);
       });

        // Set tasksList when project changes or filter changes
        createEffect(() => {
            currentProjectId();
            tasks();
            priorityFilter();
            if (Array.isArray(tasks())) {
                setTasksList(filteredTasks());
            }
        });



    // Save progress to current project when context changes (debounced)
    let saveTimeout;
    createEffect(() => {
      agentStore.context; // trigger on change
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        if (currentProjectId() && agentStore.context && typeof agentStore.context === 'object') {
          try {
            const updates = {};
             persistableFields.forEach(field => {
               updates[field] = agentStore[field];
             });
               updateProject(currentProjectId(), updates);
            } catch (error) {
            }
          }
        }, 1000);
      });

      // Restore machine state from project data when project changes
      createEffect(() => {
        const pid = currentProjectId();
        const projectsList = projects();
        
        if (!pid || !projectsList) return;
        
        const project = projectsList.find(p => p.id === pid);
        console.log('Checking project restoration:', pid, project?.current_step, project?.completed_steps);
        
        if (!project) return;
        
        // Set project data for UI display
        setProjectData(project);
        
        // Set prompt to project description if available
        if (project.description && !prompt()) {
          setPrompt(project.description);
        }
        
        if (project.current_step || project.completed_steps !== undefined) {
          // Only restore if we have saved progress (not initial state)
          if ((project.completed_steps !== undefined && project.completed_steps > 0) || (project.current_step && project.current_step !== 'system')) {
            // Restore saved state
            persistableFields.forEach(field => {
              if (project[field] !== undefined) {
                setAgentStore(field, project[field]);
              }
            });
            console.log('Restored agent state from project');
          } else {
            console.log('No progress to restore - completed_steps:', project.completed_steps, 'current_step:', project.current_step);
          }
        } else {
          console.log('No saved state found - current_step:', project.current_step, 'completed_steps:', project.completed_steps);
        }
       });

    // Show loading state if essential data is not ready
    const isLoading = () => {
        if (!currentProjectId())
            return false;
        // No loading when no project selected
        return !agentStore || !tasksList || currentLang() === undefined;
    };

     createEffect(() => {
         if (isLoading() && streamingContent()) {
            setActiveCardId('streaming');
        } else { // Find the latest task matching the current step
            const currentStepName = steps[agentStore.stepIndex]?.name;
            const matchingTask = [...tasksList()].reverse().find(task => getStepName(task) === currentStepName);
            setActiveCardId(matchingTask ? matchingTask.id : null);
        }
    });

    return (
        <RouteGuard requireAuth={true}>

        {/* Project Switching Loading Overlay */}
        <LoadingOverlay
          isLoading={switchingProject}
          message="Switching Projects..."
          timeout={15000}
          onTimeout={() => {
            toastManager.warning('Project switching is taking longer than expected. Please try refreshing the page.');
          }}
        />

  <div className="flex flex-col items-center">
              <Show when={!!currentProjectId()}>
                <div class="w-full max-w-4xl mb-4">
                  <div class="flex justify-end">
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Filter by Priority</span>
                      </label>
                      <select
                        class="select select-bordered select-sm"
                        value={priorityFilter()}
                        onChange={(e) => {
                          const newPriority = e.target.value;
                          setPriorityFilter(newPriority);
                          // Update URL
                          const url = new URL(window.location);
                          if (newPriority === 'all') {
                            url.searchParams.delete('priority');
                          } else {
                            url.searchParams.set('priority', newPriority);
                          }
                          navigate(url.pathname + url.search, { replace: true });
                        }}
                      >
                        <option value="all">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Show>
               <Show when={
                   !!currentProjectId() && (startPressed() || (tasksList && tasksList().length > 0))
               }>
                  <ResponseSection tasksList={tasksList} />
               </Show>
              <Show when={!!currentProjectId() && filteredTasks().length === 0 && priorityFilter() !== 'all'}>
                <div class="w-full max-w-4xl text-center py-8">
                  <i data-lucide="filter-x" class="w-12 h-12 mx-auto mb-4 text-base-content/40"></i>
                  <h3 class="text-lg font-medium mb-2">No tasks match the selected priority</h3>
                  <p class="text-base-content/60 mb-4">Try selecting a different priority filter</p>
                  <button
                    class="btn btn-outline"
                    onClick={() => setPriorityFilter('all')}
                  >
                    Show All Tasks
                  </button>
                </div>
              </Show>

             <AgentInterface key={currentProjectId()} agentBoxClass={agentBoxClass} currentProjectId={currentProjectId}
                agentContentClass={agentContentClass}
                greetingClass={greetingClass}
               projectData={projectData}
               isLoading={isLoading}
               agentStore={agentStore}
               textareaRef={textareaRef}
               prompt={prompt}
                setPrompt={setPrompt}
                tasksList={tasksList}
                startPressed={startPressed}
                handleImprove={handleImprove}
                 handleSuggest={handleSuggest}
                 handleInstruct={handleInstruct}
                 handleConfirm={handleConfirm}
                 handleReset={handleReset}
                 handleStart={handleStart}
                handleRegenerate={handleRegenerate}
                handleConfirmAccept={handleConfirmAccept}
                handleConfirmRetry={handleConfirmRetry}
                handleConfirmEdit={handleConfirmEdit}
                handleConfirmReset={handleConfirmReset}
              />

              {/* Instructions Modal */}
              <Show when={showInstructionsModal()}>
                <div class="modal modal-open">
                  <div class="modal-box max-w-2xl">
                    <h3 class="font-bold text-lg mb-4">Custom Instructions</h3>
                    <p class="text-sm text-base-content/70 mb-4">
                      Provide custom instructions for the AI agent. These will guide how the AI processes your startup idea through the 51-step accelerator.
                    </p>
                    <textarea
                      class="textarea textarea-bordered w-full h-48 resize-none"
                      placeholder="Enter your custom instructions here..."
                      value={instructionsText()}
                      onInput={(e) => setInstructionsText(e.target.value)}
                    ></textarea>
                    <div class="modal-action">
                      <button
                        class="btn btn-ghost"
                        onClick={() => setShowInstructionsModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        class="btn btn-primary"
                        onClick={handleSaveInstructions}
                      >
                        Save Instructions
                      </button>
                    </div>
                  </div>
                  <div class="modal-backdrop bg-black/50" onClick={() => setShowInstructionsModal(false)}></div>
                </div>
              </Show>

              {/* Project Creation Modal */}
              <Show when={showProjectModal()}>
                <div class="modal modal-open">
                  <div class="modal-box max-w-4xl">
                    <h3 class="font-bold text-xl mb-4">Create Your Startup Project</h3>
                    <p class="text-sm text-base-content/70 mb-6">
                      Let's refine your startup idea and create a structured project. Our AI has analyzed your idea and provided suggestions below.
                    </p>

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Project Setup */}
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

                      {/* AI Suggestions */}
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
 </div>
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
