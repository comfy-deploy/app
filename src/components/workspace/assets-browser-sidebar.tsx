import { AssetBrowser } from "../asset-browser";
import { UploadZone } from "../upload/upload-zone";
import { UploadProgress } from "../upload/upload-progress";
import { sendEventToCD } from "./sendEventToCD";
import { useAssetsBrowserStore } from "./Workspace";
import type { AssetType } from "../SDInputs/sd-asset-input";

interface AssetBrowserSidebarProps {
  onItemClick: (asset: AssetType) => void;
}

export function AssetBrowserSidebar({ onItemClick }: AssetBrowserSidebarProps) {
  const { targetNodeData } = useAssetsBrowserStore();

  const handleAssetClick = (asset: AssetType) => {
    if (targetNodeData?.node) {
      sendEventToCD("update_widget", {
        nodeId: targetNodeData.node,
        widgetName: targetNodeData.inputName,
        value: asset.url,
      });
      useAssetsBrowserStore.getState().setTargetNodeData(null);
    } else {
      sendEventToCD("add_node", {
        type: "ComfyUIDeployExternalImage",
        widgets_values: ["input_image", "", "", asset.url],
      });
    }
    onItemClick(asset);
  };

  return (
    <UploadZone className="h-full">
      <div className="relative h-full flex flex-col">
        <div className="px-4 py-2 text-center border-b border-white/20">
          <p className="text-xs text-muted-foreground">
            Drag & drop files here to upload
          </p>
        </div>
        <div className="flex-1">
          <AssetBrowser
            onItemClick={handleAssetClick}
            isPanel={true}
          />
        </div>
        <UploadProgress className="absolute top-12 right-4 z-10" />
      </div>
    </UploadZone>
  );
}
