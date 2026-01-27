import { addProject } from './db';

export const extractProjectName = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  return lines[0]?.trim() || 'New Project';
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