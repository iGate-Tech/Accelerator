import { createSignal, onMount, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { toastManager } from "../../lib/feedback";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  const { t } = useLanguage();
  const [email, setEmail] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  // Redirect if already authenticated
  createEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  });

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock password reset - in real app, send email
      toastManager.success(`Password reset request processed for ${email()}. If an account with this email exists, a reset link has been sent. Check your inbox and spam folder.`);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      toastManager.error(`Failed to send reset email to ${email()}. Error: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <div class="card max-w-md mx-auto shadow-2xl bg-base-100 border border-base-300 backdrop-blur-sm">
        <div class="card-body">
          <div class="text-center mb-8">
            <svg width="48" height="52" viewBox="0 0 33 36" fill="none" xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-4">
              <path d="M31.6035 7.28044C31.1951 7.03803 30.7235 7.06833 30.3421 7.35872L26.4519 10.3182C25.9036 10.7348 25.5764 11.4317 25.5764 12.1868V21.1636C25.5764 24.2695 23.7757 26.9638 21.1966 27.7138L6.895 31.8726V14.5099C6.895 11.7171 8.5129 9.29549 10.8326 8.62128L31.4004 2.64179C31.9126 2.4928 32.2714 1.9701 32.2714 1.37165C32.2714 1.01561 32.1405 0.672189 31.9149 0.424727C31.687 0.177265 31.3823 0.0510083 31.0777 0.0611088L27.8352 0.177265C26.7972 0.215142 25.7615 0.3818 24.7551 0.674714L7.27635 5.75527C3.11314 6.9648 0.206787 11.2853 0.206787 16.2598V32.8423C0.206787 33.7033 0.716752 34.4508 1.44785 34.6629L5.68553 35.8876C5.8164 35.9255 5.95405 35.9457 6.09169 35.9457C6.22934 35.9457 6.36698 35.9255 6.49786 35.8876L24.8792 30.5444C29.2342 29.2793 32.2759 24.7594 32.2759 19.5526V8.52785C32.2759 8.00263 32.0209 7.52538 31.6103 7.28297L31.6035 7.28044Z" fill="rgb(158, 40, 181)"/>
            </svg>
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
                 placeholder={t().emailPlaceholder}
                 class="input input-bordered w-full"
                 value={email()}
                 onInput={(e) => setEmail(e.target.value)}
                 required
               />
            </div>

            <button
              type="submit"
              class="btn btn-primary w-full"
              disabled={loading()}
            >
              {loading() && <span class="loading loading-spinner loading-sm"></span>}
               {t().sendResetLink}
            </button>
          </form>

           <div class="text-center">
             <button class="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>
               {t().backToLogin}
             </button>
           </div>
         </div>

         {/* Footer */}
         <footer class="mt-8 text-center text-sm text-base-content/60">
           <div class="flex flex-wrap justify-center space-x-6 mb-4">
             <a href="/help" class="link link-hover">{t().help}</a>
             <a href="/privacy-policy" class="link link-hover">{t().privacyPolicy}</a>
             <a href="/terms-of-service" class="link link-hover">{t().termsOfService}</a>
             <a href="/status" class="link link-hover">{t().statusPage}</a>
             <a href="/changelog" class="link link-hover">{t().changelog}</a>
           </div>
            <p>© {new Date().getFullYear()} iGate. <em>One Gate, Endless Possibilities.</em></p>
         </footer>
       </div>
  );
};

export default ForgotPassword;