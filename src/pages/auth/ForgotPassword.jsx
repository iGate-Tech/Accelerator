import { createSignal, onMount, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useUser } from '@context/UserContext';
import { useLanguage } from '@hooks/useLanguage';
import { toastManager } from '@lib/ui/feedback';
import { RouteGuard } from '@components';
import logo from '@assets/images/iGate-tech-logo.svg';
import { logger } from '@lib/core';
import { useDocumentTitle } from '@hooks/useDocumentTitle';

const ForgotPassword = () => {
  logger.trace('ForgotPassword: Starting');
  const navigate = useNavigate();

  // Set document title
  useDocumentTitle('Forgot Password');

  const { isAuthenticated, forgotPassword } = useUser();
  const { t } = useLanguage();
  const [email, setEmail] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  // Redirect if already authenticated
  createEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  });

  const handleReset = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await forgotPassword(email());
      if (result.success) {
        toastManager.success(
          `Password reset request processed for ${email()}. If an account with this email exists, a reset link has been generated.`
        );

        // For development, show the reset link in console and create a temporary display
        if (result.resetLink) {
          console.log('🔗 Development Reset Link:', result.resetLink);
          // You could also show this in a modal or alert for testing
          setTimeout(() => {
            alert(`Development Mode: Reset Link - ${result.resetLink}`);
          }, 1000);
        }

        setTimeout(() => {
          navigate('/auth/login');
        }, 5000); // Give more time for development link display
      } else {
        toastManager.error(
          `Failed to send reset email to ${email()}. ${result.error}`
        );
      }
    } catch (err) {
      toastManager.error(
        `Failed to send reset email to ${email()}. Error: ${err.message}. Please try again.`
      );
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
              <h2 class="text-2xl font-bold">{t().resetPassword}</h2>
              <p class="text-base-content/60">{t().enterEmailReset}</p>
            </div>

            <form onSubmit={handleReset} class="space-y-4">
              <div>
                <label class="label">
                  <span class="label-text">{t().email}</span>
                </label>
                <input
                  type="email"
                  placeholder={t().emailPlaceholderReset}
                  class="input input-bordered w-full"
                  value={email()}
                  onInput={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                class="btn btn-primary w-full font-normal"
                disabled={loading()}
              >
                {loading() && (
                  <span class="loading loading-spinner loading-sm" />
                )}
                {t().sendResetLink}
              </button>
            </form>

            <div class="text-center">
              <button
                class="btn btn-ghost btn-sm font-normal"
                onClick={() => navigate('/auth/login')}
              >
                {t().backToLogin}
              </button>
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
            <a href="/status" class="link link-hover">
              {t().statusPage}
            </a>
            <a href="/changelog" class="link link-hover">
              {t().changelog}
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

export default ForgotPassword;
