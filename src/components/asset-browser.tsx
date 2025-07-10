import {
  FileURLRender,
  FileURLRenderDropdown,
} from "@/components/workflows/OutputRender";
import { useAssetList, useDeleteAsset, useUpdateAsset } from "@/hooks/hook";
import { cn, formatFileSize } from "@/lib/utils";
import { useAssetBrowserStore } from "@/stores/asset-browser-store";
import { MoveAssetDialog } from "./move-asset-dialog";
import {
  ChevronRight,
  Folder,
  Loader2,
  MoreVertical,
  Trash,
  Grid,
  List,
  FileInput,
  Check,
  ChevronDown,
  FolderOpen,
  MoveIcon,
  FolderUp,
  X,
  Search,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { getRelativeTime } from "@/lib/get-relative-time";
import { UserIcon } from "./run/SharePageComponent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogFooter,
} from "./ui/alert-dialog";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "./ui/badge";

interface AssetBrowserProps {
  className?: string;
  showNewFolderButton?: boolean;
  onItemClick?: (asset: {
    url: string;
    name: string;
    id: string;
    path?: string;
    is_folder?: boolean;
  }) => void;
  isPanel?: boolean;
}

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

interface BulkOperationProgress {
  total: number;
  completed: number;
  inProgress: boolean;
  operation: "move" | "delete";
}

