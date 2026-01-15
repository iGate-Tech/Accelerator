import { createSignal, createResource, onMount, For, Show, useContext } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../../context/UserContext";
import { getUserInvitations, respondToInvitation } from "../../lib/db";
import { toastManager } from "../../lib/feedback";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";
import logger from '../../lib/logger.js';


const Invitations = () => {
  logger.trace('Invitations: Starting');
  const navigate = useNavigate();
  const { user } = useUser();
  const { lang } = useContext(LangContext);
  const [currentLang, setCurrentLang] = createSignal(lang());

  const [invitations, { refetch }] = createResource(
    () => user()?.email,
    async (email) => {
      if (!email) return [];
      return await getUserInvitations(email);
    }
  );

  const t = () => translations[currentLang()];

  onMount(() => {
    setCurrentLang(lang());
    if (window.lucide) window.lucide.createIcons();
  });

  const handleRespondToInvitation = async (invitationId, status) => {
    try {
      await respondToInvitation(invitationId, status);
      refetch();
      toastManager.success(
        status === 'accepted'
          ? "Invitation accepted! You can now collaborate on this portfolio."
          : "Invitation declined."
      );
    } catch (error) {
      toastManager.error("Failed to respond to invitation: " + error.message);
    }
  };

  return (
    <div class={`space-y-6 mt-10 px-4 sm:px-6 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div class="text-center sm:text-left">
        <h1 class="text-3xl sm:text-4xl font-bold text-base-content">{t().portfolioInvitations}</h1>
        <p class="text-base-content/70 mt-2">
          {t().manageInvitationsDesc}
        </p>
      </div>

      {/* Invitations List */}
      <Show
        when={!invitations.loading}
        fallback={
          <div class="flex justify-center items-center py-16">
            <div class="loading loading-spinner loading-lg"></div>
            <span class="ml-4 text-lg">{t().loadingInvitations}</span>
          </div>
        }
      >
        <Show
          when={invitations() && invitations().length > 0}
          fallback={
            <div class="text-center py-16">
              <i data-lucide="mail-x" class="w-16 h-16 mx-auto text-base-content/30 mb-4"></i>
              <h3 class="text-xl font-semibold text-base-content/70 mb-2">{t().noInvitations}</h3>
              <p class="text-base-content/50">{t().noInvitationsDesc}</p>
            </div>
          }
        >
          <div class="space-y-4">
            <For each={invitations()}>
              {(invitation) => (
                <div class="bg-base-100 rounded-box p-6 shadow-sm border border-base-200">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <i data-lucide="user-plus" class="w-5 h-5 text-primary"></i>
                        <h3 class="text-lg font-semibold">{invitation.portfolio_name}</h3>
                        <span class={`badge badge-sm capitalize ${
                          invitation.role === 'editor' ? 'badge-primary' : 'badge-secondary'
                        }`}>
                          {invitation.role}
                        </span>
                      </div>
                      <p class="text-sm text-base-content/70 mb-2">
                        {t().invitedBy} {invitation.inviter_email}
                      </p>
                      <Show when={invitation.message}>
                        <div class="bg-base-200 rounded p-3 mb-4">
                          <p class="text-sm">{invitation.message}</p>
                        </div>
                      </Show>
                      <p class="text-xs text-base-content/50">
                        {t().expiresOn} {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div class="flex gap-2 ml-4">
                      <button
                        class="btn btn-success btn-sm"
                        onClick={() => handleRespondToInvitation(invitation.id, 'accepted')}
                      >
                        <i data-lucide="check" class="w-4 h-4 mr-1"></i>
                        {t().accept}
                      </button>
                      <button
                        class="btn btn-error btn-sm"
                        onClick={() => handleRespondToInvitation(invitation.id, 'rejected')}
                      >
                        <i data-lucide="x" class="w-4 h-4 mr-1"></i>
                        {t().decline}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default Invitations;