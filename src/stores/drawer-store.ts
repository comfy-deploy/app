import { create } from "zustand";

export type Drawer =
  | "model"
  | "chat"
  | "integration"
  | "commit"
  | "version"
  | "log"
  | "external-node"
  | "assets"
  | "configuration";

interface DrawerState {
  activeDrawer: Drawer | null;
  setActiveDrawer: (drawer: Drawer | null) => void;
  toggleDrawer: (drawer: Drawer) => void;
  closeDrawer: () => void;
}

export const useDrawerStore = create<DrawerState>((set, get) => ({
  activeDrawer: null,
  setActiveDrawer: (drawer) => set({ activeDrawer: drawer }),
  toggleDrawer: (drawer) => {
    const { activeDrawer } = get();
    set({ activeDrawer: activeDrawer === drawer ? null : drawer });
  },
  closeDrawer: () => set({ activeDrawer: null }),
}));
