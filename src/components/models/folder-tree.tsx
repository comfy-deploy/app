import { DownloadingModels } from "@/components/models/downloading-models";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowDownNarrowWide,
  ArrowUpWideNarrow,
  CheckCircle2,
  ChevronDownIcon,
  ChevronRightIcon,
  Copy,
  FileIcon,
  FolderIcon,
  FolderPlus,
  MoreHorizontal,
  PencilIcon,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useQueryState } from "nuqs";
import type React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// Format file size to human-readable format (KB, MB, GB)
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / 1024 ** i).toFixed(1);

  return `${size} ${units[i]}`;
}

interface FileEntry {
  path: string;
  type: 1 | 2;
  mtime: number;
  size: number;
}

interface FolderTreeProps {
  className?: string;
  onAddModel: (folderPath: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 1 | 2;
  children: TreeNode[];
  mtime: number;
  size: number;
  isPrivate: boolean;
  isVirtual?: boolean;
}

type ModelFilter = "private" | "public" | "all";

function buildTree(files: FileEntry[], isPrivate: boolean): TreeNode[] {
  const root: TreeNode[] = [];
  const pathMap = new Map<string, TreeNode>(); // Track nodes by their full path

  // Skip inputs folders for public models
  const shouldSkipPath = (path: string, isPrivate: boolean) => {
    if (!isPrivate) {
      return path.includes("/input/") || path === "input";
    }
    return false;
  };

  for (const file of files) {
    // Skip the file if it's in an inputs folder and it's a public model
    if (shouldSkipPath(file.path, isPrivate)) {
      continue;
    }

    const parts = file.path.split("/");
    let currentLevel = root;
    let currentPath = "";

    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];
      const isLast = index === parts.length - 1;

      // Build the current path
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      // Skip this path if it's an inputs folder in public models
      if (shouldSkipPath(currentPath, isPrivate)) {
        break;
      }

      // Check if we already have a node for this exact path
      const existingNode = pathMap.get(currentPath);

      if (existingNode) {
        if (isLast && file.type === 1) {
          // This is a file with the same path as an existing node
          // This shouldn't normally happen, but we'll handle it by creating a new node
          const newNode: TreeNode = {
            name: part,
            path: currentPath,
            type: file.type,
            children: [],
            mtime: file.mtime,
            size: file.size,
            isPrivate,
          };
          currentLevel.push(newNode);
        } else if (!isLast) {
          // Continue traversing down this existing folder
          currentLevel = existingNode.children;
        }
      } else {
        // Create a new node for this path
        const newNode: TreeNode = {
          name: part,
          path: currentPath,
          type: isLast ? file.type : 2, // If it's the last part and a file, use file type, otherwise it's a folder
          children: [],
          mtime: file.mtime,
          size: file.size,
          isPrivate,
        };

        currentLevel.push(newNode);
        pathMap.set(currentPath, newNode);

        if (!isLast) {
          currentLevel = newNode.children;
        }
      }
    }
  }

  return root;
}

interface CreateFolderData {
  parentPath: string;
  folderName: string;
}

interface FileOperations {
  createFolder: (data: CreateFolderData) => Promise<void>;
  deleteFile: (path: string) => Promise<string>;
  moveFile: (src: string, dst: string, overwrite?: boolean) => Promise<void>;
}

