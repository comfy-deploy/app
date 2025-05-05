import { create } from "zustand";

export type WorkspaceVisibility = "all" | "specific";

export interface Workspace {
  id: string;
  name: string;
  visibility: WorkspaceVisibility;
  userIds: string[];
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  addWorkspace: (workspace: Omit<Workspace, "id">) => void;
  updateWorkspace: (id: string, workspace: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  setCurrentWorkspaceId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspaceId: null,
  addWorkspace: (workspace) => 
    set((state) => ({
      workspaces: [
        ...state.workspaces,
        { ...workspace, id: crypto.randomUUID() }
      ]
    })),
  updateWorkspace: (id, workspace) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) => 
        w.id === id ? { ...w, ...workspace } : w
      )
    })),
  deleteWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspaceId: state.currentWorkspaceId === id 
        ? null 
        : state.currentWorkspaceId
    })),
  setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
}));
