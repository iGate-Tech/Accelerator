import { updateProject, addProject } from './db';

import logger from './logger';

export const extractProjectName = (text) => {
  // Extract project name from LLM response text
  const lines = text.split('\n').filter(line => line.trim());
  return lines[0]?.trim() || 'New Project';
};

export const handleLLMProjectUpdate = async (
  prompt,
  extractProjectName,
  currentProjectId,
  setCurrentProjectId,
  setPrompt,
  setStreamingContent
) => {
  logger.info('Starting LLM project update process');
  try {
    if (!currentProjectId()) {
      logger.info('Creating initial project for streaming');
      const tempName = 'New Project';
      const projectId = await addProject({ name: tempName, description: '', createdAt: new Date() });
      setCurrentProjectId(projectId);
      window.dispatchEvent(new CustomEvent('projectAdded'));
      logger.info('Initial project created with ID:', projectId);
    }

    logger.info('Calling LLM with prompt length:', prompt.length);
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      responseText += chunk;
      setStreamingContent(responseText);
    }

    setPrompt(responseText);
    const projectName = extractProjectName(responseText);
    logger.info('LLM response received, extracted project name:', projectName);

    logger.info('Updating project ID:', currentProjectId());
    await updateProject(currentProjectId(), { name: projectName, description: responseText });
    window.dispatchEvent(new CustomEvent('projectUpdated'));
    logger.info('Project updated successfully');
  } catch (e) {
    logger.error('Error in LLM project update process:', e.message);
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