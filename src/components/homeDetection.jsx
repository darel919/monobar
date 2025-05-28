"use client";

import { useEffect } from "react";

export default function UrlDetector() {
    useEffect(() => {
        async function detectIsHome() {
            if(process.env.NODE_ENV === "development") return;
            if (window.location.hostname === "monobar.server.drl") return;
            try {
                const res = await fetch(process.env.NEXT_PUBLIC_DARELISME_PING_URL, { 
                    cache: "no-store", 
                    timeout: 4000 
                });
                if (res.ok) return;
                
                localStorage.setItem('redirectAfterSwitch', window.location.pathname + window.location.search);
                window.location.href = process.env.NEXT_PUBLIC_APP_LOCAL_BASE_URL + window.location.pathname + window.location.search;
            } catch {
                localStorage.setItem('redirectAfterSwitch', window.location.pathname + window.location.search);
                window.location.href = process.env.NEXT_PUBLIC_APP_LOCAL_BASE_URL + window.location.pathname + window.location.search;
            }
        }
        detectIsHome();
    }, []);

    return null;
}
