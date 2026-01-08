import { Router, Route } from "@solidjs/router";
import { lazy } from "solid-js";
import { LangProvider } from "./context/LangContext";
import { UserProvider } from "./context/UserContext";
import Layout from "./components/common/Layout";
import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import Portfolio from "./pages/Portfolio";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import Packages from "./pages/Packages";
import Credits from "./pages/Credits";
import Billing from "./pages/Billing";
import PrivacyPolicy from "./pages/modals/PrivacyPolicy";
import TermsOfService from "./pages/modals/TermsOfService";
import StatusPage from "./pages/modals/StatusPage";
import Changelog from "./pages/modals/Changelog";
import Notifications from "./pages/modals/Notifications";

const Home = lazy(() => import("./pages/Home"));

const App = () => (
  <LangProvider>
    <UserProvider>
      <Router>
        <Route path="/" component={Layout}>
          <Route path="" component={Home} />
          <Route path="dashboard" component={Dashboard} />
          <Route path="explore" component={Explore} />
          <Route path="portfolio" component={Portfolio} />
          <Route path="help" component={Help} />
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
      </Router>
    </UserProvider>
  </LangProvider>
);

export default App;