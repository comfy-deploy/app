import { AssetBrowser, SearchAssetsInputBox } from "@/components/asset-browser";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UploadButton } from "@/components/upload/upload-button";
import { UploadProgress } from "@/components/upload/upload-progress";
import { UploadZone } from "@/components/upload/upload-zone";
import { useCreateFolder } from "@/hooks/hook";
import { useAssetBrowserStore } from "@/stores/asset-browser-store";
import { createFileRoute } from "@tanstack/react-router";
import { FolderPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/assets")({
  component: AssetsPage,
});

export function AssetsPage() {
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const { mutateAsync: createFolder } = useCreateFolder();
  const { currentPath } = useAssetBrowserStore();

  const handleCreateFolder = async () => {
    // Trim whitespace and validate
    const trimmedFolderName = newFolderName.trim();
    if (!trimmedFolderName) {
      toast.error("Invalid folder name", {
        description: "Folder name cannot be empty or contain only spaces",
      });
      return;
    }

    try {
      await createFolder({
        name: trimmedFolderName,
        parent_path: currentPath,
      });
      setShowNewFolderDialog(false);
      setNewFolderName("");
      toast.success("Folder created successfully");
    } catch (e) {
      toast.error("Error creating folder", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  return (
    <UploadZone className="h-full w-full">
      <div className="mx-auto flex h-full w-full flex-col pt-2">
        <div className="flex items-center justify-between px-4 py-2">
          <SearchAssetsInputBox />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNewFolderDialog(true)}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
            <UploadButton />
            <UploadProgress className="absolute top-16 right-4 z-10" />
          </div>
        </div>
        <AssetBrowser showNewFolderButton={false} />
      </div>

      {/* New folder dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewFolderDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UploadZone>
  );
}
