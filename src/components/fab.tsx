import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface FabDisabledProps {
  disabled: boolean; // if true, show the disabled text on tooltip
  disabledText: string;
}

interface FabItemProps {
  name: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: FabDisabledProps;
}

// New type for main item when subItems exist
interface FabMainItemWithSubItems {
  name: string;
  icon: LucideIcon;
  onClick?: never; // This makes onClick not allowed when subItems exist
}

interface FabProps {
  mainItem: FabItemProps | FabMainItemWithSubItems;
  refScrollingContainerKey?: string;
  disabled?: FabDisabledProps;
  subItems?: FabItemProps[] & { length: never }; // This ensures subItems must be present
}

// Update the props type to be more specific
type FabPropsWithSubItems = Omit<FabProps, "mainItem" | "subItems"> & {
  mainItem: FabMainItemWithSubItems;
  subItems: FabItemProps[];
};

type FabPropsWithoutSubItems = Omit<FabProps, "subItems"> & {
  mainItem: FabItemProps;
  subItems?: never;
};

// Use this as the final props type
type FinalFabProps = FabPropsWithSubItems | FabPropsWithoutSubItems;

/**
 * Props for the Fab (Floating Action Button) component
 * @param mainItem - Primary action button configuration
 * @param refScrollingContainerKey - CSS class key for the scrolling container to watch
 * > For ScrollArea, remember to add "[data-radix-scroll-area-viewport]" to the key
 * @param disabled - (Optional) disabled state configuration
 * @param subItems - (Optional) array of secondary action buttons
 */
export function Fab(props: FinalFabProps & { className?: string }) {
  // Add runtime validation at the start of the component
  if (props.subItems && props.mainItem.onClick) {
    throw new Error(
      "Invalid Fab configuration: Cannot have both subItems and mainItem.onClick. " +
        "When subItems are present, the main button should act as a menu trigger.",
    );
  }

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false); // for subItems

  useEffect(() => {
    if (!props.refScrollingContainerKey) return;

    let scrollContainer: Element | null = null;
    let observer: MutationObserver | null = null;

    // Function to set up scroll listener
    const setupScrollListener = (container: Element) => {
      const handleScroll = () => {
        const scrollPosition = container.scrollTop;
        setIsScrolled(scrollPosition > 20);
      };

      handleScroll(); // Set initial state
      container.addEventListener("scroll", handleScroll, { passive: true });
      return () => container.removeEventListener("scroll", handleScroll);
    };

    // Initial attempt to find container
    scrollContainer = document.querySelector(
      `.${props.refScrollingContainerKey}`,
    );

    if (scrollContainer) {
      // If container exists immediately, set up scroll listener
      return setupScrollListener(scrollContainer);
    }
    // If container doesn't exist, observe DOM for changes
    observer = new MutationObserver((_mutations, obs) => {
      const container = document.querySelector(
        `.${props.refScrollingContainerKey}`,
      );
      if (container) {
        obs.disconnect(); // Stop observing once found
        setupScrollListener(container);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [props.refScrollingContainerKey]);

  return (
    <>
      {/* backdrop */}
      <AnimatePresence>
        {isSubMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-0 bg-black/10"
            onClick={() => setIsSubMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "fixed right-6 bottom-6 flex flex-col items-end gap-4",
          props.className,
        )}
      >
        {/* Sub-items list */}
        <AnimatePresence>
          {isSubMenuOpen && props.subItems && (
            <motion.div
              className="z-[0] flex flex-col-reverse gap-3"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {props.subItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  className="flex items-center justify-end gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.2,
                  }}
                >
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3">
                          <div className="rounded-[8px] bg-white px-3 py-1 font-medium text-xs shadow-md dark:bg-zinc-700/50 dark:text-zinc-300">
                            {item.name}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                              "h-12 w-12 rounded-sm shadow-md",
                              item.disabled?.disabled &&
                                "cursor-not-allowed opacity-80",
                            )}
                            onClick={() => {
                              if (item.disabled?.disabled) return;
                              setIsSubMenuOpen(false);
                              item.onClick();
                            }}
                          >
                            <item.icon className="h-5 w-5" />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {item.disabled?.disabled && (
                        <TooltipContent side="left">
                          <p>{item.disabled.disabledText}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger>
              <AnimatePresence>
                <Button
                  className={cn(
                    "z-[1] h-14 min-w-14 shadow-lg transition-all duration-150",
                    props.disabled?.disabled && "cursor-not-allowed opacity-80",
                  )}
                  onClick={() => {
                    if (props.disabled?.disabled) return;

                    if (props.subItems) {
                      setIsSubMenuOpen(!isSubMenuOpen);
                    } else {
                      props.mainItem.onClick();
                    }
                  }}
                >
                  <props.mainItem.icon
                    className={cn("h-5 w-5", isScrolled ? "m-0" : "mr-2")}
                    style={{
                      transform:
                        props.mainItem.icon.displayName === "Plus" &&
                        isSubMenuOpen
                          ? "rotate(45deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.1s ease-in",
                    }}
                  />

                  <AnimatePresence mode="wait">
                    {!isScrolled && (
                      <motion.span
                        className="font-medium text-sm"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeIn" }}
                      >
                        {isSubMenuOpen ? "Close" : props.mainItem.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </AnimatePresence>
            </TooltipTrigger>
            {props.disabled?.disabled && (
              <TooltipContent side="left">
                <p>{props.disabled.disabledText}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}
