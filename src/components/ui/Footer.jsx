import { useUser } from '@context/UserContext';
import { openSettings } from '@components/modals/SettingsModal';
import { Show } from 'solid-js';
import { User } from 'lucide-solid'; // ← make sure lucide-solid is installed

const Footer = props => {
  const { user } = useUser();

  const displayName = () => user()?.profile?.name || user()?.name || 'User';
  const hasCustomAvatar = () =>
    user()?.avatar &&
    !user()?.avatar.startsWith('/default') &&
    user()?.avatar.trim() !== '';

  return (
    <footer class="border-base-200/80 bg-base-100 flex-shrink-0 border-t">
      <button
        type="button"
        onClick={openSettings}
        class="group hover:bg-base-200/50 active:bg-base-200/80 focus:ring-primary/40 focus:ring-offset-base-100 flex w-full cursor-pointer items-center gap-4 px-5 py-4 transition-colors duration-200 ease-out focus:ring-2 focus:ring-offset-2 focus:outline-none"
        aria-label="Open profile and settings"
      >
        {/* Avatar */}
        <div class="avatar flex-shrink-0">
          <div class="bg-base-300/50 ring-base-200/60 h-10 w-10 overflow-hidden rounded-full ring-1">
            <Show
              when={hasCustomAvatar()}
              fallback={
                <div class="flex h-full w-full items-center justify-center">
                  <User size={20} class="text-base-content/50" />
                </div>
              }
            >
              <img
                src={user()?.avatar}
                alt={displayName()}
                class="h-full w-full object-cover"
                referrerpolicy="no-referrer"
                loading="lazy"
              />
            </Show>
          </div>
        </div>

        {/* Only show name and status if sidebar is not collapsed */}
        <Show when={!(props.isCollapsed ? props.isCollapsed() : false)}>
          {/* Name & status */}
          <div class="min-w-0 flex-1 text-left leading-snug">
            <div class="text-base-content truncate text-[14px] font-semibold tracking-tight">
              {displayName()}
            </div>
            <div class="text-base-content/50 flex items-center gap-2 text-xs font-medium whitespace-nowrap">
              <span>Free</span>
              <span class="text-base-content/30">·</span>
              <span class="min-w-0 truncate">
                {user()?.email || 'No email'}
              </span>
            </div>
          </div>
        </Show>
      </button>
    </footer>
  );
};

export default Footer;
