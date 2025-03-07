import { MachineWorkspaceItem } from "@/components/machine-workspace-item";
import {
  ComfyUIVersionSelectBox,
  GPUSelectBox,
} from "@/components/machine/machine-settings";
import { UserIcon } from "@/components/run/SharePageComponent";
import { Spotlight } from "@/components/spotlight-guide";
import { SpotlightTooltip } from "@/components/spotlight-guide";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VirtualizedInfiniteList } from "@/components/virtualized-infinite-list";
import { useLogStore } from "@/components/workspace/LogContext";
import { GPU } from "@/constants/run-data-enum";
import { useMachine, useMachines } from "@/hooks/use-machine";
import { useSessionAPI } from "@/hooks/use-session-api";
import { callServerPromise } from "@/lib/call-server-promise";
import { getRelativeTime } from "@/lib/get-relative-time";
import { comfyui_hash } from "@/utils/comfydeploy-hash";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  CornerRightUp,
  ExternalLink,
  Play,
  Plus,
  Settings,
  Share2,
  Trash,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { RecentWorkflows } from "@/components/recent-workflows";

export const Route = createFileRoute("/home")({
  component: RouteComponent,
  validateSearch: z.object({
    gpu: z
      .string()
      .transform((val) => val.toUpperCase())
      .pipe(z.enum(GPU))
      .optional(),
    comfyui_version: z.string().optional(),
    timeout: z.number().int().min(2).max(60).optional(),
    nodes: z
      .string()
      // .refine((val) => validateNodes(val), {
      //   message: "Invalid nodes format",
      // })
      .optional(),
    workflowLink: z.string().optional(),
    docker_image: z.string().optional(),
    python: z.number().optional(),
  }),
});

