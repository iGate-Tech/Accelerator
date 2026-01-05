import { Router, Route } from "@solidjs/router";
import { lazy } from "solid-js";
import { LangProvider } from "./context/LangContext";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Explore from "./components/Explore";
import Portfolio from "./components/Portfolio";
import Help from "./components/Help";

const Home = lazy(() => import("./components/Home"));

const App = () => (
  <LangProvider>
    <Router>
      <Route path="/" component={Layout}>
        <Route path="" component={Home} />
        <Route path="dashboard" component={Dashboard} />
        <Route path="explore" component={Explore} />
        <Route path="portfolio" component={Portfolio} />
        <Route path="help" component={Help} />
      </Route>
    </Router>
  </LangProvider>
);

export default App;