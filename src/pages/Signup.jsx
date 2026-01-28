import { createSignal, onMount, createEffect, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../hooks/useLanguage';
import {
  sanitizeInput,
  isValidEmail,
  isValidPassword,
} from '@lib/auth/security';
import { toastManager } from '@lib/ui/feedback';
import { RouteGuard } from '../components';
import logo from '../assets/images/iGate-tech-logo.svg';
import { logger } from '@lib/core';

const Signup = () => {
  logger.trace('Signup: Starting');
  const navigate = useNavigate();
  const { login, signup, isAuthenticated } = useUser();
  const { t } = useLanguage();
  const [formData, setFormData] = createSignal({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordStrength, setPasswordStrength] = createSignal({
    valid: false,
    message: '',
  });
  const [agreeToTerms, setAgreeToTerms] = createSignal(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = createSignal(false);
  const [showPassword, setShowPassword] = createSignal(false);
  const [showConfirmPassword, setShowConfirmPassword] = createSignal(false);
  let passwordButton;
  let confirmButton;
  const [loading, setLoading] = createSignal(false);

  // Redirect if already authenticated
  createEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  });

  // Update eye icon when showPassword changes
  createEffect(() => {
    const icon = showPassword() ? 'eye-off' : 'eye';
    if (passwordButton) {
      const i = passwordButton.querySelector('i');
      if (i) i.setAttribute('data-lucide', icon);
      if (window.lucide) window.lucide.createIcons(passwordButton);
    }
  });

  // Update eye icon when showConfirmPassword changes
  createEffect(() => {
    const icon = showConfirmPassword() ? 'eye-off' : 'eye';
    if (confirmButton) {
      const i = confirmButton.querySelector('i');
      if (i) i.setAttribute('data-lucide', icon);
      if (window.lucide) window.lucide.createIcons(confirmButton);
    }
  });

  const handleSignup = async e => {
    e.preventDefault();
    setLoading(true);

    const { name, email, password, confirmPassword } = formData();

    // Validate name
    if (!name.trim()) {
      toastManager.error(t().nameRequired || 'Name is required');
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      toastManager.error(passwordValidation.message);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toastManager.error(t().passwordMismatch);
      setLoading(false);
      return;
    }

    // Check GDPR compliance agreements
    if (!agreeToTerms()) {
      toastManager.error('Please agree to the Terms of Service');
      setLoading(false);
      return;
    }

    if (!agreeToPrivacy()) {
      toastManager.error('Please agree to the Privacy Policy');
      setLoading(false);
      return;
    }

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);

    if (!isValidEmail(sanitizedEmail)) {
      toastManager.error(t().invalidEmail);
      setLoading(false);
      return;
    }

    try {
      // Create user profile
      const profile = {
        name: sanitizedName,
        email: sanitizedEmail,
        joinDate: new Date().toISOString().split('T')[0],
        bio: '',
      };

      logger.debug('Creating user with email:', sanitizedEmail);
      // Create user with Supabase
      const result = await signup(sanitizedEmail, password, profile);
      if (!result.success) {
        toastManager.error(
          t().registrationFailed.replace('{email}', sanitizedEmail)
        );
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (result.needsConfirmation) {
        toastManager.success(
          t().accountCreated.replace('{email}', sanitizedEmail)
        );
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
        return;
      }

      // Signup includes automatic login
      if (result.success && result.user) {
        toastManager.success(
          t().accountCreatedLoggedIn.replace('{email}', sanitizedEmail)
        );
        if (result.warning) {
          toastManager.info(result.warning);
        }
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toastManager.error(
          t().accountCreatedManualLogin.replace('{email}', sanitizedEmail)
        );
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      }
    } catch (err) {
      logger.error('Signup error:', err);
      if (err.message?.includes('User already registered')) {
        toastManager.error(t().emailAlreadyExists);
      } else {
        toastManager.error(
          t().registrationFailed.replace('{email}', sanitizedEmail) +
            ` Error: ${err.message}. Please try again.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData({ ...formData(), [field]: value });

    // Check password strength when password changes
    if (field === 'password') {
      const strength = isValidPassword(value);
      setPasswordStrength(strength);
    }
  };

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

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

              <h2 class="text-2xl font-bold">{t().createAccount}</h2>
              <p class="text-base-content/60">{t().joinJourney}</p>
            </div>

            <form
              onSubmit={handleSignup}
              class="space-y-4"
              autocomplete="on"
              id="signup-form"
            >
              <div>
                <label class="label">
                  <span class="label-text">{t().fullName}</span>
                </label>
                <input
                  type="text"
                  id="signup-name"
                  placeholder={t().fullNamePlaceholder}
                  class="input input-bordered w-full"
                  value={formData().name}
                  onInput={e => updateFormData('name', e.target.value)}
                  autocomplete="name"
                  required
                />
              </div>

              <div>
                <label class="label">
                  <span class="label-text">{t().email}</span>
                </label>
                <input
                  type="email"
                  id="signup-email"
                  placeholder={t().emailPlaceholderSignup}
                  class="input input-bordered w-full"
                  value={formData().email}
                  onInput={e => updateFormData('email', e.target.value)}
                  autocomplete="email"
                  required
                />
              </div>

              <div>
                <label class="label">
                  <span class="label-text">{t().password}</span>
                </label>
                <div class="relative">
                  <input
                    type={showPassword() ? 'text' : 'password'}
                    id="signup-password"
                    placeholder={t().createPasswordPlaceholder}
                    class="input input-bordered w-full pe-10"
                    value={formData().password}
                    onInput={e => updateFormData('password', e.target.value)}
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
                    <i
                      data-lucide={showPassword() ? 'eye-off' : 'eye'}
                      class="h-4 w-4"
                    />
                  </button>
                </div>
              </div>

              <div>
                <label class="label">
                  <span class="label-text">{t().confirmPassword}</span>
                </label>
                <div class="relative">
                  <input
                    type={showConfirmPassword() ? 'text' : 'password'}
                    id="signup-confirm-password"
                    placeholder={t().confirmPasswordPlaceholder}
                    class="input input-bordered w-full pe-10"
                    value={formData().confirmPassword}
                    onInput={e =>
                      updateFormData('confirmPassword', e.target.value)
                    }
                    autocomplete="new-password"
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm btn-circle absolute end-3 top-1/2 -translate-y-1/2"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword())
                    }
                    aria-label={
                      showConfirmPassword() ? 'Hide password' : 'Show password'
                    }
                    ref={confirmButton}
                  >
                    <i
                      data-lucide={showConfirmPassword() ? 'eye-off' : 'eye'}
                      class="h-4 w-4"
                    />
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              <Show when={formData().password}>
                <div class="text-sm">
                  <div
                    class={`badge ${passwordStrength().valid ? 'badge-success' : 'badge-error'} gap-1`}
                  >
                    {passwordStrength().valid ? '✓' : '✗'}{' '}
                    {passwordStrength().message}
                  </div>
                </div>
              </Show>

              {/* GDPR Compliance Checkboxes */}
              <div class="space-y-3">
                <label class="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-primary mt-0.5"
                    checked={agreeToTerms()}
                    onChange={e => setAgreeToTerms(e.target.checked)}
                    autocomplete="off"
                  />
                  <div class="text-sm">
                    I agree to the{' '}
                    <a
                      href="/terms-of-service"
                      class="link link-primary"
                      target="_blank"
                    >
                      Terms of Service
                    </a>
                  </div>
                </label>

                <label class="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-primary mt-0.5"
                    checked={agreeToPrivacy()}
                    onChange={e => setAgreeToPrivacy(e.target.checked)}
                    autocomplete="off"
                  />
                  <div class="text-sm">
                    I agree to the{' '}
                    <a
                      href="/privacy-policy"
                      class="link link-primary"
                      target="_blank"
                    >
                      Privacy Policy
                    </a>{' '}
                    and consent to data processing
                  </div>
                </label>
              </div>

              <button
                type="submit"
                class="btn btn-primary w-full font-normal"
                disabled={loading() || !agreeToTerms() || !agreeToPrivacy()}
              >
                {loading() && (
                  <span class="loading loading-spinner loading-sm" />
                )}
                {t().createAccountBtn}
              </button>
            </form>

            <div class="divider">OR</div>

            <button
              class="btn btn-outline w-full font-normal"
              onClick={() => navigate('/auth/login')}
            >
              {t().alreadyHaveAccount}
            </button>

            <div class="text-base-content/60 text-center text-xs">
              {t().termsAgreement}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer class="text-base-content/60 mt-8 text-center text-sm">
          <div class="mb-4 flex flex-wrap justify-center space-x-6">
            <a href="/help" class="link link-hover">
              {t().help}
            </a>
            <a href="/privacy-policy" class="link link-hover">
              {t().privacyPolicy}
            </a>
            <a href="/terms-of-service" class="link link-hover">
              {t().termsOfService}
            </a>
          </div>
          <p>
            © {new Date().getFullYear()} iGate.{' '}
            <em>"One Gate, Endless Possibilities."</em>
          </p>
        </footer>
      </div>
    </RouteGuard>
  );
};

export default Signup;
