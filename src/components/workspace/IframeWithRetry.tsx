import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState, useRef } from "react";
import { RefreshOverlay } from "./RefreshOverlay";

const MAX_RETRIES = 5;
const MAX_RETRY_DELAY = 10000;

interface IframeWithRetryProps {
  endpoint: string;
  nativeMode?: boolean;
  onLoad?: () => void;
  hasSetupEventListener: boolean;
  cdSetup: boolean;
  iframeLoaded: boolean;
  activeDrawer: string | null;
  [key: string]: any;
}

export function IframeWithRetry({
  endpoint,
  nativeMode = false,
  onLoad,
  hasSetupEventListener,
  cdSetup,
  iframeLoaded,
  activeDrawer,
  ...props
}: IframeWithRetryProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const retryDelay = Math.min(1000 * Math.pow(2, retryCount), MAX_RETRY_DELAY);

  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setIframeKey((prev) => prev + 1);
      }, retryDelay);
    } else {
      setShowErrorOverlay(true);
    }
  }, [retryCount, retryDelay]);

  const handleSuccessfulLoad = useCallback(() => {
    setRetryCount(0);
    setShowErrorOverlay(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onLoad?.();
  }, [onLoad]);

  const handleRetry = useCallback(() => {
    setShowErrorOverlay(false);
    setRetryCount(0);
    setIframeKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!iframeLoaded) return;
    if (cdSetup) return;

    const eventListener = (event: any) => {
      if (event.origin !== endpoint) return;

      try {
        const data = JSON.parse(event.data);
        if (data.type === "cd_plugin_onInit") {
          console.log("clear Timeout");
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          window.removeEventListener("message", eventListener, {
            capture: true,
          });
        }
      } catch (error) {}
    };

    window.addEventListener("message", eventListener, {
      capture: true,
    });

    timeoutRef.current = setTimeout(() => {
      window.removeEventListener("message", eventListener);
      handleError();
    }, 20000);

    return () => {
      window.removeEventListener("message", eventListener, {
        capture: true,
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [iframeLoaded, cdSetup, endpoint, handleError]);

  return (
    <>
      {!showErrorOverlay && hasSetupEventListener && (
        <iframe
          key={`${endpoint}-${iframeKey}`}
          id="workspace-iframe"
          src={
            nativeMode
              ? `${endpoint}?native_mode=true`
              : `${endpoint}?workspace_mode=true`
          }
          style={{
            userSelect: "none",
          }}
          className={cn(
            "inset-0 h-full w-full border-none z-[20]",
            !cdSetup && "pointer-events-none",
            iframeLoaded && "bg-[#353535] pt-12",
            activeDrawer === "assets" && "pointer-events-none blur-sm"
          )}
          title="iframeContent"
          allow="autoplay; encrypted-media; fullscreen; display-capture; camera; microphone"
          onLoad={handleSuccessfulLoad}
          onError={handleError}
          {...props}
        />
      )}

      {showErrorOverlay && <RefreshOverlay onRetry={handleRetry} />}
    </>
  );
}
