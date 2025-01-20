import { useRouter } from "@tanstack/react-router";
import { useSessionAPI } from "@/hooks/use-session-api";
import { MachineListItem } from "@/components/machines/machine-list-item";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useLogStore } from "@/components/workspace/LogContext";

export function MachineWorkspaceItem({
  machine,
  index,
}: { machine: any; index: number }) {
  const router = useRouter();
  const { createDynamicSession } = useSessionAPI();
  return (
    <MachineListItem
      key={machine.id}
      index={index}
      machine={machine}
      overrideRightSide={
        <Button
          variant="outline"
          Icon={Play}
          iconPlacement="right"
          onClick={async () => {
            const response = await createDynamicSession.mutateAsync({
              machine_id: machine.id,
              gpu: machine.gpu,
              timeout: 15,
              // dependencies: {
              //   docker_command_steps: machine.docker_command_steps,
              //   comfyui_version: machine.comfyui_version,
              // },
            });
            useLogStore.getState().clearLogs();

            router.navigate({
              to: "/sessions/$sessionId",
              params: {
                sessionId: response.session_id,
              },
              search: {
                machineId: machine.id,
              },
            });
          }}
        >
          Start
        </Button>
      }
      machineActionItemList={<></>}
    />
  );
}
