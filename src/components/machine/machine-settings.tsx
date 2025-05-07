import AutoForm from "@/components/auto-form";
import {
  customFormSchema,
  type machineGPUOptions,
  serverlessFormSchema,
  useGPUConfig,
} from "@/components/machine/machine-schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  type SubscriptionPlan,
  useCurrentPlan,
  useCurrentPlanWithStatus,
} from "@/hooks/use-current-plan";
import {
  useGithubBranchInfo,
  useGithubReleases,
} from "@/hooks/use-github-branch-info";
import { useUserSettings } from "@/hooks/use-user-settings";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { useCachedQuery } from "@/lib/use-cached-query";
import { cn } from "@/lib/utils";
import { comfyui_hash } from "@/utils/comfydeploy-hash";
import { useAuth } from "@clerk/clerk-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useBlocker, useMatch, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, easeOut, motion, useAnimation } from "framer-motion";
import { isEqual } from "lodash";
import {
  ArchiveX,
  ExternalLinkIcon,
  Info,
  Loader2,
  Lock,
  PencilIcon,
  Play,
  Save,
  TestTubeDiagonal,
  Wrench,
} from "lucide-react";
import { useQueryState } from "nuqs";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { CustomNodeSetup } from "../onboarding/custom-node-setup";
import type { StepValidation } from "../onboarding/workflow-import";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import {
  UnsavedChangesWarning,
  useUnsavedChangesWarning,
} from "../unsaved-changes-warning";
import { ExtraDockerCommands } from "./extra-docker-commands";
import { SecretsSelector } from "./secrets-selector";
import { VersionChecker } from "./version-checker";

export function MachineSettingsWrapper({
  machine,
  onValueChange,
  title,
  disableUnsavedChangesWarningServerless = false,
  readonly = false,
  className,
}: {
  machine: any;
  onValueChange?: (key: string, value: any) => void;
  title?: ReactNode;
  disableUnsavedChangesWarningServerless?: boolean;
  readonly?: boolean;
  className?: string;
}) {
  const isServerless = machine.type === "comfy-deploy-serverless";
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [view, setView] = useQueryState("machine-settings-view", {
    defaultValue: isServerless ? "environment" : "advanced",
  });

  const isNew = machine.id === "new";

  return (
    <div>
      <div
        className={cn(
          "sticky top-[57px] z-10 flex h-[72px] flex-col bg-background/80 backdrop-blur-sm md:h-12 md:flex-row md:items-center md:justify-between",
          className,
        )}
      >
        {title ?? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <div className="font-medium text-xl">Settings</div>
            </div>
          </div>
        )}
        <div className="relative mt-4 pr-4">
          {machine.type === "comfy-deploy-serverless" && (
            <>
              <button
                type="button"
                onClick={() => setView(null)}
                className={cn(
                  "p-4 py-0 text-muted-foreground text-sm",
                  view === "environment" && "text-foreground",
                )}
              >
                Environment
              </button>

              {!isNew && (
                <>
                  <button
                    type="button"
                    onClick={() => setView("autoscaling")}
                    className={cn(
                      "p-4 py-0 text-muted-foreground text-sm",
                      view === "autoscaling" && "text-foreground",
                    )}
                  >
                    Auto Scaling
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("secrets")}
                    className={cn(
                      "p-4 py-0 text-muted-foreground text-sm",
                      view === "secrets" && "text-foreground",
                    )}
                  >
                    Secrets
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("advanced")}
                    className={cn(
                      "p-4 py-0 text-muted-foreground text-sm",
                      view === "advanced" && "text-foreground",
                    )}
                  >
                    Advanced
                  </button>
                </>
              )}
              {/* Animated underline */}
              <motion.div
                className="-bottom-1 absolute h-0.5 bg-primary"
                initial={false}
                animate={{
                  width: "100px",
                  x:
                    view === "advanced"
                      ? "calc(305%)"
                      : view === "autoscaling"
                        ? "calc(100% + 20px)"
                        : view === "secrets"
                          ? "calc(203% + 13px)"
                          : "6px",
                }}
                transition={{
                  ease: "easeInOut",
                  duration: 0.2,
                }}
              />
            </>
          )}
        </div>
      </div>
      <Card className="mb-20 flex flex-col rounded-[16px] px-2 pb-2">
        {isServerless ? (
          <ServerlessSettings
            machine={machine}
            formRef={formRef}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            view={view}
            onValueChange={onValueChange}
            disableUnsavedChangesWarning={
              disableUnsavedChangesWarningServerless
            }
            readonly={readonly}
          />
        ) : (
          <ClassicSettings
            machine={machine}
            formRef={formRef}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            view={view}
          />
        )}
      </Card>
    </div>
  );
}

