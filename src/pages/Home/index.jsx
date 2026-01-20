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
    steps, 
    stepNames,
    buildPrompt,
    fillPrompt,
    extractData 
} from "../../lib/machine";
import { createStepHook } from "../../lib/useStep";
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
import {marked} from 'marked';
import { confirmReset } from "../../components/ui/GlobalConfirm";
import AgentInterface from '../../components/features/home/AgentInterface';
import {renderFilledTemplate} from '../../lib/llm-template';
import { validateLLMPrompt } from '../../lib/security';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import ResponseSection from '../../components/ui/ResponseSection';
import RouteGuard from '../../components/common/RouteGuard';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { useContext } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";

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
    const [instructionsText, setInstructionsText] = createSignal("");
    const [showProjectModal, setShowProjectModal] = createSignal(false);
    const [projectName, setProjectName] = createSignal('');
    const [projectDescription, setProjectDescription] = createSignal('');
    const [aiSuggestions, setAiSuggestions] = createSignal([]);
    const [gettingSuggestions, setGettingSuggestions] = createSignal(false);
    const [switchingProject, setSwitchingProject] = createSignal(false);
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
            const result = await getTasks(projectId);
            return result || [];
        } catch (error) {
            logger.error('Error loading tasks:', error);
            return [];
        }
    });

    const filteredTasks = createMemo(() => {
        return tasks() || [];
    });

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

    const agentBoxClass = createMemo(() => {
        const hasProject = currentProjectId() !== null;
        const step = getStepHook();
        const isActive = hasProject && (startPressed() || (tasksList() && tasksList().length > 0 && step?.stepIndex() >= steps.length - 1));
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

    let streamingRef;
    let taskRefs = {};
    let textareaRef;

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
        
        const name = suggestedText.length > 50 ? suggestedText.substring(0, 50) + '...' : suggestedText;
        const projectId = await addProject({
          name: name,
          description: suggestedText,
          createdAt: new Date()
        });
        await activityLogger.logProject('created', projectId, name, { source: 'ai_suggestion' });
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

    const handleResetStep = async () => {
      const step = getStepHook();
      if (step) {
        await step.resetStep();
        setStreamingContent('');
        toastManager.success('Step reset');
      }
    };

    const handleResetProject = async () => {
      const confirmed = await confirmReset(t().resetAgent, "All current progress and tasks will be cleared.", "This action cannot be undone.");
      if (confirmed) {
        const step = getStepHook();
        if (step) {
          await step.resetProject();
        }
        setCurrentProjectId(null);
        setPrompt('');
        setTasksList([]);
        setStreamingContent("");
        setStartPressed(false);
        toastManager.success(t().resetSuccessful);
      }
    };

    const handleRegenerate = async () => {
      const step = getStepHook();
      if (!step || !currentProjectId()) return;
      
      setLoading(true);
      setStreamingContent("");
      setStreamingError(null);
      
      try {
        const response = await step.regenerate(callLLMForStep, prompt());
        setStreamingContent(response);
      } catch (error) {
        logger.error('Regenerate error:', error);
        toastManager.error('Regeneration failed: ' + error.message);
        setStreamingError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const handleConfirmAccept = async () => {
      const step = getStepHook();
      if (!step) return;
      
      try {
        const response = step.currentResponse();
        if (response) {
          await addTask({
            projectId: currentProjectId(),
            content: response,
            prompt: buildPrompt(step.currentStep(), {}, prompt()),
            llmResponse: response,
            model: 'System',
            section: 'Initialization',
            stepName: step.stepName()
          });
        }
        
        await step.confirm();
        
        if (step.isComplete()) {
          toastManager.success('All steps completed successfully!');
        }
      } catch (error) {
        logger.error('Confirm accept error:', error);
        toastManager.error('Confirmation failed');
      }
    };

    const handleConfirmRetry = async () => {
      await handleRegenerate();
    };

    const handleConfirmEdit = () => {
      setShowInstructionsModal(true);
    };

    const handleConfirmReset = async () => {
      await handleResetStep();
    };

    const handleInstruct = async () => {
      logger.debug('Home: handleInstruct called');
      setInstructionsText(prompt());
      setShowInstructionsModal(true);
    };

    const handleSaveInstructions = async () => {
      logger.debug('Home: handleSaveInstructions called');
      setPrompt(instructionsText());
      setShowInstructionsModal(false);
      toastManager.success('Instructions saved successfully!');
    };

    const handleConfirm = async () => {
      logger.debug('Home: handleConfirm called');
      await handleConfirmAccept();
    };

    const callLLMForStep = async (promptText) => {
      setStreamingContent("");
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
        let chunkCount = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          chunkCount++;
          responseText += chunk;
          setStreamingContent(responseText);
        }

        clearTimeout(timeoutId);
        return responseText;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The AI service is taking too long to respond. Please try again.');
        }
        throw fetchError;
      }
    };

    const runNextStep = async () => {
      const step = getStepHook();
      if (!step) return;

      const currentStep = step.currentStep();
      if (!currentStep) {
        logger.error('No current step');
        setLoading(false);
        return;
      }

      const builtPrompt = buildPrompt(currentStep, {}, prompt());
      if (!builtPrompt) {
        logger.error('No prompt available for current step');
        setLoading(false);
        return;
      }

      try {
        setStreamingContent("");
        setStreamingError(null);
        const responseText = await callLLMForStep(builtPrompt);
        
        if (responseText && responseText.trim().length > 0) {
          setStreamingContent(responseText);
        } else {
          setStreamingContent('No response generated.');
        }
        setLoading(false);
      } catch (error) {
        await errorHandler.handleError(error, {
          action: 'llm_call',
          step: step.stepIndex()
        }, {
          category: 'ai',
          recoverable: true,
          recoveryAction: 'retry'
        });

        setStreamingError(error.message || 'Failed to get AI response');
        setLoading(false);
      }
    };

    const exportProjectData = async () => {
      try {
        const u = user();
        if (!u?.id) {
          toastManager.error('User not authenticated');
          return;
        }

        const projectsList = await getProjects(u.id);
        const exportData = {
          exportDate: new Date().toISOString(),
          userId: u.id,
          projects: []
        };

        for (const project of projectsList) {
          const tasks = await getTasks(project.id);
          exportData.projects.push({
            ...project,
            tasks: tasks
          });
        }

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `accelerator-backup-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        toastManager.success('Project data exported successfully!');
        logger.info('Project data exported for user:', u.id);

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

        const u = user();
        if (!u?.id || importData.userId !== u.id) {
          toastManager.error('Invalid backup file or user mismatch');
          return;
        }

        for (const projectData of importData.projects) {
          const existingProject = await getProjectById(projectData.id);
          if (!existingProject) {
            const projectId = await addProject({
              name: projectData.name,
              description: projectData.description,
              createdAt: new Date()
            });
            await updateProject(projectId, {
              currentModel: projectData.current_model,
              totalSteps: projectData.total_steps,
              completedSteps: projectData.completed_steps,
              consumedCredits: projectData.consumed_credits,
              totalCredits: projectData.total_credits,
              public: projectData.public
            });
          }

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

        refetchProjects();
        toastManager.success('Project data imported successfully!');
        logger.info('Project data imported for user:', u.id);

      } catch (error) {
        logger.error('Import failed:', error);
        toastManager.error('Failed to import project data');
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
        });

        await activityLogger.logProject('created', projectId, name, { source: 'manual' });
        setCurrentProjectId(projectId);
        setPrompt(description);

        setShowProjectModal(false);
        setProjectName('');
        setProjectDescription('');
        setAiSuggestions([]);

        toastManager.success(`Project "${name}" created successfully!`);
        logger.info('Project created with setup, ID:', projectId);

        setStartPressed(true);
        setLoading(true);
        setStreamingContent("");
        setStreamingError(null);

        const step = getStepHook();
        if (step) {
          const response = await step.regenerate(callLLMForStep, description);
          setStreamingContent(response);
        }

      } catch (error) {
        logger.error('Project creation failed:', error);
        toastManager.error('Failed to create project');
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
      onCleanup(() => {
        clearInterval(backupInterval);
        clearInterval(stateSaveInterval);
      });
    });

    const handleBeforeUnload = () => {
      const step = getStepHook();
      if (currentProjectId() && step) {
        step.persist();
      }
    };

    onMount(() => {
      window.addEventListener('beforeunload', handleBeforeUnload);
      onCleanup(() => window.removeEventListener('beforeunload', handleBeforeUnload));
    });

    const handleStart = async () => {
      if (!prompt() || prompt().trim().length < 5) {
        toastManager.error('Please enter a valid startup idea (at least 5 characters)');
        return;
      }

      setProjectDescription(prompt());
      setProjectName(prompt().length > 30 ? prompt().substring(0, 30) + '...' : prompt());
      await createProjectWithSetup();
      setStartPressed(true);
      setLoading(true);
      setStreamingContent("");
      setStreamingError(null);

      logger.info('Project created and instructions set, ready to start AI process...');
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
        setCurrentProjectId(null);
        setPrompt('');
        setTasksList([]);
        stepHook = null;
      }
    };
    
    const onResetAgent = () => {
      handleResetProject();
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

        setCurrentProjectId(pid);
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
      try {
        const projectsList = await getProjects(user().id);
        const project = projectsList.find(p => p.id === projectId);

        if (!project) {
          logger.warn('Project not found:', projectId);
          return;
        }

        setProjectData(project);
        setPrompt(project.description || '');
        setStartPressed((project.current_step || 0) > 0);

        const tasks = await getTasks(projectId);
        setTasksList(tasks);

        const step = getStepHook();
        if (step && project.current_step) {
          step.loadFromProject(project);
        }

        logger.debug('Project state restored for:', projectId);
      } catch (error) {
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

    const refetchProjects = () => {
      projects.refetch();
    };

    onMount(() => {
        window.addEventListener('projectDeleted', onProjectDeleted);
        window.addEventListener('resetAgent', onResetAgent);
        window.addEventListener('openProject', onOpenProject);

        setTimeout(() => {
            if (window.lucide) window.lucide.createIcons();
        }, 100);
    });

    onCleanup(() => {
        window.removeEventListener('projectDeleted', onProjectDeleted);
        window.removeEventListener('resetAgent', onResetAgent);
        window.removeEventListener('openProject', onOpenProject);
    });

    createEffect(() => {
        const currentUser = user();
        if (currentUser?.id) {
            getUserProfile(currentUser.id).then(profile => {
                if (profile?.current_project_id) {
                    setCurrentProjectId(profile.current_project_id);
                }
            }).catch(error => {
                logger.debug('Failed to load user profile:', error);
            });
        }
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
            const step = getStepHook();
            if (!step) return true;
            return !tasksList || currentLang() === undefined;
        } catch {
            return false;
        }
    };

    const step = createMemo(() => getStepHook());

    createEffect(() => {
        if (isLoading() && streamingContent()) {
           setActiveCardId('streaming');
       } else {
           const currentStep = step()?.currentStep();
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
                }>
                   <ResponseSection tasksList={tasksList} />
                </Show>

              {/* Instructions Modal */}
              <Show when={showInstructionsModal()}>
                <div class="modal modal-open">
                  <div class="modal-box max-w-2xl">
                    <h3 class="font-bold text-lg mb-4">Custom Instructions</h3>
                    <p class="text-sm text-base-content/70 mb-4">
                      Provide custom instructions for the AI agent. These will guide how the AI processes your startup idea through the accelerator steps.
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
                 agentStore={step()}
                 textareaRef={textareaRef}
                 prompt={prompt}
                 setPrompt={setPrompt}
                 tasksList={tasksList}
                 startPressed={startPressed}
                 handleImprove={handleImprove}
                 handleSuggest={handleSuggest}
                 handleInstruct={handleInstruct}
                 handleConfirm={handleConfirm}
                 handleReset={handleResetProject}
                 handleResetStep={handleResetStep}
                 handleStart={handleStart}
                 handleRegenerate={handleRegenerate}
                 handleConfirmAccept={handleConfirmAccept}
                 handleConfirmRetry={handleConfirmRetry}
                 handleConfirmEdit={handleConfirmEdit}
                 handleConfirmReset={handleConfirmReset}
                 streamingContent={streamingContent}
                 streamingError={streamingError}
                 steps={steps}
                 stepNames={stepNames}
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