export function AssetBrowser({
  className,
  showNewFolderButton = true,
  onItemClick,
  isPanel = false,
}: AssetBrowserProps) {
  const { currentPath, setCurrentPath } = useAssetBrowserStore();
  const { data: assets, isLoading } = useAssetList(currentPath);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkMoveDialogOpen, setBulkMoveDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { assetToMove, setAssetToMove } = useAssetBrowserStore();
  const [bulkProgress, setBulkProgress] = useState<BulkOperationProgress>({
    total: 0,
    completed: 0,
    inProgress: false,
    operation: "delete",
  });

  const { mutateAsync: deleteAsset } = useDeleteAsset();
  const { mutateAsync: updateAsset } = useUpdateAsset();

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    // Clear selections when navigating
    setSelectedAssets([]);
    setIsSelectionMode(false);
  };

  const toggleAssetSelection = (asset: Asset) => {
    // Don't select folders for now
    if (asset.is_folder) return;

    setSelectedAssets((prev) => {
      const isAlreadySelected = prev.some((a) => a.id === asset.id);
      if (isAlreadySelected) {
        return prev.filter((a) => a.id !== asset.id);
      }
      return [...prev, asset];
    });
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    if (isSelectionMode) {
      setSelectedAssets([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.length === 0) return;

    setBulkProgress({
      total: selectedAssets.length,
      completed: 0,
      inProgress: true,
      operation: "delete",
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedAssets.length; i++) {
      try {
        await deleteAsset(selectedAssets[i].id);
        successCount++;
      } catch (e) {
        failCount++;
      }

      setBulkProgress((prev) => ({
        ...prev,
        completed: i + 1,
      }));
    }

    setBulkProgress((prev) => ({
      ...prev,
      inProgress: false,
    }));

    setSelectedAssets([]);
    setBulkDeleteDialogOpen(false);
    setIsSelectionMode(false);

    if (failCount === 0) {
      toast.success(`Successfully deleted ${successCount} assets`);
    } else {
      toast.error(`Failed to delete ${failCount} assets`, {
        description: `Successfully deleted ${successCount} assets.`,
      });
    }
  };

  const handleBulkMove = async (path: string) => {
    if (selectedAssets.length === 0) return;

    setBulkProgress({
      total: selectedAssets.length,
      completed: 0,
      inProgress: true,
      operation: "move",
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedAssets.length; i++) {
      try {
        await updateAsset({
          assetId: selectedAssets[i].id,
          path: path === "/" ? "" : path,
        });
        successCount++;
      } catch (e) {
        failCount++;
      }

      setBulkProgress((prev) => ({
        ...prev,
        completed: i + 1,
      }));
    }

    setBulkProgress((prev) => ({
      ...prev,
      inProgress: false,
    }));

    setSelectedAssets([]);
    setBulkMoveDialogOpen(false);

    if (failCount === 0) {
      toast.success(`Successfully moved ${successCount} assets`);
    } else {
      toast.error(`Failed to move ${failCount} assets`, {
        description: `Successfully moved ${successCount} assets.`,
      });
    }
  };

  // Calculate progress percentage
  const progressPercentage =
    bulkProgress.total > 0
      ? Math.round((bulkProgress.completed / bulkProgress.total) * 100)
      : 0;

  const breadcrumbs = currentPath
    .split("/")
    .filter(Boolean)
    .reduce<{ name: string; path: string }[]>(
      (acc, part) => {
        const lastPath = acc[acc.length - 1]?.path || "";
        acc.push({
          name: part,
          path: lastPath === "/" ? `${part}` : `${lastPath}/${part}`,
        });
        return acc;
      },
      [{ name: "Assets", path: "/" }],
    );

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const sortedAssets = assets
    ? [...assets].sort((a, b) => {
        if (a.is_folder && !b.is_folder) {
          return -1;
        }
        if (!a.is_folder && b.is_folder) {
          return 1;
        }
        return 0;
      })
    : [];

  return (
    <div className="@container mx-auto flex h-full w-full max-w-screen-2xl flex-col gap-2 overflow-hidden">
      {/* Move Asset Dialog */}
      {assetToMove && (
        <MoveAssetDialog
          asset={assetToMove}
          open={!!assetToMove}
          onOpenChange={(open) => !open && setAssetToMove(null)}
          onMoveDone={() => setAssetToMove(null)}
        />
      )}
      {/* Header with breadcrumb and actions - fixed */}
      <div className="flex shrink-0 items-center justify-between gap-4 p-4 pb-0">
        <div className="flex items-center gap-2 pl-1 text-gray-500 text-sm dark:text-zinc-400">
          {breadcrumbs.map((crumb, i) => (
            <>
              <div key={`separator-${crumb.path}`}>
                {i > 0 && <ChevronRight className="h-4 w-4" />}
              </div>
              <div key={`crumb-${crumb.path}`} className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleNavigate(crumb.path)}
                  className="max-w-[100px] truncate hover:text-gray-900 dark:hover:text-zinc-300"
                  disabled={crumb.path === currentPath}
                >
                  {crumb.name}
                </button>
              </div>
            </>
          ))}
        </div>

        {/* View and selection controls */}
        <div className="flex items-center gap-1">
          {isSelectionMode ? (
            <div className="mr-2 flex items-center gap-2">
              <span className="text-sm">{selectedAssets.length} selected</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-[8px]"
                onClick={toggleSelectionMode}
                aria-label="Cancel selection"
              >
                <X className="h-4 w-4" />
              </Button>

              {selectedAssets.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-[8px] flex items-center gap-1"
                    onClick={() => setBulkMoveDialogOpen(true)}
                  >
                    <MoveIcon className="h-4 w-4" />
                    Move
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-[8px] flex items-center gap-1 text-red-600 hover:bg-red-50"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          ) : (
            !isPanel && (
              <Button
                variant="outline"
                size="sm"
                className="mr-2 h-8 rounded-[8px]"
                onClick={toggleSelectionMode}
              >
                Select
              </Button>
            )
          )}

          <Button
            variant={viewType === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-[8px]"
            onClick={() => setViewType("grid")}
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-[8px]"
            onClick={() => setViewType("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk operation progress */}
      {bulkProgress.inProgress && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">
              {bulkProgress.operation === "delete" ? "Deleting" : "Moving"}{" "}
              {bulkProgress.completed} of {bulkProgress.total} files...
            </span>
            <span className="text-sm">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
        </div>
      )}

      {/* Scrollable container */}
      <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-1 overflow-y-auto">
        {viewType === "grid" ? (
          <div className="grid min-h-[200px] w-full @[1100px]:grid-cols-6 @[300px]:grid-cols-2 @[500px]:grid-cols-3 @[700px]:grid-cols-4 @[900px]:grid-cols-5 grid-cols-2 gap-3 p-4">
            {sortedAssets?.map((asset) => (
              <div
                key={asset.id}
                className="group relative flex aspect-square w-full flex-col items-center gap-1.5"
              >
                {/* Selection checkboxes for files */}
                {isSelectionMode && !asset.is_folder && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedAssets.some((a) => a.id === asset.id)}
                      onCheckedChange={() => toggleAssetSelection(asset)}
                      className="h-5 w-5 border-2 bg-white/80 drop-shadow-md"
                    />
                  </div>
                )}

                {asset.is_folder ? (
                  <button
                    type="button"
                    onClick={() => handleNavigate(asset.path)}
                    className="flex h-full w-full flex-col items-center justify-center rounded-[8px] border-2 border-dashed p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                  >
                    <Folder className="h-12 w-12 text-gray-400 dark:text-zinc-400" />
                  </button>
                ) : (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                  <div
                    className="relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-[8px] border"
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleAssetSelection(asset);
                      } else if (isPanel) {
                        onItemClick?.(asset);
                      }
                    }}
                  >
                    <FileURLRender
                      canFullScreen={!isPanel && !isSelectionMode}
                      isAssetBrowser={true}
                      url={asset.url || ""}
                      imgClasses="max-w-[240px] w-full h-full aspect-square object-cover object-center rounded-[8px] transition-all duration-300 ease-in-out group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex w-full items-center justify-between pl-2">
                  <div className="flex w-[calc(100%-2rem)] flex-col">
                    <span className="truncate text-sm leading-snug">
                      {asset.name}
                    </span>
                    {!asset.is_folder && (
                      <span className="text-2xs text-muted-foreground">
                        {asset.mime_type.split("/")[1].toUpperCase()} •{" "}
                        {formatFileSize(asset.file_size)}
                      </span>
                    )}
                  </div>
                  <AssetActions
                    asset={asset}
                    isSelectionMode={isSelectionMode}
                    onItemClick={onItemClick}
                    isPanel={isPanel}
                  />
                </div>
              </div>
            ))}
            {sortedAssets?.length === 0 && (
              <div className="col-span-full flex h-[200px] items-center justify-center text-gray-500 text-sm">
                No assets in this folder
              </div>
            )}
          </div>
        ) : (
          <div className="w-full p-4">
            {/* Column headers for list view */}
            <div className="sticky top-0 z-10 flex w-full items-center border-b bg-white px-3 py-2 font-medium text-gray-500 text-sm dark:bg-zinc-900/50 dark:text-zinc-400">
              {isSelectionMode && (
                <div className="flex w-8 items-center justify-center">
                  {/* Header checkbox could be added here later for select all */}
                </div>
              )}
              <div className="flex flex-1 items-center">
                <div className="w-8" /> {/* Space for icon */}
                <div className="flex-1 px-2">Name</div>
                {!isPanel && (
                  <div className="hidden w-32 text-center lg:block">Size</div>
                )}
                {!isPanel && (
                  <div className="hidden w-32 text-center lg:block">
                    Modified
                  </div>
                )}
                {!isPanel && (
                  <div className="hidden w-32 text-center lg:block">Owner</div>
                )}
              </div>
              <div className="w-8" /> {/* Space for actions */}
            </div>

            {sortedAssets?.map((asset) => (
              <div
                key={asset.id}
                className="group flex w-full items-center border-b px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700/50"
              >
                {/* Selection checkbox for list view */}
                {isSelectionMode && (
                  <div className="flex w-8 items-center justify-center">
                    {!asset.is_folder && (
                      <Checkbox
                        checked={selectedAssets.some((a) => a.id === asset.id)}
                        onCheckedChange={() => toggleAssetSelection(asset)}
                        className="h-4 w-4"
                      />
                    )}
                  </div>
                )}

                <div className="flex flex-1 items-center">
                  {/* Icon column */}
                  <div className="flex w-8 justify-center">
                    {asset.is_folder ? (
                      <Folder className="h-5 w-5 text-gray-400" />
                    ) : (
                      <div className="h-6 w-6 overflow-hidden rounded-[4px] border">
                        <FileURLRender
                          url={asset.url || ""}
                          imgClasses="h-6 w-6 object-cover object-center"
                        />
                      </div>
                    )}
                  </div>

                  {/* Name column */}
                  <div className="flex-1 px-2">
                    {asset.is_folder ? (
                      <button
                        type="button"
                        onClick={() => handleNavigate(asset.path)}
                        className="block w-full truncate text-left text-sm hover:underline"
                      >
                        {asset.name}
                      </button>
                    ) : (
                      // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                      <div
                        className={cn(
                          "max-w-[300px] truncate text-sm",
                          isPanel &&
                            !isSelectionMode &&
                            "cursor-pointer hover:underline",
                        )}
                        onClick={() => {
                          if (isSelectionMode) {
                            toggleAssetSelection(asset);
                          } else if (isPanel) {
                            onItemClick?.(asset);
                          }
                        }}
                      >
                        {asset.name}
                      </div>
                    )}
                  </div>

                  {/* Size column */}
                  {!isPanel && (
                    <div className="hidden w-32 text-center text-muted-foreground text-xs lg:block">
                      {!asset.is_folder && asset.mime_type
                        ? `${asset.mime_type.split("/")[1].toUpperCase().slice(0, 4)} • ${formatFileSize(asset.file_size)}`
                        : "-"}
                    </div>
                  )}

                  {/* Time column */}
                  {!isPanel && (
                    <div className="hidden w-32 text-center text-muted-foreground text-xs lg:block">
                      {getRelativeTime(asset.created_at)}
                    </div>
                  )}

                  {/* User column */}
                  {!isPanel && (
                    <div className="hidden w-32 justify-center lg:flex">
                      <UserIcon
                        displayName
                        user_id={asset.user_id}
                        className="h-5 w-5"
                      />
                    </div>
                  )}
                </div>

                {/* Actions column */}
                <div className="w-8">
                  <AssetActions
                    asset={asset}
                    isSelectionMode={isSelectionMode}
                    onItemClick={onItemClick}
                    isPanel={isPanel}
                  />
                </div>
              </div>
            ))}
            {sortedAssets?.length === 0 && (
              <div className="flex h-[200px] w-full items-center justify-center text-gray-500 text-sm">
                No assets in this folder
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Move Dialog */}
      {bulkMoveDialogOpen && (
        <MoveAssetDialog
          asset={{
            id: selectedAssets[0].id,
            name: `${selectedAssets.length} assets`,
            path: selectedAssets[0].path,
            is_folder: false,
            file_size: 0,
            mime_type: "",
            created_at: new Date().toISOString(),
            user_id: "",
          }}
          open={bulkMoveDialogOpen}
          onOpenChange={setBulkMoveDialogOpen}
          onConfirm={handleBulkMove}
          isBulkOperation={true}
          selectedCount={selectedAssets.length}
          dialogTitle={`Move ${selectedAssets.length} Assets`}
          dialogDescription={`Select destination folder for ${selectedAssets.length} assets`}
        />
      )}

      {/* Bulk Delete Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedAssets.length} Assets
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAssets.length} assets?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              onClick={() => setBulkDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function SearchAssetsInputBox() {
  const { setCurrentPath } = useAssetBrowserStore();
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedValue = useDebounce(searchValue, 300);

  // Reset selected index when search value changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchValue]);

  // Automatically trigger search when debounced value changes
  useEffect(() => {
    if (debouncedValue) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedValue]);

  const performSearch = async () => {
    if (!debouncedValue) return;

    setLoading(true);
    try {
      const response = await api({
        url: "assets/search",
        params: {
          query: debouncedValue,
        },
      });
      setSearchResults(response || []);
    } catch (error) {
      console.error("Error performing search:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If dropdown is not visible, don't handle navigation keys
    if (!isFocused || !searchValue || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          navigateToResult(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsFocused(false);
        break;
    }
  };

  const navigateToResult = (result: Asset) => {
    // Extract parent path (remove the filename portion)
    const path = result.path;
    const parentPath = path.substring(0, path.lastIndexOf("/"));

    // Navigate to the parent folder
    setCurrentPath(parentPath || "/");
    setIsFocused(false);
  };

  const clearSearch = () => {
    setSearchValue("");
    setSearchResults([]);
  };

  return (
    <div
      className={cn(
        "relative mr-2 hidden w-full max-w-sm transition-all duration-200 ease-in-out lg:block",
        // isFocused ? "w-64" : "w-24 text-muted-foreground",
      )}
    >
      <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder="Search assets"
        className="pl-9"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Delay blur to allow for item clicks
          setTimeout(() => setIsFocused(false), 200);
        }}
      />
      {searchValue && (
        <Button
          variant="ghost"
          size="icon"
          className="-translate-y-1/2 absolute top-1/2 right-3 h-6 w-6 p-0"
          onClick={clearSearch}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      {isFocused && searchValue && (
        <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 absolute top-full z-50 mt-1 max-h-[300px] w-full overflow-y-auto rounded-md border bg-popover bg-white p-1 shadow-md">
          {loading ? (
            <div className="flex items-center justify-center p-2 text-muted-foreground text-xs">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="flex flex-col">
              {searchResults.map((result, index) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                <div
                  key={result.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded p-2 text-xs hover:bg-gray-100",
                    selectedIndex === index && "bg-gray-100",
                  )}
                  onClick={() => navigateToResult(result)}
                >
                  <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded border">
                    {result.url && (
                      <FileURLRender
                        url={result.url}
                        imgClasses="w-full h-full object-cover object-center"
                      />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate font-medium">{result.name}</div>
                    <div className="truncate text-2xs text-muted-foreground">
                      {result.path}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center p-2 text-muted-foreground text-xs">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssetActions({
  asset,
  isSelectionMode,
  onItemClick,
  isPanel,
}: {
  asset: Asset;
  isSelectionMode: boolean;
  onItemClick?: (asset: {
    url: string;
    name: string;
    id: string;
    path?: string;
    is_folder?: boolean;
  }) => void;
  isPanel?: boolean;
}) {
  const { mutateAsync: deleteAsset } = useDeleteAsset();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Get the setAssetToMove function from the store
  const { setAssetToMove } = useAssetBrowserStore();

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteAsset(assetId);
      toast.success("Asset deleted successfully");
      setDeleteDialogOpen(false);
    } catch (e) {
      toast.error("Error deleting asset", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const handleMoveAsset = (asset: Asset) => {
    setAssetToMove(asset);
  };

  return (
    <>
      <FileURLRenderDropdown
        triggerIcon={
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 p-0 opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100 data-[state=open]:opacity-100",
              isSelectionMode && "!opacity-0",
            )}
            disabled={isSelectionMode}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        }
        itemUrl={asset.url || ""}
        itemFilename={asset.name}
        canAddToAssets={false}
        canDownload={!asset.is_folder}
      >
        {asset.is_folder && isPanel && (
          <DropdownMenuItem
            onClick={() => {
              if (onItemClick) {
                onItemClick({
                  url: asset.url || "",
                  name: asset.name,
                  id: asset.id,
                  path: asset.path,
                  is_folder: true,
                });
              }
            }}
            className="justify-between"
          >
            <div className="flex items-center gap-1.5">
              Select Folder{" "}
              <Badge variant="purple" className="py-0">
                Beta
              </Badge>
            </div>
            <FolderOpen className="h-4 w-4" />
          </DropdownMenuItem>
        )}
        {!asset.is_folder && (
          <DropdownMenuItem
            onClick={() => handleMoveAsset(asset)}
            className="justify-between"
          >
            Move
            <FolderUp className="h-4 w-4" />
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="justify-between text-red-600"
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete
          <Trash className="h-4 w-4" />
        </DropdownMenuItem>
      </FileURLRenderDropdown>

      {/* Delete dialog is handled here, Move dialog is handled at the AssetBrowser level */}

      <DeleteAssetDialog
        asset={asset}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => handleDeleteAsset(asset.id)}
      />
    </>
  );
}

interface DeleteAssetDialogProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

function DeleteAssetDialog({
  asset,
  open,
  onOpenChange,
  onConfirm,
}: DeleteAssetDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Asset</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{asset.name}"? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