function ClassicSettings({
  machine,
  formRef,
  isLoading,
  setIsLoading,
  view,
}: {
  machine: any;
  formRef: RefObject<HTMLFormElement | null>;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  view: string;
}) {
  return (
    <>
      {view === "environment" && <div>Not available for classic machines.</div>}
      {view === "autoscaling" && <div>Not available for classic machines.</div>}
      {view === "advanced" && (
        <AutoForm
          formRef={formRef}
          className="md:px-2"
          values={machine}
          formSchema={customFormSchema}
          fieldConfig={{
            auth_token: {
              inputProps: {
                type: "password",
              },
            },
          }}
          onSubmit={async (data) => {
            try {
              setIsLoading(true);
              await api({
                url: `machine/custom/${machine.id}`,
                init: {
                  method: "PATCH",
                  body: JSON.stringify({
                    name: data.name,
                    endpoint: data.endpoint,
                    auth_token: data.auth_token || "",
                    type: data.type,
                  }),
                },
              });
              toast.success("Updated successfully!");
            } catch (error) {
              toast.error("Failed to update!");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <div className="flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        </AutoForm>
      )}
    </>
  );
}

type FormData = z.infer<typeof serverlessFormSchema>;

function ServerlessSettings({
  machine,
  formRef,
  isLoading,
  setIsLoading,
  view,
  onValueChange,
  disableUnsavedChangesWarning = false,
  readonly = false,
}: {
  machine: any;
  formRef: RefObject<HTMLFormElement | null>;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  view: string;
  onValueChange?: (key: string, value: any) => void;
  disableUnsavedChangesWarning?: boolean;
  readonly?: boolean;
}) {
  const matchWorkflow = useMatch({
    from: "/workflows/",
    shouldThrow: false,
  });

  const matchMachine = useMatch({
    from: "/machines/",
    shouldThrow: false,
  });

  const isWorkflow = !!matchWorkflow;
  const isMachine = !!matchMachine;
  const [isFormDirty, setIsFormDirty] = useState(false);
  const isNew = machine.id === "new";
  const { controls } = useUnsavedChangesWarning({
    isDirty: isFormDirty,
    isNew,
    disabled: disableUnsavedChangesWarning,
  });

  const navigate = useNavigate();

  const sub = useCurrentPlan();
  const isBusiness = sub?.plans?.plans?.some((plan) =>
    plan.includes("business"),
  );

  const form = useForm<FormData>({
    resolver: zodResolver(serverlessFormSchema),
    mode: "onChange",
    defaultValues: {
      // env
      comfyui_version: machine.comfyui_version,
      docker_command_steps: machine.docker_command_steps || {
        steps: [],
      },

      // auto scaling
      gpu: machine.gpu,
      concurrency_limit: machine.concurrency_limit,
      run_timeout: machine.run_timeout,
      idle_timeout: machine.idle_timeout,
      keep_warm: machine.keep_warm,

      // advance
      install_custom_node_with_gpu: machine.install_custom_node_with_gpu,
      ws_timeout: machine.ws_timeout,
      extra_docker_commands: machine.extra_docker_commands,
      allow_concurrent_inputs: machine.allow_concurrent_inputs,
      machine_builder_version: machine.machine_builder_version,
      base_docker_image: machine.base_docker_image,
      python_version: machine.python_version,
      extra_args: machine.extra_args,
      disable_metadata: machine.disable_metadata,
      prestart_command: machine.prestart_command,

      optimized_runner: machine.optimized_runner,

      cpu_request: machine.cpu_request,
      cpu_limit: machine.cpu_limit,
      memory_request: machine.memory_request,
      memory_limit: machine.memory_limit,
    },
  });

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      const formValues = form.getValues();
      if (name) onValueChange?.(name, formValues[name as keyof FormData]);
      if (isNew) return;

      const isDirty = Object.keys(formValues).some((key) => {
        const newValue = formValues[key as keyof FormData];
        const oldValue = machine[key];
        return newValue !== oldValue;
      });
      setIsFormDirty(isDirty);
    });

    return () => subscription.unsubscribe();
  }, [form, machine, onValueChange, disableUnsavedChangesWarning]);

  useEffect(() => {
    const errors = form.formState.errors;
    for (const [field, error] of Object.entries(errors)) {
      if (error?.message) {
        toast.error(`${field}: ${error.message}`);
      }
    }
  }, [form.formState.errors]);

  const handleSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      const { name, ...formData } = data;

      // Create object with only changed values
      const changedData = Object.keys(formData).reduce(
        (acc, key) => {
          const formValue = formData[key as keyof typeof formData];
          const originalValue = machine[key];

          // Only include if value has changed
          if (formValue !== originalValue) {
            acc[key] = formValue;
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      // Only make API call if there are changes
      if (Object.keys(changedData).length > 0) {
        const response = await callServerPromise(
          api({
            url: `machine/serverless/${machine.id}`,
            init: {
              method: "PATCH",
              body: JSON.stringify(changedData),
            },
          }),
        );
        if (!("error" in response)) setIsFormDirty(false);
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate({
          to: "/machines/$machineId/$machineVersionId",
          params: {
            machineId: machine.id,
            machineVersionId: response.machine_version_id,
          },
        });
      }
    } catch (error: any) {
      console.error("API Error:", error);
      if (error.response) {
        const errorData = await error.response.json();
        console.error("Validation errors:", errorData);
        toast.error(`Update failed: ${JSON.stringify(errorData, null, 2)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} ref={formRef}>
          {view === "environment" && (
            <div className="space-y-4 p-2 pt-4">
              <div
                className={cn(
                  "flex flex-col gap-4 md:flex-row",
                  readonly && "pointer-events-none opacity-50",
                )}
              >
                <FormField
                  control={form.control}
                  name="comfyui_version"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>ComfyUI Version</FormLabel>
                      <FormControl>
                        <ComfyUIVersionSelectBox
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Select the ComfyUI version to use
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gpu"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>GPU</FormLabel>
                      <FormControl>
                        <GPUSelectBox
                          value={field.value}
                          onChange={field.onChange}
                          disabled={false}
                        />
                      </FormControl>
                      <FormDescription>
                        Select the GPU type for your machine
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {machine.type === "comfy-deploy-serverless" &&
                !isWorkflow &&
                !isMachine &&
                !readonly && (
                  <div className="mb-4 fixed bottom-8 inset-x-0 z-30">
                    <VersionChecker
                      machineId={machine.id}
                      variant="inline"
                      className="shadow-lg"
                      onUpdate={(e) => {
                        e.preventDefault();
                        // Navigate to update dialog
                        navigate({
                          to: "/machines/$machineId",
                          params: { machineId: machine.id },
                          search: { action: "update-custom-nodes" },
                        });
                      }}
                    />
                  </div>
                )}
              <FormField
                control={form.control}
                name="docker_command_steps"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CustomNodeSetupWrapper
                        value={field.value}
                        onChange={field.onChange}
                        readonly={readonly}
                      />
                    </FormControl>
                    <FormDescription>
                      Configure custom nodes for your machine
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Build Time Settings */}
              <div className="mt-8 space-y-4">
                <div className="space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem
                      value="advanced-build"
                      className="border-none"
                    >
                      <AccordionTrigger className="hover:bg-accent hover:no-underline rounded-md px-4">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <span>Advanced Build Options</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div
                          className={cn(
                            "space-y-4 rounded-lg border p-4 pt-4",
                            readonly && "pointer-events-none opacity-50",
                          )}
                        >
                          <FormField
                            control={form.control}
                            name="python_version"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center gap-2">
                                  <FormLabel>Python Version</FormLabel>
                                  <FormDescription>
                                    Select the Python version for your machine
                                  </FormDescription>
                                </div>
                                <Select
                                  value={field.value ?? "3.11"}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Python Version" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="3.9">3.9</SelectItem>
                                    <SelectItem value="3.10">3.10</SelectItem>
                                    <SelectItem value="3.11">
                                      3.11 (Recommended)
                                    </SelectItem>
                                    <SelectItem value="3.12">3.12</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="base_docker_image"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Base Docker Image</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="nvidia/cuda:12.8.0-devel-ubuntu22.04"
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Specify a custom base Docker image for your
                                  machine
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="install_custom_node_with_gpu"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center gap-4 space-y-0">
                                <FormControl>
                                  <Switch
                                    id="install_custom_node_with_gpu"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div>
                                  <FormLabel>
                                    Install custom nodes with GPU
                                  </FormLabel>
                                  <FormDescription>
                                    Enable GPU support for custom node
                                    installation
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </div>
          )}

          {view === "autoscaling" && (
            <div
              className={cn(
                "space-y-1 p-2 pt-4",
                readonly && "pointer-events-none opacity-50",
              )}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="concurrency_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Parallel GPU</FormLabel>
                      <FormControl>
                        <MaxParallelGPUSlider
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of parallel GPU instances
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="keep_warm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keep Always On</FormLabel>
                      <FormControl>
                        <MaxAlwaysOnSlider
                          value={field.value || 0}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of instances to keep warm
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="run_timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workflow Timeout</FormLabel>
                      <FormControl>
                        <WorkflowTimeOut
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum time for workflow execution
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="idle_timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warm Time</FormLabel>
                      <FormControl>
                        <WarmTime
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Time to keep instance warm after completion
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {view === "advanced" && (
            <div className="space-y-8 p-2 pt-4">
              <Accordion type="single" collapsible className="w-full">
                {/* Runtime Settings */}
                <AccordionItem value="runtime" className="border-none">
                  <AccordionTrigger className="flex items-center gap-2 rounded-md px-4 hover:bg-accent hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Play className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-medium text-md">Runtime Settings</h3>
                      <FormDescription>
                        Settings that affect how the machine runs
                      </FormDescription>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div
                      className={cn(
                        "space-y-4 rounded-lg border p-4",
                        readonly && "pointer-events-none opacity-50",
                      )}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="extra_args"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <FormLabel>Extra ComfyUI arguments</FormLabel>
                                <FormDescription>
                                  <div className="flex flex-row items-center gap-1">
                                    ComfyUI extra arguments.
                                    <a
                                      href="https://github.com/comfyanonymous/ComfyUI/blob/master/comfy/cli_args.py"
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex flex-row items-center gap-1 text-blue-500"
                                    >
                                      Examples
                                      <ExternalLinkIcon className="h-3 w-3" />
                                    </a>
                                  </div>
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Input
                                  placeholder="--use-flash-attention --fp32-vae"
                                  value={field.value ?? ""}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="prestart_command"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <FormLabel>Prestart Command</FormLabel>
                                <FormDescription>
                                  Command to run before the machine starts
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Input
                                  placeholder="ollama serve && ollama run llava"
                                  value={field.value ?? ""}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="disable_metadata"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Disable Metadata</FormLabel>
                              <FormDescription>
                                Disable metadata in generated output
                              </FormDescription>
                              <FormControl>
                                <Switch
                                  id="disable_metadata"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* CPU & Memory Section (moved to top-level) */}
                <AccordionItem value="cpu-mem" className="border-none">
                  <AccordionTrigger className="flex items-center gap-2 rounded-md px-4 hover:bg-accent hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-5 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-md">CPU & Memory</h3>
                      <Badge variant="outline" className="ml-2">
                        Business
                      </Badge>
                      <FormDescription>
                        Configure CPU and memory resources (Business plan
                        required)
                      </FormDescription>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 p-4">
                      {/* CPU Request */}
                      <FormField
                        control={form.control}
                        name="cpu_request"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel>CPU Request</FormLabel>
                              <Badge variant="outline">Business</Badge>
                            </div>
                            <FormDescription>
                              Minimum number of CPUs to allocate
                              {!isBusiness && (
                                <span className="text-destructive ml-2">
                                  Business plan required
                                </span>
                              )}
                            </FormDescription>
                            <FormControl>
                              <Select
                                value={field.value ? String(field.value) : ""}
                                onValueChange={(val) =>
                                  field.onChange(Number(val))
                                }
                                disabled={!isBusiness}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select CPU" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0.5">0.5 CPU</SelectItem>
                                  <SelectItem value="1">1 CPU</SelectItem>
                                  <SelectItem value="2">2 CPU</SelectItem>
                                  <SelectItem value="4">4 CPU</SelectItem>
                                  <SelectItem value="8">8 CPU</SelectItem>
                                  <SelectItem value="16">16 CPU</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* CPU Limit */}
                      <FormField
                        control={form.control}
                        name="cpu_limit"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel>CPU Limit</FormLabel>
                              <Badge variant="outline">Business</Badge>
                            </div>
                            <FormDescription>
                              Maximum number of CPUs to allocate
                              {!isBusiness && (
                                <span className="text-destructive ml-2">
                                  Business plan required
                                </span>
                              )}
                            </FormDescription>
                            <FormControl>
                              <Select
                                value={field.value ? String(field.value) : ""}
                                onValueChange={(val) =>
                                  field.onChange(Number(val))
                                }
                                disabled={!isBusiness}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select CPU" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0.5">0.5 CPU</SelectItem>
                                  <SelectItem value="1">1 CPU</SelectItem>
                                  <SelectItem value="2">2 CPU</SelectItem>
                                  <SelectItem value="4">4 CPU</SelectItem>
                                  <SelectItem value="8">8 CPU</SelectItem>
                                  <SelectItem value="16">16 CPU</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Memory Request */}
                      <FormField
                        control={form.control}
                        name="memory_request"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel>Memory Request</FormLabel>
                              <Badge variant="outline">Business</Badge>
                            </div>
                            <FormDescription>
                              Minimum memory to allocate (MB)
                              {!isBusiness && (
                                <span className="text-destructive ml-2">
                                  Business plan required
                                </span>
                              )}
                            </FormDescription>
                            <FormControl>
                              <Select
                                value={field.value ? String(field.value) : ""}
                                onValueChange={(val) =>
                                  field.onChange(Number(val))
                                }
                                disabled={!isBusiness}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select Memory" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1024">1024 MB</SelectItem>
                                  <SelectItem value="2048">2048 MB</SelectItem>
                                  <SelectItem value="4096">4096 MB</SelectItem>
                                  <SelectItem value="8192">8192 MB</SelectItem>
                                  <SelectItem value="16384">
                                    16384 MB
                                  </SelectItem>
                                  <SelectItem value="32768">
                                    32768 MB
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Memory Limit */}
                      <FormField
                        control={form.control}
                        name="memory_limit"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel>Memory Limit</FormLabel>
                              <Badge variant="outline">Business</Badge>
                            </div>
                            <FormDescription>
                              Maximum memory to allocate (MB)
                              {!isBusiness && (
                                <span className="text-destructive ml-2">
                                  Business plan required
                                </span>
                              )}
                            </FormDescription>
                            <FormControl>
                              <Select
                                value={field.value ? String(field.value) : ""}
                                onValueChange={(val) =>
                                  field.onChange(Number(val))
                                }
                                disabled={!isBusiness}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select Memory" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1024">1024 MB</SelectItem>
                                  <SelectItem value="2048">2048 MB</SelectItem>
                                  <SelectItem value="4096">4096 MB</SelectItem>
                                  <SelectItem value="8192">8192 MB</SelectItem>
                                  <SelectItem value="16384">
                                    16384 MB
                                  </SelectItem>
                                  <SelectItem value="32768">
                                    32768 MB
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Performance Optimizations */}
                <AccordionItem value="experimental" className="border-none">
                  <AccordionTrigger className="flex items-center gap-2 hover:bg-accent hover:no-underline rounded-md px-4">
                    <div className="flex items-center gap-2">
                      <TestTubeDiagonal className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-medium text-md">
                        Performance Optimizations
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div
                      className={cn(
                        "space-y-4 rounded-lg border p-4",
                        readonly && "pointer-events-none opacity-50",
                      )}
                    >
                      <FormField
                        control={form.control}
                        name="optimized_runner"
                        render={({ field }) => {
                          const [showDialog, setShowDialog] = useState(false);

                          return (
                            <FormItem className="flex flex-row items-center gap-4 space-y-0">
                              <FormControl>
                                <Switch
                                  id="optimized_runner"
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setShowDialog(true);
                                    } else {
                                      field.onChange(false);
                                    }
                                  }}
                                />
                              </FormControl>
                              <div>
                                <FormLabel>Optimized Cold Start</FormLabel>
                                <FormDescription>
                                  Enables optimizations to reduce container
                                  startup time. This may increase memory usage.
                                </FormDescription>
                              </div>
                              <OptimizedRunnerDialog
                                open={showDialog}
                                onOpenChange={setShowDialog}
                                onConfirm={() => field.onChange(true)}
                              />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Legacy Settings */}
                <AccordionItem value="deprecated" className="border-none">
                  <AccordionTrigger className="flex items-center gap-2 hover:bg-accent hover:no-underline rounded-md px-4">
                    <div className="flex items-center gap-2">
                      <ArchiveX className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-medium text-md">Legacy Settings</h3>
                      <Badge variant="destructive" className="ml-2">
                        Deprecated
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div
                      className={cn(
                        "space-y-4 rounded-lg border p-4",
                        readonly && "pointer-events-none opacity-50",
                      )}
                    >
                      <FormField
                        control={form.control}
                        name="extra_docker_commands"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Extra Docker Commands</FormLabel>
                            <FormControl>
                              <ExtraDockerCommands
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Additional Docker commands to run during setup
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allow_concurrent_inputs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Queue per GPU</FormLabel>
                            <FormControl>
                              <RangeSlider
                                value={field.value || 1}
                                onChange={field.onChange}
                                min={1}
                                max={10}
                              />
                            </FormControl>
                            <FormDescription>
                              The queue size is the number of inputs that can be
                              queued to 1 container before spinning up a new
                              container.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </form>
      </Form>

      {view === "secrets" && (
        <div className="pt-4">
          <SecretsSelector machine={machine} />
        </div>
      )}

      <UnsavedChangesWarning
        isDirty={isFormDirty}
        isLoading={isLoading}
        onReset={() => {
          form.reset();
          setIsFormDirty(false);
        }}
        onSave={() => formRef.current?.requestSubmit()}
        controls={controls}
        disabled={disableUnsavedChangesWarning}
      />
    </>
  );
}

// -----------------------components-----------------------
export function ComfyUIVersionSelectBox({
  value,
  onChange,
  className,
  isAnnoymous = false,
}: {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  isAnnoymous?: boolean;
}) {
  const { data: versions, isLoading } = useCachedQuery({
    queryKey: ["comfyui-versions"],
    enabled: !isAnnoymous,
    cacheTime: 1000 * 60 * 30,
  });

  const [customValue, setCustomValue] = useState(value || "");
  const [showCustomDialog, setShowCustomDialog] = useState(false);

  const options = [
    ...(versions?.releases || []),
    // versions?.latest || { label: "Latest", value: "latest", sha: "" },
    // { label: "Custom Version", value: "custom", sha: "" },
  ];

  // Find if the current value matches any known version
  const matchingVersion = options.find(
    (opt) =>
      opt.sha === value ||
      opt.value === value ||
      (opt.value === "latest" && value === "latest"),
  );

  // Determine the selected value based on matches
  const selectedValue = isLoading
    ? "loading"
    : matchingVersion
      ? matchingVersion.value
      : value
        ? "custom"
        : "latest"; // Default to latest if no value

  // Set default value when options are loaded and no value is selected
  useEffect(() => {
    // console.log("isLoading", isLoading);
    // console.log("options", options);
    // console.log("value", value);
    if (!isLoading && options.length > 0 && !value) {
      const latestOption = options[0];
      if (latestOption) {
        onChange(latestOption.sha || latestOption.value);
      }
    }
  }, [isLoading, options, value, onChange]);

  return (
    <div className={cn("flex flex-row gap-1", className)}>
      <Select
        value={selectedValue}
        onValueChange={(newValue) => {
          if (
            newValue === "custom" ||
            (newValue === selectedValue && newValue === "custom")
          ) {
            setShowCustomDialog(true);
          } else {
            const selectedOption = options.find(
              (opt) => opt.value === newValue,
            );
            if (selectedOption) {
              // Special handling for "latest" version
              const newValue =
                selectedOption.value === "latest"
                  ? "latest"
                  : selectedOption.sha || selectedOption.value;
              onChange(newValue);
              setCustomValue(newValue);
            }
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select version">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-[120px]" />
              </div>
            ) : selectedValue === "custom" ? (
              <div className="flex items-center gap-2">
                {/* <span>Custom: </span> */}
                <span className="font-mono text-xs">{value?.slice(0, 7)}</span>
              </div>
            ) : (
              options.find((opt) => opt.value === selectedValue)?.label
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <>
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <SelectItem
                    key={`loading-${index}`}
                    value={`loading-${index}`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="ml-2 h-3 w-16" />
                    </div>
                  </SelectItem>
                ))}
            </>
          ) : (
            options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={isAnnoymous && option.label === "Latest"}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                  </div>
                  {option.sha && (
                    <span className="ml-2 font-mono text-muted-foreground text-xs">
                      {`(${option.sha.slice(0, 7)})`}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
          <SelectItem value="custom" onClick={() => setShowCustomDialog(true)}>
            Custom
          </SelectItem>
        </SelectContent>
      </Select>

      {selectedValue === "custom" && (
        <Button
          type="button"
          variant="outline"
          className="mt-0"
          onClick={() => setShowCustomDialog(true)}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
      )}
      <Dialog
        open={showCustomDialog}
        onOpenChange={(open) => {
          setShowCustomDialog(open);
          if (!open && value) {
            setCustomValue(value);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Custom ComfyUI Version</DialogTitle>
            <DialogDescription>
              Please enter the ComfyUI commit hash or version number
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              className="font-mono"
              placeholder="Enter ComfyUI hash..."
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomDialog(false);
                if (value) {
                  setCustomValue(value);
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onChange(customValue);
                setShowCustomDialog(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomNodeSetupWrapper({
  value,
  onChange,
  readonly = false,
}: {
  value: any;
  onChange: (value: any) => void;
  readonly?: boolean;
}) {
  const [validation, setValidation] = useState<StepValidation>(() => ({
    docker_command_steps: value || { steps: [] },
    machineName: "",
    gpuType: "A10G",
    comfyUiHash: "",
    selectedComfyOption: "recommended",
    firstTimeSelectGPU: false,
  }));

  // Handle incoming value changes (including form reset)
  useEffect(() => {
    setValidation((prev) => ({
      ...prev,
      docker_command_steps: value || { steps: [] },
    }));
  }, [value]);

  // Handle outgoing changes
  const handleValidationChange = (
    newValidation: StepValidation | ((prev: StepValidation) => StepValidation),
  ) => {
    const nextValidation =
      typeof newValidation === "function"
        ? newValidation(validation)
        : newValidation;

    setValidation(nextValidation);
    if (!isEqual(nextValidation.docker_command_steps, value)) {
      onChange(nextValidation.docker_command_steps);
    }
  };

  return (
    <CustomNodeSetup
      validation={validation}
      setValidation={handleValidationChange}
      readonly={readonly}
    />
  );
}

export function GPUSelectBox({
  value,
  onChange,
  className,
  disabled,
}: {
  value?: (typeof machineGPUOptions)[number];
  onChange: (value: (typeof machineGPUOptions)[number]) => void;
  className?: string;
  disabled?: boolean;
}) {
  const { gpuConfig } = useGPUConfig();
  const sub = useCurrentPlan() as SubscriptionPlan;
  const isBusiness = sub?.plans?.plans?.some(
    (plan) =>
      plan.includes("business") ||
      plan.includes("creator") ||
      plan.includes("deployment"),
  );

  return (
    <div className={cn("", className)}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select GPU">
            {value && (
              <div className="truncate">
                {gpuConfig.find((gpu) => gpu.id === value)?.gpuName}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {gpuConfig.map((gpu) => {
            const isDisabled = !isBusiness && gpu.tier === "business";
            return (
              <SelectItem
                key={gpu.id}
                value={gpu.id}
                disabled={isDisabled}
                className="w-full pr-8"
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="truncate">
                    <span>{gpu.gpuName}</span>
                    {isDisabled && (
                      <Badge
                        variant="outline"
                        className="ml-2 font-normal text-xs"
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        Business
                      </Badge>
                    )}
                  </div>
                  <div className="ml-auto flex items-center gap-2 shrink-0">
                    <span className="text-muted-foreground text-sm">
                      {gpu.ram}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      ${gpu.pricePerSec?.toFixed(6)}/s
                    </span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  description?: string;
  inputWidth?: string;
}

function RangeSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  description,
}: RangeSliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row items-center gap-4">
        <span className="text-muted-foreground text-xs">{min}</span>
        <Slider
          showTooltip={true}
          min={min}
          max={max}
          step={step}
          value={[value || min]}
          onValueChange={(value) => onChange(value[0])}
          className="w-full"
        />
        <span className="text-muted-foreground text-xs">{max}</span>
        <Input
          className="w-20"
          type="number"
          min={min}
          max={max}
          value={value || min}
          onChange={(e) => {
            const newValue = Math.round(
              Math.min(Math.max(Number(e.target.value), min), max),
            );
            onChange(newValue);
          }}
          onKeyDown={(e) => {
            if (e.key === "." || e.key === ",") {
              e.preventDefault();
            }
          }}
        />
      </div>
      {/* <div className="flex w-[calc(100%-90px)] justify-between px-1 text-muted-foreground text-sm leading-tight">
        <span>{min}</span>
        <span>Current: {value || min}</span>
        <span>{max}</span>
      </div> */}
      {description && (
        <span className="text-muted-foreground text-sm">{description}</span>
      )}
    </div>
  );
}

export function MaxParallelGPUSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { data: sub, isLoading: isSubLoading } = useCurrentPlanWithStatus();
  const { data: userSettings, isLoading: isUserSettingsLoading } =
    useUserSettings();
  const plan = sub?.plans?.plans.filter(
    (plan: string) => !plan.includes("ws"),
  )?.[0];

  const planHierarchy: Record<string, { max: number }> = {
    basic: { max: 1 },
    pro: { max: 3 },
    business: { max: 10 },
    enterprise: { max: 10 },
    creator: { max: 10 },
    // for new plans
    creator_legacy_monthly: { max: 3 },
    creator_monthly: { max: 1 },
    creator_yearly: { max: 1 },
    deployment: { max: 5 },
    deployment_monthly: { max: 5 },
    deployment_yearly: { max: 5 },
    business_monthly: { max: 10 },
    business_yearly: { max: 10 },
  };

  let maxGPU = planHierarchy[plan as keyof typeof planHierarchy]?.max || 1;
  if (userSettings?.max_gpu) {
    maxGPU = Math.max(maxGPU, userSettings.max_gpu);
  }

  if (isUserSettingsLoading || isSubLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 w-6" />
        </div>
        <Skeleton className="h-5 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    );
  }

  return (
    <RangeSlider
      value={value}
      onChange={onChange}
      min={1}
      max={maxGPU}
      // description=""
    />
  );
}

interface TimeSelectOption {
  seconds?: number;
  minutes?: number;
  value?: number;
  requiredPlan?: string;
}

interface TimeSelectProps {
  value: number;
  onChange: (value: number) => void;
  options: TimeSelectOption[];
  placeholder?: string;
  description?: string;
}

function TimeSelect({
  value,
  onChange,
  options,
  placeholder,
  description,
}: TimeSelectProps) {
  const planHierarchy: Record<string, string[]> = {
    basic: [],
    pro: ["pro"],
    enterprise: ["pro", "business", "creator"],
    ws_basic: [],
    ws_pro: [],
    business: ["pro", "business"],
    creator: ["pro", "business", "creator"],
    deployment: ["pro", "business", "creator"],
    deployment_monthly: ["pro", "business", "creator"],
    deployment_yearly: ["pro", "business", "creator"],
    business_monthly: ["pro", "business", "creator"],
    business_yearly: ["pro", "business", "creator"],
    creator_monthly: ["pro", "business", "creator"],
    creator_legacy_monthly: ["pro"],
  };

  const sub = useCurrentPlan();
  const plan = sub?.plans?.plans.filter(
    (plan: string) => !plan.includes("ws"),
  )?.[0];

  const formatTime = (option: TimeSelectOption) => {
    if (option.minutes) {
      if (option.minutes >= 60) {
        const hours = Math.floor(option.minutes / 60);
        const remainingMinutes = option.minutes % 60;
        return remainingMinutes > 0
          ? `${hours} hr ${remainingMinutes} min`
          : `${hours} hr`;
      }
      return `${option.minutes} min`;
    }
    if (option.seconds) {
      if (option.seconds >= 3600) {
        const hours = Math.floor(option.seconds / 3600);
        const remainingMinutes = Math.floor((option.seconds % 3600) / 60);
        const remainingSeconds = option.seconds % 60;
        if (remainingMinutes > 0) {
          return `${hours} hr ${remainingMinutes} min`;
        }
        if (remainingSeconds > 0) {
          return `${hours} hr ${remainingSeconds} sec`;
        }
        return `${hours} hr`;
      }
      if (option.seconds >= 60) {
        const minutes = Math.floor(option.seconds / 60);
        const remainingSeconds = option.seconds % 60;
        return remainingSeconds > 0
          ? `${minutes} min ${remainingSeconds} sec`
          : `${minutes} min`;
      }
      return `${option.seconds} sec`;
    }
    if (option.value) {
      if (option.value >= 60) {
        const hours = Math.floor(option.value / 60);
        const remainingMinutes = option.value % 60;
        return remainingMinutes > 0
          ? `${hours} hr ${remainingMinutes} min`
          : `${hours} hr`;
      }
      return `${option.value} min`;
    }
    return "0 sec";
  };

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={String(value)}
        onValueChange={(val) => onChange(Number(val))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder || "Select time"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const optionValue =
              option.value ?? (option.seconds || (option.minutes || 0) * 60);
            const isAllowed =
              !option.requiredPlan ||
              (plan &&
                plan in planHierarchy &&
                planHierarchy[plan as keyof typeof planHierarchy]?.includes(
                  option.requiredPlan,
                ));

            return (
              <SelectItem
                key={optionValue}
                value={String(optionValue)}
                disabled={!isAllowed}
              >
                <span className="flex w-full items-center justify-between">
                  <span>{formatTime(option)}</span>
                  {!isAllowed && (
                    <span className="mx-2 inline-flex items-center justify-center gap-2">
                      <Badge className="capitalize">
                        {option.requiredPlan}
                      </Badge>{" "}
                      plan required
                      <Lock size={14} />
                    </span>
                  )}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {description && (
        <span className="pt-2 text-muted-foreground text-sm leading-snug">
          {description}
        </span>
      )}
    </div>
  );
}

export function WorkflowTimeOut({
  value,
  onChange,
}: { value: number; onChange: (value: number) => void }) {
  const { orgId } = useAuth();

  const options: TimeSelectOption[] = [
    { seconds: 300 },
    { seconds: 420, requiredPlan: "pro" },
    { seconds: 600, requiredPlan: "business" },
    { seconds: 1200, requiredPlan: "business" },
    { seconds: 1800, requiredPlan: "business" },
  ];

  if (orgId === "org_2v89WmHMDa6I8uHHoE4GesjvIDY") {
    options.push({
      seconds: 7 * 60 * 60, // 7 hours
      requiredPlan: "business",
    });
  }

  return (
    <TimeSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select Timeout"
    />
  );
}

export function WarmTime({
  value,
  onChange,
}: { value: number; onChange: (value: number) => void }) {
  const options: TimeSelectOption[] = [
    { seconds: 2 },
    { seconds: 15 },
    { seconds: 30 },
    { seconds: 60 },
    { seconds: 120, requiredPlan: "pro" },
    { seconds: 240, requiredPlan: "business" },
    { seconds: 600, requiredPlan: "business" },
    { seconds: 1200, requiredPlan: "business" },
  ];

  return (
    <TimeSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select Warm Time"
      // description="The warm time is the seconds before the container will be stopped after the run is finished. So the next request will reuse the warm container."
    />
  );
}

export function MaxAlwaysOnSlider({
  value,
  onChange,
}: { value: number; onChange: (value: number) => void }) {
  const sub = useCurrentPlan();

  const minAlwaysOn = 0;
  const maxAlwaysOn = sub?.features.alwaysOnMachineLimit ?? 0;

  return (
    <div>
      {maxAlwaysOn === 0 ? (
        <div className="text-muted-foreground text-sm">
          This feature is limited with your current plan. Please consult with
          support if you need to increase the limit.
        </div>
      ) : (
        <>
          <RangeSlider
            value={value}
            onChange={onChange}
            min={0}
            max={maxAlwaysOn}
          />
          {/* <Alert variant="warning" className="mt-2 bg-yellow-500/10">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Advanced Feature</AlertTitle>
            <AlertDescription>
              This is an advanced feature. Keeping machines always-on will
              continuously incur GPU costs until you reduce the value.
            </AlertDescription>
          </Alert> */}
        </>
      )}
    </div>
  );
}

function WebSocketTimeout({
  value,
  onChange,
}: { value: number; onChange: (value: number) => void }) {
  const options: TimeSelectOption[] = [
    { minutes: 2 },
    { minutes: 5, requiredPlan: "pro" },
    { minutes: 10, requiredPlan: "business" },
  ];

  return (
    <TimeSelect
      value={value}
      onChange={onChange}
      options={options.map((opt) => ({ ...opt, value: opt.minutes }))}
      placeholder="Select Timeout"
    />
  );
}

function BuilderVersionSelectBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const builderVersions = [
    {
      value: "2",
      label: "V2",
      status: "deprecated",
      disabled: true,
      description: "Deprecated",
    },
    {
      value: "3",
      label: "V3",
      status: "",
      disabled: true,
      description: "Support version",
    },
    {
      value: "4",
      label: "V4",
      status: "latest",
      disabled: false,
      description: "Recommended version",
    },
  ];

  return (
    <div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select version">
            {value && (
              <div className="flex items-center gap-2 w-full pr-4">
                <div className="truncate">
                  {builderVersions.find((v) => v.value === value)?.label}
                </div>
                <div className="ml-auto shrink-0">
                  <Badge
                    variant={
                      builderVersions.find((v) => v.value === value)?.status ===
                      "deprecated"
                        ? "destructive"
                        : "green"
                    }
                    className="text-xs"
                  >
                    {builderVersions.find((v) => v.value === value)?.status}
                  </Badge>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {builderVersions.map((version) => (
            <SelectItem
              key={version.value}
              value={version.value}
              disabled={version.disabled}
              className="w-full pr-8"
            >
              <div className="flex items-center gap-2 w-full">
                <div className="truncate">
                  <span className="font-medium">{version.label}</span>
                </div>
                <div className="ml-auto flex items-center gap-2 shrink-0">
                  {version.status && (
                    <Badge
                      variant={
                        version.status === "deprecated"
                          ? "destructive"
                          : "green"
                      }
                      className="text-xs"
                    >
                      {version.status}
                    </Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <p className="mt-2 text-sm text-muted-foreground">
          {builderVersions.find((v) => v.value === value)?.description}
        </p>
      )}
    </div>
  );
}

function OptimizedRunnerDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Optimized Cold Start</DialogTitle>
          <DialogDescription>
            This feature requires:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>ComfyUI version &gt;= 0.3.26</li>
              <li>Latest Comfy Deploy custom nodes</li>
            </ul>
            Please make sure your environment meets these requirements before
            enabling.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Enable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
