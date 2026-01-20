import { createSignal, createResource, createMemo, onMount, onCleanup, For, Show, createEffect, useContext } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { logger } from '../lib/core';
import {
  getGroups,
  getGroupsWithProjects,
  getUngroupedProjects,
  addGroup,
  updateGroup,
  deleteGroup,
  addProjectToGroup,
  removeProjectFromGroup,
  inviteCollaborator,
  getPortfolioInvitations,
  getPortfolioCollaborators,
  removeCollaborator,
  updateCollaboratorRole
} from "../lib/database";
import { LangContext } from "../context/LangContext";
import { useUser } from "../context/UserContext";
import { translations } from "../assets/translations/translations-index.js";
import { ProjectCard } from "../components";
import { toastManager } from "../lib/ui/feedback";
import { useLucideIcons } from "../hooks/useLucideIcons";

const Portfolio = () => {
  logger.trace('Portfolio: Starting');
  const navigate = useNavigate();
  const { lang } = useContext(LangContext);
  const { user } = useUser();
  const [currentLang, setCurrentLang] = createSignal(lang());
  const [groups, { refetch: refetchGroups }] = createResource(() => user()?.id, getGroupsWithProjects);

  useLucideIcons();
  const [ungroupedProjects, { refetch: refetchUngrouped }] = createResource(() => user()?.id, getUngroupedProjects);
  const [showCreateGroupModal, setShowCreateGroupModal] = createSignal(false);
  const [newGroupName, setNewGroupName] = createSignal("");
  const [newGroupDescription, setNewGroupDescription] = createSignal("");
  const [newGroupColor, setNewGroupColor] = createSignal("#6366f1");
  const [editingGroup, setEditingGroup] = createSignal(null);
  const [editGroupName, setEditGroupName] = createSignal("");
  const [editGroupDescription, setEditGroupDescription] = createSignal("");
   const [draggedProject, setDraggedProject] = createSignal(null);
   const [draggedOverGroup, setDraggedOverGroup] = createSignal(null);
   const [showInviteModal, setShowInviteModal] = createSignal(false);
   const [selectedPortfolio, setSelectedPortfolio] = createSignal(null);
   const [inviteeEmail, setInviteeEmail] = createSignal("");
   const [invitationMessage, setInvitationMessage] = createSignal("");
   const [invitationRole, setInvitationRole] = createSignal("editor");
   const [collaborators, { refetch: refetchCollaborators }] = createResource(() => selectedPortfolio(), getPortfolioCollaborators);
   const [invitations, { refetch: refetchInvitations }] = createResource(() => selectedPortfolio(), getPortfolioInvitations);

   const t = createMemo(() => translations[currentLang()]);

  createEffect(() => {
    setCurrentLang(lang());
  });

  const refreshData = async () => {
    await Promise.all([refetchGroups(), refetchUngrouped()]);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName().trim()) return;

    await addGroup({
      name: newGroupName().trim(),
      description: newGroupDescription().trim(),
      color: newGroupColor(),
      createdAt: new Date().toISOString()
    });

    setNewGroupName("");
    setNewGroupDescription("");
    setNewGroupColor("#6366f1");
    setShowCreateGroupModal(false);
    await refreshData();
  };

  const handleEditGroup = async (group) => {
    if (editingGroup() === group.id) {
      if (editGroupName().trim()) {
        await updateGroup(group.id, {
          name: editGroupName().trim(),
          description: editGroupDescription().trim()
        });
        await refreshData();
      }
      setEditingGroup(null);
    } else {
      setEditGroupName(group.name);
      setEditGroupDescription(group.description || "");
      setEditingGroup(group.id);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    toastManager.warning("Deleting group - projects will remain ungrouped.");
    await deleteGroup(groupId);
    await refreshData();
  };

  const handleRemoveProjectFromGroup = async (project, group) => {
    await removeProjectFromGroup(project.id, group.id);
    await refreshData();
    toastManager.success(`Removed ${project.name} from ${group.name}`);
  };

  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, groupId) => {
    e.preventDefault();
    setDraggedOverGroup(groupId);
  };

  const handleDragLeave = () => {
    setDraggedOverGroup(null);
  };

  const handleDrop = async (e, groupId) => {
    e.preventDefault();
    const project = draggedProject();
    if (!project) return;

    if (groupId === 'ungrouped') {
      // Remove from all groups
      const currentGroups = groups() || [];
      for (const group of currentGroups) {
        await removeProjectFromGroup(project.id, group.id);
      }
    } else {
      // Add to group (this will handle the unique constraint)
      await addProjectToGroup(project.id, groupId);
    }

    setDraggedProject(null);
    setDraggedOverGroup(null);
    await refreshData();
  };

   const handleProjectClick = (project) => {
     window.dispatchEvent(new CustomEvent('openProject', { detail: project.id }));
     navigate('/');
   };

   const handleInviteCollaborator = async () => {
     if (!inviteeEmail().trim() || !selectedPortfolio()) return;

     try {
       await inviteCollaborator(
         selectedPortfolio(),
         inviteeEmail().trim(),
         invitationRole(),
         invitationMessage().trim()
       );

       setInviteeEmail("");
       setInvitationMessage("");
       setInvitationRole("editor");
       setShowInviteModal(false);
       await refetchInvitations();
   
  logger.trace('handleManageCollaborators: Starting');    toastManager.success("Invitation sent successfully!");
     } catch (error) {
       toastManager.error("Failed to send invitation: " + error.message);
     }
   };

   const handleManageCollaborators = (groupId) => {
     setSelectedPortfolio(groupId);
     setShowInviteModal(true);
     refetchCollaborators();
     refetchInvitations();
   };

   const handleRemoveCollaborator = async (userId) => {
     try {
       await removeCollaborator(selectedPortfolio(), userId);
       await refetchCollaborators();
       toastManager.success("Collaborator removed successfully!");
     } catch (error) {
       toastManager.error("Failed to remove collaborator: " + error.message);
     }
   };

   const handleUpdateCollaboratorRole = async (userId, role) => {
     try {
       await updateCollaboratorRole(selectedPortfolio(), userId, role);
       await refetchCollaborators();
       toastManager.success("Collaborator role updated!");
     } catch (error) {
       toastManager.error("Failed to update role: " + error.message);
      }
    };

    const onProjectAdded = () => refreshData();
    const onProjectUpdated = () => refreshData();

    onMount(async () => {
      if (window.lucide) window.lucide.createIcons();
      await refreshData();

      window.addEventListener('projectAdded', onProjectAdded);
      window.addEventListener('projectUpdated', onProjectUpdated);
    });

    onCleanup(() => {
      window.removeEventListener('projectAdded', onProjectAdded);
      window.removeEventListener('projectUpdated', onProjectUpdated);
    });

   createEffect(() => {
     if (window.lucide) window.lucide.createIcons();
   });

  const colorOptions = [
    "#6366f1", "#ef4444", "#10b981", "#f59e0b",
    "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"
  ];

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
       <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
         <div class="text-center sm:text-left">
           <h1 class="text-3xl sm:text-4xl font-bold text-base-content">{t().portfolio}</h1>
           <p class="text-base-content/70 mt-2">
             {t().organizeProjects}
           </p>
         </div>
         <button
           class="btn btn-primary w-full sm:w-auto"
           onClick={() => setShowCreateGroupModal(true)}
         >
           {t().createGroup}
         </button>
       </div>

      {/* Create Group Modal */}
      <Show when={showCreateGroupModal()}>
        <div class="modal modal-open">
          <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">{t().createNewGroup}</h3>
            <div class="space-y-4">
              <div>
                <label class="label">
                  <span class="label-text">{t().groupName}</span>
                </label>
                <input
                  type="text"
                  placeholder={t().enterGroupName}
                  class="input input-bordered w-full"
                  value={newGroupName()}
                  onInput={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div>
                <label class="label">
                  <span class="label-text">{t().descriptionOptional}</span>
                </label>
                <textarea
                  placeholder={t().enterGroupDescription}
                  class="textarea textarea-bordered w-full"
                  value={newGroupDescription()}
                  onInput={(e) => setNewGroupDescription(e.target.value)}
                ></textarea>
              </div>
              <div>
                  <label class="label">
                    <span class="label-text">{t().color}</span>
                  </label>
                <div class="flex gap-2 flex-wrap">
                  <For each={colorOptions}>
                    {(color) => (
                      <button
                        class={`w-8 h-8 rounded-full border-2 ${newGroupColor() === color ? 'border-primary' : 'border-base-300'}`}
                        style={{ "background-color": color }}
                        onClick={() => setNewGroupColor(color)}
                      />
                    )}
                  </For>
                </div>
              </div>
            </div>
            <div class="modal-action">
              <button
                class="btn"
                onClick={() => setShowCreateGroupModal(false)}
              >
                {t().cancel}
              </button>
              <button
                class="btn btn-primary"
                onClick={handleCreateGroup}
                disabled={!newGroupName().trim()}
              >
                {t().createGroup}
              </button>
            </div>
          </div>
        </div>
       </Show>

       {/* Invite Collaborator Modal */}
       <Show when={showInviteModal()}>
         <div class="modal modal-open">
           <div class="modal-box max-w-2xl">
             <h3 class="font-bold text-lg mb-4">{t().inviteCollaborator}</h3>
             <div class="space-y-4">
               <div>
                 <label class="label">
                   <span class="label-text">{t().emailAddress}</span>
                 </label>
                 <input
                   type="email"
                   placeholder="colleague@example.com"
                   class="input input-bordered w-full"
                   value={inviteeEmail()}
                   onInput={(e) => setInviteeEmail(e.target.value)}
                 />
               </div>
               <div>
                 <label class="label">
                   <span class="label-text">{t().role}</span>
                 </label>
                 <select
                   class="select select-bordered w-full"
                   value={invitationRole()}
                   onInput={(e) => setInvitationRole(e.target.value)}
                 >
                   <option value="editor">{t().editor}</option>
                   <option value="viewer">{t().viewer}</option>
                 </select>
               </div>
               <div>
                 <label class="label">
                   <span class="label-text">{t().messageOptional}</span>
                 </label>
                 <textarea
                   placeholder={t().invitationMessagePlaceholder}
                   class="textarea textarea-bordered w-full"
                   value={invitationMessage()}
                   onInput={(e) => setInvitationMessage(e.target.value)}
                   rows="3"
                 ></textarea>
               </div>

               {/* Current Collaborators */}
               <Show when={collaborators() && collaborators().length > 0}>
                 <div>
                   <h4 class="font-semibold mb-2">{t().currentCollaborators}</h4>
                   <div class="space-y-2 max-h-40 overflow-y-auto">
                     <For each={collaborators()}>
                       {(collaborator) => (
                         <div class="flex items-center justify-between p-2 bg-base-200 rounded">
                            <div class="flex items-center gap-2">
                              <div class="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center">
                                <i data-lucide="user" class="w-4 h-4"></i>
                              </div>
                              <div>
                               <p class="text-sm font-medium">{collaborator.email}</p>
                               <p class="text-xs text-base-content/60 capitalize">{collaborator.role}</p>
                             </div>
                           </div>
                           <div class="flex items-center gap-2">
                             <select
                               class="select select-xs"
                               value={collaborator.role}
                               onInput={(e) => handleUpdateCollaboratorRole(collaborator.user_id, e.target.value)}
                             >
                               <option value="editor">{t().editor}</option>
                               <option value="viewer">{t().viewer}</option>
                             </select>
                             <button
                               class="btn btn-ghost btn-xs text-error"
                               onClick={() => handleRemoveCollaborator(collaborator.user_id)}
                             >
                               <i data-lucide="x" class="w-4 h-4"></i>
                             </button>
                           </div>
                         </div>
                       )}
                     </For>
                   </div>
                 </div>
               </Show>

               {/* Pending Invitations */}
               <Show when={invitations() && invitations().length > 0}>
                 <div>
                   <h4 class="font-semibold mb-2">{t().pendingInvitations}</h4>
                   <div class="space-y-2 max-h-40 overflow-y-auto">
                     <For each={invitations()}>
                       {(invitation) => (
                         <div class="flex items-center justify-between p-2 bg-base-200 rounded">
                           <div>
                             <p class="text-sm font-medium">{invitation.invitee_email}</p>
                             <p class="text-xs text-base-content/60 capitalize">{invitation.role} • {invitation.status}</p>
                           </div>
                           <div class="text-xs text-base-content/60">
                             {new Date(invitation.invited_at).toLocaleDateString()}
                           </div>
                         </div>
                       )}
                     </For>
                   </div>
                 </div>
               </Show>
             </div>
             <div class="modal-action">
               <button
                 class="btn"
                 onClick={() => setShowInviteModal(false)}
               >
                 {t().cancel}
               </button>
               <button
                 class="btn btn-primary"
                 onClick={handleInviteCollaborator}
                 disabled={!inviteeEmail().trim()}
               >
                 {t().sendInvitation}
               </button>
             </div>
           </div>
         </div>
       </Show>

       {/* Groups and Ungrouped Projects */}
      <Show
        when={!groups.loading && !ungroupedProjects.loading}
        fallback={
          <div class="flex justify-center items-center py-16">
            <div class="loading loading-spinner loading-lg"></div>
            <span class="ms-4 text-lg">{t().loadingPortfolio}</span>
          </div>
        }
      >
        <div class="space-y-8">
          {/* Groups */}
          <For each={groups()}>
            {(group) => (
              <div class="bg-base-100 rounded-box p-6 shadow-sm border border-base-200">
                <div class="flex justify-between items-center mb-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-4 h-4 rounded-full"
                      style={{ "background-color": group.color }}
                    ></div>
                    <Show
                      when={editingGroup() === group.id}
                      fallback={
                        <h3 class="text-xl font-semibold">{group.name}</h3>
                      }
                    >
                      <input
                        type="text"
                        class="input input-ghost text-xl font-semibold px-0 border-none focus:outline-none"
                        value={editGroupName()}
                        onInput={(e) => setEditGroupName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditGroup(group);
                          if (e.key === 'Escape') setEditingGroup(null);
                        }}
                      />
                    </Show>
                    {group.description && (
                      <Show
                        when={editingGroup() === group.id}
                        fallback={
                          <p class="text-sm text-base-content/60">{group.description}</p>
                        }
                      >
                        <textarea
                          class="textarea textarea-ghost text-sm px-0 border-none focus:outline-none resize-none"
                          value={editGroupDescription()}
                          onInput={(e) => setEditGroupDescription(e.target.value)}
                          rows="1"
                        />
                      </Show>
                    )}
                  </div>
                   <div class="flex items-center gap-2">
                     <button
                       class="btn btn-ghost btn-sm"
                       onClick={() => handleManageCollaborators(group.id)}
                       title="Manage Collaborators"
                     >
                       <i data-lucide="users" class="w-4 h-4"></i>
                     </button>
                     <button
                       class="btn btn-ghost btn-sm"
                       onClick={() => handleEditGroup(group)}
                     >
                       <i data-lucide={editingGroup() === group.id ? "check" : "edit"} class="w-4 h-4"></i>
                     </button>
                     <button
                       class="btn btn-ghost btn-sm text-error"
                       onClick={() => handleDeleteGroup(group.id)}
                     >
                       <i data-lucide="trash" class="w-4 h-4"></i>
                     </button>
                   </div>
                </div>

                {/* Drop Zone */}
                <div
                  class={`min-h-[200px] rounded-lg border-2 border-dashed transition-colors p-4 ${
                    draggedOverGroup() === group.id
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 hover:border-base-content/20'
                  }`}
                  onDragOver={(e) => handleDragOver(e, group.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, group.id)}
                >
                  <Show
                    when={group.projects && group.projects.length > 0}
                    fallback={
                    <div class="text-center py-8 text-base-content/50">
                      <i data-lucide="folder-x" class="w-12 h-12 mx-auto mb-2"></i>
                      <p>{t().dropProjectsHere}</p>
                    </div>
                    }
                  >
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <For each={group.projects}>
                        {(project) => (
                          <div
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, project)}
                            class="cursor-move"
                          >
                             <ProjectCard
                               project={project}
                               onClick={handleProjectClick}
                               onRemove={(project) => handleRemoveProjectFromGroup(project, group)}
                               compact={true}
                             />
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </div>
            )}
          </For>

          {/* Ungrouped Projects */}
          <div class="bg-base-100 rounded-box p-6 shadow-sm border border-base-200 mt-10">
            <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
              <i data-lucide="folder-minus" class="w-5 h-5"></i>
              {t().ungroupedProjects}
            </h3>

            <div
              class={`min-h-[200px] rounded-lg border-2 border-dashed transition-colors p-4 ${
                draggedOverGroup() === 'ungrouped'
                  ? 'border-warning bg-warning/5'
                  : 'border-base-300 hover:border-base-content/20'
              }`}
              onDragOver={(e) => handleDragOver(e, 'ungrouped')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'ungrouped')}
            >
              <Show
                when={ungroupedProjects() && ungroupedProjects().length > 0}
                fallback={
                    <div class="text-center py-8 text-base-content/50">
                      <i data-lucide="folder-x" class="w-12 h-12 mx-auto mb-2"></i>
                      <p>{t().noUngroupedProjects}</p>
                    </div>
                }
              >
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <For each={ungroupedProjects()}>
                    {(project) => (
                      <div
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, project)}
                        class="cursor-move"
                      >
                        <ProjectCard
                          project={project}
                          onClick={handleProjectClick}
                          compact={true}
                        />
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Portfolio;