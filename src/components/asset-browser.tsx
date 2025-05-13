import { FileURLRender } from "@/components/workflows/OutputRender";
import { useAssetList, useDeleteAsset } from "@/hooks/hook";
import { cn, formatFileSize } from "@/lib/utils";
import { useAssetBrowserStore } from "@/stores/asset-browser-store";
import {
  ChevronRight,
  Folder,
  FolderPlus,
  Loader2,
  MoreVertical,
  Trash,
  Grid,
  List,
  CheckSquare,
  X,
  Move as MoveIcon,
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { UploadZone } from "./upload/upload-zone";
import { Dialog, DialogContent } from "./ui/dialog";
import { getRelativeTime } from "@/lib/get-relative-time";
import { UserIcon } from "./run/SharePageComponent";
import { Checkbox } from "./ui/checkbox";
import { AssetFolderSelect } from "./asset-folder-select";
import { useBatchAssetOperations } from "@/hooks/use-batch-asset-operations";

interface AssetBrowserProps {
  className?: string;
  showNewFolderButton?: boolean;
  onItemClick?: (asset: { url: string; name: string; id: string }) => void;
  isPanel?: boolean;
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
    isSelectionMode,
    toggleAssetSelection,
    setSelectionMode,
    clearSelection,
    selectMultipleAssets
  } = useAssetBrowserStore();
  const { data: assets, isLoading } = useAssetList(currentPath);
  const { mutateAsync: deleteAsset } = useDeleteAsset();
  const { 
    batchDeleteAssets, 
    batchMoveAssets, 
    isProcessing, 
    progress, 
    total 
  } = useBatchAssetOperations();
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteAsset(assetId);
      toast.success("Asset deleted successfully");
    } catch (e) {
      toast.error("Error deleting asset");
    }
  };

  const handleNavigate = (path: string) => {
    console.log(path);
    setCurrentPath(path);
  };
  
  const handleBatchDelete = async () => {
    if (selectedAssets.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedAssets.length} assets?`)) {
      await batchDeleteAssets(selectedAssets);
      clearSelection();
    }
  };
  
  const handleBatchMove = async (destinationPath: string) => {
    if (selectedAssets.length === 0) return;
    
    await batchMoveAssets(selectedAssets, destinationPath);
    setShowFolderSelect(false);
    clearSelection();
  };
  
  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      clearSelection();
    } else {
      setSelectionMode(true);
    }
  };
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isSelectionMode || 
        (e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('.checkbox-container')) {
      return;
    }
    
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setStartPoint({ x, y });
    setSelectionBox({ x, y, width: 0, height: 0 });
  }, [isSelectionMode]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);
    const x = Math.min(currentX, startPoint.x);
    const y = Math.min(currentY, startPoint.y);
    
    setSelectionBox({ x, y, width, height });
  }, [isDragging, startPoint]);
  
  const handleMouseUp = useCallback(() => {
    if (!isDragging || !containerRef.current || !assets) return;
    
    const assetElements = Array.from(document.querySelectorAll('[data-asset-id]'));
    const assetsInBox: string[] = [];
    
    assetElements.forEach((element) => {
      const assetId = element.getAttribute('data-asset-id');
      if (!assetId) return;
      
      const rect = element.getBoundingClientRect();
      const containerRect = containerRef.current!.getBoundingClientRect();
      
      const assetLeft = rect.left - containerRect.left;
      const assetTop = rect.top - containerRect.top;
      const assetRight = assetLeft + rect.width;
      const assetBottom = assetTop + rect.height;
      
      if (
        assetRight >= selectionBox.x &&
        assetLeft <= selectionBox.x + selectionBox.width &&
        assetBottom >= selectionBox.y &&
        assetTop <= selectionBox.y + selectionBox.height
      ) {
        assetsInBox.push(assetId);
      }
    });
    
    if (assetsInBox.length > 0) {
      selectMultipleAssets(assetsInBox);
    }
    
    setIsDragging(false);
  }, [isDragging, selectionBox, assets, selectMultipleAssets]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp as any);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp as any);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
      [{ name: "Root", path: "/" }],
    );

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "@container flex h-full w-full flex-col gap-2 overflow-hidden",
      )}
      ref={containerRef}
      onMouseDown={handleMouseDown}
    >
      {/* Header with breadcrumb and actions - fixed */}
      <div className="flex shrink-0 items-center justify-between gap-4 p-4 pb-0">
        <div className="flex items-center gap-2 pl-1 text-gray-500 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={`crumb-fragment-${crumb.path}`}>
              <div key={`separator-${crumb.path}`}>
                {i > 0 && <ChevronRight className="h-4 w-4" />}
              </div>
              <div key={`crumb-${crumb.path}`} className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleNavigate(crumb.path)}
                  className="hover:text-gray-900"
                >
                  {crumb.name}
                </button>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* View toggle and selection mode buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant={isSelectionMode ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-[8px]"
            onClick={toggleSelectionMode}
            aria-label={isSelectionMode ? "Exit selection mode" : "Enter selection mode"}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
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
      
      {/* Progress indicator for batch operations */}
      {isProcessing && (
        <div className="mx-4 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out" 
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {progress}/{total}
          </span>
        </div>
      )}

      {/* Scrollable container */}
      {/* Drag selection box */}
      {isDragging && (
        <div
          className="absolute z-10 border-2 border-primary bg-primary/10 pointer-events-none"
          style={{
            left: `${selectionBox.x}px`,
            top: `${selectionBox.y}px`,
            width: `${selectionBox.width}px`,
            height: `${selectionBox.height}px`,
          }}
        />
      )}
      
      {/* Floating action bar for batch operations */}
      {isSelectionMode && selectedAssets.length > 0 && (
        <div className="fixed bottom-8 left-1/2 z-10 flex -translate-x-1/2 transform items-center gap-2 rounded-lg border bg-white px-4 py-2 shadow-lg">
          <span className="font-medium">
            {selectedAssets.length} {selectedAssets.length === 1 ? 'asset' : 'assets'} selected
          </span>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowFolderSelect(true)}>
            <MoveIcon className="mr-2 h-4 w-4" />
            Move
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      )}
      
      {/* Folder selection modal */}
      <AssetFolderSelect
        open={showFolderSelect}
        onOpenChange={setShowFolderSelect}
        onFolderSelect={handleBatchMove}
        currentPath={currentPath}
      />
      
      <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-1 overflow-y-auto">
        {viewType === "grid" ? (
          <div className="grid min-h-[200px] w-full @[300px]:grid-cols-2 @[500px]:grid-cols-3 @[700px]:grid-cols-4 @[900px]:grid-cols-5 grid-cols-2 gap-3 p-4">
            {assets?.map((asset: any) => (
              <div
                key={asset.id}
                data-asset-id={asset.id}
                className={cn(
                  "group relative flex aspect-square w-full flex-col items-center gap-1.5",
                  selectedAssets.includes(asset.id) && "ring-2 ring-primary"
                )}
              >
                {/* Selection checkbox */}
                {isSelectionMode && !asset.is_folder && (
                  <div className="absolute top-2 left-2 z-10 checkbox-container">
                    <Checkbox
                      checked={selectedAssets.includes(asset.id)}
                      onCheckedChange={() => toggleAssetSelection(asset.id)}
                      className="h-5 w-5 border-2"
                    />
                  </div>
                )}
                
                {asset.is_folder ? (
                  <button
                    type="button"
                    onClick={() => handleNavigate(asset.path)}
                    className="flex h-full w-full flex-col items-center justify-center rounded-[8px] border-2 border-dashed p-4 hover:bg-gray-50"
                  >
                    <Folder className="h-12 w-12 text-gray-400" />
                  </button>
                ) : (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                  <div
                    className="relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-[8px] border"
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleAssetSelection(asset.id);
                      } else if (isPanel) {
                        onItemClick?.(asset);
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
                    <DropdownMenuContent blocking={true}>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteAsset(asset.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {assets?.length === 0 && (
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
                {isSelectionMode && (
                  <div className="w-8 flex justify-center">
                    <span className="text-xs">Select</span>
                  </div>
                )}
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

            {assets?.map((asset: any) => (
              <div
                key={asset.id}
                data-asset-id={asset.id}
                className={cn(
                  "group flex w-full items-center border-b px-3 py-2 hover:bg-gray-50",
                  selectedAssets.includes(asset.id) && "bg-gray-50"
                )}
              >
                <div className="flex flex-1 items-center">
                  {/* Selection checkbox */}
                  {isSelectionMode && !asset.is_folder && (
                    <div className="w-8 flex justify-center checkbox-container">
                      <Checkbox
                        checked={selectedAssets.includes(asset.id)}
                        onCheckedChange={() => toggleAssetSelection(asset.id)}
                        className="h-4 w-4"
                      />
                    </div>
                  )}
                  {isSelectionMode && asset.is_folder && <div className="w-8" />}
                  
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
                          (isPanel || isSelectionMode) && "cursor-pointer hover:underline",
                        )}
                        onClick={() => {
                          if (isSelectionMode) {
                            toggleAssetSelection(asset.id);
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
                    <DropdownMenuContent blocking={true}>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteAsset(asset.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {assets?.length === 0 && (
              <div className="flex h-[200px] w-full items-center justify-center text-gray-500 text-sm">
                No assets in this folder
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
