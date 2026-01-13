import logger from './logger.js';

// Basic input sanitization utility
export const sanitizeInput = (input) => {
  logger.trace('sanitizeInput: Starting');
  if (typeof input !== 'string') return input;
  // Remove potentially dangerous characters
  return input.replace(/[<>'"&]/g, '');
};

// Validate email
export const isValidEmail = (email) => {
  logger.trace('isValidEmail: Starting');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password (basic)
export const isValidPassword = (password) => {
  logger.trace('isValidPassword: Starting');
  return password && password.length >= 6;
};

// LLM prompt security validation
export const validateLLMPrompt = (prompt) => {
  logger.trace('validateLLMPrompt: Starting validation');

  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, reason: 'Prompt must be a non-empty string' };
  }

  // Check length limits
  if (prompt.length > 10000) {
    return { valid: false, reason: 'Prompt too long (max 10000 characters)' };
  }

  // Check for common jailbreak attempts
  const jailbreakPatterns = [
    /ignore.*previous.*instructions/i,
    /override.*safety/i,
    /bypass.*restrictions/i,
    /act as.*uncensored/i,
    /developer.*mode/i,
    /system.*prompt/i,
    /pretend.*to.*be/i,
    /role.*play.*as/i
  ];

  for (const pattern of jailbreakPatterns) {
    if (pattern.test(prompt)) {
      logger.warn('validateLLMPrompt: Potential jailbreak attempt detected');
      return { valid: false, reason: 'Prompt contains potentially unsafe content' };
    }
  }

  // Check for harmful content keywords
  const harmfulKeywords = [
    'bomb', 'explosive', 'weapon', 'kill', 'murder', 'harm', 'suicide',
    'hack', 'exploit', 'virus', 'malware', 'ransomware',
    'illegal', 'drugs', 'narcotics', 'fraud', 'scam'
  ];

  const lowerPrompt = prompt.toLowerCase();
  for (const keyword of harmfulKeywords) {
    if (lowerPrompt.includes(keyword)) {
      logger.warn('validateLLMPrompt: Harmful content keyword detected:', keyword);
      return { valid: false, reason: 'Prompt contains potentially harmful content' };
    }
  }

  // Sanitize the prompt
  const sanitized = sanitizeInput(prompt);

  logger.trace('validateLLMPrompt: Prompt validated successfully');
  return { valid: true, sanitized };
};