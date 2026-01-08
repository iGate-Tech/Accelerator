import { createSignal, onMount, useContext, createEffect } from "solid-js";
import { useLanguage } from "../../hooks/useLanguage";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { sanitizeInput, isValidEmail } from "../../lib/security";
import { toastManager } from "../../lib/feedback";
import RouteGuard from "../../components/common/RouteGuard";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useUser();
  const { currentLang, t } = useLanguage();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [showPassword, setShowPassword] = createSignal(false);
  let eyeButton;
  const [loading, setLoading] = createSignal(false);

  // Redirect if already authenticated
  createEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  });

  // Update eye icon when showPassword changes
  createEffect(() => {
    const icon = showPassword() ? "eye-off" : "eye";
    if (eyeButton) {
      const i = eyeButton.querySelector('i');
      if (i) i.setAttribute('data-lucide', icon);
      if (window.lucide) window.lucide.createIcons(eyeButton);
    }
  });



  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const sanitizedEmail = sanitizeInput(email());
    const sanitizedPassword = sanitizeInput(password());

    if (!isValidEmail(sanitizedEmail)) {
      toastManager.error(`Invalid email format: ${sanitizedEmail}. Please enter a valid email address.`);
      setLoading(false);
      return;
    }

    try {
      const success = await login(sanitizedEmail, sanitizedPassword);
      if (success) {
        toastManager.success(`Login successful for ${sanitizedEmail}. Welcome back! Redirecting to dashboard.`);
        navigate('/');
      } else {
        toastManager.error(`Invalid credentials for ${sanitizedEmail}. Please check your email and password.`);
      }
    } catch (err) {
      toastManager.error(`Login failed for ${sanitizedEmail}. Error: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

   return (
     <RouteGuard requireGuest={true}>
       <div class="w-full max-w-md mx-auto">
         <div class="card w-full shadow-2xl bg-base-100 border border-base-300 backdrop-blur-sm">
        <div class="card-body">
          <div class="text-center mb-8">
            <svg width="48" height="52" viewBox="0 0 33 36" fill="none" xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-4">
              <path d="M31.6035 7.28044C31.1951 7.03803 30.7235 7.06833 30.3421 7.35872L26.4519 10.3182C25.9036 10.7348 25.5764 11.4317 25.5764 12.1868V21.1636C25.5764 24.2695 23.7757 26.9638 21.1966 27.7138L6.895 31.8726V14.5099C6.895 11.7171 8.5129 9.29549 10.8326 8.62128L31.4004 2.64179C31.9126 2.4928 32.2714 1.9701 32.2714 1.37165C32.2714 1.01561 32.1405 0.672189 31.9149 0.424727C31.687 0.177265 31.3823 0.0510083 31.0777 0.0611088L27.8352 0.177265C26.7972 0.215142 25.7615 0.3818 24.7551 0.674714L7.27635 5.75527C3.11314 6.9648 0.206787 11.2853 0.206787 16.2598V32.8423C0.206787 33.7033 0.716752 34.4508 1.44785 34.6629L5.68553 35.8876C5.8164 35.9255 5.95405 35.9457 6.09169 35.9457C6.22934 35.9457 6.36698 35.9255 6.49786 35.8876L24.8792 30.5444C29.2342 29.2793 32.2759 24.7594 32.2759 19.5526V8.52785C32.2759 8.00263 32.0209 7.52538 31.6103 7.28297L31.6035 7.28044Z" fill="rgb(158, 40, 181)"/>
            </svg>
            <h2 class="text-2xl font-bold">{t().welcomeBack}</h2>
            <p class="text-base-content/60">{t().signInToAccount}</p>
          </div>

          <form onSubmit={handleLogin} class="space-y-4">
            <div>
               <label class="label">
                 <span class="label-text">{t().email}</span>
               </label>
              <input
                type="email"
                placeholder="john.doe@example.com"
                class="input input-bordered w-full"
                value={email()}
                onInput={(e) => setEmail(e.target.value)}
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
                  type={showPassword() ? "text" : "password"}
                  placeholder="Enter your password"
                  class="input input-bordered w-full pr-10"
                  value={password()}
                  onInput={(e) => setPassword(e.target.value)}
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                  onClick={() => setShowPassword(!showPassword())}
                  aria-label={showPassword() ? "Hide password" : "Show password"}
                  ref={eyeButton}
                >
                  <i data-lucide={showPassword() ? "eye-off" : "eye"} class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-primary w-full"
              disabled={loading()}
            >
              {loading() && <span class="loading loading-spinner loading-sm"></span>}
               {t().signIn}
            </button>
          </form>

          <div class="divider">OR</div>

           <button class="btn btn-outline w-full" onClick={() => navigate('/signup')}>
             {t().createNewAccount}
           </button>

          <div class="text-center text-sm text-base-content/60">
             <a href="/forgot-password" class="link link-primary">{t().forgotPassword}</a>
          </div>
          </div>
        </div>
       </div>
     </RouteGuard>
  );
};

export default Login;