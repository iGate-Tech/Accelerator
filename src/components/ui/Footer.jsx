import { useUser } from '@context/UserContext';
import { openSettings } from '@components/modals/SettingsModal';
import { Show } from 'solid-js';
import { User } from 'lucide-solid'; // ← make sure lucide-solid is installed

const Footer = (props) => {
  const { user } = useUser();

  const displayName = () => user()?.profile?.name || user()?.name || 'User';
  const hasCustomAvatar = () =>
    user()?.avatar && !user()?.avatar.startsWith('/default') && user()?.avatar.trim() !== '';

  return (
    <footer class="border-t border-base-200 bg-base-100 flex-shrink-0">
      <button
        type="button"
        onClick={openSettings}
        class="
          group w-full px-4 py-3.5
          flex items-center gap-3.5
          hover:bg-base-200/70 active:bg-base-200/90
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-base-100
          cursor-pointer
        "
        aria-label="Open profile and settings"
      >
        {/* Avatar */}
        <div class="avatar flex-shrink-0">
          <div class="w-10 h-10 rounded-full  bg-base-300 ring-1 ring-base-300/60">
            <Show
              when={hasCustomAvatar()}
              fallback={
                <div class="w-full h-full flex items-center justify-center bg-base-300">
                  <User size={22} class="text-base-content/70" />
                </div>
              }
            >
              <img
                src={user()?.avatar}
                alt={displayName()}
                class="w-full h-full object-cover"
                referrerpolicy="no-referrer"
                loading="lazy"
              />
            </Show>
          </div>
        </div>

        {/* Only show name and status if sidebar is not collapsed */}
        <Show when={!(props.isCollapsed ? props.isCollapsed() : false)}>
          {/* Name & status */}
          <div class="flex-1 min-w-0 text-left leading-tight">
            <div class="font-medium truncate text-base-content text-[15px]">
              {displayName()}
            </div>
<div class="
  text-xs text-base-content/60
  flex items-center gap-1.5
   whitespace-nowrap
">
  <span class="font-medium">Free</span>
  <span class="opacity-60">•</span>
  <span class="truncate min-w-0">
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