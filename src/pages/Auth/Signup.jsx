import { createSignal, onMount, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { sanitizeInput, isValidEmail } from "../../lib/security";
import { toastManager } from "../../lib/feedback";
import RouteGuard from "../../components/common/RouteGuard";
import logo from "../../assets/iGate-tech-logo.svg";
import logger from '../../lib/logger.js';



const Signup = () => {
  logger.trace('Signup: Starting');
  const navigate = useNavigate();
  const { login, signup, isAuthenticated } = useUser();
  const { t } = useLanguage();
  const [formData, setFormData] = createSignal({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
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
    const icon = showPassword() ? "eye-off" : "eye";
    if (passwordButton) {
      const i = passwordButton.querySelector('i');
      if (i) i.setAttribute('data-lucide', icon);
      if (window.lucide) window.lucide.createIcons(passwordButton);
    }
  });

  // Update eye icon when showConfirmPassword changes
  createEffect(() => {
    const icon = showConfirmPassword() ? "eye-off" : "eye";
    if (confirmButton) {
      const i = confirmButton.querySelector('i');
      if (i) i.setAttribute('data-lucide', icon);
      if (window.lucide) window.lucide.createIcons(confirmButton);
    }
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { name, email, password, confirmPassword } = formData();

    if (password !== confirmPassword) {
      toastManager.error(t().passwordMismatch);
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
        avatar: avatar,
        joinDate: new Date().toISOString().split('T')[0],
        bio: ""
      };

      logger.debug('Creating user with email:', sanitizedEmail);
      // Create user with Supabase
      const result = await signup(sanitizedEmail, password, profile);
      if (!result.success) {
        toastManager.error(t().registrationFailed.replace('{email}', sanitizedEmail));
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (result.needsConfirmation) {
        toastManager.success(t().accountCreated.replace('{email}', sanitizedEmail));
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
        return;
      }

      // Signup includes automatic login
      if (result.success && result.user) {
        toastManager.success(t().accountCreatedLoggedIn.replace('{email}', sanitizedEmail));
        if (result.warning) {
          toastManager.info(result.warning);
        }
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toastManager.error(t().accountCreatedManualLogin.replace('{email}', sanitizedEmail));
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      }
    } catch (err) {
      logger.error('Signup error:', err);
      if (err.message?.includes('User already registered')) {
        toastManager.error(t().emailAlreadyExists);
      } else {
        toastManager.error(t().registrationFailed.replace('{email}', sanitizedEmail) + ` Error: ${err.message}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData({ ...formData(), [field]: value });
  };

  onMount(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  return (
    <RouteGuard>
      <div class="w-full max-w-md px-4 sm:px-6 lg:px-8 py-4">

         <div class="card w-full py-6 shadow-2xl bg-base-100 border border-base-300 backdrop-blur-sm">
        <div class="card-body">
          <div class="text-center mb-8">
             <img src={logo} alt="iGate Logo" class="h-12 w-auto block mx-auto mb-6" />

             <h2 class="text-2xl font-bold">{t().createAccount}</h2>
             <p class="text-base-content/60">{t().joinJourney}</p>
          </div>

          <form onSubmit={handleSignup} class="space-y-4">
            <div>
               <label class="label">
                 <span class="label-text">{t().fullName}</span>
               </label>
               <input
                 type="text"
                 placeholder={t().fullNamePlaceholder}
                 class="input input-bordered w-full"
                 value={formData().name}
                 onInput={(e) => updateFormData('name', e.target.value)}
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
                 placeholder={t().emailPlaceholder}
                 class="input input-bordered w-full"
                 value={formData().email}
                 onInput={(e) => updateFormData('email', e.target.value)}
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
                   placeholder={t().createPasswordPlaceholder}
                    class="input input-bordered w-full pe-10"
                   value={formData().password}
                   onInput={(e) => updateFormData('password', e.target.value)}
                   autocomplete="new-password"
                   required
                   minLength="6"
                 />
                 <button
                   type="button"
                   class="absolute end-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                   onClick={() => setShowPassword(!showPassword())}
                   aria-label={showPassword() ? "Hide password" : "Show password"}
                   ref={passwordButton}
                 >
                   <i data-lucide={showPassword() ? "eye-off" : "eye"} class="w-4 h-4"></i>
                 </button>
               </div>
             </div>

             <div>
                <label class="label">
                  <span class="label-text">{t().confirmPassword}</span>
                </label>
               <div class="relative">
                  <input
                    type={showConfirmPassword() ? "text" : "password"}
                    placeholder={t().confirmPasswordPlaceholder}
                    class="input input-bordered w-full pe-10"
                    value={formData().confirmPassword}
                    onInput={(e) => updateFormData('confirmPassword', e.target.value)}
                    autocomplete="new-password"
                    required
                  />
                 <button
                   type="button"
                   class="absolute end-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword())}
                  aria-label={showConfirmPassword() ? "Hide password" : "Show password"}
                  ref={confirmButton}
                >
                  <i data-lucide={showConfirmPassword() ? "eye-off" : "eye"} class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-primary w-full"
              disabled={loading()}
            >
              {loading() && <span class="loading loading-spinner loading-sm"></span>}
               {t().createAccountBtn}
            </button>
          </form>

          <div class="divider">OR</div>

           <button class="btn btn-outline w-full" onClick={() => navigate('/auth/login')}>
             {t().alreadyHaveAccount}
           </button>

           <div class="text-center text-xs text-base-content/60">
             {t().termsAgreement}
           </div>
             </div>
           </div>

           {/* Footer */}
           <footer class="mt-8 text-center text-sm text-base-content/60">
             <div class="flex flex-wrap justify-center space-x-6 mb-4">
               <a href="/help" class="link link-hover">{t().help}</a>
               <a href="/privacy-policy" class="link link-hover">{t().privacyPolicy}</a>
               <a href="/terms-of-service" class="link link-hover">{t().termsOfService}</a>
             </div>
              <p>© {new Date().getFullYear()} iGate. <em>"One Gate, Endless Possibilities."</em></p>
           </footer>
          </div>
       </RouteGuard>
   );
};

export default Signup;