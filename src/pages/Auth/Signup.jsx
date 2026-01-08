import { createSignal, onMount, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { createUser } from "../../lib/db";
import { sanitizeInput, isValidEmail } from "../../lib/security";
import { toastManager } from "../../lib/feedback";
import RouteGuard from "../../components/common/RouteGuard";

const Signup = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useUser();
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
      navigate('/dashboard', { replace: true });
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
      toastManager.error('Passwords do not match. Please ensure both password fields are identical.');
      setLoading(false);
      return;
    }

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);

    if (!isValidEmail(sanitizedEmail)) {
      toastManager.error(`Invalid email format: ${sanitizedEmail}. Please enter a valid email address.`);
      setLoading(false);
      return;
    }

    try {
      // Create user profile
      const profile = {
        name: sanitizedName,
        email: sanitizedEmail,
        avatar: "/src/assets/avatar.png",
        joinDate: new Date().toISOString().split('T')[0],
        bio: ""
      };

      console.log('Creating user with email:', sanitizedEmail);
      // Create user in database
      const newUser = await createUser(sanitizedEmail, password, profile);
      console.log('User created successfully:', newUser);

      // Log in the user
      const loginSuccess = await login(sanitizedEmail, password);
      if (loginSuccess) {
        toastManager.success(`Account created successfully for ${sanitizedEmail} and logged in! User profile initialized with name: ${sanitizedName}. Starting onboarding...`);
        setTimeout(() => {
          navigate('/onboarding');
        }, 2000);
      } else {
        toastManager.error(`Account created for ${sanitizedEmail} but automatic login failed. Please try logging in manually on the login page.`);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Signup error:', err);
      if (err.message?.includes('UNIQUE constraint failed') || err.message?.includes('duplicate key') || err.message?.includes('already exists')) {
        toastManager.error(`Registration failed for ${sanitizedEmail}. An account with this email already exists. Please try logging in or use a different email.`);
      } else {
        toastManager.error(`Registration failed for ${sanitizedEmail}. Error: ${err.message}. Please try again.`);
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
     <RouteGuard requireGuest={true}>
       <div class="w-full max-w-md mx-auto">
         <div class="card w-full shadow-2xl bg-base-100 border border-base-300 backdrop-blur-sm">
        <div class="card-body">
          <div class="text-center mb-8">
            <svg width="48" height="52" viewBox="0 0 33 36" fill="none" xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-4">
              <path d="M31.6035 7.28044C31.1951 7.03803 30.7235 7.06833 30.3421 7.35872L26.4519 10.3182C25.9036 10.7348 25.5764 11.4317 25.5764 12.1868V21.1636C25.5764 24.2695 23.7757 26.9638 21.1966 27.7138L6.895 31.8726V14.5099C6.895 11.7171 8.5129 9.29549 10.8326 8.62128L31.4004 2.64179C31.9126 2.4928 32.2714 1.9701 32.2714 1.37165C32.2714 1.01561 32.1405 0.672189 31.9149 0.424727C31.687 0.177265 31.3823 0.0510083 31.0777 0.0611088L27.8352 0.177265C26.7972 0.215142 25.7615 0.3818 24.7551 0.674714L7.27635 5.75527C3.11314 6.9648 0.206787 11.2853 0.206787 16.2598V32.8423C0.206787 33.7033 0.716752 34.4508 1.44785 34.6629L5.68553 35.8876C5.8164 35.9255 5.95405 35.9457 6.09169 35.9457C6.22934 35.9457 6.36698 35.9255 6.49786 35.8876L24.8792 30.5444C29.2342 29.2793 32.2759 24.7594 32.2759 19.5526V8.52785C32.2759 8.00263 32.0209 7.52538 31.6103 7.28297L31.6035 7.28044Z" fill="rgb(158, 40, 181)"/>
            </svg>
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
                   class="input input-bordered w-full pr-10"
                   value={formData().password}
                   onInput={(e) => updateFormData('password', e.target.value)}
                   autocomplete="new-password"
                   required
                   minLength="6"
                 />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
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
                   class="input input-bordered w-full pr-10"
                   value={formData().confirmPassword}
                   onInput={(e) => updateFormData('confirmPassword', e.target.value)}
                   autocomplete="new-password"
                   required
                 />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
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

           <button class="btn btn-outline w-full" onClick={() => navigate('/login')}>
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
               <a href="/status" class="link link-hover">{t().statusPage}</a>
               <a href="/changelog" class="link link-hover">{t().changelog}</a>
             </div>
             <p>{t().copyright}</p>
           </footer>
          </div>
       </RouteGuard>
   );
};

export default Signup;