import { create } from "zustand";

interface AssetBrowserState {
  currentPath: string;
  selectedAssets: string[]; // Add selected assets array
  setCurrentPath: (path: string) => void;
  toggleSelectAsset: (assetId: string) => void; // Toggle selection
  selectAllAssets: (assetIds: string[]) => void; // Select all
  clearSelection: () => void; // Clear selection
  isRangeSelecting: boolean; // Track shift key for range selection
  setIsRangeSelecting: (isSelecting: boolean) => void;
  lastSelectedAsset: string | null; // Track last selected asset for range selection
  setLastSelectedAsset: (assetId: string | null) => void;
}

export const useAssetBrowserStore = create<AssetBrowserState>((set) => ({
  currentPath: "/",
  selectedAssets: [],
  lastSelectedAsset: null,
  isRangeSelecting: false,
  setCurrentPath: (path) => set({ currentPath: path, selectedAssets: [], lastSelectedAsset: null }),
  toggleSelectAsset: (assetId) => set((state) => {
    const isSelected = state.selectedAssets.includes(assetId);
    const newSelectedAssets = isSelected
      ? state.selectedAssets.filter(id => id !== assetId)
      : [...state.selectedAssets, assetId];
    
    return { 
      selectedAssets: newSelectedAssets,
      lastSelectedAsset: isSelected ? state.lastSelectedAsset : assetId
    };
  }),
  selectAllAssets: (assetIds) => set({ selectedAssets: assetIds, lastSelectedAsset: null }),
  clearSelection: () => set({ selectedAssets: [], lastSelectedAsset: null }),
  setIsRangeSelecting: (isSelecting) => set({ isRangeSelecting: isSelecting }),
  setLastSelectedAsset: (assetId) => set({ lastSelectedAsset: assetId }),
}));
