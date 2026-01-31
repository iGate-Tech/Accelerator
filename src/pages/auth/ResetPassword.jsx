import { createSignal, onMount, createEffect } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useUser } from '@context/UserContext';
import { useLanguage } from '@hooks/useLanguage';
import {
  sanitizeInput,
  isValidEmail,
  isValidPassword,
} from '@lib/auth/security';
import { toastManager } from '@lib/ui/feedback';
import { RouteGuard } from '@components';
import logo from '@assets/images/iGate-tech-logo.svg';
import { logger } from '@lib/core';
import { Eye, EyeOff, AlertCircle } from 'lucide-solid';
import { useDocumentTitle } from '@hooks/useDocumentTitle';

const ResetPassword = () => {
  logger.trace('ResetPassword: Starting');
  const navigate = useNavigate();
  const params = useParams();

  // Set document title
  useDocumentTitle('Reset Password');

  const { resetPassword, isAuthenticated } = useUser();
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = createSignal('');
  const [confirmPassword, setConfirmPassword] = createSignal('');
  const [showPassword, setShowPassword] = createSignal(false);
  const [showConfirmPassword, setShowConfirmPassword] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [token, setToken] = createSignal('');
  const [tokenValid, setTokenValid] = createSignal(null); // null = checking, true = valid, false = invalid
  let passwordButton;
  let confirmButton;

  // Redirect if already authenticated
  createEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  });

  // Get token from URL params
  onMount(async () => {

    const urlToken = params.token;
    if (urlToken) {
      setToken(urlToken);
      // Validate token on mount
      try {
        const { validatePasswordResetToken } = await import('../lib/database');
        const validation = await validatePasswordResetToken(urlToken);
        setTokenValid(validation.valid);
        if (!validation.valid) {
          toastManager.error(
            'Invalid or expired reset link. Please request a new password reset.'
          );
        }
      } catch (error) {
        logger.error('Token validation error:', error);
        setTokenValid(false);
        toastManager.error('Failed to validate reset link. Please try again.');
      }
    } else {
      setTokenValid(false);
      toastManager.error('No reset token provided.');
    }
  });

  // Update eye icon when showPassword changes - now handled by conditional rendering
  // No need for data-lucide attributes with imported icons

  // Update eye icon when showConfirmPassword changes - now handled by conditional rendering
  // No need for data-lucide attributes with imported icons

  const handleReset = async e => {
    e.preventDefault();
    setLoading(true);

    const password = newPassword();
    const confirm = confirmPassword();

    // Validate password strength
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      toastManager.error(passwordValidation.message);
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      toastManager.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!tokenValid()) {
      toastManager.error('Invalid or expired reset token');
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword(token(), password);
      if (result.success) {
        toastManager.success(
          'Password reset successfully! You can now log in with your new password.'
        );
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      } else {
        toastManager.error(result.error || 'Failed to reset password');
      }
    } catch (err) {
      logger.error('Reset password error:', err);
      toastManager.error('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RouteGuard requireGuest={true}>
      <div class="w-full max-w-md px-4 py-4 sm:px-6 lg:px-8">
        <div class="card bg-base-100 border-base-300 w-full border py-6 shadow-2xl backdrop-blur-sm">
          <div class="card-body">
            <div class="mb-8 text-center">
              <img
                src={logo}
                alt="iGate Logo"
                class="mx-auto mb-6 block h-12 w-auto"
              />

              <h2 class="text-2xl font-bold">
                {t().resetPassword || 'Reset Password'}
              </h2>
              <p class="text-base-content/60">
                {tokenValid() === null
                  ? 'Validating reset link...'
                  : tokenValid()
                    ? 'Enter your new password'
                    : 'Invalid or expired reset link'}
              </p>
            </div>

            {tokenValid() === false ? (
              <div class="text-center">
                <div class="alert alert-error mb-4">
                  <AlertCircle class="h-4 w-4" />
                  <span>
                    This password reset link is invalid or has expired.
                  </span>
                </div>
                <button
                  class="btn btn-primary font-normal"
                  onClick={() => navigate('/auth/forgot-password')}
                >
                  Request New Reset Link
                </button>
              </div>
            ) : tokenValid() === null ? (
              <div class="py-8 text-center">
                <div class="loading loading-spinner loading-lg" />
                <p class="mt-4">Validating your reset link...</p>
              </div>
            ) : (
              <form onSubmit={handleReset} class="space-y-4">
                {/* Password Strength Indicator */}
                {newPassword() && (
                  <div class="text-sm">
                    <div
                      class={`badge ${isValidPassword(newPassword()).valid ? 'badge-success' : 'badge-error'} gap-1`}
                    >
                      {isValidPassword(newPassword()).valid ? '✓' : '✗'}{' '}
                      {isValidPassword(newPassword()).message}
                    </div>
                  </div>
                )}

                <div>
                  <label class="label">
                    <span class="label-text">
                      {t().newPassword || 'New Password'}
                    </span>
                  </label>
                  <div class="relative">
                    <input
                      type={showPassword() ? 'text' : 'password'}
                      placeholder={
                        t().createPasswordPlaceholder || 'Enter new password'
                      }
                      class="input input-bordered w-full pe-10"
                      value={newPassword()}
                      onInput={e => setNewPassword(e.target.value)}
                      autocomplete="new-password"
                      required
                      minLength="8"
                    />
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm btn-circle absolute end-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword())}
                      aria-label={
                        showPassword() ? 'Hide password' : 'Show password'
                      }
                      ref={passwordButton}
                    >
                      {showPassword() ? (
                        <EyeOff class="h-4 w-4" />
                      ) : (
                        <Eye class="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label class="label">
                    <span class="label-text">
                      {t().confirmPassword || 'Confirm Password'}
                    </span>
                  </label>
                  <div class="relative">
                    <input
                      type={showConfirmPassword() ? 'text' : 'password'}
                      placeholder={
                        t().confirmPasswordPlaceholder || 'Confirm new password'
                      }
                      class="input input-bordered w-full pe-10"
                      value={confirmPassword()}
                      onInput={e => setConfirmPassword(e.target.value)}
                      autocomplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm btn-circle absolute end-3 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword())
                      }
                      aria-label={
                        showConfirmPassword()
                          ? 'Hide password'
                          : 'Show password'
                      }
                      ref={confirmButton}
                    >
                      {showConfirmPassword() ? (
                        <EyeOff class="h-4 w-4" />
                      ) : (
                        <Eye class="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  class="btn btn-primary w-full font-normal"
                  disabled={loading() || !isValidPassword(newPassword()).valid}
                >
                  {loading() && (
                    <span class="loading loading-spinner loading-sm" />
                  )}
                  {t().resetPassword || 'Reset Password'}
                </button>
              </form>
            )}

            <div class="divider">OR</div>

            <button
              class="btn btn-outline w-full font-normal"
              onClick={() => navigate('/auth/login')}
            >
              {t().backToLogin || 'Back to Login'}
            </button>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
};

export default ResetPassword;
