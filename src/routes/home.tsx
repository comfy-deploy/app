import { MachineListItem } from "@/components/machines/machine-list-item";
import { cn } from "@/lib/utils";
import { VirtualizedInfiniteList } from "@/components/virtualized-infinite-list";
import { useMachine, useMachines } from "@/hooks/use-machine";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Cog, Play, Settings, Trash } from "lucide-react";
import {
  ComfyUIVersionSelectBox,
  GPUSelectBox,
} from "@/components/machine/machine-settings";
import { useForm } from "react-hook-form";
import { comfyui_hash } from "@/utils/comfydeploy-hash";
import { useSessionAPI } from "@/hooks/use-session-api";
import { useLogStore } from "@/components/workspace/LogContext";
import { UserIcon } from "@/components/run/SharePageComponent";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime } from "@/lib/get-relative-time";

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

function MachineNameDisplay({ machineId }: { machineId: string }) {
  const { data: machine } = useMachine(machineId);
  return (
    <Link
      to="/machines/$machineId"
      params={{ machineId }}
      className="text-xs hover:underline"
    >
      {machine?.name}
    </Link>
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

  // const data = [
  //   {
  //     id: "1d6d37d2-3ac6-4e06-9b0e-fc484a606c4f",
  //     user_id: "user_2ZA6vuKD3IJXju16oJVQGLBcWwg",
  //     org_id: "org_2bWQ1FoWC3Wro391TurkeVG77pC",
  //     machine_id: "f9de318e-4903-42e3-a98c-d0463f813fdc",
  //     start_time: "2025-01-15T10:21:06.028Z",
  //     end_time: null,
  //     gpu: "T4",
  //     ws_gpu: null,
  //     gpu_provider: "modal",
  //     created_at: "2025-01-15T10:21:05.934Z",
  //     updated_at: "2025-01-15T10:21:16.014Z",
  //     session_timeout: 15,
  //     session_id: "015085cf-dcc0-4f31-8342-40dc6bc8ea3e",
  //     modal_function_id: "fc-01JHMQP41WQJXCT0QG1D59DDKV",
  //     tunnel_url: "https://4t78bugi4bpaj9.r12.modal.host",
  //     cost_item_title: null,
  //     cost: 0,
  //   },
  //   {
  //     id: "1d6d37d2-3ac6-4e06-9b0e-fc484a606c4f",
  //     user_id: "user_2ZA6vuKD3IJXju16oJVQGLBcWwg",
  //     org_id: "org_2bWQ1FoWC3Wro391TurkeVG77pC",
  //     machine_id: "f9de318e-4903-42e3-a98c-d0463f813fdc",
  //     start_time: "2025-01-15T10:21:06.028Z",
  //     end_time: null,
  //     gpu: "T4",
  //     ws_gpu: null,
  //     gpu_provider: "modal",
  //     created_at: "2025-01-15T10:21:05.934Z",
  //     updated_at: "2025-01-15T10:21:16.014Z",
  //     session_timeout: 15,
  //     session_id: "015085cf-dcc0-4f31-8342-40dc6bc8ea3e",
  //     modal_function_id: "fc-01JHMQP41WQJXCT0QG1D59DDKV",
  //     tunnel_url: "https://4t78bugi4bpaj9.r12.modal.host",
  //     cost_item_title: null,
  //     cost: 0,
  //   },
  //   {
  //     id: "1d6d37d2-3ac6-4e06-9b0e-fc484a606c4f",
  //     user_id: "user_2ZA6vuKD3IJXju16oJVQGLBcWwg",
  //     org_id: "org_2bWQ1FoWC3Wro391TurkeVG77pC",
  //     machine_id: "f9de318e-4903-42e3-a98c-d0463f813fdc",
  //     start_time: "2025-01-15T10:21:06.028Z",
  //     end_time: null,
  //     gpu: "T4",
  //     ws_gpu: null,
  //     gpu_provider: "modal",
  //     created_at: "2025-01-15T10:21:05.934Z",
  //     updated_at: "2025-01-15T10:21:16.014Z",
  //     session_timeout: 15,
  //     session_id: "015085cf-dcc0-4f31-8342-40dc6bc8ea3e",
  //     modal_function_id: "fc-01JHMQP41WQJXCT0QG1D59DDKV",
  //     tunnel_url: "https://4t78bugi4bpaj9.r12.modal.host",
  //     cost_item_title: null,
  //     cost: 0,
  //   },
  // ];

  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-screen-lg pt-10 flex flex-col gap-2">
      <div className="text-sm font-medium">Active ComfyUI</div>
      <div className="flex flex-col  divide-y divide-border overflow-hidden  rounded-3xl  border">
        {data?.map((session) => {
          return (
            <Link
              to={"/sessions/$sessionId"}
              params={{
                sessionId: session.session_id,
              }}
              search={{
                machineId: session.machine_id,
              }}
              key={session.session_id}
              className="flex h-[60px] flex-row items-center gap-2 bg-background px-4 hover:bg-slate-50"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="text-muted-foreground text-xs bg-background ">
                {session.id.slice(0, 6)}
              </div>
              <UserIcon user_id={session.user_id} className="w-6 h-6" />
              <MachineNameDisplay machineId={session.machine_id} />
              <Badge variant="green" className="py-1">
                {session.gpu}
              </Badge>
              <div className="ml-auto text-muted-foreground text-sm">
                {getRelativeTime(session.start_time)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  e.nativeEvent.preventDefault();
                  await deleteSession.mutateAsync({
                    sessionId: session.session_id,
                  });
                }}
              >
                <Trash className="w-4 h-4 stroke-red-500 fill-red-200" />
              </Button>
            </Link>
          );
        })}
        {data?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="text-sm">No active ComfyUI sessions</div>
            {/* <div className="text-xs">Start a new session to begin</div> */}
          </div>
        )}
      </div>
      <div className="text-sm font-medium mt-5">Configurations</div>
      <div className="-mb-6 flex flex-row items-center justify-between rounded-t-3xl border-gray-100 border-x border-t border-b-0 bg-gray-50 p-4 pb-8">
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
        className=" fab-machine-list mx-auto w-full max-w-[1200px] rounded-3xl border "
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
