import { GPUSelectBox } from "@/components/machine/machine-settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLogStore } from "@/components/workspace/LogContext";
import { MachineSelect } from "@/components/workspace/MachineSelect";
import { SessionTimer } from "@/components/workspace/SessionTimer";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine, useMachineVersion } from "@/hooks/use-machine";
import { useSessionAPI } from "@/hooks/use-session-api";
import { api } from "@/lib/api";
import { useParams, useRouter } from "@tanstack/react-router";
import {
  AlertCircleIcon,
  ArrowRightToLine,
  Droplets,
  Loader2,
  Rocket,
  RotateCw,
  Save,
  Sparkles,
  StopCircle,
  Share,
  ImageIcon,
} from "lucide-react";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserIcon } from "../run/SharePageComponent";
import { useAuthStore } from "@/lib/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/providers";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FileURLRender } from "../workflows/OutputRender";

interface SessionForm {
  machineId: string;
  gpu: "A10G" | "CPU" | "T4" | "L4" | "L40S" | "A100" | "A100-80GB" | "H100";
  timeout: number;
}

interface SessionCreatorFormProps {
  workflowId: string;
  version: number;
  defaultMachineId?: string;
  defaultMachineVersionId?: string;
  isFluidVersion?: boolean;
  onSuccess?: () => void;
  showCancelButton?: boolean;
  onCancel?: () => void;
  onShareWorkflow?: () => void;
  mode?:
    | "default"
    | "compact"
    | "description-only"
    | "mobile"
    | "mobile-expanded";
}

export function MachineSessionsList({ machineId }: { machineId: string }) {
  const { listSession, deleteSession } = useSessionAPI(machineId);
  const { data: sessions } = listSession;
  const router = useRouter();
  const params = useParams({ from: "/workflows/$workflowId/$view" });
  const [sessionId, setSessionId] = useQueryState("sessionId");

  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No active sessions for this machine
      </div>
    );
  }

  return (
    <div className="space-y-1 py-1">
      {sessions.map((session) => (
        <div
          key={session.session_id}
          className="group flex items-center justify-between rounded-lg border bg-background p-2 transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/40"
        >
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
          <div
            className="flex flex-1 cursor-pointer items-center gap-2 pl-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSessionId(session.session_id);
              router.navigate({
                to: "/workflows/$workflowId/$view",
                params: { workflowId: params.workflowId, view: "workspace" },
                search: {
                  isFirstTime: true,
                  workflowId: params.workflowId,
                },
              });
            }}
          >
            <div className="relative flex h-4 w-4 items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <RotateCw className="absolute h-4 w-4 animate-spin text-green-500 opacity-50" />
            </div>
            <UserIcon user_id={session.user_id} className="h-6 w-6" />
            <span className="text-muted-foreground text-xs">
              {session.session_id.slice(0, 8)}
            </span>
            <Badge variant="outline">{session.gpu}</Badge>
            <ArrowRightToLine className="mr-2 ml-auto h-4 w-4 text-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
            <SessionTimer session={session} size="sm" />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={deleteSession.isPending}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"
                  Icon={StopCircle}
                  iconPlacement="right"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      await deleteSession.mutateAsync({
                        sessionId: session.session_id,
                        waitForShutdown: true,
                      });
                      await listSession.refetch();
                      toast.success("Session stopped successfully");
                    } catch (error) {
                      toast.error("Failed to stop session");
                    }
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Stop Session</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ))}
    </div>
  );
}

