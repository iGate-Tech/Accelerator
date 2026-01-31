// Component exports
export { default as ConsentBanner } from './feedback/ConsentBanner';
export { default as Sidebar } from './navigation/Sidebar';

// UI components
export { default as Footer } from './ui/Footer';
export { default as ProjectCard } from './ui/ProjectCard';

// Navigation components
export { default as ProjectsSection } from './navigation/ProjectsSection';

// Business components
export { default as AgentInterface } from './business/AgentInterface';
export { default as ResponseSection } from './business/ResponseSection';

// Feedback components
export { default as LoadingOverlay } from './feedback/LoadingOverlay';
export {
  loadingManager,
  errorManager,
  GlobalLoading,
  GlobalError,
  ToastContainer,
} from './feedback/GlobalUI';

// Modal components
export {
  default as GlobalConfirm,
  confirmReset,
  confirmDelete,
  confirmLogout,
  confirmDanger,
} from './modals/GlobalConfirm';
export { default as SupportModal } from './modals/SupportModal';
export { default as SettingsModal } from './modals/SettingsModal';

// Utility components
export {
  ErrorBoundary,
  GlobalErrorDisplay,
  errorHandler,
  handleAsyncError,
} from './utilities/ErrorHandler';
export { default as OfflineIndicator } from './utilities/OfflineIndicator';
export { default as ProtectedRoute } from './utilities/ProtectedRoute';
export { default as RouteGuard } from './utilities/RouteGuard';
export { default as ValidationWarnings } from './utilities/ValidationWarnings';
