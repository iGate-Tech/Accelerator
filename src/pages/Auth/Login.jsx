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
    <RouteGuard>
      <div class="w-full max-w-md mx-auto">
        {/* Logo */}
        <div class="flex justify-center mb-8">
          <svg width="48" height="52" viewBox="131.813 251.178 668.768 222.94" xmlns="http://www.w3.org/2000/svg" xmlns:bx="https://boxy-svg.com" class="h-12 w-auto">
            <defs>
              <linearGradient id="green-yellow" x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform="matrix(0.942709, 0.333618, -0.150908, 0.426427, 0, 0)">
                <stop offset="0" stop-color="#6cd14d"/>
                <stop offset="1" stop-color="#ffc600"/>
              </linearGradient>
              <linearGradient id="purple-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0" stop-color="#00a7e0"/>
                <stop offset="1" stop-color="#9e28b5"/>
              </linearGradient>
              <linearGradient id="gradient-1" bx:pinned="true"/>
              <linearGradient id="gradient-2" bx:pinned="true">
                <stop offset="0" style="stop-color: rgb(0, 167, 224);"/>
                <stop offset="1" style="stop-color: rgb(158, 40, 181);"/>
              </linearGradient>
              <linearGradient id="gradient-0" bx:pinned="true">
                <stop offset="0" style="stop-color: rgb(108, 208, 76);"/>
                <stop offset="0.316" style="stop-color: rgb(179, 203, 39);"/>
                <stop offset="1" style="stop-color: rgb(255, 198, 0);"/>
              </linearGradient>
              <linearGradient id="gradient-5" bx:pinned="true">
                <stop offset="0" style="stop-color: rgb(108, 208, 76);"/>
                <stop offset="1" style="stop-color: rgb(255, 198, 0);"/>
              </linearGradient>
              <linearGradient id="gradient-3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0" stop-color="#00a7e0"/>
                <stop offset="1" stop-color="#9e28b5"/>
              </linearGradient>
              <linearGradient id="gradient-2-1" href="#gradient-2" gradientUnits="userSpaceOnUse" x1="369.824" y1="258.28" x2="369.824" y2="419.898" gradientTransform="matrix(1.298064, 0.947677, -0.363133, 0.497397, -202.742569, -197.590729)"/>
              <linearGradient id="gradient-4" x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform="matrix(0.942709, 0.333618, -0.150908, 0.426427, 0, 0)">
                <stop offset="0" stop-color="#6cd14d"/>
                <stop offset="1" stop-color="#ffc600"/>
              </linearGradient>
              <linearGradient id="gradient-6" x1="0%" y1="0%" x2="0%" y2="100%" gradientTransform="matrix(0.942709, 0.333618, -0.150908, 0.426427, 0, 0)">
                <stop offset="0" stop-color="#6cd14d"/>
                <stop offset="1" stop-color="#ffc600"/>
              </linearGradient>
            </defs>
            <g>
              <g>
                <g id="Layer_1" transform="matrix(1, 0, 0, 1, 171.58522, 14.641378)">
                  <g transform="matrix(1, 0, 0, 1, 73.123965, -108.644679)">
                    <g transform="matrix(1, 0, 0, 1, -96.212367, 106.556072)"/>
                    <g transform="matrix(1, 0, 0, 1, -96.212367, 106.556072)">
                      <path class="cls-2" d="" style="fill: url(&quot;#purple-blue&quot;); stroke-width: 0px;"/>
                      <path class="cls-4" d="" style="fill: url(&quot;#green-yellow&quot;); stroke-width: 0px;"/>
                    </g>
                  </g>
                  <g id="svg-1" transform="matrix(1, 0, 0, 1, 170.335073, 57.983076)">
                    <g transform="matrix(1, 0, 0, 1, -192.074377, 169.970846)"/>
                    <g transform="matrix(1, 0, 0, 1, -192.074377, 169.970846)"/>
                  </g>
                  <g transform="matrix(1, 0, 0, 1, 32.358464, 377.3195)">
                    <path class="cls-2" style="stroke-width: 0; fill: url(&quot;#gradient-3&quot;);" id="object-0"/>
                    <path class="cls-4" style="stroke-width: 0; fill: url(&quot;#gradient-4&quot;);" id="object-1"/>
                    <g transform="matrix(1, 0, 0, 1, -10.654114, -272.98291)" id="object-2">
                      <path class="cls-2" d="M 118.928 304.856 L 87.648 296.786 C 86.708 296.546 85.718 296.546 84.768 296.786 L -7.532 320.776 C -8.502 320.016 -9.722 319.566 -11.052 319.566 C -14.222 319.566 -16.792 322.136 -16.792 325.306 L -16.792 344.486 C -16.792 346.266 -15.972 347.936 -14.562 349.026 C -13.542 349.816 -12.312 350.226 -11.052 350.226 C -10.572 350.226 -10.082 350.166 -9.612 350.046 L 110.528 318.836 C 113.558 318.056 116.658 316.996 119.728 315.696 C 121.988 314.736 123.398 312.446 123.208 309.986 C 123.028 307.536 121.298 305.466 118.918 304.856 L 118.928 304.856 M 155.398 189.906 C 152.108 188.136 148.188 188.186 144.958 189.996 L 120.018 198.236 C 119.518 198.406 119.038 198.636 118.598 198.936 C 114.228 201.896 111.618 206.876 111.618 212.246 L 111.618 261.076 C 111.618 268.826 109.338 276.236 105.038 282.516 C 100.178 289.596 93.058 294.646 85.038 296.716 L 84.818 296.776 C 82.268 297.416 80.478 299.696 80.468 302.316 C 80.458 304.936 82.228 307.236 84.768 307.896 L 116.048 315.966 C 116.518 316.086 116.998 316.146 117.478 316.146 C 118.238 316.146 118.998 315.996 119.718 315.696 C 127.918 312.226 135.258 307.176 141.528 300.696 C 154.238 287.636 161.228 270.196 161.228 251.606 L 161.228 199.696 C 161.228 195.556 158.968 191.796 155.378 189.906 L 155.398 189.906" style="stroke-width: 0; fill: url(&quot;#gradient-2-1&quot;); transform-box: fill-box; transform-origin: 52.7671% 51.533%;"/>
                      <g>
                        <path class="cls-4" d="M 155.968 137.909 C 153.888 135.909 151.178 134.879 148.418 134.999 L 127.138 135.669 C 120.128 135.889 113.108 136.899 106.278 138.679 L -8.462 168.479 C -19.172 171.269 -29.047 176.869 -37.047 184.719 C -37.047 184.719 -37.057 184.739 -37.077 184.749 C -38.337 185.999 -39.527 187.269 -40.587 188.539 C -41.857 190.049 -42.277 192.099 -41.667 193.979 C -41.077 195.859 -39.557 197.299 -37.637 197.789 L -7.522 205.559 C -7.042 205.679 -6.562 205.739 -6.092 205.739 C -4.092 205.739 -2.192 204.689 -1.152 202.919 C -1.142 202.899 -1.132 202.889 -1.132 202.889 C 0.358 200.779 2.108 198.859 4.068 197.189 C 7.648 194.109 11.778 191.949 16.328 190.769 L 151.338 155.699 C 155.948 154.499 159.168 150.299 159.168 145.499 C 159.168 142.669 158.008 139.919 155.948 137.899 L 155.968 137.909 Z M -0.692 198.029 C -1.342 196.269 -2.822 194.939 -4.642 194.469 L -34.757 186.699 C -36.857 186.159 -39.087 186.849 -40.527 188.479 C -51.137 200.649 -56.977 216.409 -56.977 232.859 L -56.977 330.119 C -56.977 336.449 -52.757 341.959 -46.697 343.539 L -18.962 350.689 C -17.882 350.989 -16.722 351.139 -15.522 351.139 C -14.322 351.139 -13.212 350.989 -12.102 350.699 L -11.612 350.569 C -9.102 349.899 -7.362 347.619 -7.362 345.029 L -7.362 222.569 C -7.362 215.579 -5.292 208.919 -1.372 203.299 C -0.292 201.759 -0.042 199.789 -0.692 198.019 L -0.692 198.029 Z" style="stroke-width: 0; fill: url(&quot;#gradient-6&quot;);"/>
                      </g>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </svg>
        </div>
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