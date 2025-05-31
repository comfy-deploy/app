import { PaddingLayout } from "@/components/PaddingLayout";
import { AddModelDialog } from "@/components/models/add-model-dialog/index";
import { FolderTree } from "@/components/models/folder-tree";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

export const Route = createFileRoute("/models")({
  component: StoragePage,
});

export function StoragePage() {
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState("");

  const handleAddModel = (folderPath: string) => {
    setSelectedFolderPath(folderPath);
    setShowAddModel(true);
  };

  return (
    <PaddingLayout className="mx-auto flex h-full w-full flex-col gap-4 p-4 md:px-4">
      <div className="flex h-full flex-1 flex-col gap-2 rounded-md ">
        <Suspense
          fallback={
            <div className="flex h-full w-full flex-col gap-3">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton
                  key={`skeleton-item-${i}-${Math.random()}`}
                  className="h-[18px] w-full"
                />
              ))}
            </div>
          }
        >
          <FolderTree onAddModel={handleAddModel} />
        </Suspense>
      </div>

      <AddModelDialog
        open={showAddModel}
        onOpenChange={setShowAddModel}
        initialFolderPath={selectedFolderPath}
      />
    </PaddingLayout>
  );
}
