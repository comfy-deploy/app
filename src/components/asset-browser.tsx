import { FileURLRender } from "@/components/workflows/OutputRender";
import { useAssetList, useDeleteAsset, useUpdateAsset } from "@/hooks/hook";
import { cn, formatFileSize } from "@/lib/utils";
import { useAssetBrowserStore } from "@/stores/asset-browser-store";
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
  X,
  MoveHorizontal,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Checkbox } from "./ui/checkbox";
import { api } from "@/lib/api";

interface AssetBrowserProps {
  className?: string;
  showNewFolderButton?: boolean;
  onItemClick?: (asset: { url: string; name: string; id: string }) => void;
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

export function AssetBrowser({
  className,
  showNewFolderButton = true,
  onItemClick,
  isPanel = false,
}: AssetBrowserProps) {
  const { 
    currentPath, 
    setCurrentPath, 
    selectedAssets, 
    toggleSelectAsset, 
    selectAllAssets, 
    clearSelection,
    isRangeSelecting,
    setIsRangeSelecting,
    lastSelectedAsset,
    setLastSelectedAsset
  } = useAssetBrowserStore();
  const { data: assets, isLoading } = useAssetList(currentPath);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkMoving, setIsBulkMoving] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const { mutateAsync: deleteAsset } = useDeleteAsset();
  const { mutateAsync: updateAsset } = useUpdateAsset();

  const handleNavigate = (path: string) => {
    console.log(path);
    setCurrentPath(path);
  };
  
