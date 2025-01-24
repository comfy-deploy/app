"use client";

import { AutoFormSubmit } from "@/components/auto-form";
import { Button } from "@/components/ui/button";
import { LoadingIcon } from "@/components/ui/custom/loading-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { callServerPromise } from "@/lib/call-server-promise";
import { ArrowRight, Copy, MoreVertical, Play, Plus } from "lucide-react";
import { parseAsInteger, useQueryState } from "nuqs";
import { usePostHog } from "posthog-js/react";
import {
  type FormEvent,
  type RefObject,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { create } from "zustand";

import { SDForm } from "@/components/SDInputs/SDForm";
import {
  type RGBColor,
  SDInputsRender,
} from "@/components/SDInputs/SDInputsRender";
import { useConfirmServerActionDialog } from "@/components/auto-form/auto-form-dialog";
import { type LogsType, LogsViewer } from "@/components/log/logs-viewer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  VersionSelectV2,
  useSelectedVersion,
} from "@/components/version-select";
import { getEnvColor } from "@/components/workspace/ContainersTable";
import { useWorkflowDeployments } from "@/components/workspace/ContainersTable";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import {
  getDefaultValuesFromWorkflow,
  getInputsFromWorkflow,
} from "@/lib/getInputsFromWorkflow";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useRuns } from "../workflows/RunsTable";
import { parseFilesToImgURLs } from "./RunWorkflowInline";

export function useWorkflowVersion(workflow: any) {
  return useQueryState("version", {
    defaultValue: workflow?.versions?.[0].version ?? 1,
    ...parseAsInteger,
  });
}

type SelectedMachineStore = {
  selectedMachine: string | undefined;
  setSelectedMachine: (machine: string) => void;
  machine: Omit<MachineType, "build_log"> | undefined;
  setMachine: (machine: Omit<MachineType, "build_log">) => void;
};

export const selectedMachineStore = create<SelectedMachineStore>((set) => ({
  selectedMachine: undefined,
  setSelectedMachine: (machine) => set(() => ({ selectedMachine: machine })),
  machine: undefined,
  setMachine: (machine) => set(() => ({ machine: machine })),
}));

type status = {
  state: string;
  live_status: string;
  progress: number;
};

type PublicRunStore = {
  image:
    | {
        url: string;
      }[]
    | null;
  loading: boolean;
  runId: string;
  status: status | null;
  logs: LogsType;
  addLogs: (logs: LogsType) => void;
  setImage: (image: { url: string }[]) => void;
  setLoading: (loading: boolean) => void;
  setRunId: (runId: string) => void;
  setStatus: (status: status) => void;
};

export const publicRunStore = create<PublicRunStore>((set) => ({
  image: null,
  loading: false,
  runId: "",
  status: null,
  logs: [],
  setImage: (image) => set({ image }),
  setLoading: (loading) => set({ loading }),
  setRunId: (runId) => set({ runId }),
  setStatus: (status) => set({ status }),

  addLogs: (logs) => set((state) => ({ logs: [...state.logs, ...logs] })),
}));

export function SharedRunLogs() {
  const { logs } = publicRunStore();
  return (
    <LogsViewer
      stickToBottom
      logs={logs}
      containerClassName="w-full h-[300px]"
      className="overflow-auto "
    />
  );
}

function useOnScreen(ref: RefObject<any>, rootMargin = "0px") {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin,
      },
    );

    const currentElement = ref?.current;

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      observer.unobserve(currentElement);
    };
  }, []);

  return isVisible;
}

