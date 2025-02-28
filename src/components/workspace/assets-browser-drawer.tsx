"use client";

import { cn } from "@/lib/utils";
// import { PreventNavigation } from "@/repo/components/ui/custom/prevent-navigation";
// import { createNewDraftVersion } from "@/server/actions/cdActions";
// import { uploadFile } from "@repo/lib/uploadFile";
import { sendEventToCD } from "./sendEventToCD";

// import { usePathname, useRouter } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";
import { Drawer } from "vaul";
import { AssetBrowser } from "../asset-browser";
import { useAssetsBrowserStore } from "./Workspace";

interface Props {
  isPlayground?: boolean;
  handleAsset?: (asset: AssetType) => void;
}

export function AssetsBrowserPopup({ isPlayground, handleAsset }: Props) {
  const { open, setOpen, targetNodeData } = useAssetsBrowserStore();
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(open) => setOpen(open)}
      direction={isMobile ? "bottom" : "right"}
    >
      <Drawer.Portal>
        <Drawer.Content
          className={cn(
            isMobile
              ? "fixed right-0 bottom-0 left-0 mt-24 flex h-[96%] flex-col rounded-t-[10px] bg-white md:top-0 md:right-0 md:bottom-0 md:h-full md:w-[400px] md:rounded-l-[10px] md:rounded-tr-none"
              : "fixed top-2 right-2 bottom-2 z-10 flex w-[500px] outline-none",
          )}
          style={
            {
              "--initial-transform": "calc(100% + 8px)",
            } as React.CSSProperties
          }
        >
          <div className="flex h-full w-full grow flex-col rounded-[16px] bg-zinc-50 p-5">
            <AssetBrowser
              onItemClick={(asset) => {
                if (isPlayground && handleAsset) {
                  handleAsset(asset);
                  return;
                }
                if (targetNodeData?.node) {
                  // If we have target node data, update the existing node
                  console.log(targetNodeData);

                  sendEventToCD("update_widget", {
                    nodeId: targetNodeData.node,
                    widgetName: targetNodeData.inputName,
                    value: asset.url,
                  });
                  useAssetsBrowserStore.getState().setTargetNodeData(null);
                } else {
                  // Otherwise create a new node (existing behavior)
                  sendEventToCD("add_node", {
                    type: "ComfyUIDeployExternalImage",
                    widgets_values: ["input_image", "", "", asset.url],
                  });
                }
                setOpen(false); // Close the drawer after selection
              }}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
