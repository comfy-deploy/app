import AutoForm from "@/components/auto-form";
import {
  customFormSchema,
  type machineGPUOptions,
  serverlessFormSchema,
  useGPUConfig,
} from "@/components/machine/machine-schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { comfyui_hash } from "@/utils/comfydeploy-hash";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBlocker, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, easeOut, motion, useAnimation } from "framer-motion";
import { isEqual } from "lodash";
import {
  ExternalLinkIcon,
  Info,
  Loader2,
  Lock,
  PencilIcon,
  Save,
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
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCachedQuery } from "@/lib/use-cached-query";

export function MachineSettingsWrapper({
  machine,
  onValueChange,
  title,
  disableUnsavedChangesWarningServerless = false,
}: {
  machine: any;
  onValueChange?: (key: string, value: any) => void;
  title?: ReactNode;
  disableUnsavedChangesWarningServerless?: boolean;
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
      <div>
        <div className="sticky top-[57px] z-10 flex h-[72px] flex-col bg-background/80 backdrop-blur-sm md:h-12 md:flex-row md:items-center md:justify-between">
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
                        ? "calc(200% + 24px)"
                        : view === "autoscaling"
                          ? "calc(100% + 20px)"
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
}: {
  machine: any;
  formRef: RefObject<HTMLFormElement | null>;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  view: string;
  onValueChange?: (key: string, value: any) => void;
  disableUnsavedChangesWarning?: boolean;
}) {
  const [isFormDirty, setIsFormDirty] = useState(false);
  const isNew = machine.id === "new";
  const { controls } = useUnsavedChangesWarning({
    isDirty: isFormDirty,
    isNew,
    disabled: disableUnsavedChangesWarning,
  });

  const navigate = useNavigate();

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
      prestart_command: machine.prestart_command,
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
    // console.log(errors);
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
      <form ref={formRef} onSubmit={form.handleSubmit(handleSubmit)}>
        {view === "environment" && (
          <div className="space-y-4 p-2 pt-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="w-full">
                <Badge className="mb-2 font-medium text-sm">
                  ComfyUI Version
                </Badge>
                <ComfyUIVersionSelectBox
                  value={form.watch("comfyui_version")}
                  onChange={(value) => form.setValue("comfyui_version", value)}
                />
              </div>
              <div className="w-full">
                <Badge className="mb-2 font-medium text-sm">GPU</Badge>
                <GPUSelectBox
                  value={form.watch("gpu")}
                  onChange={(value) => form.setValue("gpu", value)}
                  disabled={false}
                />
              </div>
            </div>
            {/* {!isNew && ( */}
            <CustomNodeSetupWrapper
              value={form.watch("docker_command_steps")}
              onChange={(value) => form.setValue("docker_command_steps", value)}
            />
            {/* )} */}
          </div>
        )}

        {view === "autoscaling" && (
          <div className="space-y-1 p-2 pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col items-start justify-between">
                <div className="flex flex-col gap-2">
                  <Badge className="font-medium text-sm">
                    Max Parallel GPU
                  </Badge>
                  {/* <div>
                        Increase the concurrency limit for the machine to handle
                        more gpu intensive tasks at the same time.
                      </div> */}
                </div>
                <div className="w-full">
                  <MaxParallelGPUSlider
                    value={form.watch("concurrency_limit")}
                    onChange={(value) =>
                      form.setValue("concurrency_limit", value)
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col items-start justify-between">
                <div className="flex flex-col gap-2">
                  <Badge className="mb-2 font-medium text-sm">
                    Keep Always On
                  </Badge>
                  {/* <div>
                        Increase the concurrency limit for the machine to handle
                        more gpu intensive tasks at the same time.
                      </div> */}
                </div>
                <div className="w-full">
                  <MaxAlwaysOnSlider
                    value={form.watch("keep_warm") || 0}
                    onChange={(value) => form.setValue("keep_warm", value)}
                  />
                </div>
              </div>
              {/* </AccordionContent>
              </AccordionItem> */}
              {/* <AccordionItem value="timeout">
                <AccordionTrigger className="py-4">
                  Timeout Settings
                </AccordionTrigger>
                <AccordionContent className="space-y-6"> */}
              <div>
                <Badge className="mb-2 font-medium text-sm">
                  Workflow Timeout
                </Badge>
                <WorkflowTimeOut
                  value={form.watch("run_timeout")}
                  onChange={(value) => form.setValue("run_timeout", value)}
                />
              </div>
              <div>
                <Badge className="mb-2 font-medium text-sm">Warm Time</Badge>
                <WarmTime
                  value={form.watch("idle_timeout")}
                  onChange={(value) => form.setValue("idle_timeout", value)}
                />
              </div>
            </div>
          </div>
        )}

        {view === "advanced" && (
          <div className="space-y-10 p-2 pt-4">
            <div className="flex flex-col gap-2">
              <h3 className="font-medium text-sm">Builder Version</h3>
              <BuilderVersionSelectBox
                value={form.watch("machine_builder_version") || "4"}
                onChange={(value) =>
                  form.setValue(
                    "machine_builder_version",
                    value as "2" | "3" | "4",
                  )
                }
              />
            </div>

            <Accordion type="single" defaultValue="docker">
              <AccordionItem value="docker">
                <AccordionTrigger className="py-4">
                  Docker Configuration
                </AccordionTrigger>
                <AccordionContent className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm">Base Docker Image</h3>
                    <Input
                      value={form.watch("base_docker_image") ?? ""}
                      onChange={(e) =>
                        form.setValue("base_docker_image", e.target.value)
                      }
                    />
                    <p className="text-muted-foreground text-xs">
                      Optional base docker image for the machine.
                    </p>
                  </div>
                  <ExtraDockerCommands
                    value={form.watch("extra_docker_commands")}
                    onChange={(value) =>
                      form.setValue("extra_docker_commands", value)
                    }
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="system">
                <AccordionTrigger className="py-4">
                  System Settings
                </AccordionTrigger>
                <AccordionContent className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm">Python Version</h3>
                    <Select
                      value={form.watch("python_version") ?? "3.11"}
                      onValueChange={(value) =>
                        form.setValue("python_version", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Python Version" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3.9">3.9</SelectItem>
                        <SelectItem value="3.10">3.10</SelectItem>
                        <SelectItem value="3.11">3.11 (Recommended)</SelectItem>
                        <SelectItem value="3.12">3.12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm">Queue per GPU</h3>
                    <RangeSlider
                      value={form.watch("allow_concurrent_inputs") || 1}
                      onChange={(value) =>
                        form.setValue("allow_concurrent_inputs", value)
                      }
                      min={1}
                      max={10}
                    />
                    <p className="text-muted-foreground text-xs">
                      The queue size is the number of inputs that can be queued
                      to 1 container before spinning up a new container.
                    </p>
                  </div>
                  {/* <div className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm">Websocket timeout</h3>
                    <WebSocketTimeout
                      value={form.watch("ws_timeout")}
                      onChange={(value) => form.setValue("ws_timeout", value)}
                    />
                  </div> */}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="custom">
                <AccordionTrigger className="py-4">
                  Custom Settings
                </AccordionTrigger>
                <AccordionContent className="space-y-6">
                  <div>
                    <div className="flex flex-row items-center gap-4">
                      <Switch
                        id="install_custom_node_with_gpu"
                        checked={form.watch("install_custom_node_with_gpu")}
                        onCheckedChange={(value) =>
                          form.setValue("install_custom_node_with_gpu", value)
                        }
                      />
                      <Label htmlFor="install_custom_node_with_gpu">
                        Install custom nodes with GPU
                      </Label>
                    </div>
                    <p className="mt-2 text-muted-foreground text-xs">
                      Some custom nodes require GPU while being initialized.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm">Extra arguments</h3>
                    <Input
                      value={form.watch("extra_args") ?? ""}
                      onChange={(e) =>
                        form.setValue("extra_args", e.target.value)
                      }
                    />
                    <p className="flex flex-row items-center gap-1 text-muted-foreground text-xs">
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
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm">Prestart Command</h3>
                    <Input
                      value={form.watch("prestart_command") ?? ""}
                      onChange={(e) =>
                        form.setValue("prestart_command", e.target.value)
                      }
                    />
                    <p className="text-muted-foreground text-xs">
                      Command to run before the machine starts.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </form>

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
}: {
  value: any;
  onChange: (value: any) => void;
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
    if (option.minutes) return `${option.minutes} min`;
    if (option.seconds)
      return option.seconds < 60
        ? `${option.seconds} sec`
        : `${Math.floor(option.seconds / 60)} min`;
    return `${option.value} min`;
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
  const options: TimeSelectOption[] = [
    { seconds: 300 },
    { seconds: 420, requiredPlan: "pro" },
    { seconds: 600, requiredPlan: "business" },
    { seconds: 1200, requiredPlan: "business" },
    { seconds: 1800, requiredPlan: "business" },
  ];

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
