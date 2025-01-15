import { MachineListItem } from "@/components/machines/machine-list-item";
import { cn } from "@/lib/utils";
import { VirtualizedInfiniteList } from "@/components/virtualized-infinite-list";
import { useMachines } from "@/hooks/use-machine";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Cog, Play, Settings } from "lucide-react";
import {
  ComfyUIVersionSelectBox,
  GPUSelectBox,
} from "@/components/machine/machine-settings";
import { useForm } from "react-hook-form";
import { comfyui_hash } from "@/utils/comfydeploy-hash";
import { useSessionAPI } from "@/hooks/use-session-api";
import { useLogStore } from "@/components/workspace/LogContext";

export const Route = createFileRoute("/home")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <SessionsList />
    </>
  );
}

function SessionsList() {
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ["sessions"],
    refetchInterval: 2000,
  });

  // console.log(data);
  const query = useMachines(undefined, 5, 5);

  const { createSession, listSession, deleteSession } = useSessionAPI();

  const form = useForm({
    defaultValues: {
      gpu: "A10G",
      comfyui_version: comfyui_hash,
    },
  });

  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-screen-lg pt-10 flex  flex-col">
      <div className="bg-gray-50 rounded-t-3xl border-t border-x border-b-0 border-gray-100 p-4 pb-8 -mb-4 flex flex-row justify-between items-center">
        <div className="flex flex-row gap-2 items-center ">
          ComfyUI
          <ComfyUIVersionSelectBox
            className="mt-0"
            value={form.watch("comfyui_version")}
            onChange={(value) => form.setValue("comfyui_version", value)}
          />
        </div>
        <div className="flex flex-row gap-2">
          <div className="flex gap-2 flex-row items-center">
            <GPUSelectBox
              className="mt-0"
              value={form.watch("gpu")}
              onChange={(value) => form.setValue("gpu", value)}
            />
          </div>
          <Button
            variant="outline"
            Icon={Settings}
            iconPlacement="right"
            onClick={() => {
              router.navigate({
                to: "/machines",
                search: {
                  view: "create",
                },
              });
            }}
          />
          <Button
            variant="shine"
            Icon={Play}
            iconPlacement="right"
            onClick={() => {
              router.navigate({
                to: "/sessions/$sessionId",
                params: {
                  sessionId: "new",
                  // workflowId: "e3902b92-4c83-4bae-8b69-d494ca1e91fd",
                },
                // search: {
                //   sessionId: "preview",
                // },
              });
            }}
          >
            Start
          </Button>
        </div>
      </div>
      <VirtualizedInfiniteList
        autoFetch={false}
        className="!h-full fab-machine-list mx-auto w-full max-w-[1200px] rounded-3xl border"
        containerClassName="divide-y divide-border"
        queryResult={query}
        renderItem={(machine, index) => (
          <MachineListItem
            key={machine.id}
            index={index}
            machine={machine}
            // isExpanded={expandedMachineId === machine.id}
            // setIsExpanded={(expanded) =>
            //   setExpandedMachineId(expanded ? machine.id : null)
            // }
            overrideRightSide={
              <Button
                variant="outline"
                Icon={Play}
                iconPlacement="right"
                onClick={async () => {
                  const response = await createSession.mutateAsync({
                    machine_id: machine.id,
                    gpu: machine.gpu,
                    timeout: 15,
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
        )}
        renderItemClassName={(machine) => cn("z-0 transition-all duration-200")}
        renderLoading={() => {
          return [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="mb-2 flex h-[80px] w-full animate-pulse items-center justify-between rounded-md border bg-white p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row items-center gap-2">
                    <div className="h-[10px] w-[10px] rounded-full bg-gray-200" />
                    <div className="h-4 w-60 rounded bg-gray-200" />
                  </div>
                  <div className="h-3 w-32 rounded bg-gray-200" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-12 rounded-md bg-gray-200" />
                <div className="h-5 w-20 rounded-md bg-gray-200" />
                <div className="h-5 w-12 rounded-md bg-gray-200" />
                {/* <Button variant="ghost" size="icon">
                  <ChevronDown className={"h-4 w-4"} />
                </Button> */}
              </div>
            </div>
          ));
        }}
        estimateSize={80}
      />
    </div>
  );
}
