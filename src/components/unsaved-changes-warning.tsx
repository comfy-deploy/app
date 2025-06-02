import {
  AnimatePresence,
  motion,
  useAnimation,
  type AnimationControls,
} from "framer-motion";
import { Info, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { easeOut } from "framer-motion";
import { useBlocker } from "@tanstack/react-router";

interface UnsavedChangesWarningProps {
  isDirty: boolean;
  isLoading?: boolean;
  onReset: () => void;
  onSave: () => void;
  controls: AnimationControls;
  disabled?: boolean;
}

export function UnsavedChangesWarning({
  isDirty,
  isLoading = false,
  onReset,
  onSave,
  controls,
  disabled = false,
}: UnsavedChangesWarningProps) {
  if (disabled) return null;

  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
          className="fixed right-0 bottom-4 left-0 z-50 mx-auto w-fit"
        >
          <motion.div
            animate={controls}
            className="flex w-96 flex-row items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm shadow-md dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="flex flex-row items-center gap-2">
              <Info className="h-4 w-4" /> Unsaved changes
            </div>
            <div className="flex flex-row items-center gap-1">
              <Button variant="ghost" onClick={onReset}>
                Reset
              </Button>
              <Button onClick={onSave} disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to handle form blocking and animations
export function useUnsavedChangesWarning({
  isDirty,
  isNew = false,
  disabled = false,
}: {
  isDirty: boolean;
  isNew?: boolean;
  disabled?: boolean;
}) {
  const controls = useAnimation();

  useBlocker({
    enableBeforeUnload: () => {
      return !disabled && !!isDirty && !isNew;
    },
    shouldBlockFn: () => {
      if (isNew || disabled) return false;

      if (isDirty) {
        controls.start({
          x: [0, -8, 12, -15, 8, -10, 5, -3, 2, -1, 0],
          y: [0, 4, -9, 6, -12, 8, -3, 5, -2, 1, 0],
          filter: [
            "blur(0px)",
            "blur(2px)",
            "blur(2px)",
            "blur(3px)",
            "blur(2px)",
            "blur(2px)",
            "blur(1px)",
            "blur(2px)",
            "blur(1px)",
            "blur(1px)",
            "blur(0px)",
          ],
          transition: {
            duration: 0.4,
            ease: easeOut,
          },
        });
      }

      return !!isDirty;
    },
  });

  return { controls };
}
