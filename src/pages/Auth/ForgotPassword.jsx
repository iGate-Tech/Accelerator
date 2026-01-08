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
             <img src="/src/assets/iGate-tech-logo.svg" alt="iGate Logo" class="h-12 w-auto block mx-auto mb-6" />
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
            <p>© {new Date().getFullYear()} iGate. <em>"One Gate, Endless Possibilities."</em></p>
         </footer>
       </div>
  );
};

export default ForgotPassword;