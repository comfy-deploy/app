import * as React from "react";
import { useAssetList } from "@/hooks/hook";
import { Folder } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface AssetFolderSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderSelect: (folderPath: string) => void;
  currentPath: string;
}

export function AssetFolderSelect({
  open,
  onOpenChange,
  onFolderSelect,
  currentPath,
}: AssetFolderSelectProps) {
  const [selectedPath, setSelectedPath] = useState(currentPath);
  const [navigationPath, setNavigationPath] = useState(currentPath);
  const { data: assets, isLoading } = useAssetList(navigationPath);
  
  const handleNavigate = (path: string) => {
    setNavigationPath(path);
  };
  
  const handleSelect = (path: string) => {
    setSelectedPath(path);
  };
  
  const breadcrumbs = navigationPath
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Select Destination Folder</DialogTitle>
          <DialogDescription>
            Choose a folder to move the selected assets to
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex h-[300px] flex-col gap-2 overflow-hidden">
          <div className="flex items-center gap-2 pl-1 text-gray-500 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <div key={`crumb-${crumb.path}`} className="flex items-center">
                {i > 0 && <span className="mx-1">/</span>}
                <button
                  type="button"
                  onClick={() => handleNavigate(crumb.path)}
                  className="hover:text-gray-900"
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>
          
          <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-1 overflow-y-auto border rounded-md p-2">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <span>Loading...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {assets?.filter((asset: any) => asset.is_folder).map((folder: any) => (
                  <div 
                    key={folder.id}
                    className={`flex cursor-pointer items-center gap-2 p-2 rounded-md hover:bg-gray-100 ${selectedPath === folder.path ? 'bg-gray-100 border border-gray-300' : ''}`}
                    onClick={() => handleSelect(folder.path)}
                    onDoubleClick={() => handleNavigate(folder.path)}
                  >
                    <Folder className="h-5 w-5 text-gray-400" />
                    <span>{folder.name}</span>
                  </div>
                ))}
                {assets?.filter((asset: any) => asset.is_folder).length === 0 && (
                  <div className="p-2 text-gray-500">No folders found</div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onFolderSelect(selectedPath)}>
            Select Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
