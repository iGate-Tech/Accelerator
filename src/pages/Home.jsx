import { createSignal, useContext, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { logger } from '@lib/core';
import { AgentInterface } from '../components';
import { useUser } from '../context/UserContext';
import { LangContext } from '../context/LangContext';
import { projectsStore, setProjectsStore } from '../stores/projectsStore';
import { addProject } from '@lib/database';
import { toastManager } from '@lib/ui/feedback';

const TasksContent = () => {
  const { lang } = useContext(LangContext);
  const { user } = useUser();
  const navigate = useNavigate();

  const [currentLang, setCurrentLang] = createSignal(lang());
  const [prompt, setPrompt] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);

  // Classes for AgentInterface positioning
  const agentBoxClass = () => {
    return 'w-full max-w-4xl flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]';
  };

  const agentContentClass = () => {
    return 'flex flex-col gap-4 w-full';
  };

  // Handle creating a new project when user submits a prompt
  const handleStart = async () => {
    if (!prompt() || !prompt().trim()) {
      toastManager.error('Please enter a project description');
      return;
    }

    if (!user()?.id) {
      toastManager.error('User not authenticated');
      return;
    }

    setIsLoading(true);

    try {
      // Create new project
      const projectData = {
        name:
          prompt().trim().substring(0, 50) +
          (prompt().length > 50 ? '...' : ''),
        description: prompt().trim(),
        userId: user().id,
      };

      const projectId = await addProject(projectData, user().id);

      // Set as current project in store
      setProjectsStore('currentProjectId', projectId);

      // Navigate to the opened project page with the project ID
      navigate(`/opened-project/${projectId}`);

      toastManager.success('Project created successfully!');
    } catch (error) {
      logger.error('Error creating project:', error);
      toastManager.error('Failed to create project: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="bg-base-100 mx-auto flex h-screen max-w-md items-center justify-center sm:max-w-lg md:max-w-xl lg:max-w-3xl">
      <AgentInterface
        currentProjectId={() => null} // No project yet
        prompt={prompt}
        setPrompt={setPrompt}
        handleStart={handleStart}
        startPressed={() => false} // Ensure start is not pressed to show greeting
        tasksList={() => []} // No tasks
        selectedTaskId={() => null}
        setSelectedTaskId={() => {}}
        instructPrompt={() => ''}
        setInstructPrompt={() => {}}
        handleInstructSubmit={() => {}}
        showGreeting={true} // Explicitly show the greeting on the home page
      />
    </div>
  );
};

const Tasks = () => {
  return <TasksContent />;
};

export default Tasks;
