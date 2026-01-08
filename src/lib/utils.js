import { updateProject, addProject } from './db';

export const handleLLMProjectUpdate = async (
  callLLM,
  prompt,
  extractProjectName,
  currentProjectId,
  setCurrentProjectId,
  setPrompt
) => {
  try {
    const result = await callLLM(prompt, 0, { streamToTextarea: true });
    setPrompt(result);
    const projectName = extractProjectName(result);
    if (currentProjectId()) {
      await updateProject(currentProjectId(), { name: projectName, description: result });
      window.dispatchEvent(new CustomEvent('projectUpdated'));
    } else {
      const projectId = await addProject({ name: projectName, description: result, createdAt: new Date() });
      setCurrentProjectId(projectId);
      window.dispatchEvent(new CustomEvent('projectAdded'));
    }
  } catch (e) {
    console.error('Error in LLM project update:', e);
  }
};

// Date formatting utilities
export const formatRelativeTime = (dateString, t) => {
  if (!dateString) return t?.unknownDate || 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffMinutes < 1) return t?.justNow || 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const formatLocaleDate = (dateString, lang = 'en') => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};