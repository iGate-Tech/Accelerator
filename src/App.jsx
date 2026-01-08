import { Router, Route } from "@solidjs/router";
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

const AppRoutes = () => {
  return (
    <Router>
      <Route path="/" component={MainLayout}>
        <Route path="" component={Home} />
        <Route path="dashboard" component={Dashboard} />
        <Route path="explore" component={Explore} />
        <Route path="portfolio" component={Portfolio} />
        <Route path="help" component={Help} />
        <Route path="profile" component={Profile} />
        <Route path="settings" component={Settings} />
        <Route path="packages" component={Packages} />
        <Route path="credits" component={Credits} />
        <Route path="billing" component={Billing} />
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