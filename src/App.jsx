import { Router, Route, Navigate } from "@solidjs/router";
import { lazy, createEffect, useContext } from "solid-js";
import { LangProvider } from "./context/LangContext";
import { UserProvider, useUser } from "./context/UserContext";
import MainLayout from "./components/common/MainLayout";
import AuthLayout from "./components/common/AuthLayout";
import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import Portfolio from "./pages/Portfolio";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Packages from "./pages/Packages";
import Credits from "./pages/Credits";
import Billing from "./pages/Billing";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import PrivacyPolicy from "./pages/modals/PrivacyPolicy";
import TermsOfService from "./pages/modals/TermsOfService";
import StatusPage from "./pages/modals/StatusPage";
import Changelog from "./pages/modals/Changelog";
import Notifications from "./pages/modals/Notifications";

const Home = lazy(() => import("./pages/Home"));

const ProtectedRoute = (props) => {
  const { isAuthenticated } = useUser();
  return isAuthenticated() ? props.children : <Navigate href="/login" />;
};

const AppRoutes = () => {
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
      </Route>
      <Route path="/" component={AuthLayout}>
        <Route path="login" component={Login} />
        <Route path="signup" component={Signup} />
        <Route path="forgot-password" component={ForgotPassword} />
        <Route path="onboarding" component={Onboarding} />
      </Route>
    </Router>
  );
};

const App = () => (
  <LangProvider>
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  </LangProvider>
);

export default App;