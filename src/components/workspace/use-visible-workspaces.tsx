import * as React from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";
import { useWorkspaceStore } from "./workspace-store";

export function useVisibleWorkspaces() {
  const { userId } = useAuth();
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  
  return useMemo(() => {
    return workspaces.filter(
      (workspace) =>
        workspace.visibility === "all" ||
        (workspace.visibility === "specific" && workspace.userIds.includes(userId!))
    );
  }, [workspaces, userId]);
}
