import { createSignal, createResource, createMemo, onMount, For, Show, createEffect, useContext } from "solid-js";
import { useNavigate } from "@solidjs/router";
import {
  getGroups,
  getGroupsWithProjects,
  getUngroupedProjects,
  addGroup,
  updateGroup,
  deleteGroup,
  addProjectToGroup,
  removeProjectFromGroup
} from "../../lib/db";
import { LangContext } from "../../context/LangContext";
import { translations } from "../../assets/translations/translations-index.js";
import ProjectCard from "../../components/ui/ProjectCard";

const Portfolio = () => {
  const navigate = useNavigate();
  const { lang } = useContext(LangContext);
  const [currentLang, setCurrentLang] = createSignal(lang());
  const [groups, { refetch: refetchGroups }] = createResource(getGroupsWithProjects);
  const [ungroupedProjects, { refetch: refetchUngrouped }] = createResource(getUngroupedProjects);
  const [showCreateGroupModal, setShowCreateGroupModal] = createSignal(false);
  const [newGroupName, setNewGroupName] = createSignal("");
  const [newGroupDescription, setNewGroupDescription] = createSignal("");
  const [newGroupColor, setNewGroupColor] = createSignal("#6366f1");
  const [editingGroup, setEditingGroup] = createSignal(null);
  const [editGroupName, setEditGroupName] = createSignal("");
  const [editGroupDescription, setEditGroupDescription] = createSignal("");
  const [draggedProject, setDraggedProject] = createSignal(null);
  const [draggedOverGroup, setDraggedOverGroup] = createSignal(null);

  const t = () => translations[currentLang()];

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
      createdAt: new Date()
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

  onMount(async () => {
    if (window.lucide) window.lucide.createIcons();
    await refreshData();

    // Listen for project updates
    window.addEventListener('projectAdded', refreshData);
    window.addEventListener('projectUpdated', refreshData);
  });

  createEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const colorOptions = [
    "#6366f1", "#ef4444", "#10b981", "#f59e0b",
    "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"
  ];

  return (
    <div class={`space-y-6 mt-10 ${currentLang() === 'ar' ? 'rtl' : 'ltr'}`}>
       {/* Header */}
       <div class="flex justify-between items-center">
         {currentLang() === 'ar' ? (
           <>
             <button
               class="btn btn-primary"
               onClick={() => setShowCreateGroupModal(true)}
             >
               {t().createGroup}
             </button>
             <div>
               <h1 class="text-4xl font-bold text-base-content">{t().portfolio}</h1>
               <p class="text-base-content/70 mt-2">
                 {t().organizeProjects}
               </p>
             </div>
           </>
         ) : (
           <>
             <div>
               <h1 class="text-4xl font-bold text-base-content">{t().portfolio}</h1>
               <p class="text-base-content/70 mt-2">
                 {t().organizeProjects}
               </p>
             </div>
             <button
               class="btn btn-primary"
               onClick={() => setShowCreateGroupModal(true)}
             >
               {t().createGroup}
             </button>
           </>
         )}
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

      {/* Groups and Ungrouped Projects */}
      <Show
        when={!groups.loading && !ungroupedProjects.loading}
        fallback={
          <div class="flex justify-center items-center py-16">
            <div class="loading loading-spinner loading-lg"></div>
            <span class="ml-4 text-lg">{t().loadingPortfolio}</span>
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