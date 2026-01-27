import { createSignal, createResource, createMemo, onMount, For, Show, useContext } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useUser } from "../context/UserContext";
import { getUserInvitations, respondToInvitation } from "@lib/database";
import { toastManager } from "@lib/ui/feedback";
import { LangContext } from "../context/LangContext";
import { translations } from "../assets/translations/translations-index.js";
import { logger } from '@lib/core';


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

   const t = createMemo(() => translations[currentLang()]);

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
     <div class="max-w-6xl mx-auto space-y-8 px-4 sm:px-6 py-6 sm:py-8 overflow-visible">
       {/* Back Button */}
       <div class="flex justify-start mb-4">
         <button
           onClick={() => window.history.back()}
           class="btn btn-ghost btn-sm gap-2"
         >
           <svg class="w-4 h-4 rtl:transform rtl:scale-x-[-1]" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
           <span class="hidden sm:inline">Back</span>
         </button>
       </div>

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
            <span class="ms-4 text-lg">{t().loadingInvitations}</span>
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
                    <div class="flex gap-2 ms-4">
                      <button
                        class="btn btn-success btn-sm"
                        onClick={() => handleRespondToInvitation(invitation.id, 'accepted')}
                      >
                        <i data-lucide="check" class="w-4 h-4 me-1"></i>
                        {t().accept}
                      </button>
                      <button
                        class="btn btn-error btn-sm"
                        onClick={() => handleRespondToInvitation(invitation.id, 'rejected')}
                      >
                        <i data-lucide="x" class="w-4 h-4 me-1"></i>
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