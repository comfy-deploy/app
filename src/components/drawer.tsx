import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useMediaQuery } from "usehooks-ts";
import { Drawer } from "vaul";

export function MyDrawer({
  children,
  open,
  onClose,
  desktopClassName,
  backgroundInteractive = false,
  side = "right",
  offset = 2,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  desktopClassName?: string;
  backgroundInteractive?: boolean;
  side?: "left" | "right";
  offset?: number;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Drawer.Root
      open={open}
      handleOnly={!isMobile}
      onOpenChange={(open) => !open && onClose()}
      direction={isMobile ? "bottom" : side}
      modal={!backgroundInteractive}
    >
      <Drawer.Portal>
        {!backgroundInteractive && (
          <Drawer.Overlay
            forceMount
            className="fixed inset-0 z-50 bg-black/10 backdrop-blur-sm"
          />
        )}
        <Drawer.Content
          role="dialog"
          className={cn(
            "z-50 rounded-[16px]",
            isMobile
              ? "fixed right-0 bottom-0 left-0 mt-24 flex h-[96%] flex-col rounded-t-[10px] bg-white md:top-0 md:right-0 md:bottom-0 md:h-full md:w-[400px] md:rounded-l-[10px] md:rounded-tr-none"
              : "fixed top-2 bottom-2 flex h-[calc(100%-16px)] w-[500px] outline-none",
            !isMobile && desktopClassName,
          )}
          style={
            {
              "--initial-transform": "calc(100% + 8px)",
              ...(isMobile ? {} : { [side]: `${offset * 0.25}rem` }),
              pointerEvents: "none",
            } as React.CSSProperties
          }
        >
          <div className="pointer-events-auto flex h-full w-full grow select-text flex-col rounded-[16px] bg-zinc-50 px-5 pt-8 pb-5 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900">
            <Drawer.Close className="absolute top-2 right-2 rounded-full p-2 hover:bg-zinc-200">
              <X size={14} />
            </Drawer.Close>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
