import { create } from "zustand";

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

interface AssetBrowserState {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  assetToMove: Asset | null;
  setAssetToMove: (asset: Asset | null) => void;
}

export const useAssetBrowserStore = create<AssetBrowserState>((set) => ({
  currentPath: "/",
  setCurrentPath: (path) => set({ currentPath: path }),
  assetToMove: null,
  setAssetToMove: (asset) => set({ assetToMove: asset }),
}));
