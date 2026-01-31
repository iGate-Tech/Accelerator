import {
  createSignal,
  createResource,
  createMemo,
  onMount,
  For,
  Show,
  useContext,
} from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useUser } from '@context/UserContext';
import { getUserInvitations, respondToInvitation } from '@lib/database';
import { toastManager } from '@lib/ui/feedback';
import { LangContext } from '@context/LangContext';
import { translations } from '@assets/translations/translations-index.js';
import { logger } from '@lib/core';
import { MailX, UserPlus, Check, X } from 'lucide-solid';
import { useDocumentTitle } from '@hooks/useDocumentTitle';

const Invitations = () => {
  logger.trace('Invitations: Starting');
  const navigate = useNavigate();

  // Set document title
  useDocumentTitle('Invitations');

  const { user } = useUser();
  const { lang } = useContext(LangContext);
  const [currentLang, setCurrentLang] = createSignal(lang());

  const [invitations, { refetch }] = createResource(
    () => user()?.email,
    async email => {
      if (!email) return [];
      return await getUserInvitations(email);
    }
  );

  const t = createMemo(() => translations[currentLang()]);

  onMount(() => {
    setCurrentLang(lang());
  });

  const handleRespondToInvitation = async (invitationId, status) => {
    try {
      await respondToInvitation(invitationId, status);
      refetch();
      toastManager.success(
        status === 'accepted'
          ? 'Invitation accepted! You can now collaborate on this portfolio.'
          : 'Invitation declined.'
      );
    } catch (error) {
      toastManager.error('Failed to respond to invitation: ' + error.message);
    }
  };

  return (
    <div class="mx-auto max-w-6xl space-y-8 overflow-visible px-4 py-6 sm:px-6 sm:py-8">
      {/* Back Button */}
      <div class="mb-4 flex justify-start">
        <button
          onClick={() => window.history.back()}
          class="btn btn-ghost btn-sm gap-2"
        >
          <svg
            class="h-4 w-4 rtl:scale-x-[-1] rtl:transform"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            width="16"
            height="16"
            viewBox="0 0 24 24"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span class="hidden sm:inline">Back</span>
        </button>
      </div>

      {/* Header */}
      <div class="text-center sm:text-left">
        <h1 class="text-base-content text-3xl font-bold sm:text-4xl">
          {t().portfolioInvitations}
        </h1>
        <p class="text-base-content/70 mt-2">{t().manageInvitationsDesc}</p>
      </div>

      {/* Invitations List */}
      <Show
        when={!invitations.loading}
        fallback={
          <div class="flex items-center justify-center py-16">
            <div class="loading loading-spinner loading-lg" />
            <span class="ms-4 text-lg">{t().loadingInvitations}</span>
          </div>
        }
      >
        <Show
          when={invitations() && invitations().length > 0}
          fallback={
            <div class="py-16 text-center">
              <MailX
                class="text-base-content/30 mx-auto mb-4 h-16 w-16"
              />
              <h3 class="text-base-content/70 mb-2 text-xl font-semibold">
                {(t() && t().noInvitations) || 'No pending invitations'}
              </h3>
              <p class="text-base-content/50">{(t() && t().noInvitationsDesc) || 'You currently have no pending portfolio invitations.'}</p>
            </div>
          }
        >
          <div class="space-y-4">
            <For each={invitations()}>
              {invitation => (
                <div class="bg-base-100 rounded-box border-base-200 border p-6 shadow-sm">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="mb-2 flex items-center gap-3">
                        <UserPlus
                          class="text-primary h-5 w-5"
                        />
                        <h3 class="text-lg font-semibold">
                          {invitation.portfolio_name}
                        </h3>
                        <span
                          class={`badge badge-sm capitalize ${
                            invitation.role === 'editor'
                              ? 'badge-primary'
                              : 'badge-secondary'
                          }`}
                        >
                          {invitation.role}
                        </span>
                      </div>
                      <p class="text-base-content/70 mb-2 text-sm">
                        {t().invitedBy} {invitation.inviter_email}
                      </p>
                      <Show when={invitation.message}>
                        <div class="bg-base-200 mb-4 rounded p-3">
                          <p class="text-sm">{invitation.message}</p>
                        </div>
                      </Show>
                      <p class="text-base-content/50 text-xs">
                        {t().expiresOn}{' '}
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div class="ms-4 flex gap-2">
                      <button
                        class="btn btn-success btn-sm"
                        onClick={() =>
                          handleRespondToInvitation(invitation.id, 'accepted')
                        }
                      >
                        <Check class="me-1 h-4 w-4" />
                        {t().accept}
                      </button>
                      <button
                        class="btn btn-error btn-sm"
                        onClick={() =>
                          handleRespondToInvitation(invitation.id, 'rejected')
                        }
                      >
                        <X class="me-1 h-4 w-4" />
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