  // Handle keyboard events for selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsRangeSelecting(true);
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsRangeSelecting(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setIsRangeSelecting, clearSelection]);
  
  // Handle mouse events for drag selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return; // Only left click on container
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
    setDragCurrent({ x, y });
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDragCurrent({ x, y });
  }, [isDragging]);
  
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const selectionBox = getSelectionBox();
    
    const assetElements = container.querySelectorAll('[data-asset-id]');
    const selectedIds: string[] = [];
    
    assetElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const elementLeft = rect.left - containerRect.left;
      const elementTop = rect.top - containerRect.top;
      const elementRight = elementLeft + rect.width;
      const elementBottom = elementTop + rect.height;
      
      if (
        elementRight >= selectionBox.left &&
        elementLeft <= selectionBox.right &&
        elementBottom >= selectionBox.top &&
        elementTop <= selectionBox.bottom
      ) {
        const assetId = element.getAttribute('data-asset-id');
        if (assetId) {
          selectedIds.push(assetId);
        }
      }
    });
    
    if (selectedIds.length > 0) {
      if (isRangeSelecting) {
        // Add to existing selection
        const newSelection = [...new Set([...selectedAssets, ...selectedIds])];
        selectAllAssets(newSelection);
      } else {
        // Replace existing selection
        selectAllAssets(selectedIds);
      }
    }
    
    setIsDragging(false);
  }, [isDragging, isRangeSelecting, selectedAssets, selectAllAssets]);
  
  const getSelectionBox = () => {
    const left = Math.min(dragStart.x, dragCurrent.x);
    const top = Math.min(dragStart.y, dragCurrent.y);
    const right = Math.max(dragStart.x, dragCurrent.x);
    const bottom = Math.max(dragStart.y, dragCurrent.y);
    
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };
  
  // Handle asset selection
  const handleAssetSelect = (assetId: string, e?: React.MouseEvent) => {
    if (e?.shiftKey && lastSelectedAsset && assets) {
      const assetIds = assets.map((asset: Asset) => asset.id);
      const currentIndex = assetIds.indexOf(assetId);
      const lastIndex = assetIds.indexOf(lastSelectedAsset);
      
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const rangeIds = assetIds.slice(start, end + 1);
        
        // Add the range to the existing selection
        const newSelection = [...new Set([...selectedAssets, ...rangeIds])];
        selectAllAssets(newSelection);
        setLastSelectedAsset(assetId);
        return;
      }
    }
    
    // Normal selection
    toggleSelectAsset(assetId);
  };
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    const totalItems = selectedAssets.length;
    let successCount = 0;
    
    try {
      for (let i = 0; i < selectedAssets.length; i++) {
        try {
          await deleteAsset(selectedAssets[i]);
          successCount++;
          toast.success(`Deleted ${i+1}/${totalItems}`);
        } catch (e) {
          toast.error(`Error deleting asset ${i+1}/${totalItems}`);
        }
      }
      
      if (successCount === totalItems) {
        toast.success(`Successfully deleted ${totalItems} assets`);
      } else {
        toast.info(`Deleted ${successCount}/${totalItems} assets`);
      }
    } finally {
      setIsBulkDeleting(false);
      clearSelection();
      setDeleteDialogOpen(false);
    }
  };
  
  // Handle bulk move
  const handleBulkMove = async (path: string) => {
    setIsBulkMoving(true);
    const totalItems = selectedAssets.length;
    let successCount = 0;
    
    try {
      for (let i = 0; i < selectedAssets.length; i++) {
        try {
          await updateAsset({
            assetId: selectedAssets[i],
            path,
          });
          successCount++;
          toast.success(`Moved ${i+1}/${totalItems}`);
        } catch (e) {
          toast.error(`Error moving asset ${i+1}/${totalItems}`);
        }
      }
      
      if (successCount === totalItems) {
        toast.success(`Successfully moved ${totalItems} assets`);
      } else {
        toast.info(`Moved ${successCount}/${totalItems} assets`);
      }
    } finally {
      setIsBulkMoving(false);
      clearSelection();
      setMoveDialogOpen(false);
    }
  };
  
  // Handle single asset delete with confirmation
  const handleDeleteAsset = async (assetId: string) => {
    setAssetToDelete(assetId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    
    try {
      await deleteAsset(assetToDelete);
      toast.success("Asset deleted successfully");
    } catch (e) {
      toast.error("Error deleting asset", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setAssetToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

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
    <div
      className={cn(
        "@container flex h-full w-full flex-col gap-2 overflow-hidden",
      )}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header with breadcrumb and actions - fixed */}
      <div className="flex shrink-0 items-center justify-between gap-4 p-4 pb-0">
        <div className="flex items-center gap-2 pl-1 text-gray-500 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <>
              <div key={`separator-${crumb.path}`}>
                {i > 0 && <ChevronRight className="h-4 w-4" />}
              </div>
              <div key={`crumb-${crumb.path}`} className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleNavigate(crumb.path)}
                  className="max-w-[100px] truncate hover:text-gray-900"
                  disabled={crumb.path === currentPath}
                >
                  {crumb.name}
                </button>
              </div>
            </>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Selection actions */}
          {selectedAssets.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm" title="Tip: Use Shift+click to select a range of assets">{selectedAssets.length} selected</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2"
                onClick={() => setMoveDialogOpen(true)}
                disabled={isBulkMoving}
              >
                <MoveHorizontal className="h-4 w-4 mr-1" />
                Move
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 text-red-600 hover:text-red-700"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isBulkDeleting}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => clearSelection()}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* View toggle buttons */}
          <div className="flex items-center gap-1">
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
      </div>

      {/* Scrollable container */}
      <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-1 overflow-y-auto">
        {viewType === "grid" ? (
          <div className="grid min-h-[200px] w-full @[300px]:grid-cols-2 @[500px]:grid-cols-3 @[700px]:grid-cols-4 @[900px]:grid-cols-5 grid-cols-2 gap-3 p-4">
            {sortedAssets?.map((asset) => (
              <div
                key={asset.id}
                className={cn(
                  "group relative flex aspect-square w-full flex-col items-center gap-1.5",
                  selectedAssets.includes(asset.id) && "ring-2 ring-blue-500 rounded-[8px]"
                )}
                data-asset-id={asset.id}
              >
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox 
                    checked={selectedAssets.includes(asset.id)}
                    onCheckedChange={() => handleAssetSelect(asset.id)}
                    className="h-5 w-5 border-2 data-[state=checked]:bg-blue-500"
                  />
                </div>
                
                {asset.is_folder ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleAssetSelect(asset.id, e);
                      } else if (!selectedAssets.includes(asset.id)) {
                        handleNavigate(asset.path);
                      } else {
                        // If already selected, toggle selection
                        handleAssetSelect(asset.id);
                      }
                    }}
                    className="flex h-full w-full flex-col items-center justify-center rounded-[8px] border-2 border-dashed p-4 hover:bg-gray-50"
                  >
                    <Folder className="h-12 w-12 text-gray-400" />
                  </button>
                ) : (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                  <div
                    className="relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-[8px] border"
                    onClick={(e) => {
                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleAssetSelect(asset.id, e);
                      } else if (isPanel && !selectedAssets.includes(asset.id)) {
                        onItemClick?.(asset);
                      } else {
                        // If already selected, toggle selection
                        handleAssetSelect(asset.id);
                      }
                    }}
                  >
                    <FileURLRender
                      canFullScreen={!isPanel}
                      url={asset.url || ""}
                      imgClasses="max-w-[230px] w-full h-[230px] object-cover object-center rounded-[8px] transition-all duration-300 ease-in-out group-hover:scale-105"
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
                  <AssetActions asset={asset} />
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
            <div className="sticky top-0 z-10 flex w-full items-center border-b bg-white px-3 py-2 font-medium text-gray-500 text-sm">
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
                className={cn(
                  "group flex w-full items-center border-b px-3 py-2 hover:bg-gray-50",
                  selectedAssets.includes(asset.id) && "bg-blue-50 hover:bg-blue-100"
                )}
                data-asset-id={asset.id}
              >
                <div className="flex flex-1 items-center">
                  {/* Checkbox column */}
                  <div className="flex w-8 justify-center">
                    <Checkbox 
                      checked={selectedAssets.includes(asset.id)}
                      onCheckedChange={() => handleAssetSelect(asset.id)}
                      className="h-4 w-4 border-2 data-[state=checked]:bg-blue-500"
                    />
                  </div>
                  
                  {/* Icon column */}
                  <div className="flex w-8 justify-center">
                    {asset.is_folder ? (
                      <Folder className="h-5 w-5 text-gray-400" />
                    ) : (
                      <div className="h-6 w-6 overflow-hidden rounded-[4px] border">
                        <FileURLRender
                          url={asset.url || ""}
                          imgClasses="w-full h-full object-cover object-center"
                          canFullScreen={true}
                        />
                      </div>
                    )}
                  </div>

                  {/* Name column */}
                  <div className="flex-1 px-2">
                    {asset.is_folder ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          if (e.shiftKey || e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            handleAssetSelect(asset.id, e);
                          } else if (!selectedAssets.includes(asset.id)) {
                            handleNavigate(asset.path);
                          } else {
                            // If already selected, toggle selection
                            handleAssetSelect(asset.id);
                          }
                        }}
                        className="block w-full truncate text-left text-sm hover:underline"
                      >
                        {asset.name}
                      </button>
                    ) : (
                      // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                      <div
                        className={cn(
                          "max-w-[300px] truncate text-sm",
                          isPanel && "cursor-pointer hover:underline",
                        )}
                        onClick={(e) => {
                          if (e.shiftKey || e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            handleAssetSelect(asset.id, e);
                          } else if (isPanel && !selectedAssets.includes(asset.id)) {
                            onItemClick?.(asset);
                          } else {
                            // If already selected, toggle selection
                            handleAssetSelect(asset.id);
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
                        ? `${asset.mime_type.split("/")[1].toUpperCase()} • ${formatFileSize(asset.file_size)}`
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
                  <AssetActions asset={asset} />
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
      
      {/* Drag selection box */}
      {isDragging && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none z-10"
          style={{
            left: `${Math.min(dragStart.x, dragCurrent.x)}px`,
            top: `${Math.min(dragStart.y, dragCurrent.y)}px`,
            width: `${Math.abs(dragCurrent.x - dragStart.x)}px`,
            height: `${Math.abs(dragCurrent.y - dragStart.y)}px`,
          }}
        />
      )}
      
      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAssets.length > 1 || !assetToDelete
                ? `Delete ${selectedAssets.length} assets?`
                : "Delete asset?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAssets.length > 1 || !assetToDelete
                ? "This action cannot be undone. These assets will be permanently deleted."
                : "This action cannot be undone. This asset will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedAssets.length > 1 || !assetToDelete) {
                  handleBulkDelete();
                } else {
                  confirmDeleteAsset();
                }
              }}
            >
              {isBulkDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Bulk move dialog */}
      {selectedAssets.length > 0 && (
        <MoveAssetDialog
          asset={{ id: selectedAssets[0], path: "", name: "", is_folder: false, file_size: 0, mime_type: "", created_at: "", user_id: "" }}
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          onConfirm={(path) => handleBulkMove(path)}
          isBulk={true}
          itemCount={selectedAssets.length}
        />
      )}
    </div>
  );
}