export function RunWorkflowButton({
  workflow_id,
  overrideRun,
  workspaceEndpoint,
  className,
}: {
  workflow_id: string;
  overrideRun?: (inputs: Record<string, any> | undefined) => Promise<void>;
  workspaceEndpoint?: string;
  filterWorkspace?: boolean;
  className?: string;
}) {
  const { workflow } = useCurrentWorkflow(workflow_id);

  const ref = useRef<HTMLButtonElement>(null);

  const [version] = useQueryState("version", {
    defaultValue: workflow?.versions[0].version ?? 1,
    ...parseAsInteger,
  });
  const [runID, setRunID] = useQueryState("runID");
  const machine = workflow?.selected_machine_id;
  const { data: currentMachine } = useMachine(machine);
  const [isLoading, setIsLoading] = useState(false);
  const [isVersionDisabled, setIsVersionDisabled] = useState(false);

  const [values, setValues] = useState<Record<string, any>>({});
  const [open, setOpen] = useState(false);

  const isButtonVisible = useOnScreen(ref);

  const { refetch } = useRuns({ workflow_id });

  const [batchNumber, setBatchNumber] = useState(1);
  const [isBatchInput, setIsBatchInput] = useState(false);

  const { setVersion, value: workflow_version } =
    useSelectedVersion(workflow_id);

  useEffect(() => {
    if (!workspaceEndpoint) return;

    const eventListener = (event: any) => {
      if (event.origin !== workspaceEndpoint) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "cd_plugin_onQueuePromptTrigger") {
          setOpen(true);
        }
      } catch (error) {}
    };
    window.addEventListener("message", eventListener);
    return () => {
      window.removeEventListener("message", eventListener);
    };
  }, [workspaceEndpoint]);

  useEffect(() => {
    if (!workflow_version || workflow_version.workflow_api === null) {
      setIsVersionDisabled(true);
    } else {
      setIsVersionDisabled(false);
    }
  }, [workflow, version]);

  useEffect(() => {
    if (!isButtonVisible) {
      return;
    }

    if (!runID) {
      return;
    }
    api({
      url: `run/${runID}`,
      init: {
        method: "GET",
      },
    }).then((res) => {
      if (!res || !res.workflow_inputs) {
        toast.error(`Couldn't load inputs of run: ${runID}`);
        setRunID(null);
        return;
      }

      // if have version, change to that version
      if (res.workflow_version_id) {
        const runVersion = workflow?.versions.find(
          (v) => v.id === res.workflow_version_id,
        )?.version;
        if (runVersion && runVersion !== version) {
          setVersion(runVersion);
          toast.warning("Workflow version changed to: v" + runVersion);
        }
      }

      setValues(res?.workflow_inputs);
      setRunID(null);
      setOpen(true);
    });
  }, [runID, isButtonVisible]);

  const inputs = useMemo(() => {
    if (!workflow_version) return null;

    const a = getInputsFromWorkflow(workflow_version);

    if (!a) return null;

    const default_values = getDefaultValuesFromWorkflow(a);

    setValues(default_values);

    return a;
  }, [workflow_version]);

  const fetchToken = useAuthStore((state) => state.fetchToken);

  const runWorkflow = async () => {
    setIsLoading(true);
    const valuesParsed = await parseFilesToImgURLs({ ...values });
    const val = Object.keys(valuesParsed).length > 0 ? valuesParsed : undefined;

    console.log(val);
    if (!workflow_version || !machine) return;

    try {
      const origin = window.location.origin;
      if (overrideRun) await overrideRun({ ...val, batchNumber });
      const auth = await fetchToken();
      await callServerPromise(
        api({
          url: "run",
          init: {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${auth}`,
            },
            body: JSON.stringify({
              workflow_version_id: workflow_version.id,
              machine_id: machine,
              inputs: { ...val },
              origin: "manual",
              batch_number: batchNumber,
            }),
          },
        }),
      );

      setTimeout(async () => {
        await refetch();
      }, 100);

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      toast.error(
        `Failed to run workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    setOpen(false);
  };

  function updateInput(
    key: string,
    val: string | File | undefined | (File | string)[] | boolean | RGBColor[],
  ) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runWorkflow();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger>
            <DialogTrigger
              asChild
              className={cn("appearance-none hover:cursor-pointer", className)}
              ref={ref}
            >
              <Button
                className={cn("gap-2")}
                disabled={
                  isLoading ||
                  !currentMachine ||
                  currentMachine.status === "error"
                }
              >
                Run {isLoading ? <LoadingIcon /> : <Play size={14} />}
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          {!machine && (
            <TooltipContent>
              <p>Select a machine to run the workflow</p>
            </TooltipContent>
          )}
          {currentMachine?.status === "error" && (
            <TooltipContent>
              <p>
                There is some issue with your machine. Please rebuild your
                machine.
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            Confirm run
            <VersionSelectV2
              workflow_id={workflow_id}
              className="max-w-[100px] rounded-md border border-gray-200 bg-muted/50"
            />
          </DialogTitle>
          <DialogDescription>
            {inputs
              ? "Run your workflow with custom inputs"
              : "Confirm to run your workflow"}
          </DialogDescription>
        </DialogHeader>

        {/* {v2RunApi && (
          <div className="absolute bottom-4 left-7 flex justify-between items-center space-x-2 mb-4">
            <Switch
              id="batch-mode"
              checked={isBatchInput}
              onCheckedChange={setIsBatchInput}
            />
            <Label htmlFor="batch-mode">Grid Mode</Label>
          </div>
        )} */}

        {/* {isBatchInput && machine ? (
          <div>
            <BatchRequestForm
              init_inputs={inputs ?? []}
              default_values={values}
              machine_id={machine}
              workflow_version_id={workflow_version?.id}
            />
          </div>
        ) : ( */}
        <SDForm
          onSubmit={onSubmit}
          actionArea={
            <div className="flex items-center justify-end gap-2 pr-3">
              {/* <Input
                type="number"
                min="1"
                value={batchNumber}
                onChange={(e) =>
                  setBatchNumber(Number.parseInt(e.target.value))
                }
                className="w-20"
                placeholder="Batch"
              /> */}
              <AutoFormSubmit disabled={isLoading} className="gap-2">
                Run
                {isLoading ? <LoadingIcon /> : <Play size={14} />}
              </AutoFormSubmit>
            </div>
          }
        >
          {inputs?.map((item) => {
            if (!item?.input_id) {
              return;
            }
            return (
              <SDInputsRender
                key={item.input_id}
                inputNode={item}
                updateInput={updateInput}
                inputValue={values[item.input_id]}
              />
            );
          })}
        </SDForm>
        {/* )} */}
      </DialogContent>
    </Dialog>
  );
}

export function CreateDeploymentButtonV2({
  workflow_id,
}: {
  workflow_id: string;
}) {
  const { refetch: mutate } = useWorkflowDeployments(workflow_id);

  const { workflow } = useCurrentWorkflow(workflow_id);

  const machine = workflow?.selected_machine_id;

  const [version, setVersion] = useState(workflow?.versions?.[0]);

  useEffect(() => {
    if (!workflow) return;
    setVersion(workflow?.versions?.[0]);
  }, [workflow?.versions?.[0]?.version]);

  const [values, setValues] = useState<Record<string, any>>({});

  const [environment, setEnvironment] = useState<"production" | "staging">(
    "production",
  );

  const { dialog, open, setOpen } = useConfirmServerActionDialog({
    action: async () => {
      if (!machine) return;

      // console.log({
      //   workflow_id: workflow?.id,
      //   version_number: version,
      //   version_id: version?.id,
      //   machine_id: machine,
      //   environment: environment,
      // });

      // await callServerPromise(
      //   createDeployments({
      //     workflow_id: workflow?.id!,
      //     version_number: version?.version,
      //     version_id: version?.id,
      //     machine_id: machine,
      //     environment: environment,
      //   }),
      // );
      await callServerPromise(
        api({
          url: "deployment",
          init: {
            method: "POST",
            body: JSON.stringify({
              workflow_id: workflow?.id!,
              workflow_version_id: version?.id,
              machine_id: machine,
              environment: environment,
            }),
          },
        }),
      );
      mutate();
    },
    ui: (
      <div className="flex items-center justify-between">
        <VersionSelectV2
          workflow_id={workflow_id}
          selectedVersion={version}
          onSelect={setVersion}
          className="w-fit"
        />
        <ArrowRight className="opacity-50" size={14} />
        <Select
          value={environment}
          onValueChange={(value) => {
            setEnvironment(value as "production" | "staging");
          }}
        >
          <SelectTrigger className="w-[200px] capitalize">
            <SelectValue placeholder="Select a deployment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              key="production"
              value="production"
              className="flex items-center justify-between capitalize"
            >
              {/* <span>{deployment.environment}</span> */}
              <Badge
                variant="outline"
                className={cn(getEnvColor("production"))}
              >
                Production
              </Badge>
            </SelectItem>
            <SelectItem
              key="staging"
              value="staging"
              className="flex items-center justify-between capitalize"
            >
              <Badge variant="outline" className={cn(getEnvColor("staging"))}>
                Staging
              </Badge>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    title: "Deploy workflow",
    description: "Deploy your workflow to a machine",
  });

  return (
    <>
      <Button
        iconPlacement="right"
        disabled={!machine}
        Icon={Plus}
        onClick={() => setOpen(true)}
        variant="default"
      >
        Deploy
      </Button>
      {dialog}
    </>
  );
}

export async function getWorkflowJSON(
  workflow_name: string,
  workflow_id: string,
  version: number,
  auth: string | null,
) {
  if (!auth) {
    toast.error("No auth token");
    throw new Error("No auth token");
  }

  const id = toast.loading("Version loading...");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_CD_API_URL}/api/workflow/${workflow_id}/version/${version}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth}`,
      },
    },
  );
  const data = await response.json();

  toast.dismiss(id);

  if (!data) {
    toast.error("Unable to load version");
    throw new Error("Unable to load version");
  }

  data?.workflow?.nodes.forEach((x: any) => {
    if (x?.type === "ComfyDeploy") {
      console.log(x);

      x.widgets_values[0] = workflow_name;
      x.widgets_values[1] = workflow_id;
      x.widgets_values[2] = data.version;
    }
  });

  return data;
}

export function CopyWorkflowVersion({
  workflow_id,
  version,
  className,
}: // workflow,
{
  workflow_id: string;
  // workflow: Awaited<ReturnType<typeof findFirstTableWithVersion>>;
  version: number;
  className?: string;
}) {
  const { workflow } = useCurrentWorkflow(workflow_id);
  const fetchToken = useAuthStore((state) => state.fetchToken);
  // const [version, setVersion] = useWorkflowVersion(workflow);
  const posthog = usePostHog();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={cn("h-9 gap-2", className)} variant="outline">
          <Copy size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!workflow) return;

            const data = await getWorkflowJSON(
              workflow.name,
              workflow.id,
              version,
              await fetchToken(),
            );

            posthog.capture("workflow_page:copy_workflow_button_click", {
              workflow_id: workflow.id,
              workflow_version_id: data.id,
              workflow_version: version,
              workflow_copy_type: "classic", // idk about this name
            });

            navigator.clipboard.writeText(JSON.stringify(data?.workflow));
            toast("Copied to clipboard");
          }}
        >
          Copy (JSON)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!workflow) return;
            const id = toast.loading("Version loading...");
            const data = await getWorkflowJSON(
              workflow.name,
              workflow.id,
              version,
              await fetchToken(),
            );
            toast.dismiss(id);

            if (!data) {
              toast.error("Unable to load version");
              return;
            }

            posthog.capture("workflow_page:copy_workflow_button_click", {
              workflow_id: workflow.id,
              workflow_version_id: data.id,
              workflow_version: version,
              workflow_copy_type: "api",
            });

            navigator.clipboard.writeText(JSON.stringify(data?.workflow_api));
            toast("Copied to clipboard");
          }}
        >
          Copy API (JSON)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getWorkflowVersionFromVersionIndex(
  workflow: any,
  version: number,
) {
  const workflow_version = workflow?.versions.find(
    (x) => x.version === version,
  );

  return workflow_version;
}
