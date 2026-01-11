import { useUser } from "../../context/UserContext";
import { useNavigate } from "@solidjs/router";
import { onMount, createEffect } from "solid-js";

const RouteGuard = (props) => {
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();

   createEffect(() => {
     if (props.requireAuth && !isAuthenticated()) {
       navigate('/auth/login');
     } else if (props.requireGuest && isAuthenticated() && window.location.pathname !== '/auth/login' && window.location.pathname !== '/auth/signup') {
       navigate('/');
     }
   });

   onMount(() => {
     if (props.requireAuth && !isAuthenticated()) {
       navigate('/auth/login');
     } else if (props.requireGuest && isAuthenticated() && window.location.pathname !== '/auth/login' && window.location.pathname !== '/auth/signup') {
       navigate('/');
     }
   });

  return props.children;
};

export default RouteGuard;