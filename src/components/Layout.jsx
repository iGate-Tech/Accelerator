import { onMount, createEffect, useContext } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { LangContext } from "../context/LangContext";
import { initDb } from "../lib/db";
import Navbar from "./Navbar";
import favicon from "../assets/favicon.svg";

const Layout = (props) => {
  const navigate = useNavigate();
  const { lang, setLang } = useContext(LangContext);

  createEffect(() => {
    document.documentElement.setAttribute('dir', lang() === 'ar' ? 'rtl' : 'ltr');
  });

  onMount(async () => {
    await initDb();
    // Create Lucide icons
    if (window.lucide) window.lucide.createIcons();

    // Set favicon
    const link = document.querySelector('link[rel="icon"]');
    if (link) link.href = favicon;

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeController = document.getElementById('theme-controller');
    if (themeController) themeController.checked = savedTheme === 'dark';

    // Initialize language
    setLang(localStorage.getItem('lang') || 'en');
    const langSwap = document.getElementById('langSwap');
    if (langSwap) langSwap.checked = lang() === 'ar';
  });

  return (
    <>
      <Navbar />
      <div class="flex w-full">
        <div class="w-full h-[calc(100vh-4rem)] overflow-y-auto pt-16">
          {props.children}
        </div>
      </div>
    </>
  );
};

export default Layout;