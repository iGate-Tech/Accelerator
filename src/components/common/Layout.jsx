import {onMount, createEffect, createSignal, useContext} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {LangContext} from "../../context/LangContext";
import {getPg} from "../../lib/db";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import favicon from "../../assets/favicon.svg";

const Layout = (props) => {
    const navigate = useNavigate();
    const context = useContext(LangContext) || {
        lang: () => 'ar',
        setLang: () => {},
        serverReachable: () => true,
        setServerReachable: () => {}
    };
    const {lang, setLang, serverReachable, setServerReachable} = context;

    // Make component reactive to language changes
    const [currentLang, setCurrentLang] = createSignal(lang());

    createEffect(() => {
        const newLang = lang();
        setCurrentLang(newLang);
        document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
        console.log('Language changed to:', newLang);
    });

    const checkServerConnectivity = async () => {
        try {
            const response = await fetch('/api/health', {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
            setServerReachable(response.ok);
        } catch {
            setServerReachable(false);
        }
    };

export default Layout;
