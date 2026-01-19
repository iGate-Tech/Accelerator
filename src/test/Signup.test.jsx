import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import Signup from '../pages/Auth/Signup.jsx';
import { useUser } from '../context/UserContext.jsx';
import { useLanguage } from '../hooks/useLanguage.js';
import { sanitizeInput, isValidEmail, isValidPassword } from '../lib/security.js';
import { toastManager } from '../lib/feedback.js';

// Mock dependencies
vi.mock('../context/UserContext.jsx', () => ({
  useUser: vi.fn()
}));

vi.mock('../hooks/useLanguage.js', () => ({
  useLanguage: vi.fn()
}));

vi.mock('../lib/security.js', () => ({
  sanitizeInput: vi.fn(),
  isValidEmail: vi.fn(),
  isValidPassword: vi.fn()
}));

vi.mock('../lib/feedback.js', () => ({
  toastManager: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('@solidjs/router', () => ({
  useNavigate: vi.fn(),
  RouteGuard: ({ children }) => children
}));

vi.mock('../assets/iGate-tech-logo.svg', () => ({
  default: 'logo.svg'
}));

describe('Signup Component - US-AUTH-001: Complete User Registration and Onboarding Flow', () => {
  let mockNavigate;
  let mockSignup;
  let mockT;
  let mockIsAuthenticated;

  beforeEach(() => {
    mockNavigate = vi.fn();
    mockSignup = vi.fn();
    mockT = vi.fn(() => ({
      createAccount: 'Create Account',
      joinJourney: 'Join the journey to accelerate your startup',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      email: 'Email',
      emailPlaceholder: 'Enter your email address',
      password: 'Password',
      passwordPlaceholder: 'Create a strong password',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm your password',
      agreeToTerms: 'I agree to the Terms of Service',
      agreeToPrivacy: 'I agree to the Privacy Policy',
      createAccountBtn: 'Create Account',
      haveAccount: 'Already have an account?',
      signIn: 'Sign In',
      passwordMismatch: 'Passwords do not match',
      passwordTooWeak: 'Password is too weak',
      emailInvalid: 'Please enter a valid email',
      nameRequired: 'Name is required',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      termsRequired: 'You must agree to the terms',
      privacyRequired: 'You must agree to the privacy policy',
      registrationSuccess: 'Account created successfully!',
      registrationError: 'Failed to create account'
    }));
    mockIsAuthenticated = vi.fn(() => false);

    // Setup mocks
    useUser.mockReturnValue({
      signup: mockSignup,
      isAuthenticated: mockIsAuthenticated
    });

    useLanguage.mockReturnValue({
      t: mockT
    });

    sanitizeInput.mockImplementation((input) => input);
    isValidEmail.mockReturnValue(true);
    isValidPassword.mockReturnValue({ valid: true, message: 'Password is strong' });

    // Mock window.lucide
    global.window.lucide = {
      createIcons: vi.fn()
    };
  });

  it('renders signup form correctly', () => {
    render(() => <Signup />);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create a strong password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/ })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(() => <Signup />);

    const submitButton = screen.getByRole('button', { name: /Create Account/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastManager.error).toHaveBeenCalledWith('Name is required');
    });
  });

  it('validates password strength', async () => {
    render(() => <Signup />);

    const submitButton = screen.getByRole('button', { name: /Create Account/ });

    fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'weak' } });
    fireEvent.input(confirmInput, { target: { value: 'weak' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(privacyCheckbox);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastManager.error).toHaveBeenCalledWith('Password too weak');
    });
  });

  it('validates password confirmation match', async () => {
    render(() => <Signup />);

    const nameInput = screen.getByPlaceholderText('fullNamePlaceholder');
    const emailInput = screen.getByPlaceholderText('emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('createPasswordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('confirmPasswordPlaceholder');
    const termsCheckbox = screen.getByLabelText(/Terms of Service/);
    const privacyCheckbox = screen.getByLabelText(/Privacy Policy/);
    const submitButton = screen.getByRole('button', { name: /Create Account/ });

    fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.input(confirmInput, { target: { value: 'DifferentPass123!' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(privacyCheckbox);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastManager.error).toHaveBeenCalledWith('passwordMismatch');
    });
  });

  it('requires GDPR consent checkboxes', async () => {
    render(() => <Signup />);

    const nameInput = screen.getByPlaceholderText('fullNamePlaceholder');
    const emailInput = screen.getByPlaceholderText('emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('createPasswordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('confirmPasswordPlaceholder');
    const submitButton = screen.getByRole('button', { name: /Create Account/ });

    fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.input(confirmInput, { target: { value: 'StrongPass123!' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastManager.error).toHaveBeenCalledWith('Please agree to the Terms of Service');
    });
  });

  it('validates email format', async () => {
    isValidEmail.mockReturnValue(false);

    render(() => <Signup />);

    const nameInput = screen.getByPlaceholderText('fullNamePlaceholder');
    const emailInput = screen.getByPlaceholderText('emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('createPasswordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('confirmPasswordPlaceholder');
    const termsCheckbox = screen.getByLabelText(/Terms of Service/);
    const privacyCheckbox = screen.getByLabelText(/Privacy Policy/);
    const submitButton = screen.getByRole('button', { name: /Create Account/ });

    fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.input(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.input(confirmInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(privacyCheckbox);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastManager.error).toHaveBeenCalledWith('invalidEmail');
    });
  });

  it('handles successful registration', async () => {
    mockSignup.mockResolvedValue({
      success: true,
      user: { id: 1, email: 'john@example.com' }
    });

    render(() => <Signup />);

    const nameInput = screen.getByPlaceholderText('fullNamePlaceholder');
    const emailInput = screen.getByPlaceholderText('emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('createPasswordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('confirmPasswordPlaceholder');
    const termsCheckbox = screen.getByLabelText(/Terms of Service/);
    const privacyCheckbox = screen.getByLabelText(/Privacy Policy/);
    const submitButton = screen.getByRole('button', { name: /Create Account/ });

    fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.input(confirmInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(privacyCheckbox);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('john@example.com', 'StrongPass123!', {
        name: 'John Doe',
        email: 'john@example.com',
        joinDate: expect.any(String),
        bio: ''
      });
      expect(toastManager.success).toHaveBeenCalledWith('accountCreatedLoggedIn');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles registration with email confirmation required', async () => {
    mockSignup.mockResolvedValue({
      success: true,
      needsConfirmation: true,
      user: { id: 1, email: 'john@example.com' }
    });

    render(() => <Signup />);

    const nameInput = screen.getByPlaceholderText('fullNamePlaceholder');
    const emailInput = screen.getByPlaceholderText('emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('createPasswordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('confirmPasswordPlaceholder');
    const termsCheckbox = screen.getByLabelText(/Terms of Service/);
    const privacyCheckbox = screen.getByLabelText(/Privacy Policy/);
    const submitButton = screen.getByRole('button', { name: /Create Account/ });

    fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.input(confirmInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(privacyCheckbox);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastManager.success).toHaveBeenCalledWith('accountCreated');
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('handles duplicate email registration', async () => {
    mockSignup.mockRejectedValue(new Error('User already registered'));

    render(() => <Signup />);

    const nameInput = screen.getByPlaceholderText('fullNamePlaceholder');
    const emailInput = screen.getByPlaceholderText('emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('createPasswordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('confirmPasswordPlaceholder');
    const termsCheckbox = screen.getByLabelText(/Terms of Service/);
    const privacyCheckbox = screen.getByLabelText(/Privacy Policy/);
    const submitButton = screen.getByRole('button', { name: /Create Account/ });

    fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.input(confirmInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(privacyCheckbox);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastManager.error).toHaveBeenCalledWith('emailAlreadyExists');
    });
  });

  it('sanitizes user inputs', async () => {
    sanitizeInput.mockImplementation((input) => `sanitized-${input}`);

    render(() => <Signup />);

    const nameInput = screen.getByPlaceholderText('fullNamePlaceholder');
    const emailInput = screen.getByPlaceholderText('emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('createPasswordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('confirmPasswordPlaceholder');
    const termsCheckbox = screen.getByLabelText(/Terms of Service/);
    const privacyCheckbox = screen.getByLabelText(/Privacy Policy/);
    const submitButton = screen.getByRole('button', { name: /Create Account/ });

    fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.input(confirmInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(privacyCheckbox);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(sanitizeInput).toHaveBeenCalledWith('john@example.com');
      expect(sanitizeInput).toHaveBeenCalledWith('John Doe');
    });
  });

  it('shows password strength indicator', async () => {
    isValidPassword.mockReturnValue({ valid: false, message: 'Password too weak' });

    render(() => <Signup />);

    const passwordInput = screen.getByPlaceholderText('createPasswordPlaceholder');

    fireEvent.input(passwordInput, { target: { value: 'weak' } });

    await waitFor(() => {
      expect(screen.getByText('✗ Password too weak')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    render(() => <Signup />);

    const passwordInput = screen.getByPlaceholderText('createPasswordPlaceholder');
    const toggleButton = screen.getAllByRole('button', { hidden: true }).find(btn =>
      btn.getAttribute('aria-label')?.includes('password')
    );

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe('text');
  });

  it('redirects authenticated users', () => {
    mockIsAuthenticated.mockReturnValue(true);

    render(() => <Signup />);

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('disables submit button when required checkboxes are not checked', () => {
    render(() => <Signup />);

    const submitButton = screen.getByRole('button', { name: /Create Account/ });

    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when all requirements are met', async () => {
    render(() => <Signup />);

    const nameInput = screen.getByPlaceholderText('fullNamePlaceholder');
    const emailInput = screen.getByPlaceholderText('emailPlaceholder');
    const passwordInput = screen.getByPlaceholderText('createPasswordPlaceholder');
    const confirmInput = screen.getByPlaceholderText('confirmPasswordPlaceholder');
    const termsCheckbox = screen.getByLabelText(/Terms of Service/);
    const privacyCheckbox = screen.getByLabelText(/Privacy Policy/);
    const submitButton = screen.getByRole('button', { name: /Create Account/ });

    fireEvent.input(nameInput, { target: { value: 'John Doe' } });
    fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.input(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.input(confirmInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(privacyCheckbox);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});