import { create } from "zustand";

interface AssetBrowserState {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  selectedAssets: string[];
  isSelectionMode: boolean;
  toggleAssetSelection: (assetId: string) => void;
  setSelectionMode: (mode: boolean) => void;
  clearSelection: () => void;
  selectMultipleAssets: (assetIds: string[]) => void;
}

export const useAssetBrowserStore = create<AssetBrowserState>((set) => ({
  currentPath: "/",
  setCurrentPath: (path) => set({ currentPath: path }),
  selectedAssets: [],
  isSelectionMode: false,
  toggleAssetSelection: (assetId) => 
    set((state) => ({
      selectedAssets: state.selectedAssets.includes(assetId)
        ? state.selectedAssets.filter((id) => id !== assetId)
        : [...state.selectedAssets, assetId],
    })),
  setSelectionMode: (mode) => set({ isSelectionMode: mode }),
  clearSelection: () => set({ selectedAssets: [], isSelectionMode: false }),
  selectMultipleAssets: (assetIds) => 
    set((state) => {
      const newAssets = assetIds.filter(
        (id) => !state.selectedAssets.includes(id)
      );
      return {
        selectedAssets: [...state.selectedAssets, ...newAssets],
      };
    }),
}));
