import { Router, Route, Navigate } from '@solidjs/router';
import { lazy, Suspense, Show, useContext } from 'solid-js';
import { LangProvider, LangContext } from './context/LangContext';
import { UserProvider, useUser } from './context/UserContext';
import {
  GlobalConfirm as ConfirmModal,
  ConsentBanner,
  GlobalErrorDisplay,
  SupportModal,
} from './components';
import {
  MainLayout,
  AuthLayout,
} from './layouts';

const Home = lazy(() => import('./pages/main/Home'));
const OpenedProject = lazy(() => import('./pages/main/OpenedProject'));
const Dashboard = lazy(() => import('./pages/main/Dashboard'));
const Explore = lazy(() => import('./pages/main/Explore'));
const Portfolio = lazy(() => import('./pages/main/Portfolio'));
const Help = lazy(() => import('./pages/info/Help'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const PrivacyPolicy = lazy(() => import('./pages/info/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/info/TermsOfService'));
const StatusPage = lazy(() => import('./pages/info/StatusPage'));
const Changelog = lazy(() => import('./pages/info/Changelog'));
const Invitations = lazy(() => import('./pages/user/Invitations'));

const ProtectedRoute = props => {
  const { isAuthenticated } = useUser();
  return (
    <Show when={isAuthenticated()} fallback={<Navigate href="/auth/login" />}>
      {props.children}
    </Show>
  );
};

const AuthRoute = props => {
  const { isAuthenticated } = useUser();
  return (
    <Show when={!isAuthenticated()} fallback={<Navigate href="/" />}>
      {props.children}
    </Show>
  );
};

function DashboardPage() {
  return <Dashboard />;
}

function ExplorePage() {
  return <Explore />;
}

function PortfolioPage() {
  return <Portfolio />;
}

function InvitationsPage() {
  return <Invitations />;
}

function OpenedProjectPage() {
  return <OpenedProject />;
}

function HomePage() {
  return <Home />;
}

function LoginPage() {
  return <Login />;
}

function SignupPage() {
  return <Signup />;
}

function ForgotPasswordPage() {
  return <ForgotPassword />;
}

function ResetPasswordPage() {
  return <ResetPassword />;
}

const AppContent = () => {
  const { langKey } = useContext(LangContext);

  return (
    <UserProvider>
      <ConfirmModal />
      <Suspense
        fallback={
          <div class="flex h-screen items-center justify-center">
            <div class="loading loading-spinner loading-lg" />
          </div>
        }
      >
        <Router key={langKey()}>
          <Route path="/auth" component={AuthLayout}>
            <Route path="/login" component={LoginPage} />
            <Route path="/signup" component={SignupPage} />
            <Route path="/forgot-password" component={ForgotPasswordPage} />
            <Route
              path="/auth/reset-password/:token"
              component={ResetPasswordPage}
            />
          </Route>
          <Route
            path="/"
            component={() => {
              const { isAuthenticated } = useUser();
              return isAuthenticated() ? (
                <Navigate href="/home" />
              ) : (
                <Navigate href="/auth/login" />
              );
            }}
          />
          <Route path="/home" component={MainLayout}>
            <Route path="" component={HomePage} />
          </Route>
          <Route path="/opened-project" component={MainLayout}>
            <Route path="" component={OpenedProjectPage} />
          </Route>
          <Route path="/opened-project/:id" component={MainLayout}>
            <Route path="" component={OpenedProjectPage} />
          </Route>
          <Route path="/dashboard" component={MainLayout}>
            <Route path="" component={DashboardPage} />
          </Route>
          <Route path="/explore" component={MainLayout}>
            <Route path="" component={ExplorePage} />
          </Route>
          <Route path="/portfolio" component={MainLayout}>
            <Route path="" component={PortfolioPage} />
          </Route>
          <Route path="/help" component={MainLayout}>
            <Route path="" component={Help} />
          </Route>
          <Route path="/invitations" component={MainLayout}>
            <Route path="" component={InvitationsPage} />
          </Route>

          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/status" component={StatusPage} />
          <Route path="/changelog" component={Changelog} />
          <Route path="*" component={() => <Navigate href="/home" replace />} />
        </Router>
        <ConsentBanner />
        <GlobalErrorDisplay />
        <SupportModal />
      </Suspense>
    </UserProvider>
  );
};

const App = () => {
  return (
    <LangProvider>
      <AppContent />
    </LangProvider>
  );
};

export default App;
