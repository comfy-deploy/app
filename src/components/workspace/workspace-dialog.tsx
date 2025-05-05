import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import type { Workspace, WorkspaceVisibility } from "./workspace-store";
import { useWorkspaceStore } from "./workspace-store";
import { UserSelector } from "./user-selector";

interface WorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace?: Workspace;
}

export function WorkspaceDialog({
  open,
  onOpenChange,
  workspace,
}: WorkspaceDialogProps) {
  const [name, setName] = useState(workspace?.name || "");
  const [visibility, setVisibility] = useState<WorkspaceVisibility>(
    workspace?.visibility || "all"
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    workspace?.userIds || []
  );
  
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace);
  const updateWorkspace = useWorkspaceStore((state) => state.updateWorkspace);
  
  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }
    
    if (visibility === "specific" && selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    
    if (workspace) {
      updateWorkspace(workspace.id, {
        name,
        visibility,
        userIds: visibility === "specific" ? selectedUsers : [],
      });
      toast.success("Workspace updated");
    } else {
      addWorkspace({
        name,
        visibility,
        userIds: visibility === "specific" ? selectedUsers : [],
      });
      toast.success("Workspace created");
    }
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {workspace ? "Edit Workspace" : "Create Workspace"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="workspace-name" className="text-right">
              Name
            </Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="visibility" className="text-right">
              Visibility
            </Label>
            <Select
              value={visibility}
              onValueChange={(value: WorkspaceVisibility) => setVisibility(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="specific">Specific users</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {visibility === "specific" && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Users</Label>
              <div className="col-span-3">
                <UserSelector
                  selectedUsers={selectedUsers}
                  onSelectionChange={setSelectedUsers}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
