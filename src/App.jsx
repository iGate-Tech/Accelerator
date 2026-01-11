import { Router, Route, Navigate } from "@solidjs/router";
import { lazy, createEffect, useContext } from "solid-js";
import { LangProvider } from "./context/LangContext";
import { UserProvider, useUser } from "./context/UserContext";
import MainLayout from "./components/common/MainLayout";
import AuthLayout from "./components/common/AuthLayout";

const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Explore = lazy(() => import("./pages/Explore"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Help = lazy(() => import("./pages/Help"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Packages = lazy(() => import("./pages/Packages"));
const Credits = lazy(() => import("./pages/Credits"));
const Billing = lazy(() => import("./pages/Billing"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Signup = lazy(() => import("./pages/Auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const PrivacyPolicy = lazy(() => import("./pages/modals/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/modals/TermsOfService"));
const StatusPage = lazy(() => import("./pages/modals/StatusPage"));
const Changelog = lazy(() => import("./pages/modals/Changelog"));
const Notifications = lazy(() => import("./pages/modals/Notifications"));
const Invitations = lazy(() => import("./pages/Invitations"));

const ProtectedRoute = (props) => {
  const { isAuthenticated } = useUser();
  return isAuthenticated() ? props.children : <Navigate href="/auth/login" />;
};

const AppRoutes = () => {
  console.log('AppRoutes component rendering');
  return (
    <Router>
       <Route path="/" component={MainLayout}>
          <Route path="" component={() => <ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="dashboard" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="explore" component={() => <ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="portfolio" component={() => <ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="help" component={Help} />
          <Route path="profile" component={() => <ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="settings" component={() => <ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="packages" component={() => <ProtectedRoute><Packages /></ProtectedRoute>} />
          <Route path="credits" component={() => <ProtectedRoute><Credits /></ProtectedRoute>} />
          <Route path="billing" component={() => <ProtectedRoute><Billing /></ProtectedRoute>} />
          <Route path="privacy-policy" component={PrivacyPolicy} />
          <Route path="terms-of-service" component={TermsOfService} />
          <Route path="status" component={StatusPage} />
          <Route path="changelog" component={Changelog} />
          <Route path="notifications" component={Notifications} />
          <Route path="invitations" component={() => <ProtectedRoute><Invitations /></ProtectedRoute>} />
        </Route>
        <Route path="/auth" component={AuthLayout}>
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/onboarding" component={Onboarding} />
        </Route>
     </Router>
  );
};

const App = () => {
  console.log('App component rendering');
  return (
    <LangProvider>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </LangProvider>
  );
};

export default App;