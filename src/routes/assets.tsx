import { AssetBrowser } from "@/components/asset-browser";
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

  const handleCreateFolder = async () => {
    if (!newFolderName) return;

    try {
      await createFolder({
        name: newFolderName,
        parent_path: "/",
      });
      setShowNewFolderDialog(false);
      setNewFolderName("");
      toast.success("Folder created successfully");
    } catch (e) {
      toast.error("Error creating folder");
    }
  };

  return (
    <UploadZone className="mx-auto h-full w-full max-w-[1000px]">
      <div className="mx-auto flex h-full w-full flex-col">
        <div className="flex items-center justify-between px-4 py-2">
          <h1 className="font-semibold text-lg">Assets</h1>
          <div className="flex items-center gap-2">
            <UploadButton />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewFolderDialog(true)}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
            <UploadProgress className="absolute top-16 right-4" />
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
