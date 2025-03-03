import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  FolderIcon,
  FileIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  RefreshCcw,
  MoreHorizontal,
  Trash2,
  Search,
  FolderPlus,
  Upload,
  PencilIcon,
  CheckCircle2,
  XCircle,
  Copy,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DownloadingModels } from "@/components/models/downloading-models";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

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
}

type ModelFilter = "private" | "public" | "all";

function buildTree(files: FileEntry[], isPrivate: boolean): TreeNode[] {
  const root: TreeNode[] = [];
  const pathMap = new Map<string, TreeNode>(); // Track nodes by their full path

  for (const file of files) {
    const parts = file.path.split("/");
    let currentLevel = root;
    let currentPath = "";

    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];
      const isLast = index === parts.length - 1;

      // Build the current path
      currentPath = currentPath ? `${currentPath}/${part}` : part;

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
  moveFile: (src: string, dst: string) => Promise<void>;
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

  return (
    <div>
      <div className="group flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-2 rounded px-2 py-1 hover:bg-accent"
          onClick={() => setIsOpen(!isOpen)}
        >
          {node.type === 2 ? (
            <>
              {shouldBeOpen ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
              <FolderIcon className="h-4 w-4" />
            </>
          ) : (
            <>
              <span className="w-4" />
              <FileIcon className="h-4 w-4" />
            </>
          )}
          <span>{node.name}</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
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

            {node.isPrivate &&
              (node.type === 2 ? (
                <>
                  <DropdownMenuItem
                    onClick={() => setShowNewFolderDialog(true)}
                  >
                    <FolderPlus className="mr-2 h-4 w-4" />
                    New Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddModel(node.path)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Model
                  </DropdownMenuItem>
                </>
              ) : (
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
              ))}
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
            <div className="text-sm text-muted-foreground">
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
              {!isValidName && (
                <p className="mt-1.5 text-sm text-red-500">
                  {validationMessage}
                </p>
              )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <p>Are you sure you want to delete this file?</p>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium">{node.path}</span>
              </p>
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  This action cannot be undone. The file will be permanently
                  deleted.
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
                  "Delete"
                )}
              </Button>
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

  // Helper to check if a node should be included based on its privacy
  const shouldIncludeNode = (node: TreeNode) =>
    (node.isPrivate && showPrivate) || (!node.isPrivate && showPublic);

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
  const [filter, setFilter] = useState<ModelFilter>("private");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [frontendFolderPaths, setFrontendFolderPaths] = useState<string[]>([]);

  const { data: privateFiles, isLoading: isLoadingPrivate } = useQuery({
    queryKey: ["volume", "private-models"],
    queryFn: async ({ queryKey }) => {
      const response = await api({
        url: queryKey.join("/"),
      });
      return response as Promise<FileEntry[]>;
    },
  });

  const { data: publicFiles, isLoading: isLoadingPublic } = useQuery({
    queryKey: ["volume", "public-models"],
    queryFn: async ({ queryKey }) => {
      const response = await api({
        url: queryKey.join("/"),
      });
      return response as Promise<FileEntry[]>;
    },
  });

  const privateTree = privateFiles ? buildTree(privateFiles, true) : [];
  const publicTree = publicFiles ? buildTree(publicFiles, false) : [];

  // Inject frontend folders into the tree
  const injectFrontendFolders = (tree: TreeNode[]): TreeNode[] => {
    const result = [...tree];

    for (const path of frontendFolderPaths) {
      const parts = path.split("/");
      let currentLevel = result;

      for (const [index, part] of parts.entries()) {
        const isLast = index === parts.length - 1;
        const existingNode = currentLevel.find((node) => node.name === part);

        if (existingNode) {
          if (!isLast) {
            currentLevel = existingNode.children;
          }
        } else {
          const newNode: TreeNode = {
            name: part,
            path: parts.slice(0, index + 1).join("/"),
            type: 2,
            children: [],
            mtime: Date.now(),
            size: 0,
            isPrivate: true,
          };
          currentLevel.push(newNode);
          currentLevel = newNode.children;
        }
      }
    }

    return result;
  };

  const injectedPrivateTree = injectFrontendFolders(privateTree);

  const mergedTree = mergeNodes(
    injectedPrivateTree,
    publicTree,
    filter === "private" || filter === "all",
    filter === "public" || filter === "all",
  );

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
    mutationFn: async ({ src, dst }: { src: string; dst: string }) => {
      await api({
        url: "volume/mv",
        init: {
          method: "POST",
          body: JSON.stringify({ src_path: src, dst_path: dst }),
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
    moveFile: async (src, dst) => {
      await moveFileMutation.mutateAsync({ src, dst });
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
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Models</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["volume"] })
            }
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewFolderDialog(true)}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DownloadingModels />

      <div className="relative">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={filter} onValueChange={(v) => setFilter(v as ModelFilter)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="private">Private</SelectItem>
          <SelectItem value="public">Public</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1 overflow-auto">
        {isLoadingPrivate || isLoadingPublic ? (
          <div>Loading...</div>
        ) : (
          <div className="flex flex-col">
            {mergedTree.map((node) => (
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
