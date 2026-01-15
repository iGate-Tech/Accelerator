import { updateProject, addProject, getCreditBalance, consumeCredits } from './db';
import logger from './logger';

export const extractProjectName = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  return lines[0]?.trim() || 'New Project';
};

export const handleQuickLLMCall = async (prompt, updatePrompt = true, setPrompt = null, userId = null) => {
  logger.info('handleQuickLLMCall: Starting with prompt length:', prompt?.length);
  try {
    if (userId) {
      const balance = await getCreditBalance(userId);
      if (balance < 5) {
        throw new Error('Insufficient credits. Need at least 5 credits.');
      }
    }

    const response = await fetch('/api/llm/quick', {
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
    }

    if (userId) {
      await consumeCredits(userId, 5, 'Quick LLM request');
    }

    if (updatePrompt && setPrompt) {
      setPrompt(responseText);
    }

    logger.info('handleQuickLLMCall: Completed, response length:', responseText.length);
    return responseText;
  } catch (error) {
    logger.error('handleQuickLLMCall error:', error);
    throw error;
  }
};

export const streamQuickLLMCall = async (prompt, userId = null, onStreamUpdate = null) => {
  logger.info('streamQuickLLMCall: Starting with prompt length:', prompt?.length);
  try {
    if (userId) {
      const balance = await getCreditBalance(userId);
      if (balance < 5) {
        throw new Error('Insufficient credits. Need at least 5 credits.');
      }
    }

    const response = await fetch('/api/llm/quick', {
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
      
      if (onStreamUpdate) {
        onStreamUpdate(responseText);
      }
    }

    if (userId) {
      await consumeCredits(userId, 5, 'Quick LLM request');
    }

    logger.info('streamQuickLLMCall: Completed, response length:', responseText.length);
    return responseText;
  } catch (error) {
    logger.error('streamQuickLLMCall error:', error);
    throw error;
  }
};

export const handleLLMProjectUpdate = async (
  prompt,
  extractProjectName,
  currentProjectId,
  setCurrentProjectId,
  setPrompt,
  setStreamingContent
) => {
  console.log(`[${new Date().toISOString()}] handleLLMProjectUpdate: Starting with prompt length: ${prompt?.length || 0}, currentProjectId: ${currentProjectId()}`);
  try {
    if (!currentProjectId()) {
      console.log(`[${new Date().toISOString()}] handleLLMProjectUpdate: No current project, creating initial project`);
      const tempName = 'New Project';
      const projectId = await addProject({ name: tempName, description: '', createdAt: new Date() });
      console.log(`[${new Date().toISOString()}] handleLLMProjectUpdate: Initial project created with ID: ${projectId}`);
      setCurrentProjectId(projectId);
      window.dispatchEvent(new CustomEvent('projectAdded'));
    } else {
      console.log(`[${new Date().toISOString()}] handleLLMProjectUpdate: Using existing project: ${currentProjectId()}`);
    }

    console.log(`[${new Date().toISOString()}] handleLLMProjectUpdate: Calling LLM API with prompt length: ${prompt?.length || 0}`);
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      console.log(`[${new Date().toISOString()}] handleLLMProjectUpdate: LLM API error: ${response.status}`);
      throw new Error(`LLM API error: ${response.status}`);
    }

    console.log(`[${new Date().toISOString()}] handleLLMProjectUpdate: Starting to read streaming response`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseText = '';
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log(`[${new Date().toISOString()}] handleLLMProjectUpdate: Streaming complete, total chunks: ${chunkCount}, total response length: ${responseText.length}`);
        break;
      }
      const chunk = decoder.decode(value);
      chunkCount++;
      responseText += chunk;
      setStreamingContent(responseText);

      if (chunkCount % 10 === 0) {
        console.log(`[${new Date().toISOString()}] handleLLMProjectUpdate: Received chunk ${chunkCount}, total length: ${responseText.length}`);
      }
    }

    console.log(`[${new Date().toISOString()}] handleLLMProjectUpdate: Streaming completed successfully`);

  } catch (e) {
    console.log(`[${new Date().toISOString()}] handleLLMProjectUpdate: Error - ${e.message}`);
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