function TreeNode({
  node,
  search,
  parentMatched = false,
  operations,
  onAddModel,
}: {
  node: TreeNode;
  search: string;
  parentMatched?: boolean;
  operations: FileOperations;
  onAddModel: (folderPath: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(!!search);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isValidName, setIsValidName] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveTarget, setMoveTarget] = useState<string>("");
  const [moveSource, setMoveSource] = useState<string>("");
  const [isMoving, setIsMoving] = useState(false);
  const [overwriteConfirm, setOverwriteConfirm] = useState(false);

  // Check if this node or any of its children match
  const nodeMatches = node.name.toLowerCase().includes(search.toLowerCase());
  const childrenMatch = node.children.some((child) =>
    child.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Show if:
  // 1. Not searching
  // 2. This node matches
  // 3. Any parent matched
  // 4. Any children match
  const shouldShow = !search || nodeMatches || parentMatched || childrenMatch;

  // Keep folder open if user has explicitly interacted with it
  const shouldBeOpen = isOpen;

  if (!shouldShow) {
    return null;
  }

  const handleCreateFolder = async () => {
    try {
      await operations.createFolder({
        parentPath: node.path,
        folderName: newFolderName,
      });
      setShowNewFolderDialog(false);
      setNewFolderName("");
      toast.success("Folder created successfully");
    } catch (error) {
      toast.error("Failed to create folder");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateFolder();
    }
  };

  const validateFileName = (name: string) => {
    if (!name.trim()) {
      setIsValidName(false);
      setValidationMessage("Filename cannot be empty");
      return false;
    }

    if (/[<>:"/\\|?*]/.test(name)) {
      setIsValidName(false);
      setValidationMessage("Filename contains invalid characters");
      return false;
    }

    setIsValidName(true);
    setValidationMessage("");
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewName(value);
    validateFileName(value);
  };

  const handleRename = async () => {
    if (isRenaming || !validateFileName(newName)) return;

    try {
      setIsRenaming(true);
      const pathParts = node.path.split("/");
      pathParts.pop();
      const parentPath = pathParts.join("/");
      const newPath = parentPath ? `${parentPath}/${newName}` : newName;

      await operations.moveFile(node.path, newPath);
      setShowRenameDialog(false);
      setNewName("");
      toast.success("File renamed successfully");
    } catch (error) {
      setShowRenameDialog(false);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRename();
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await operations.deleteFile(node.path);
      setShowDeleteDialog(false);
    } catch (error) {
      // Error is handled in the mutation
    } finally {
      setIsDeleting(false);
    }
  };

  // Get total count of all children (files + folders) recursively
  const getTotalChildrenCount = (node: TreeNode): number => {
    let count = node.children.length;
    for (const child of node.children) {
      if (child.type === 2) {
        // If it's a folder
        count += getTotalChildrenCount(child);
      }
    }
    return count;
  };

  // Determine if folder deletion should be allowed
  const canDeleteFolder = node.type === 2 && node.isPrivate && !node.isVirtual;

  // Add drag handlers for the node
  const handleDragStart = (e: React.DragEvent) => {
    // Only allow dragging private files (not folders)
    if (!node.isPrivate || node.isVirtual || node.type === 2) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData("text/plain", node.path);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Add drop target handlers for folders
  const handleDragOver = (e: React.DragEvent) => {
    // Only folders can be drop targets
    if (node.type !== 2) {
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    // Only folders can be drop targets
    if (node.type !== 2) {
      return;
    }

    e.preventDefault();
    setIsDragOver(false);

    const sourcePath = e.dataTransfer.getData("text/plain");
    if (!sourcePath || sourcePath === node.path) return;

    // Check if trying to move a folder into itself or a subfolder
    if (
      sourcePath.split("/").length < node.path.split("/").length &&
      node.path.startsWith(`${sourcePath}/`)
    ) {
      toast.error("Cannot move a folder into its own subfolder");
      return;
    }

    const sourceFileName = sourcePath.split("/").pop() || "";
    const destinationPath = `${node.path}/${sourceFileName}`;

    setMoveSource(sourcePath);
    setMoveTarget(destinationPath);
    setShowMoveDialog(true);
  };

  // Handle the move operation
  const handleMove = async (overwrite = false) => {
    if (isMoving || !moveSource || !moveTarget) return;

    try {
      setIsMoving(true);
      await operations.moveFile(moveSource, moveTarget, overwrite);
      toast.success("Item moved successfully");
      setShowMoveDialog(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("already exists")) {
        setOverwriteConfirm(true);
      } else {
        toast.error(`Failed to move item: ${errorMessage}`);
        setShowMoveDialog(false);
      }
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2",
          isDragging && "opacity-50",
          isDragOver && "rounded-md bg-blue-50",
        )}
        draggable={node.isPrivate && !node.isVirtual}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded px-2 py-1 hover:bg-accent",
            node.isVirtual && "text-muted-foreground",
            node.type === 2 &&
              "border border-transparent hover:border hover:border-blue-200 hover:border-dashed hover:bg-blue-50",
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {node.type === 2 ? (
            <>
              {shouldBeOpen ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
              <FolderIcon
                className={cn(
                  "h-4 w-4",
                  node.isVirtual && "opacity-50",
                  node.type === 2 && "text-blue-600 group-hover:text-blue-700",
                )}
              />
            </>
          ) : (
            <>
              <span className="w-4" />
              <FileIcon className="h-4 w-4" />
            </>
          )}
          <span>{node.name}</span>
          {node.type === 2 && node.children.length > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
              {getTotalChildrenCount(node)}
            </span>
          )}
          {node.type === 1 && (
            <span className="ml-1.5 text-muted-foreground text-xs">
              {formatFileSize(node.size)}
            </span>
          )}
        </button>

        {node.type === 2 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 border border-transparent bg-transparent text-transparent hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700"
            onClick={() => onAddModel(node.path)}
            title={`Upload model to ${node.path}`}
          >
            <Upload className="h-3.5 w-3.5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-transparent group-hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(node.path);
                toast.success("Path copied to clipboard");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Path
            </DropdownMenuItem>

            {node.type === 2 ? (
              <>
                <DropdownMenuItem onClick={() => setShowNewFolderDialog(true)}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddModel(node.path)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Model
                </DropdownMenuItem>
                {canDeleteFolder && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Folder
                  </DropdownMenuItem>
                )}
              </>
            ) : (
              <>
                {node.isPrivate && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setNewName(node.name);
                        setShowRenameDialog(true);
                      }}
                    >
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                {!node.isPrivate && (
                  <DropdownMenuItem
                    disabled
                    className="text-muted-foreground opacity-50"
                  >
                    <span className="mr-2 text-xs italic">
                      Public models cannot be modified
                    </span>
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />
      </div>

      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewFolderDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRenameDialog}
        onOpenChange={(open) => {
          if (!isRenaming) {
            if (open) {
              setNewName(node.name);
              validateFileName(node.name);
            } else {
              setShowRenameDialog(false);
            }
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="text-muted-foreground text-sm">
              Original path: <span className="font-medium">{node.path}</span>
            </div>

            <div>
              <Label htmlFor="filename">New filename</Label>
              <div className="relative mt-1.5">
                <Input
                  id="filename"
                  placeholder="Enter new filename"
                  value={newName}
                  onChange={handleNameChange}
                  onKeyDown={handleRenameKeyDown}
                  autoFocus
                  disabled={isRenaming}
                  className={cn(
                    "pr-10",
                    isValidName ? "border-input" : "border-red-500",
                  )}
                />
                <div className="-translate-y-1/2 absolute top-1/2 right-3">
                  {!isRenaming && !isValidName ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : !isRenaming && newName !== node.name ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : null}
                </div>
              </div>
              <p className="text-red-500 text-sm">{validationMessage}</p>
            </div>

            {newName !== node.name && isValidName && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  <div className="flex flex-col gap-1">
                    <div>
                      <span className="text-muted-foreground">From: </span>
                      <span className="font-medium">{node.path}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">To: </span>
                      <span className="font-medium">
                        {node.path.substring(0, node.path.lastIndexOf("/") + 1)}
                        {newName}
                      </span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRenameDialog(false)}
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                disabled={isRenaming || !isValidName || newName === node.name}
                className="min-w-[100px]"
              >
                {isRenaming ? (
                  <div className="flex items-center">
                    <span>Renaming</span>
                  </div>
                ) : (
                  "Rename"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <p>
                Are you sure you want to delete this{" "}
                {node.type === 2 ? "folder" : "file"}?
              </p>
              <p className="text-muted-foreground text-sm">
                <span className="font-medium">{node.path}</span>
              </p>
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  {node.type === 2
                    ? "This action cannot be undone. The folder and all its contents will be permanently deleted."
                    : "This action cannot be undone. The file will be permanently deleted."}
                </AlertDescription>
              </Alert>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="min-w-[100px]"
              >
                {isDeleting ? (
                  <div className="flex w-full items-center justify-center">
                    <span>Deleting</span>
                  </div>
                ) : (
                  `Delete ${node.type === 2 ? "Folder" : "File"}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Item</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <div className="mt-1.5 rounded-md border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-blue-500" />
                  <span className="truncate text-sm">{moveSource}</span>
                </div>
              </div>
            </div>

            <div className="my-1 flex justify-center">
              <div className="rounded-full border border-gray-200 bg-gray-50 p-1.5">
                <ArrowDown className="h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              {overwriteConfirm ? (
                <Alert className="mt-1.5 border-yellow-200 bg-yellow-50">
                  <AlertDescription className="text-sm">
                    <p className="font-medium text-yellow-800">
                      A file with this name already exists at the destination.
                    </p>
                    <p className="mt-1 text-yellow-700">
                      Do you want to overwrite the existing file? This action
                      cannot be undone.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="mt-1.5 rounded-md border border-gray-200 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4 text-amber-500" />
                    <span className="truncate text-sm">{moveTarget}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons - matching your other dialogs */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMoveDialog(false);
                  setOverwriteConfirm(false);
                }}
                disabled={isMoving}
              >
                Cancel
              </Button>

              {overwriteConfirm ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => handleMove(true)}
                    disabled={isMoving}
                    className="min-w-[100px]"
                  >
                    {isMoving ? <span>Moving...</span> : <span>Overwrite</span>}
                  </Button>
                  <Button
                    onClick={() => setOverwriteConfirm(false)}
                    disabled={isMoving}
                  >
                    Choose Different Name
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => handleMove(false)}
                  disabled={isMoving || !moveTarget}
                  className="min-w-[100px]"
                >
                  {isMoving ? <span>Moving...</span> : <span>Move</span>}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {shouldBeOpen && node.children.length > 0 && (
        <div className="ml-6">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              search={search}
              parentMatched={nodeMatches || parentMatched}
              operations={operations}
              onAddModel={onAddModel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function mergeNodes(
  privateNodes: TreeNode[],
  publicNodes: TreeNode[],
  showPrivate: boolean,
  showPublic: boolean,
): TreeNode[] {
  const result: TreeNode[] = [];
  const pathMap = new Map<string, number>(); // Track nodes by path instead of name

  // Helper to check if a node should be included based on its privacy and type
  const shouldIncludeNode = (node: TreeNode) =>
    node.type === 2 || // Always include folders
    (node.isPrivate && showPrivate) || // Include private files when showing private
    (!node.isPrivate && showPublic); // Include public files when showing public

  // Add private nodes if showing private
  if (showPrivate) {
    for (const node of privateNodes) {
      if (shouldIncludeNode(node)) {
        result.push(node);
        pathMap.set(node.path, result.length - 1);
      }
    }
  }

  // Add or merge public nodes if showing public
  if (showPublic) {
    for (const publicNode of publicNodes) {
      const existingNodeIndex = pathMap.get(publicNode.path);

      if (existingNodeIndex === undefined) {
        // No existing node with this path
        if (shouldIncludeNode(publicNode)) {
          result.push(publicNode);
          pathMap.set(publicNode.path, result.length - 1);
        }
      } else {
        const existingNode = result[existingNodeIndex];

        // If both are folders, merge their children
        if (existingNode.type === 2 && publicNode.type === 2) {
          const mergedChildren = mergeNodes(
            existingNode.children,
            publicNode.children,
            showPrivate,
            showPublic,
          );
          if (mergedChildren.length > 0) {
            existingNode.children = mergedChildren;
          }
        }
      }
    }
  }

  return result;
}

export function FolderTree({ className, onAddModel }: FolderTreeProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useQueryState<ModelFilter>("model_view", {
    defaultValue: "private",
    parse: (value): ModelFilter => {
      if (value === "private" || value === "public" || value === "all") {
        return value;
      }
      return "private";
    },
    shallow: true,
  });
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [frontendFolderPaths, setFrontendFolderPaths] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "size">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { data: privateFiles, isLoading: isLoadingPrivate } = useQuery<
    FileEntry[]
  >({
    queryKey: ["volume", "private-models"],
    refetchInterval: 5000,
  });

  const { data: publicFiles, isLoading: isLoadingPublic } = useQuery<
    FileEntry[]
  >({
    queryKey: ["volume", "public-models"],
  });

  const privateTree = privateFiles ? buildTree(privateFiles, true) : [];
  const publicTree = publicFiles ? buildTree(publicFiles, false) : [];

  const injectFrontendFolders = (
    tree: TreeNode[],
    publicTree: TreeNode[],
  ): TreeNode[] => {
    const result = [...tree];
    const pathMap = new Map<string, TreeNode>();

    // Helper function to add a path to the tree
    const addPath = (path: string, isVirtual = false) => {
      const parts = path.split("/");
      let currentLevel = result;
      let currentPath = "";

      for (const [index, part] of parts.entries()) {
        const isLast = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        const existingNode = currentLevel.find((node) => node.name === part);

        if (existingNode) {
          if (!isLast) {
            currentLevel = existingNode.children;
          }
        } else {
          const newNode: TreeNode = {
            name: part,
            path: currentPath,
            type: 2, // Always a folder
            children: [],
            mtime: Date.now(),
            size: 0,
            isPrivate: true,
            isVirtual: isVirtual, // Mark if this is just a structure hint
          };
          currentLevel.push(newNode);
          pathMap.set(currentPath, newNode);
          currentLevel = newNode.children;
        }
      }
    };

    // First add the frontend folders
    for (const path of frontendFolderPaths) {
      addPath(path);
    }

    // Then inject the public tree structure
    const processPublicNode = (node: TreeNode, parentPath = "") => {
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

      // Only inject folders, not files
      if (node.type === 2) {
        addPath(currentPath, true);

        // Process children recursively
        for (const child of node.children) {
          processPublicNode(child, currentPath);
        }
      }
    };

    // Process each root node in the public tree
    for (const node of publicTree) {
      processPublicNode(node);
    }

    return result;
  };

  const injectedPrivateTree = injectFrontendFolders(privateTree, publicTree);

  const mergedTree = mergeNodes(
    injectedPrivateTree,
    publicTree,
    filter === "private" || filter === "all",
    filter === "public" || filter === "all",
  );

  // Apply sorting to the merged tree
  const sortedTree = useMemo(() => {
    console.log("Sorting by:", sortBy, "Direction:", sortDirection);

    // Sort function
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      // Create a copy to avoid mutating original
      return [...nodes]
        .sort((a, b) => {
          // Folders always come first
          if (a.type !== b.type) {
            return a.type === 2 ? -1 : 1;
          }

          if (sortBy === "name") {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            return sortDirection === "asc"
              ? nameA.localeCompare(nameB)
              : nameB.localeCompare(nameA);
          }
          // Sort by size
          return sortDirection === "asc" ? a.size - b.size : b.size - a.size;
        })
        .map((node) => ({
          ...node,
          children: sortNodes(node.children),
        }));
    };

    return sortNodes(mergedTree);
  }, [mergedTree, sortBy, sortDirection]);

  // Helper to check if tree has any visible content based on filter
  const hasVisibleContent = (nodes: TreeNode[]): boolean => {
    return nodes.some((node) => {
      if (node.type === 2) {
        // For folders, check if they have any visible content
        return hasVisibleContent(node.children);
      }
      // For files, check if they match the current filter
      return (
        (node.isPrivate && (filter === "private" || filter === "all")) ||
        (!node.isPrivate && (filter === "public" || filter === "all"))
      );
    });
  };

  // Check if we have any folders (even empty ones) when in private
  const hasFolders = (nodes: TreeNode[]): boolean => {
    return nodes.some(
      (node) => node.type === 2 || (node.children && hasFolders(node.children)),
    );
  };

  const showEmptyState =
    filter === "public"
      ? !hasVisibleContent(mergedTree)
      : !hasFolders(mergedTree) && !hasVisibleContent(mergedTree);

  const deleteFileMutation = useMutation({
    mutationFn: async (path: string) => {
      await api({
        url: "volume/rm",
        init: {
          method: "POST",
          body: JSON.stringify({ path }),
        },
      });
      return path;
    },
    onSuccess: (path) => {
      queryClient.invalidateQueries({ queryKey: ["volume"] });
      toast.success(`Deleted '${path}' successfully`);
    },
    onError: (error, path) => {
      toast.error(`Failed to delete '${path}'. Please refresh and try again.`);
    },
  });

  const moveFileMutation = useMutation({
    mutationFn: async ({
      src,
      dst,
      overwrite = false,
    }: { src: string; dst: string; overwrite?: boolean }) => {
      await api({
        url: "volume/move", // Updated to match backend route
        init: {
          method: "POST",
          body: JSON.stringify({
            source_path: src,
            destination_path: dst,
            overwrite,
          }),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volume"] });
    },
    onError: (error) => {
      toast.error("Failed to move file. Please refresh and try again.");
    },
  });

  const operations: FileOperations = {
    createFolder: async (data: CreateFolderData) => {
      const newPath = data.parentPath
        ? `${data.parentPath}/${data.folderName}`
        : data.folderName;

      setFrontendFolderPaths((prev) => [...prev, newPath]);
    },
    deleteFile: deleteFileMutation.mutateAsync,
    moveFile: async (src, dst, overwrite = false) => {
      await moveFileMutation.mutateAsync({ src, dst, overwrite });
    },
  };

  const handleCreateFolder = async () => {
    try {
      await operations.createFolder({
        parentPath: "", // Empty string for root level
        folderName: newFolderName,
      });
      setShowNewFolderDialog(false);
      setNewFolderName("");
      toast.success("Folder created successfully");
    } catch (error) {
      toast.error("Failed to create folder");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateFolder();
    }
  };

  return (
    <div className={cn("flex h-full flex-col gap-4", className)}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm sm:w-auto sm:flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sorting controls */}
            <div className="flex items-center gap-2 rounded-md border bg-white/95 p-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex h-8 items-center gap-1"
                  >
                    <span>{sortBy === "name" ? "Name" : "File size"}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as "name" | "size")}
                  >
                    <DropdownMenuRadioItem value="name">
                      Name
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="size">
                      File size
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-5 w-[1px] bg-gray-200" />

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                }
              >
                {sortDirection === "asc" ? (
                  <ArrowUpWideNarrow className="h-4 w-4" />
                ) : (
                  <ArrowDownNarrowWide className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                iconPlacement="left"
                Icon={Upload}
                onClick={async () => {
                  onAddModel("");
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                iconPlacement="left"
                Icon={RefreshCcw}
                onClick={async () => {
                  await queryClient.invalidateQueries({ queryKey: ["volume"] });
                  toast.success("Models refreshed");
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNewFolderDialog(true)}
                title="Create folder"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter tabs */}
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as ModelFilter)}
            >
              <motion.div className="inline-flex items-center rounded-lg bg-white/95 py-0.5 ring-1 ring-gray-200/50">
                <TabsList className="relative flex w-fit gap-1 bg-transparent">
                  <motion.div layout className="relative">
                    <TabsTrigger
                      value="private"
                      className={cn(
                        "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                        filter === "private"
                          ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50"
                          : "text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      Private
                    </TabsTrigger>
                  </motion.div>
                  <motion.div layout className="relative">
                    <TabsTrigger
                      value="public"
                      className={cn(
                        "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                        filter === "public"
                          ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50"
                          : "text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      Public
                    </TabsTrigger>
                  </motion.div>
                  <motion.div layout className="relative">
                    <TabsTrigger
                      value="all"
                      className={cn(
                        "rounded-md px-4 py-1.5 font-medium text-sm transition-all",
                        filter === "all"
                          ? "bg-gradient-to-b from-white to-gray-100 shadow-sm ring-1 ring-gray-200/50"
                          : "text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      All
                    </TabsTrigger>
                  </motion.div>
                </TabsList>
              </motion.div>
            </Tabs>
          </div>
        </div>
        <DownloadingModels />
      </div>

      <div className="mx-auto w-full max-w-screen-2xl flex-1 overflow-auto rounded-sm border border-gray-200 bg-muted/20">
        {isLoadingPrivate || isLoadingPublic ? (
          <div className="flex flex-col gap-4 p-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={`loading-folder-${i}`} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="flex flex-col divide-y divide-gray-100">
                  {Array.from({ length: 2 }, (_, j) => (
                    <div
                      key={`loading-file-${i}-${j}`}
                      className="flex items-center gap-2 p-2"
                    >
                      <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : showEmptyState ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 p-8 text-center">
            <div className="rounded-full bg-gray-100 p-3">
              <FolderIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="font-medium text-gray-900">No models found</div>
            <p className="text-muted-foreground text-sm">
              {filter === "all"
                ? "No models available. Upload models to your folders or create a new folder."
                : filter === "private"
                  ? "No private models found. Upload models to your folders or create a new folder."
                  : "No public models available at the moment."}
            </p>
            {/* Allow upload even for public filter */}
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewFolderDialog(true)}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Create Folder
              </Button>
              <Button
                variant="default"
                size="sm"
                className="border-blue-700 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                onClick={() => onAddModel("")}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Model
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col p-4">
            {/* Common Models Section */}
            <div className="mb-2 mt-1">
              <h3 className="mb-2 text-sm font-medium text-gray-900">
                Common Models
              </h3>
            </div>

            {/* Display common model folders directly */}
            {sortedTree
              .filter(
                (node) =>
                  node.path === "checkpoints" ||
                  node.path === "loras" ||
                  node.path === "controlnet" ||
                  node.path.startsWith("checkpoints/") ||
                  node.path.startsWith("loras/") ||
                  node.path.startsWith("controlnet/"),
              )
              .map((node) => (
                <TreeNode
                  key={node.path}
                  node={node}
                  search={search}
                  operations={operations}
                  onAddModel={onAddModel}
                />
              ))}

            {/* All Models Section */}
            <div className="mb-2 mt-3">
              <h3 className="mb-2 text-sm font-medium text-gray-900">
                All Models
              </h3>
            </div>

            {/* Display all models except common ones */}
            {sortedTree
              .filter(
                (node) =>
                  !(
                    node.path === "checkpoints" ||
                    node.path === "loras" ||
                    node.path === "controlnet" ||
                    node.path.startsWith("checkpoints/") ||
                    node.path.startsWith("loras/") ||
                    node.path.startsWith("controlnet/")
                  ),
              )
              .map((node) => (
                <TreeNode
                  key={node.path}
                  node={node}
                  search={search}
                  operations={operations}
                  onAddModel={onAddModel}
                />
              ))}
          </div>
        )}
      </div>

      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewFolderDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
