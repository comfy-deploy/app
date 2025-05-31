import { useCreateFolder, useUpdateAsset } from "../hooks/hook";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "./ui/badge";

interface Asset {
  id: string;
  name: string;
  path: string;
  url?: string;
  is_folder: boolean;
  file_size: number;
  mime_type: string;
  created_at: string;
  user_id: string;
}

interface MoveAssetDialogProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveDone?: () => void;
  onConfirm?: (path: string) => void;
  dialogTitle?: string;
  dialogDescription?: string;
  confirmText?: string;
  isBulkOperation?: boolean;
  selectedCount?: number;
  isAddAsset?: boolean;
}

interface FolderNode {
  id: string;
  name: string;
  path: string;
  children: FolderNode[];
  isLoaded: boolean;
  isExpanded: boolean;
}

export function useMoveAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetId,
      destinationPath,
    }: {
      assetId: string;
      destinationPath: string;
    }) => {
      return await api({
        url: "assets/move",
        init: {
          method: "POST",
          body: JSON.stringify({
            asset_id: assetId,
            destination_path: destinationPath,
          }),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

function getParentPath(path: string) {
  const parts = path.split("/").filter(Boolean);
  parts.pop(); // Remove the last part (file/folder name)
  return parts.length === 0 ? "/" : parts.join("/");
}

export function MoveAssetDialog({
  asset,
  open,
  onOpenChange,
  onMoveDone,
  onConfirm,
  dialogTitle = "Move Asset",
  dialogDescription,
  confirmText = "Move Here",
  isBulkOperation = false,
  selectedCount = 0,
  isAddAsset = false,
}: MoveAssetDialogProps) {
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedPath, setSelectedPath] = useState("");
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderTree, setFolderTree] = useState<FolderNode[]>([
    {
      id: "root",
      name: "Assets",
      path: "/",
      children: [],
      isLoaded: false,
      isExpanded: true,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: createFolder } = useCreateFolder();
  const { mutateAsync: updateAsset } = useUpdateAsset();

  const assetParentPath = getParentPath(asset.path);

  useEffect(() => {
    if (open) {
      loadFolders("/", "root");
      setSelectedPath("/"); // Default selection is root
    }
  }, [open]);

  const loadFolders = async (path: string, parentId: string) => {
    setIsLoading(true);
    try {
      const response = await api({
        url: `assets?path=${encodeURIComponent(path)}`,
      });

      const folders = (response || []).filter((item: Asset) => item.is_folder);

      setFolderTree((prevTree) => {
        const newTree = [...prevTree];
        updateFolderNode(newTree, parentId, folders);
        return newTree;
      });
    } catch (error) {
      console.error("Error loading folders:", error);
      toast.error("Failed to load folders");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFolderNode = (
    tree: FolderNode[],
    nodeId: string,
    folders: Asset[],
  ) => {
    for (let i = 0; i < tree.length; i++) {
      const node = tree[i];

      if (node.id === nodeId) {
        node.children = folders.map((folder) => ({
          id: folder.id,
          name: folder.name,
          path: folder.path,
          children: [],
          isLoaded: false,
          isExpanded: false,
        }));
        node.isLoaded = true;
        return true;
      }

      if (node.children.length > 0) {
        if (updateFolderNode(node.children, nodeId, folders)) {
          return true;
        }
      }
    }
    return false;
  };

  const toggleFolder = (nodeId: string, path: string) => {
    setFolderTree((prevTree) => {
      const newTree = [...prevTree];

      const toggleNode = (nodes: FolderNode[]) => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          if (node.id === nodeId) {
            if (!node.isLoaded) {
              loadFolders(path, nodeId);
            }

            node.isExpanded = !node.isExpanded;
            return true;
          }

          if (node.children.length > 0) {
            if (toggleNode(node.children)) {
              return true;
            }
          }
        }
        return false;
      };

      toggleNode(newTree);
      return newTree;
    });
  };

  const handleSelect = (path: string) => {
    setSelectedPath(path);
    setCurrentPath(path);
  };

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

      const parentNode = findNodeByPath(folderTree, currentPath);
      if (parentNode) {
        loadFolders(currentPath, parentNode.id);
      }

      setShowCreateFolderDialog(false);
      setNewFolderName("");
      toast.success("Folder created successfully");
    } catch (e) {
      toast.error("Error creating folder", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const findNodeByPath = (
    nodes: FolderNode[],
    path: string,
  ): FolderNode | null => {
    for (const node of nodes) {
      if (node.path === path) {
        return node;
      }

      if (node.children.length > 0) {
        const found = findNodeByPath(node.children, path);
        if (found) {
          return found;
        }
      }
    }

    return null;
  };

  const handleConfirm = async () => {
    if (assetParentPath === selectedPath && !isAddAsset) {
      toast.error("Cannot move to the same location");
      return;
    }

    const finalPath = selectedPath === "/" ? "" : selectedPath;

    // If onConfirm is provided, use it (for adding assets case)
    if (onConfirm) {
      onConfirm(finalPath);
      onOpenChange(false);
      return;
    }

    // Otherwise, handle moving existing assets
    try {
      await updateAsset({
        assetId: asset.id,
        path: finalPath,
      });

      onOpenChange(false);
      if (onMoveDone) {
        onMoveDone();
      }
      toast.success("Asset moved successfully");
    } catch (e) {
      toast.error("Error moving asset", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const renderFolderTree = (nodes: FolderNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id} style={{ marginLeft: `${depth * 8}px` }}>
        <div
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-[8px] py-1 pr-2 pl-2 hover:bg-gray-50",
            selectedPath === node.path && "bg-blue-50",
          )}
        >
          {/* Expand/collapse button */}
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center text-gray-500"
            onClick={() => toggleFolder(node.id, node.path)}
          >
            {node.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {/* Folder icon and name */}
          <button
            className="flex flex-1 items-center gap-2 text-left"
            onClick={() => handleSelect(node.path)}
            type="button"
          >
            {node.isExpanded ? (
              <FolderOpen className="h-4 w-4 text-gray-400" />
            ) : (
              <Folder className="h-4 w-4 text-gray-400" />
            )}
            <span className="max-w-[150px] truncate text-sm" title={node.name}>
              {node.name}
            </span>
          </button>

          {/* Selection indicator */}
          {selectedPath === node.path && (
            <Check className="h-4 w-4 text-blue-500" />
          )}
        </div>

        {/* Render children if expanded */}
        {node.isExpanded && node.children.length > 0 && (
          <div>{renderFolderTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogDescription ||
                (isBulkOperation
                  ? `Select destination folder for ${selectedCount} assets`
                  : `Select destination folder for "${asset.name}"`)}
            </DialogDescription>
          </DialogHeader>

          {/* Folder tree container */}
          <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent h-[350px] overflow-y-auto rounded-md border p-2">
            {isLoading && folderTree[0].children.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              renderFolderTree(folderTree)
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowCreateFolderDialog(true)}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedPath === assetParentPath && !isAddAsset}
            >
              {confirmText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create folder dialog */}
      <Dialog
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New Folder{" "}
              <Badge>
                <FolderOpen className="h-4 w-4" /> {currentPath}
              </Badge>
            </DialogTitle>
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
              onClick={() => setShowCreateFolderDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
