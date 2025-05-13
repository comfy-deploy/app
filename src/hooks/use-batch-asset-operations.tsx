import * as React from "react";
import { useDeleteAsset } from "@/hooks/hook";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

export function useBatchAssetOperations() {
  const { mutateAsync: deleteAsset } = useDeleteAsset();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const batchDeleteAssets = async (assetIds: string[]) => {
    if (assetIds.length === 0) return;
    
    setIsProcessing(true);
    setTotal(assetIds.length);
    setProgress(0);
    
    try {
      for (let i = 0; i < assetIds.length; i++) {
        await deleteAsset(assetIds[i]);
        setProgress(i + 1);
      }
      toast.success(`Successfully deleted ${assetIds.length} assets`);
    } catch (error) {
      toast.error("Error deleting some assets");
    } finally {
      setIsProcessing(false);
    }
  };

  const batchMoveAssets = async (assetIds: string[], destinationPath: string) => {
    if (assetIds.length === 0) return;
    
    setIsProcessing(true);
    setTotal(assetIds.length);
    setProgress(0);
    
    try {
      for (let i = 0; i < assetIds.length; i++) {
        await api({
          url: `assets/${assetIds[i]}/move`,
          init: {
            method: "POST",
            body: JSON.stringify({ destination_path: destinationPath }),
          },
        });
        setProgress(i + 1);
      }
      toast.success(`Successfully moved ${assetIds.length} assets`);
    } catch (error) {
      toast.error("Error moving some assets");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    batchDeleteAssets,
    batchMoveAssets,
    isProcessing,
    progress,
    total,
  };
}
