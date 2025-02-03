import { cn } from "@/lib/utils";
import { useMediaQuery } from "usehooks-ts";
import { Drawer } from "vaul";

export function MyDrawer({
  children,
  open,
  onClose,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <>
      <Drawer.Root
        open={open}
        onOpenChange={(open) => !open && onClose()}
        direction={isMobile ? "bottom" : "right"}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[100] bg-black/40" />
          <Drawer.Content
            className={cn(
              isMobile
                ? "fixed right-0 bottom-0 left-0 mt-24 flex h-[96%] flex-col rounded-t-[10px] bg-white md:top-0 md:right-0 md:bottom-0 md:h-full md:w-[400px] md:rounded-l-[10px] md:rounded-tr-none"
                : "fixed top-2 right-2 bottom-2 z-[101] flex w-[500px] outline-none",
            )}
            style={
              {
                "--initial-transform": "calc(100% + 8px)",
              } as React.CSSProperties
            }
          >
            <div className="flex h-full w-full grow flex-col rounded-[16px] bg-zinc-50 p-5">
              {children}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      {/* )} */}
    </>
  );
}
