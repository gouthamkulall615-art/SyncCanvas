// src/hooks/usePWAInstall.js
import { useState, useEffect, useCallback, useRef } from "react";

const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const promptTimerRef = useRef(null);

  // Check standalone mode
  const checkIsStandalone = useCallback(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://")
    );
  }, []);

  // Check if user already installed or recently dismissed
  const checkIsSuppressed = useCallback(() => {
    if (typeof window === "undefined") return true;
    if (checkIsStandalone()) return true;

    try {
      const installed = localStorage.getItem("pwa_installed");
      if (installed === "true") return true;

      const dismissedAt = localStorage.getItem("pwa_dismissed_at");
      if (dismissedAt) {
        const timeSinceDismiss = Date.now() - parseInt(dismissedAt, 10);
        if (timeSinceDismiss < DISMISS_DURATION_MS) {
          return true;
        }
      }
    } catch {
      // LocalStorage might be restricted
    }

    return false;
  }, [checkIsStandalone]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect iOS Safari (which doesn't support beforeinstallprompt)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const isSafariBrowser =
      /safari/.test(ua) && !/chrome|crios|crmo|firefox|fxios|edge|edg|opr|opera/i.test(ua);
    const iOSStandalone = window.navigator.standalone === true;

    const isIOSSafari = isIOSDevice && isSafariBrowser && !iOSStandalone;
    setIsIOS(isIOSSafari);

    // If suppressed or already standalone, do nothing
    if (checkIsSuppressed()) {
      return;
    }

    // For iOS Safari, trigger popup ~2s after load since beforeinstallprompt never fires
    if (isIOSSafari) {
      promptTimerRef.current = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    }

    // Listen for beforeinstallprompt (Chromium / Android / Desktop Chrome / Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Trigger ~2 seconds after load
      if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
      promptTimerRef.current = setTimeout(() => {
        if (!checkIsSuppressed()) {
          setShowPrompt(true);
        }
      }, 2000);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem("pwa_installed", "true");
      } catch {
        // Ignored
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [checkIsSuppressed]);

  // Install trigger
  const install = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === "accepted") {
        try {
          localStorage.setItem("pwa_installed", "true");
        } catch {
          // Ignored
        }
      }
    } catch (err) {
      console.warn("[PWA] Installation prompt error:", err);
    } finally {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  }, [deferredPrompt]);

  // Dismiss trigger
  const dismiss = useCallback(() => {
    try {
      localStorage.setItem("pwa_dismissed_at", Date.now().toString());
    } catch {
      // Ignored
    }
    setShowPrompt(false);
  }, []);

  return {
    isInstallable: Boolean(deferredPrompt) || isIOS,
    showPrompt,
    isIOS,
    install,
    dismiss,
  };
}

export default usePWAInstall;