export function CompactMachineSessionsList({
  machineId,
}: { machineId: string }) {
  const { listSession, deleteSession } = useSessionAPI(machineId);
  const { data: sessions } = listSession;
  const router = useRouter();
  const params = useParams({ from: "/workflows/$workflowId/$view" });
  const [sessionId, setSessionId] = useQueryState("sessionId");

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-xs py-1">
        No active sessions
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">
        Active Sessions ({sessions.length})
      </div>
      <div className="flex flex-wrap gap-1">
        {sessions.map((session) => (
          <TooltipProvider key={session.session_id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="group relative">
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                  <div
                    className="flex cursor-pointer items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/40"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSessionId(session.session_id);
                      router.navigate({
                        to: "/workflows/$workflowId/$view",
                        params: {
                          workflowId: params.workflowId,
                          view: "workspace",
                        },
                        search: {
                          isFirstTime: true,
                          workflowId: params.workflowId,
                        },
                      });
                    }}
                  >
                    <div className="relative flex h-3 w-3 items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <RotateCw className="absolute h-3 w-3 animate-spin text-green-500 opacity-50" />
                    </div>
                    <UserIcon user_id={session.user_id} className="h-4 w-4" />
                    <span className="text-muted-foreground">
                      {session.session_id.slice(0, 6)}
                    </span>
                    <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                      {session.gpu}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    isLoading={deleteSession.isPending}
                    className="absolute -right-1 -top-1 h-4 w-4 p-0 text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        await deleteSession.mutateAsync({
                          sessionId: session.session_id,
                          waitForShutdown: true,
                        });
                        await listSession.refetch();
                        toast.success("Session stopped successfully");
                      } catch (error) {
                        toast.error("Failed to stop session");
                      }
                    }}
                  >
                    <StopCircle className="h-3 w-3" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div>Session: {session.session_id.slice(0, 8)}</div>
                  <div>GPU: {session.gpu}</div>
                  <div>Click to join • Click X to stop</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}

