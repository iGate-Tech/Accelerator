import { useUser } from "../../context/UserContext";
import { useNavigate } from "@solidjs/router";
import { onMount } from "solid-js";

const RouteGuard = (props) => {
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();

  onMount(() => {
    if (props.requireAuth && !isAuthenticated()) {
      navigate('/login');
    } else if (props.requireGuest && isAuthenticated() && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
      navigate('/');
    }
  });

  return props.children;
};

export default RouteGuard;