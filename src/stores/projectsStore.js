import { createStore } from 'solid-js/store';

export const [projectsStore, setProjectsStore] = createStore({
  projects: [],
  loading: true,
  count: 0,
  searchQuery: '',
  currentProjectId: null,
  pendingProjectId: null,
});

export const setPendingProjectId = (projectId) => {
  setProjectsStore('pendingProjectId', projectId);
};

export const clearPendingProjectId = () => {
  setProjectsStore('pendingProjectId', null);
};