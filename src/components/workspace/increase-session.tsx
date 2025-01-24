import { getSession, increaseSessionTimeout } from "@/components/session-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { History, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { Progress } from "../ui/progress";
import { Timer } from "../workflows/Timer";

const timeIncrements = [
  { value: "1", label: "1 minute" },
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
  { value: "15", label: "15 minutes" },
];

interface SessionIncrementState {
  open: boolean;
  setOpen: (open: boolean) => void;
  sessionId: string | null;
  setSessionId: (sessionId: string | null) => void;
}

export const useSessionIncrementStore = create<SessionIncrementState>(
  (set) => ({
    open: false,
    setOpen: (open) => set({ open }),
    sessionId: null,
    setSessionId: (sessionId) => set({ sessionId }),
  }),
);

export function SessionIncrementDialog() {
  const { open, setOpen } = useSessionIncrementStore();
  const { sessionId, setSessionId } = useSessionIncrementStore();
  const { data: sessionDetails } = getSession(sessionId || "");

  const [selectedIncrement, setSelectedIncrement] = useState("5");
  const [sessionTimeout, setSessionTimeout] = useState(
    sessionDetails?.timeout || 0,
  );

  useEffect(() => {
    if (!sessionDetails?.timeout) return;
    setSessionTimeout(sessionDetails.timeout);
  }, [sessionDetails?.timeout]);

  useEffect(() => {
    return () => {
      setOpen(false);
      setSessionId(null);
    };
  }, [setOpen, setSessionId]);

  const incrementTime = async () => {
    if (!sessionDetails) {
      toast.error("Session details not found");
      return;
    }

    await increaseSessionTimeout(
      Number(selectedIncrement),
      sessionDetails.machine_id,
      sessionDetails.session_id,
      sessionDetails.gpu,
    );
    setSessionTimeout((prevState: number | undefined) =>
      prevState ? prevState + Number.parseInt(selectedIncrement) : 0,
    );

    toast.success(
      `Session time increased to ${sessionTimeout + Number.parseInt(selectedIncrement)} minutes`,
    );
    setOpen(false);
  };

  if (!sessionDetails) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Increase Session Time</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center text-muted-foreground text-sm">
              <span className="flex items-center space-x-2">
                Instance:{" "}
                <span className="ml-1 font-medium">{sessionDetails?.gpu}</span>
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between rounded-none bg-muted/50 px-2 py-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Execution</span>
                </div>
                <Timer
                  start={new Date(sessionDetails?.created_at).getTime()}
                  relative={true}
                />
              </div>
              {sessionDetails?.timeout && sessionDetails?.created_at && (
                <>
                  <Progress
                    value={
                      ((sessionTimeout -
                        Math.max(
                          0,
                          sessionTimeout -
                            (new Date().getTime() -
                              new Date(sessionDetails.created_at).getTime()) /
                              60000,
                        )) /
                        sessionTimeout) *
                      100
                    }
                    className="h-2"
                  />
                  <span className="text-right text-muted-foreground text-xs">
                    max: {sessionTimeout} min
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={selectedIncrement}
              onValueChange={setSelectedIncrement}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Minutes" />
              </SelectTrigger>
              <SelectContent>
                {timeIncrements.map((increment) => (
                  <SelectItem key={increment.value} value={increment.value}>
                    {increment.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={incrementTime} className="flex-1">
              <Plus className="mr-2 h-4 w-4" /> Add Time
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