function RouteComponent() {
  return <SessionsList />;
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

const validateNodes = (nodes: string) => {
  const regex = /^([^\/]+\/[^@]+@[^,]+)(,[^\/]+\/[^@]+@[^,]+)*$/;
  return regex.test(nodes);
};

function SessionsList() {
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ["sessions"],
    refetchInterval: 2000,
  });
  const {
    gpu: gpuSearch = "A10G",
    comfyui_version: comfyuiVersionSearch = comfyui_hash,
    timeout: timeoutSearch = 15,
    nodes: nodesSearch = "",
    workflowLink: workflowLinkSearch = "",
    docker_image: dockerImageSearch = "",
    python: pythonSearch = "",
  } = Route.useSearch();

  // console.log(data);
  const query = useMachines(undefined, 6, 6, true, true);

  // console.log(query.data);

  const { createDynamicSession, createSession, listSession, deleteSession } =
    useSessionAPI();

  const router = useRouter();
  const { isSignedIn } = useAuth();
  const clerk = useClerk();

  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (workflowLinkSearch && !showSettings) {
      setTimeout(() => {
        setShowSettings(true);
      }, 500);
      setTimeout(() => {
        setShowGuide(true);
      }, 1000);
    }
  }, [workflowLinkSearch]);

  const form = useForm({
    defaultValues: {
      gpu: gpuSearch,
      comfyui_version: comfyuiVersionSearch,
      timeout: timeoutSearch,
      workflowLink: workflowLinkSearch,
    },
  });

  const gpu = form.watch("gpu");
  const comfyui_version = form.watch("comfyui_version");
  const timeout = form.watch("timeout");
  const workflowLink = form.watch("workflowLink");

  // Define default values
  const DEFAULT_VALUES = {
    gpu: "A10G",
    comfyui_version: comfyui_hash, // Your default comfyui hash
    timeout: 15,
    workflowLink: "",
    nodes: "",
  };

  // Modify the useEffect to only include changed values
  useEffect(() => {
    router.navigate({
      search: (prev) => {
        const searchParams: Record<string, any> = {};

        // Only include values that differ from defaults
        if (gpu !== DEFAULT_VALUES.gpu) searchParams.gpu = gpu;
        if (comfyui_version !== DEFAULT_VALUES.comfyui_version)
          searchParams.comfyui_version = comfyui_version;
        if (timeout !== DEFAULT_VALUES.timeout) searchParams.timeout = timeout;
        if (workflowLink) searchParams.workflowLink = workflowLink;
        if (nodesSearch) searchParams.nodes = nodesSearch;

        return {
          ...prev,
          ...searchParams,
        };
      },
    });
  }, [gpu, comfyui_version, timeout, workflowLink, nodesSearch]);

  const handleCopy = async () => {
    if (copied) return;
    const url = new URL(window.location.href);

    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-screen-lg flex-col gap-2 pt-2 pb-20">
      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-blue-900">Welcome to v3!</h3>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="https://v2.app.comfydeploy.com"
              target="_blank"
              className="text-xs text-blue-600 hover:underline"
            >
              Visit old version <ExternalLink className="ml-1 inline h-3 w-3" />
            </Link>
            <Link
              to="https://www.comfydeploy.com/blog/v3"
              target="_blank"
              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
            >
              Learn more <ExternalLink className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-blue-100/50">
            <Check className="mr-1 h-3 w-3" /> Stateful Workspace
          </Badge>
          <Badge variant="secondary" className="bg-blue-100/50">
            <Check className="mr-1 h-3 w-3" /> ComfyUI Manager Support
          </Badge>
          <Badge variant="secondary" className="bg-blue-100/50">
            <Check className="mr-1 h-3 w-3" /> Instant API Endpoint
          </Badge>
        </div>
      </div>
      <RecentWorkflows />
      <div className="font-medium text-sm mt-4">Active ComfyUI</div>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-3xl border bg-gray-50">
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
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <div className="bg-background text-muted-foreground text-xs ">
                {session.id.slice(0, 6)}
              </div>
              <UserIcon user_id={session.user_id} className="h-6 w-6" />
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
                <Trash className="h-4 w-4 fill-red-200 stroke-red-500" />
              </Button>
            </Link>
          );
        })}
        {(!data || data?.length === 0) && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="text-sm">No active ComfyUI sessions</div>
          </div>
        )}
      </div>

      <div className="fixed right-0 bottom-0 left-0 z-50 mx-auto max-w-screen-lg rounded-t-3xl border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100 p-4 shadow-xl">
        <Spotlight
          show={showGuide && !!workflowLinkSearch}
          tooltipPosition={{
            offsetX: 20,
            offsetY: -100,
            align: "end",
            side: "top",
          }}
          delay={500}
          maskMargin={30}
          tooltip={
            <SpotlightTooltip
              title="Try this workflow!"
              description="Press the Start button to launch ComfyUI with this workflow template."
              onGotIt={() => setShowGuide(false)}
            />
          }
        >
          <div className="flex flex-row items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div>ComfyUI</div>
              {workflowLinkSearch && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="h-1 w-1 rounded-full bg-blue-500" />
                  <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5">
                    <div className="h-[7px] w-[7px] animate-pulse rounded-full bg-blue-400" />
                    <span className="font-medium text-2xs text-blue-700">
                      Workflow detected
                    </span>
                    <Link
                      to={workflowLinkSearch}
                      target="_blank"
                      className="flex items-center gap-1 text-2xs text-blue-500 hover:text-blue-700 hover:underline"
                    >
                      view source
                      <ExternalLink className="h-[11px] w-[11px]" />
                    </Link>
                  </div>
                </motion.div>
              )}
              {/* Quick settings when collapsed */}
              {!showSettings && (
                <div className="flex flex-row items-center gap-2">
                  <GPUSelectBox
                    className="mt-0 w-[100px]"
                    value={gpu}
                    onChange={(value) => form.setValue("gpu", value)}
                  />
                  <Select
                    value={timeout.toString()}
                    onValueChange={(value) =>
                      form.setValue("timeout", Number(value))
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Duration">
                        {timeout} mins
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 mins</SelectItem>
                      <SelectItem value="15">15 mins</SelectItem>
                      <SelectItem value="30">30 mins</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex flex-row items-center gap-2">
              <Button
                variant="ghost"
                className="rounded-[9px]"
                onClick={() => setShowSettings(!showSettings)}
              >
                Custom
                <Settings className="ml-2 h-3 w-3" />
              </Button>
              <Button
                variant="shine"
                className="rounded-[9px]"
                onClick={async () => {
                  if (!isSignedIn) {
                    clerk.openSignIn({
                      fallbackRedirectUrl: window.location.href,
                    });
                    return;
                  }

                  if (nodesSearch && !validateNodes(nodesSearch)) {
                    toast.error("Invalid nodes format");
                    return;
                  }

                  const response = await callServerPromise(
                    createDynamicSession.mutateAsync({
                      gpu: gpu,
                      comfyui_hash: comfyui_version,
                      timeout: timeout,
                      dependencies: nodesSearch ? nodesSearch.split(",") : [],
                      ...(dockerImageSearch && {
                        base_docker_image: dockerImageSearch,
                      }),
                      ...(pythonSearch && {
                        python_version: pythonSearch.toString(),
                      }),
                    }),
                    {
                      loadingText: "Starting new session...",
                      successMessage: "Session started successfully",
                    },
                  );
                  useLogStore.getState().clearLogs();

                  router.navigate({
                    to: "/sessions/$sessionId",
                    params: {
                      sessionId: response.session_id,
                    },
                    search: {
                      ...(workflowLinkSearch && {
                        workflowLink: workflowLinkSearch,
                      }),
                    },
                  });
                }}
              >
                New Session
                <Plus className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: -24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut",
                  height: { duration: 0.2 },
                  marginBottom: { duration: 0.2 },
                }}
                className="overflow-hidden"
              >
                <div className="mx-2 mt-4 rounded-t-2xl border-gray-200/60 border-x border-t bg-white/50 p-4 shadow-inner">
                  <div className="mb-6 flex flex-row items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm">
                        Quick Launch
                      </h3>
                      <p className="text-2xs text-muted-foreground">
                        Configure your ComfyUI session settings
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleCopy}
                      className="transition-all duration-200"
                    >
                      {copied ? (
                        <>
                          Copied! <Check className="ml-2 h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Share <Share2 className="ml-2 h-3 w-3" />
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700 text-xs">
                        GPU Type
                      </span>
                      <GPUSelectBox
                        className="w-full"
                        value={gpu}
                        onChange={(value) => {
                          form.setValue("gpu", value);
                          router.navigate({
                            search: (prev) => ({
                              ...prev,
                              gpu: value,
                            }),
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700 text-xs">
                        Session Duration
                      </span>
                      <Select
                        value={timeout.toString()}
                        onValueChange={(value) => {
                          form.setValue("timeout", Number(value));
                          router.navigate({
                            search: (prev) => ({
                              ...prev,
                              timeout: Number(value),
                            }),
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select duration">
                            {timeout} mins
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <span className="font-medium text-gray-700 text-xs">
                        ComfyUI Version
                      </span>
                      <ComfyUIVersionSelectBox
                        className="w-full"
                        isAnnoymous={!isSignedIn}
                        value={comfyui_version}
                        onChange={(value) => {
                          form.setValue("comfyui_version", value);
                          router.navigate({
                            search: (prev) => ({
                              ...prev,
                              comfyui_version: value,
                            }),
                          });
                        }}
                      />
                    </div>
                    <div>
                      <div className="space-y-2">
                        <span className="font-medium text-gray-700 text-xs">
                          Workflow Link (JSON)
                        </span>
                        <div className="relative">
                          <Input
                            className="w-full"
                            placeholder="Enter workflow json link..."
                            value={workflowLink}
                            onChange={(e) => {
                              form.setValue("workflowLink", e.target.value);
                              router.navigate({
                                search: (prev) => ({
                                  ...prev,
                                  workflowLink: e.target.value,
                                }),
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="my-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 text-xs">
                        Custom Nodes
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const newNodes = [
                            ...nodesSearch.split(",").filter(Boolean),
                            "/@",
                          ];
                          router.navigate({
                            search: (prev) => ({
                              ...prev,
                              nodes: newNodes.join(","),
                            }),
                          });
                        }}
                      >
                        Add Node <Plus className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                    <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent mt-2 max-h-[200px] space-y-1 overflow-y-auto rounded-sm border border-gray-200 bg-gray-50 p-2">
                      {nodesSearch
                        .split(",")
                        .filter(Boolean)
                        .map((node, index) => {
                          const [author, repoWithVersion] = node.split("/");
                          const [repo, version] =
                            repoWithVersion?.split("@") ?? [];

                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2 rounded-[9px] bg-white px-2 py-1 shadow-sm"
                            >
                              <div className="flex flex-row items-center gap-2">
                                <Input
                                  className="h-8 w-24 rounded-[10px]"
                                  placeholder="owner"
                                  value={author}
                                  onChange={(e) => {
                                    const nodes = nodesSearch
                                      .split(",")
                                      .filter(Boolean);
                                    nodes[index] =
                                      `${e.target.value}/${repo || ""}@${version || ""}`.replace(
                                        /\/+@/,
                                        "/@",
                                      );
                                    router.navigate({
                                      search: (prev) => ({
                                        ...prev,
                                        nodes: nodes.join(","),
                                      }),
                                    });
                                  }}
                                />
                                <span className="text-gray-400">/</span>
                                <Input
                                  className="h-8 w-40 rounded-[10px]"
                                  placeholder="repository"
                                  value={repo}
                                  onChange={(e) => {
                                    const nodes = nodesSearch
                                      .split(",")
                                      .filter(Boolean);
                                    nodes[index] =
                                      `${author || ""}/${e.target.value}@${version || ""}`.replace(
                                        /\/+@/,
                                        "/@",
                                      );
                                    router.navigate({
                                      search: (prev) => ({
                                        ...prev,
                                        nodes: nodes.join(","),
                                      }),
                                    });
                                  }}
                                />
                                <span className="text-gray-400">@</span>
                                <Input
                                  className="h-8 w-24 rounded-[10px] font-mono text-xs"
                                  placeholder="hash"
                                  maxLength={7}
                                  value={version}
                                  onChange={(e) => {
                                    const nodes = nodesSearch
                                      .split(",")
                                      .filter(Boolean);
                                    nodes[index] =
                                      `${author || ""}/${repo || ""}@${e.target.value}`.replace(
                                        /\/+@/,
                                        "/@",
                                      );
                                    router.navigate({
                                      search: (prev) => ({
                                        ...prev,
                                        nodes: nodes.join(","),
                                      }),
                                    });
                                  }}
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500"
                                onClick={() => {
                                  const nodes = nodesSearch
                                    .split(",")
                                    .filter(Boolean);
                                  nodes.splice(index, 1);
                                  router.navigate({
                                    search: (prev) => ({
                                      ...prev,
                                      nodes: nodes.join(","),
                                    }),
                                  });
                                }}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      {nodesSearch.split(",").filter(Boolean).length === 0 && (
                        <div className="flex items-center justify-center py-4 text-gray-500 text-xs">
                          No custom nodes added
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Spotlight>
      </div>
    </div>
  );
}
