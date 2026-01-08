import { Router, Route } from "@solidjs/router";
import { lazy } from "solid-js";
import { LangProvider } from "./context/LangContext";
import { UserProvider } from "./context/UserContext";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Explore from "./components/Explore";
import Portfolio from "./components/Portfolio";
import Help from "./components/Help";
import Settings from "./components/Settings";
import Packages from "./components/Packages";
import Credits from "./components/Credits";
import Billing from "./components/Billing";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import StatusPage from "./components/StatusPage";
import Changelog from "./components/Changelog";
import Notifications from "./components/Notifications";

const Home = lazy(() => import("./components/Home"));

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