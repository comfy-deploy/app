import { PaddingLayout } from "@/components/PaddingLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { FolderTree } from "@/components/models/folder-tree";
import { AddModelDialog } from "@/components/models/add-model-dialog/index";
import { cn } from "@/lib/utils";

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
    <PaddingLayout className="flex h-full w-full flex-col gap-4 py-10">
      <div className="flex h-full flex-1 flex-col gap-2 rounded-md border border-gray-200 bg-muted/20 p-4">
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
