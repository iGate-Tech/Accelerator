import { Router, Route, Navigate } from "@solidjs/router";
import { lazy, Suspense, Show, useContext } from "solid-js";
import { LangProvider, LangContext } from "./context/LangContext";
import { UserProvider, useUser } from "./context/UserContext";
import { GlobalConfirm as ConfirmModal, ConsentBanner, GlobalErrorDisplay, SupportModal, MainLayout, AuthLayout } from "./components";



const Home = lazy(() => import("./pages/Home"));
const OpenedProject = lazy(() => import("./pages/OpenedProject"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Explore = lazy(() => import("./pages/Explore"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Help = lazy(() => import("./pages/Help"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Packages = lazy(() => import("./pages/Packages"));
const Credits = lazy(() => import("./pages/Credits"));
const Billing = lazy(() => import("./pages/Billing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./components/TermsOfService"));
const StatusPage = lazy(() => import("./components/StatusPage"));
const Changelog = lazy(() => import("./components/Changelog"));
const Notifications = lazy(() => import("./components/Notifications"));
const Invitations = lazy(() => import("./pages/Invitations"));

const ProtectedRoute = (props) => {
  const { isAuthenticated } = useUser();
  return (
    <Show when={isAuthenticated()} fallback={<Navigate href="/auth/login" />}>
      {props.children}
    </Show>
  );
};

const AuthRoute = (props) => {
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

function ProfilePage() {
  return <Profile />;
}

function SettingsPage() {
  return <Settings />;
}

function PackagesPage() {
  return <Packages />;
}

function CreditsPage() {
  return <Credits />;
}

function BillingPage() {
  return <Billing />;
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
      <Suspense fallback={<div class="flex items-center justify-center h-screen"><div class="loading loading-spinner loading-lg"></div></div>}>
        <Router key={langKey()}>
          <Route path="/auth" component={AuthLayout}>
            <Route path="/login" component={LoginPage} />
            <Route path="/signup" component={SignupPage} />
            <Route path="/forgot-password" component={ForgotPasswordPage} />
            <Route path="/auth/reset-password/:token" component={ResetPasswordPage} />
          </Route>
          <Route path="/" component={() => {
            const { isAuthenticated } = useUser();
            return isAuthenticated() ? <Navigate href="/home" /> : <Navigate href="/auth/login" />;
          }} />
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
          <Route path="/profile" component={MainLayout}>
            <Route path="" component={ProfilePage} />
          </Route>
          <Route path="/settings" component={MainLayout}>
            <Route path="" component={SettingsPage} />
          </Route>
          <Route path="/packages" component={MainLayout}>
            <Route path="" component={PackagesPage} />
          </Route>
          <Route path="/credits" component={MainLayout}>
            <Route path="" component={CreditsPage} />
          </Route>
          <Route path="/billing" component={MainLayout}>
            <Route path="" component={BillingPage} />
          </Route>
          <Route path="/invitations" component={MainLayout}>
            <Route path="" component={InvitationsPage} />
          </Route>
          <Route path="/notifications" component={MainLayout}>
            <Route path="" component={Notifications} />
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
