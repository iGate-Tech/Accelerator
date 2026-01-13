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