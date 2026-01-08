// Basic input sanitization utility
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Remove potentially dangerous characters
  return input.replace(/[<>'"&]/g, '');
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password (basic)
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};