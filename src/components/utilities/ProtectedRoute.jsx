import { createSignal, onMount, Show, createResource } from 'solid-js';
import { useUser } from '@context/UserContext';
import { useNavigate } from '@solidjs/router';
import { logger } from '@lib/core';

const ProtectedRoute = props => {
  logger.trace('ProtectedRoute: Starting');
  const { isAuthenticated, checkAuth } = useUser();
  const navigate = useNavigate();

  // Wait for auth check
  const [authChecked] = createResource(async () => {
    await checkAuth();
    return true;
  });

  // Auth check is handled asynchronously but don't block with loading
  // if (!authChecked()) {
  //   return <div class="flex justify-center items-center h-screen"><div class="loading loading-spinner loading-lg"></div></div>;
  // }

  // Check authentication status after check is done
  const auth = isAuthenticated();
  logger.debug(
    'ProtectedRoute: Authentication check - isAuthenticated:',
    auth,
    'current path:',
    window.location.pathname
  );

  // If not authenticated, redirect to login
  if (!auth) {
    logger.info(
      'ProtectedRoute: User not authenticated, redirecting to /auth/login'
    );
    navigate('/auth/login', { replace: true });
    return null;
  }

  // If authenticated, render the component
  return props.children;
};

export default ProtectedRoute;