function getParentPath(path: string): string {
  const parts = path.split("/");
  parts.pop();
  return parts.length === 0 ? "/" : parts.join("/");
}

function AssetActions({ asset }: { asset: Asset }) {
  const { selectedAssets } = useAssetBrowserStore();
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Get the parent component's handlers
  const assetBrowserComponent = document.querySelector('[data-asset-browser]');
  const handleDeleteAsset = assetBrowserComponent?.getAttribute('data-delete-handler') 
    ? new Function(assetBrowserComponent.getAttribute('data-delete-handler') || '')
    : (assetId: string) => {
        const event = new CustomEvent('delete-asset', { detail: { assetId } });
        document.dispatchEvent(event);
      };
  
  const handleMoveAsset = async (assetId: string, path: string) => {
    const event = new CustomEvent('move-asset', { detail: { assetId, path } });
    document.dispatchEvent(event);
    setMoveDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent blocking={true} className="w-40">
          {!asset.is_folder && (
            <DropdownMenuItem onClick={() => setMoveDialogOpen(true)}>
              <FileInput className="mr-2 h-4 w-4" />
              Move
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MoveAssetDialog
        asset={asset}
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        onConfirm={(path) => handleMoveAsset(asset.id, path)}
      />
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This asset will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                handleDeleteAsset(asset.id);
                setDeleteDialogOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface MoveAssetDialogProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (path: string) => void;
  isBulk?: boolean;
  itemCount?: number;
}

interface FolderNode {
  id: string;
  name: string;
  path: string;
  children: FolderNode[];
  isLoaded: boolean;
  isExpanded: boolean;
}

function MoveAssetDialog({
  asset,
  open,
  onOpenChange,
  onConfirm,
  isBulk = false,
  itemCount = 1,
}: MoveAssetDialogProps) {
  const [selectedPath, setSelectedPath] = useState("");
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

  // Get the parent path of the asset being moved
  const assetParentPath = getParentPath(asset.path);

  // Load root folders initially
  useEffect(() => {
    if (open) {
      loadFolders("/", "root");
      setSelectedPath("/"); // Default selection is root
    }
  }, [open]);

  // Function to load folders at a specific path
  const loadFolders = async (path: string, parentId: string) => {
    setIsLoading(true);
    try {
      // Direct API call to get folders
      const response = await api({
        url: `assets?path=${encodeURIComponent(path)}`,
      });

      // Filter to only include folders
      const folders = (response || []).filter((item: Asset) => item.is_folder);

      // Update the folder tree
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

  // Helper function to update a node in the folder tree
  const updateFolderNode = (
    tree: FolderNode[],
    nodeId: string,
    folders: Asset[],
  ) => {
    for (let i = 0; i < tree.length; i++) {
      const node = tree[i];

      if (node.id === nodeId) {
        // Create child nodes from the fetched folders
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

  // Toggle folder expansion
  const toggleFolder = (nodeId: string, path: string) => {
    setFolderTree((prevTree) => {
      const newTree = [...prevTree];

      const toggleNode = (nodes: FolderNode[]) => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          if (node.id === nodeId) {
            // If not loaded, load the folders
            if (!node.isLoaded) {
              loadFolders(path, nodeId);
            }

            // Toggle expansion
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

  // Handle folder selection
  const handleSelect = (path: string) => {
    setSelectedPath(path);
  };

  // Handle move confirmation
  const handleConfirm = () => {
    // Don't allow moving to the same location
    if (assetParentPath === selectedPath) {
      toast.error("Cannot move to the same location");
      return;
    }

    if (selectedPath === "/") {
      onConfirm("");
      return;
    }

    onConfirm(selectedPath);
  };

  // Render the folder tree
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{isBulk ? `Move ${itemCount} Assets` : "Move Asset"}</DialogTitle>
          <DialogDescription>Select the destination folder</DialogDescription>
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

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPath || (!isBulk && selectedPath === assetParentPath)}
          >
            {isBulk ? `Move ${itemCount} Items` : "Move Here"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
