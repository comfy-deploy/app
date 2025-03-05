import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRef, useEffect, useState } from "react";

interface SpotlightProps {
  children: ReactNode;
  tooltip?: ReactNode;
  show?: boolean;
  tooltipPosition?: {
    offsetX?: number; // Horizontal offset from center
    offsetY?: number; // Vertical offset from bottom
    align?: "start" | "center" | "end"; // Horizontal alignment
    side?: "top" | "bottom"; // Vertical position
  };
  delay?: number; // Delay in milliseconds
  maskMargin?: number; // New margin property for the mask
}

export function Spotlight({
  children,
  tooltip,
  show = true,
  tooltipPosition = {
    offsetX: 0,
    offsetY: 16,
    align: "center",
    side: "bottom",
  },
  delay = 0, // Default to no delay
  maskMargin = 4, // Default 4px margin on all sides
}: SpotlightProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!show) {
      setShouldShow(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!targetRef.current) return;

      const newRect = targetRef.current.getBoundingClientRect();
      setRect(newRect);
      setShouldShow(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [show, delay]);

  useEffect(() => {
    if (!targetRef.current || !shouldShow) return;

    const updateRect = () => {
      const newRect = targetRef.current?.getBoundingClientRect();
      if (newRect) setRect(newRect);
    };

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [shouldShow]);

  const getTooltipPosition = () => {
    if (!rect) return {};

    const baseLeft =
      rect.left +
      (tooltipPosition.align === "center"
        ? rect.width / 2 - 140 // Half of tooltip width (280px)
        : tooltipPosition.align === "start"
          ? 0
          : rect.width - 280);

    const left = baseLeft + (tooltipPosition.offsetX ?? 0);

    const top =
      tooltipPosition.side === "bottom"
        ? rect.bottom + (tooltipPosition.offsetY ?? 16)
        : rect.top - (tooltipPosition.offsetY ?? 16) - 280;

    return { top, left };
  };

  return (
    <>
      <div ref={targetRef} className="relative">
        {children}
      </div>

      {shouldShow &&
        rect &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
            >
              {/* Overlay with rounded rectangle hole */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  WebkitMask: `url("data:image/svg+xml,${encodeURIComponent(`
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="hole">
            <rect width="100%" height="100%" fill="white"/>
            <rect 
              x="${rect.left - maskMargin}" 
              y="${rect.top - maskMargin}" 
              width="${rect.width + maskMargin * 2}" 
              height="${rect.height + maskMargin * 2}" 
              rx="8" 
              ry="8" 
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="white" mask="url(#hole)"/>
      </svg>
    `)}")`,
                  mask: `url("data:image/svg+xml,${encodeURIComponent(`
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="hole">
            <rect width="100%" height="100%" fill="white"/>
            <rect 
              x="${rect.left - maskMargin}" 
              y="${rect.top - maskMargin}" 
              width="${rect.width + maskMargin * 2}" 
              height="${rect.height + maskMargin * 2}" 
              rx="8" 
              ry="8" 
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="white" mask="url(#hole)"/>
      </svg>
    `)}")`,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                }}
              />

              {/* Tooltip */}
              {tooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="pointer-events-auto absolute z-50"
                  style={getTooltipPosition()}
                >
                  <div className="relative flex w-[280px] flex-col gap-2 rounded-xl border border-blue-100 bg-white p-4 shadow-lg">
                    {tooltipPosition.side === "bottom" && (
                      <div className="-top-2 absolute left-[132px] h-4 w-4 rotate-45 border-blue-100 border-t border-l bg-white" />
                    )}
                    {tooltipPosition.side === "top" && (
                      <div className="-bottom-2 absolute left-[132px] h-4 w-4 rotate-[225deg] border-blue-100 border-t border-l bg-white" />
                    )}
                    {tooltip}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

// Helper component for tooltip content
export function SpotlightTooltip({
  title,
  description,
  onGotIt,
}: {
  title: string;
  description: string;
  onGotIt: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <p className="text-2xs text-gray-600">{description}</p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onGotIt();
        }}
        className="mt-1 self-end rounded-md bg-blue-50 px-3 py-1 font-medium text-2xs text-blue-600 transition-colors duration-100 hover:bg-blue-100"
      >
        Got it
      </button>
    </>
  );
}
