import { createSignal, onMount, useContext, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { useLanguage } from "../../hooks/useLanguage";
import { sanitizeInput, isValidEmail } from "../../lib/security";
import { toastManager } from "../../lib/feedback";
import RouteGuard from "../../components/common/RouteGuard";
import logo from "../../assets/iGate-tech-logo.svg";

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
  <RouteGuard>
<style>{`
.btnshadow{
   	position: relative;
   	margin: 10px auto;

    background: #010002;
    
   }
  
   .btnshadow:before,
   .btnshadow:after{
   	content: '';
   	position: absolute;
   	
   	background: linear-gradient(45deg,#fb0094,#0000ff,#00ff00,#ffff00,#ff0000,#fb0094,#0000ff,#00ff00,#ffff00,#ff0000);
   	background-size: 200% 200%;
   	width: calc(100% + 3px);
   	height: calc(100% + 3px);
   	border-radius: 8px;
   	z-index: -1;
    animation: animate 4s ease alternate infinite;
   }
   .btnshadow:after{
   	filter: blur(5px);
   }
   @keyframes animate{
   	0%{
   		background-position: 0 50%;
   	}
   	50%{
   		background-position: 100% 50%;
   	}
   	100%{
   		background-position: 0% 50%;
   	}
   }
`}</style>

    <div class="w-full max-w-md mx-auto">
        {/* Logo */}
         
         <div class="card w-full py-6 shadow-2xl bg-base-100 border border-base-300 backdrop-blur-sm">
        <div class="card-body">
          <div class="text-center mb-8">
             <img src={logo} alt="iGate Logo" class="h-12 w-auto block mx-auto mb-6" />
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
                 placeholder={t().emailPlaceholder}
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
                   placeholder={t().passwordPlaceholder}
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
              class="w-full btn btnshadow"
              disabled={loading()}
            >
              <div class="bg-base-100">

              {loading() && <span class="loading loading-spinner loading-sm"></span>}
               {t().signIn}
              </div>
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
      </RouteGuard>
  );
};

export default Login;