export function SessionCreatorForm({
  workflowId,
  version,
  defaultMachineId,
  defaultMachineVersionId,
  isFluidVersion: defaultIsFluidVersion,
  onSuccess,
  showCancelButton = false,
  onCancel,
  onShareWorkflow,
  mode = "default",
}: SessionCreatorFormProps) {
  const router = useRouter();
  const { createSession: createDynamicSession } = useSessionAPI();
  const { workflow } = useCurrentWorkflow(workflowId);
  const { data: selectedMachine } = useMachine(workflow?.selected_machine_id);
  const [currentSelectedVersion] = useQueryState("version", {
    defaultValue: version,
    ...parseAsInteger,
  });

  const [_, setSessionId] = useQueryState("sessionId");

  const form = useForm<SessionForm>({
    defaultValues: {
      gpu: selectedMachine?.gpu || "A10G",
      timeout: 15,
    },
  });

  const { data: machineVersionData } = useMachineVersion(
    defaultMachineId || "",
    defaultMachineVersionId || "",
  );

  const isFluidVersion =
    defaultIsFluidVersion ?? !!machineVersionData?.modal_image_id;

  const onSubmit = async (data: SessionForm) => {
    if (!workflow?.selected_machine_id) {
      toast.error("Please select a machine first");
      return;
    }

    try {
      const response = await createDynamicSession.mutateAsync({
        gpu: data.gpu,
        timeout: data.timeout,
        machine_id: workflow.selected_machine_id,
        machine_version_id: defaultMachineVersionId,
      });

      useLogStore.getState().clearLogs();

      router.navigate({
        to: "/workflows/$workflowId/$view",
        params: { workflowId, view: "workspace" },
        search: {
          isFirstTime: true,
          workflowId: workflowId,
          version: currentSelectedVersion,
        },
      });

      setSessionId(response.session_id);
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to create session: ${error}`);
    }
  };

  // Update GPU when machine changes
  useEffect(() => {
    if (selectedMachine?.gpu) {
      form.setValue("gpu", selectedMachine.gpu);
    }
  }, [selectedMachine, form]);

  if (
    selectedMachine?.type !== "comfy-deploy-serverless" &&
    mode !== "description-only"
  ) {
    return (
      <div className="flex w-full items-center justify-center text-muted-foreground text-sm">
        <div>Current machine does not support session. </div>
      </div>
    );
  }

  // Description-only mode for top-left floating area
  if (mode === "description-only") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="line-clamp-1 font-semibold text-lg">
            {workflow?.name || "ComfyUI"}
          </h2>

          {onShareWorkflow && (
            <Button
              variant="outline"
              size="icon"
              onClick={onShareWorkflow}
              className="shrink-0"
            >
              <span className="sr-only">Share Workflow</span>
              <Share className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="w-full">
            <DescriptionForm
              workflowId={workflowId}
              description={workflow?.description}
              workflowJson={workflow?.versions[0].workflow}
              workflowName={workflow?.name}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="mx-auto flex items-center justify-center">
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    {workflow.cover_image ? (
                      <div className="h-32 w-32 overflow-hidden rounded-md">
                        <FileURLRender
                          url={workflow.cover_image}
                          imgClasses="w-full h-full object-cover aspect-square"
                        />
                      </div>
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-md border-2 border-gray-300 border-dashed hover:border-gray-400">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Add Cover Image</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" className="w-40">
              <DropdownMenuItem
                onSelect={() => {
                  router.navigate({
                    to: "/workflows/$workflowId/$view",
                    params: {
                      workflowId,
                      view: "gallery",
                    },
                    search: {
                      action: true,
                    },
                  });
                }}
              >
                From Gallery
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setOnAssetSelect(handleAsset);
                  setAssetsOpen(true);
                }}
              >
                From Assets
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // Compact mode for bottom form
  if (mode === "compact") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Machine</span>
          </div>
          <MachineSelect
            workflow_id={workflowId}
            leaveEmpty
            className="rounded-md border bg-background"
          />

          {/* Compact Active Sessions List */}
          {workflow?.selected_machine_id && (
            <MachineSessionsList machineId={workflow.selected_machine_id} />
          )}
        </div>

        {/* Machine Status Alert */}
        {selectedMachine?.status !== "ready" && (
          <Alert
            variant="destructive"
            className="cursor-pointer bg-red-500/10 py-2 transition-colors hover:bg-red-500/20 dark:bg-red-900/30 dark:hover:bg-red-900/40"
            onClick={() => {
              router.navigate({
                to: "/workflows/$workflowId/$view",
                params: { workflowId, view: "machine" },
              });
            }}
          >
            <div className="flex items-center gap-2">
              <AlertCircleIcon size={14} className="dark:text-red-500" />
              <AlertTitle className="mb-0 text-xs dark:text-red-500">
                Machine not ready - Click for details
              </AlertTitle>
            </div>
          </Alert>
        )}

        {/* Compact Form Controls */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="flex items-end gap-3">
              <FormField
                control={form.control}
                name="gpu"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <GPUSelectBox
                        disabled={selectedMachine?.status !== "ready"}
                        className="w-full"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeout"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger
                          disabled={selectedMachine?.status !== "ready"}
                        >
                          <SelectValue placeholder="Select timeout">
                            {field.value} mins
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="2">2 mins</SelectItem>
                        <SelectItem value="15">15 mins</SelectItem>
                        <SelectItem value="30">30 mins</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="gap-1"
                disabled={
                  createDynamicSession.isPending ||
                  selectedMachine?.status !== "ready"
                }
                isLoading={createDynamicSession.isPending}
                Icon={Rocket}
                iconPlacement="right"
              >
                Start ComfyUI
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  // Mobile mode for bottom mobile form (minimal)
  if (mode === "mobile") {
    return (
      <div className="space-y-3">
        {/* Mobile Status Alert */}
        {selectedMachine?.status !== "ready" && (
          <Alert
            variant="destructive"
            className="cursor-pointer bg-red-500/10 py-2 transition-colors hover:bg-red-500/20 dark:bg-red-900/30 dark:hover:bg-red-900/40"
            onClick={() => {
              router.navigate({
                to: "/workflows/$workflowId/$view",
                params: { workflowId, view: "machine" },
              });
            }}
          >
            <div className="flex items-center gap-2">
              <AlertCircleIcon size={14} className="dark:text-red-500" />
              <AlertTitle className="mb-0 text-xs dark:text-red-500">
                Machine not ready
              </AlertTitle>
            </div>
          </Alert>
        )}

        {/* Mobile Form Controls */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name="gpu"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <GPUSelectBox
                        disabled={selectedMachine?.status !== "ready"}
                        className="w-full text-sm"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeout"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger
                          disabled={selectedMachine?.status !== "ready"}
                          className="text-sm"
                        >
                          <SelectValue placeholder="Select timeout">
                            {field.value}m
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="2">2 mins</SelectItem>
                        <SelectItem value="15">15 mins</SelectItem>
                        <SelectItem value="30">30 mins</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="gap-1 flex-1"
                disabled={
                  createDynamicSession.isPending ||
                  selectedMachine?.status !== "ready"
                }
                isLoading={createDynamicSession.isPending}
                Icon={Rocket}
                iconPlacement="right"
              >
                Start
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  // Mobile expanded mode for mobile drawer (shows machine selection and sessions)
  if (mode === "mobile-expanded") {
    return (
      <div className="space-y-4">
        {/* Machine Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Machine</span>
            <Badge variant="outline" className="text-xs">
              {selectedMachine?.name || "None"}
            </Badge>
          </div>
          <MachineSelect
            workflow_id={workflowId}
            leaveEmpty
            className="rounded-md border bg-background"
          />

          {/* Mobile Active Sessions List */}
          {workflow?.selected_machine_id && (
            <CompactMachineSessionsList
              machineId={workflow.selected_machine_id}
            />
          )}
        </div>

        {/* Description Section */}
        <div className="space-y-2">
          <DescriptionForm
            workflowId={workflowId}
            description={workflow?.description}
            workflowJson={workflow?.versions[0].workflow}
            workflowName={workflow?.name}
          />
        </div>
      </div>
    );
  }

  // Default mode (original layout)
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">ComfyUI</h2>
        {onShareWorkflow && (
          <Button
            variant="outline"
            size="icon"
            onClick={onShareWorkflow}
            className="shrink-0"
          >
            <span className="sr-only">Share Workflow</span>
            <Share className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-muted-foreground text-sm">
          Start and edit your workflow{" "}
          <Badge
            variant="outline"
            className="gap-2 dark:outline dark:outline-gray-600/40"
          >
            {isFluidVersion && (
              <div className="rounded-full bg-blue-100 p-0.5">
                <Droplets
                  strokeWidth={2}
                  className="h-[12px] w-[12px] text-blue-600"
                />
              </div>
            )}
            v{version}
          </Badge>
        </p>
      </div>

      <DescriptionForm
        workflowId={workflowId}
        description={workflow?.description}
        workflowJson={workflow?.versions[0].workflow}
        workflowName={workflow?.name}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormItem>
            <FormLabel>Machine</FormLabel>
            <MachineSelect
              workflow_id={workflowId}
              leaveEmpty
              className="rounded-md border bg-background"
            />
            {workflow?.selected_machine_id && (
              <MachineSessionsList machineId={workflow.selected_machine_id} />
            )}
            <FormDescription>
              {isFluidVersion
                ? "Machine is pre-configured for this fluid version"
                : "Choose the machine to run this workflow version on"}
            </FormDescription>
            <FormMessage />
          </FormItem>
          {selectedMachine?.status !== "ready" && (
            <Alert
              variant="destructive"
              className="cursor-pointer bg-red-500/10 py-3 transition-colors hover:bg-red-500/20 dark:bg-red-900/30 dark:hover:bg-red-900/40"
              onClick={() => {
                router.navigate({
                  to: "/workflows/$workflowId/$view",
                  params: { workflowId, view: "machine" },
                });
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircleIcon size={16} className="dark:text-red-500" />
                <AlertTitle className="mb-0 text-sm dark:text-red-500">
                  Machine not ready
                </AlertTitle>
              </div>
              <AlertDescription className="ml-6 text-xs dark:text-red-500">
                <p>Please check the machine status. Click for details.</p>
              </AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end gap-2">
            <FormField
              control={form.control}
              name="gpu"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <GPUSelectBox
                      disabled={selectedMachine?.status !== "ready"}
                      className="w-full"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeout"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger
                        disabled={selectedMachine?.status !== "ready"}
                      >
                        <SelectValue placeholder="Select timeout">
                          {field.value} mins
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2">2 mins</SelectItem>
                      <SelectItem value="15">15 mins</SelectItem>
                      <SelectItem value="30">30 mins</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showCancelButton && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="gap-1"
              disabled={
                createDynamicSession.isPending ||
                selectedMachine?.status !== "ready"
              }
              isLoading={createDynamicSession.isPending}
              Icon={Rocket}
              iconPlacement="right"
            >
              Start ComfyUI
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

const descriptionSchema = z.object({
  description: z
    .string()
    .refine((value) => !/^\s*$/.test(value), "Description is required"),
});

type DescriptionFormValues = z.infer<typeof descriptionSchema>;

function DescriptionForm({
  description,
  workflowId,
  workflowJson,
  workflowName,
}: {
  description: string;
  workflowId: string;
  workflowJson: any;
  workflowName: string;
}) {
  const [isDirty, setIsDirty] = useState(false);
  const [initialValue, setInitialValue] = useState(description || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const fetchToken = useAuthStore((state) => state.fetchToken);

  useEffect(() => {
    // Set initial value when component mounts or description prop changes
    setInitialValue(description || "");
    descriptionForm.reset({ description: description || "" });
  }, [description]);

  const descriptionForm = useForm<DescriptionFormValues>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: {
      description: description || "",
    },
  });

  const { mutate: saveDescription, isPending } = useMutation({
    mutationFn: async (data: DescriptionFormValues) => {
      return api({
        url: `workflow/${workflowId}`,
        init: {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      });
    },
    onSuccess: () => {
      setIsDirty(false);
      setInitialValue(descriptionForm.getValues().description);
      queryClient.invalidateQueries({
        queryKey: ["workflow", workflowId],
      });
      toast.success("Description saved successfully");
    },
    onError: () => {
      toast.error("Failed to save description");
    },
  });

  // Watch for changes in the description field
  useEffect(() => {
    const subscription = descriptionForm.watch((value) => {
      // Show buttons if there are any changes, even if the new value is empty
      setIsDirty(value.description !== initialValue);
    });

    return () => subscription.unsubscribe();
  }, [descriptionForm, initialValue]);

  const onSubmit = (data: DescriptionFormValues) => {
    saveDescription(data);
  };

  const handleDiscard = () => {
    descriptionForm.reset({ description: initialValue });
  };

  return (
    <Form {...descriptionForm}>
      <form
        onSubmit={descriptionForm.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
      >
        <p className="font-medium text-sm">Description</p>
        <FormField
          control={descriptionForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="group relative">
                  <Textarea
                    {...field}
                    className="-mt-2 min-h-28 border-none text-muted-foreground focus-visible:bg-zinc-100/40 focus-visible:text-black focus-visible:ring-transparent dark:bg-transparent dark:focus-visible:bg-zinc-900/40 dark:focus-visible:text-white dark:focus-visible:ring-transparent"
                    placeholder="Describe your workflow"
                    onChange={(e) => {
                      field.onChange(e);
                      // This ensures the dirty state updates immediately on change
                      setIsDirty(e.target.value !== initialValue);
                    }}
                  />
                  <Button
                    variant="gooeyRight"
                    size="icon"
                    hideLoading
                    disabled={isGenerating}
                    type="button"
                    className="absolute right-4 bottom-2 opacity-0 transition-opacity group-hover:opacity-80"
                    onClick={async () => {
                      const token = await fetchToken();

                      try {
                        setIsGenerating(true);
                        const apiUrl =
                          "https://comfy-deploy--master-comfy-fastapi-app.modal.run/v1/workflow/description";
                        const response = await fetch(apiUrl, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            workflow: workflowJson,
                            workflow_name: workflowName,
                          }),
                        });

                        const data = await response.json();

                        if (data?.message) {
                          // Set value and trigger validation in one step
                          descriptionForm.setValue(
                            "description",
                            data.message,
                            {
                              shouldValidate: true,
                            },
                          );
                          setIsDirty(true);
                        }
                      } catch (error) {
                        toast.error("Failed to generate description");
                        console.error(error);
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        {isDirty && (
          <div className="mt-2 flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              type="button"
            >
              Discard
            </Button>
            <Button
              size="sm"
              type="submit"
              isLoading={isPending}
              disabled={!descriptionForm.formState.isValid}
            >
              Save
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
