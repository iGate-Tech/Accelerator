import { createSignal, onMount, useContext, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../hooks/useLanguage';
import { sanitizeInput, isValidEmail } from '@lib/auth/security';
import { toastManager } from '@lib/ui/feedback';
import { RouteGuard } from '../components';
import logo from '../assets/images/iGate-tech-logo.svg';
import { logger } from '@lib/core';

const Login = () => {
  logger.trace('Login: Starting');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useUser();
  const { currentLang, t } = useLanguage();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [showPassword, setShowPassword] = createSignal(false);
  const [rememberMe, setRememberMe] = createSignal(false);
  let eyeButton;
  const [loading, setLoading] = createSignal(false);

  // Redirect if already authenticated
  createEffect(() => {
    logger.debug(
      'Login createEffect running, isAuthenticated:',
      isAuthenticated()
    );
    if (isAuthenticated()) {
      logger.debug('Login: Redirecting authenticated user to /');
      navigate('/', { replace: true });
    }
  });

  // Update eye icon when showPassword changes
  createEffect(() => {
    const icon = showPassword() ? 'eye-off' : 'eye';
    if (eyeButton) {
      const i = eyeButton.querySelector('i');
      if (i) i.setAttribute('data-lucide', icon);
      if (window.lucide) window.lucide.createIcons(eyeButton);
    }
  });

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);

    const sanitizedEmail = sanitizeInput(email());
    const sanitizedPassword = sanitizeInput(password());

    if (!isValidEmail(sanitizedEmail)) {
      toastManager.error(
        `Invalid email format: ${sanitizedEmail}. Please enter a valid email address.`
      );
      setLoading(false);
      return;
    }

    try {
      const result = await login(
        sanitizedEmail,
        sanitizedPassword,
        rememberMe()
      );
      if (result && result.success) {
        logger.info('Login successful for:', sanitizedEmail);
        toastManager.success(
          `Login successful for ${sanitizedEmail}. Welcome back!`
        );
        navigate('/', { replace: true });
      } else {
        toastManager.error(
          result?.error ||
            `Invalid credentials for ${sanitizedEmail}. Please check your email and password.`
        );
      }
    } catch (err) {
      toastManager.error(
        `Login failed for ${sanitizedEmail}. Error: ${err.message}. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <RouteGuard requireGuest={true}>
      <div class="w-full max-w-md px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}

        <div class="card bg-base-100 border-base-300 w-full border py-6 shadow-2xl backdrop-blur-sm">
          <div class="card-body">
            <div class="mb-8 text-center">
              <img
                src={logo}
                alt="iGate Logo"
                class="mx-auto mb-6 block h-12 w-auto"
              />
              <h2 class="text-2xl font-bold">{t().welcomeBack}</h2>
              <p class="text-base-content/60">{t().signInToAccount}</p>
            </div>

            <form onSubmit={handleLogin} class="space-y-4" id="login-form">
              <div>
                <label class="label">
                  <span class="label-text">{t().email}</span>
                </label>
                <input
                  type="email"
                  id="login-email"
                  placeholder={t().emailPlaceholderLogin}
                  class="input input-bordered w-full"
                  value={email()}
                  onInput={e => setEmail(e.target.value)}
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
                    id="login-password"
                    placeholder={t().passwordPlaceholder}
                    class="input input-bordered w-full pr-10"
                    value={password()}
                    onInput={e => setPassword(e.target.value)}
                    autocomplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm btn-circle absolute end-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword())}
                    aria-label={
                      showPassword() ? 'Hide password' : 'Show password'
                    }
                    ref={eyeButton}
                  >
                    <i
                      data-lucide={showPassword() ? 'eye-off' : 'eye'}
                      class="h-4 w-4"
                    />
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div class="flex items-center justify-between">
                <label class="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-primary checkbox-xs"
                    checked={rememberMe()}
                    onChange={e => setRememberMe(e.target.checked)}
                    autocomplete="off"
                  />
                  <span class="text-sm">{t().rememberMe || 'Remember me'}</span>
                </label>
              </div>

              <button
                type="submit"
                class="btn w-full font-normal"
                disabled={loading()}
              >
                {loading() && (
                  <span class="loading loading-spinner loading-sm" />
                )}
                {t().signIn}
              </button>
            </form>

            <div class="divider">OR</div>

            <button
              class="btn w-full font-normal"
              onClick={() => navigate('/auth/signup')}
            >
              {t().createNewAccount}
            </button>

            <div class="text-base-content/60 text-center text-sm">
              <a href="/auth/forgot-password" class="link link-primary">
                {t().forgotPassword}
              </a>
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
            © {new Date().getFullYear()} iGate. <em>{t().motto}</em>
          </p>
        </footer>
      </div>
    </RouteGuard>
  );
};

export default Login;
