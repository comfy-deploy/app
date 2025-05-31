import { LoadingMachineVerSkeleton } from "@/components/machine/machine-deployment";
import {
  LastActiveEvent,
  MachineCostEstimate,
  MachineOverview,
} from "@/components/machine/machine-overview";
import { MachineVersionBadge } from "@/components/machine/machine-version-badge";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { FolderOpen, Loader2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function MachinePage({
  params,
}: {
  params: { machine_id: string };
}) {
  const {
    data: machine,
    isLoading,
    refetch,
  } = useQuery<any>({
    queryKey: ["machine", params.machine_id],
    refetchInterval: 5000,
  });
  if (isLoading || !machine) {
    return (
      <>
        <div className="h-[57px] w-full border-b bg-[#fcfcfc] shadow-sm" />
        <div className="mx-auto h-[calc(100vh-100px)] max-h-full w-full max-w-[1200px] px-2 py-4 md:px-4">
          <LoadingMachineVerSkeleton />
        </div>
      </>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full">
        <MachineTopStickyBar machine={machine} />
        <div className="mx-auto max-w-[1200px]">
          <MachineOverview machine={machine} />
        </div>
      </div>
    </div>
  );
}

export function MachineTopStickyBar({ machine }: { machine: any }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 flex flex-row justify-between border-gray-200 border-b bg-[#fcfcfc] p-4 shadow-sm">
      <div className="flex flex-row items-center gap-2">
        <Link
          to={`/machines/${machine.id}`}
          params={{ machineId: machine.id }}
          className="flex flex-row items-center gap-2 font-medium text-md"
        >
          {machine.name}
          {machine.machine_version_id && (
            <MachineVersionBadge machine={machine} isExpanded={true} />
          )}
        </Link>
        {machine.type === "comfy-deploy-serverless" && (
          <>
            <MachineRenameButton machine={machine} />
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                navigate({
                  to: "/machines/$machineId/files",
                  params: { machineId: machine.id },
                });
              }}
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </Button>
          </>
        )}
      </div>
      <div className="flex flex-row gap-2">
        <MachineCostEstimate machineId={machine.id} />
        <LastActiveEvent machineId={machine.id} />
      </div>
    </div>
  );
}
function MachineRenameButton({ machine }: { machine: any }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(machine.name);
  const [isLoading, setIsLoading] = useState(false);

  // Reset name when dialog opens
  useEffect(() => {
    if (open) {
      setNewName(machine.name);
    }
  }, [open, machine.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!newName || newName.trim() === "") {
      toast.error("Machine name cannot be empty");
      return;
    }

    if (newName === machine.name) {
      setOpen(false);
      return;
    }

    try {
      setIsLoading(true);
      await api({
        url: `machine/serverless/${machine.id}`,
        init: {
          method: "PATCH",
          body: JSON.stringify({
            name: newName.trim(),
          }),
        },
      });

      toast.success("Machine renamed successfully");
      setOpen(false);
    } catch (error: any) {
      console.error("Failed to rename machine:", error);
      toast.error(error.message || "Failed to rename machine");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="xs">
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex flex-row items-center gap-2">
              Rename Machine{" "}
              <Badge variant="outline" className="text-xs">
                {machine.name}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                placeholder="Enter a new name"
                className="col-span-3"
                onChange={(e) => setNewName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={
                isLoading || !newName.trim() || newName === machine.name
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
