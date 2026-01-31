import { useUser } from '@context/UserContext';
import { openSettings } from '@components/modals/SettingsModal';
import { Show } from 'solid-js';
import { User, Settings, Crown, Zap, CreditCard } from 'lucide-solid';

const Footer = props => {
  const { user } = useUser();

  const displayName = () => user()?.profile?.name || user()?.name || 'User';
  const hasCustomAvatar = () =>
    user()?.avatar &&
    !user()?.avatar.startsWith('/default') &&
    user()?.avatar.trim() !== '';

  const plan = () => user()?.plan || 'Free';
  const isOnline = () => user()?.status === 'online' || true;

  const getPlanBadge = () => {
    const planName = plan();
    if (planName === 'Pro' || planName === 'Enterprise') {
      return (
        <span class="badge badge-sm badge-primary gap-1 px-2 py-0.5">
          <Crown size={12} />
          {planName}
        </span>
      );
    }
    if (planName === 'Team') {
      return (
        <span class="badge badge-sm badge-secondary gap-1 px-2 py-0.5">
          <Zap size={12} />
          {planName}
        </span>
      );
    }
    return (
      <span class="badge badge-sm badge-ghost gap-1 px-2 py-0.5">
        <CreditCard size={12} />
        Free
      </span>
    );
  };

  return (
    <footer class="border-base-200/60 from-base-100 via-base-100 to-base-200/30 flex-shrink-0 border-t bg-gradient-to-r backdrop-blur-sm">
      <button
        type="button"
        onClick={openSettings}
        class="group hover:bg-base-200/60 active:bg-base-200/80 relative flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 transition-all duration-300 ease-out hover:pl-5"
        aria-label="Open profile and settings"
      >
        {/* Avatar with online status */}
        <div class="avatar relative flex-shrink-0">
          <div class="bg-base-300/60 ring-base-100 group-hover:ring-primary/20 h-11 w-11 overflow-hidden rounded-full ring-2 transition-all duration-300">
            <Show
              when={hasCustomAvatar()}
              fallback={
                <div class="from-base-300 to-base-400 flex h-full w-full items-center justify-center bg-gradient-to-br">
                  <User size={22} class="text-base-content/40" />
                </div>
              }
            >
              <img
                src={user()?.avatar}
                alt={displayName()}
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                referrerpolicy="no-referrer"
                loading="lazy"
              />
            </Show>
          </div>
          {/* Online status indicator */}
          <Show when={isOnline()}>
            <span class="bg-success ring-base-100 absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full ring-2">
              <span class="bg-success absolute inset-0 animate-ping rounded-full opacity-75"></span>
            </span>
          </Show>
        </div>

        {/* Only show name and status if sidebar is not collapsed */}
        <Show when={!(props.isCollapsed ? props.isCollapsed() : false)}>
          <div class="min-w-0 flex-1 text-left">
            {/* Name */}
            <div class="text-base-content flex items-center gap-2 text-[15px] font-semibold tracking-tight">
              <span class="truncate">{displayName()}</span>
            </div>

            {/* Plan & Email */}
            <div class="mt-0.5 flex items-center gap-2 text-xs">
              {getPlanBadge()}
              <span class="text-base-content/40">|</span>
              <span class="text-base-content/50 min-w-0 truncate font-medium">
                {user()?.email || 'No email'}
              </span>
            </div>
          </div>

          {/* Settings Icon */}
          <div class="flex-shrink-0 opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div class="bg-base-200/80 text-base-content/60 hover:bg-primary/10 hover:text-primary flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300">
              <Settings
                size={16}
                class="transition-transform duration-300 group-hover:rotate-90"
              />
            </div>
          </div>
        </Show>
      </button>
    </footer>
  );
};

export default Footer;
