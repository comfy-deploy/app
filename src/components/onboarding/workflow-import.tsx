import type {
  ConflictingNodeInfo,
  WorkflowDependencies,
} from "@/components/onboarding/workflow-analyze";
import {
  type GpuTypes,
  WorkflowImportCustomNodeSetup,
  WorkflowImportMachineSetup,
  WorkflowImportSelectedMachine,
  convertToDockerSteps,
  findFirstDuplicateNode,
} from "@/components/onboarding/workflow-machine-import";
import type { NodeData } from "@/components/onboarding/workflow-machine-import";
import { WorkflowModelCheck } from "@/components/onboarding/workflow-model-check";
import {
  type Step,
  type StepComponentProps,
  StepForm,
} from "@/components/step-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { comfyui_hash } from "@/utils/comfydeploy-hash";
import { defaultWorkflowTemplates } from "@/utils/default-workflow";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Circle, CircleCheckBig, Lightbulb } from "lucide-react";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileURLRender } from "../workflows/OutputRender";

// Add these interfaces
export interface StepValidation {
  workflowName?: string;
  importOption?: "import" | "default";
  importJson?: string;
  workflowJson?: string;
  workflowApi?: string;
  selectedMachineId?: string;
  machineOption?: "existing" | "new";
  existingMachine?: any;
  machineConfig?: any; // only for existing machine
  existingMachineMissingNodes?: NodeData[];
  // Add more fields as needed for future steps
  hasEnvironment?: boolean;
  machineName?: string;
  gpuType?: GpuTypes;
  python_version?: string;
  install_custom_node_with_gpu?: boolean;
  base_docker_image?: string;
  comfyUiHash?: string;
  selectedComfyOption?: "recommended" | "latest" | "custom";
  firstTimeSelectGPU?: boolean;

  dependencies?: WorkflowDependencies;
  selectedConflictingNodes?: {
    [nodeName: string]: ConflictingNodeInfo[];
  };

  docker_command_steps?: DockerCommandSteps;
  isEditingHashOrAddingCommands?: boolean;
}
interface DockerCommandSteps {
  steps: DockerCommandStep[];
}

interface DockerCommandStep {
  id: string;
  type: "custom-node" | "commands";
  data: CustomNodeData | string;
}

interface CustomNodeData {
  name: string;
  hash?: string;
  url: string;
  files: string[];
  install_type: "git-clone";
  pip?: string[];
  meta?: {
    message: string;
    latest_hash?: string;
    committer?: {
      name: string;
      email: string;
      date: string;
    };
    commit_url?: string;
    stargazers_count?: number;
  };
}

interface StepNavigation {
  next: number | null; // null means end of flow
  prev: number | null; // null means start of flow
}

function getStepNavigation(
  currentStep: number,
  validation: StepValidation,
): StepNavigation {
  switch (currentStep) {
    case 0: // Create Workflow
      // If docker_command_steps exists, skip to step 3 (Model Check)
      if (validation.hasEnvironment) {
        return {
          next: 3,
          prev: null,
        };
      }
      return {
        next: validation.importOption === "default" ? 2 : 1,
        prev: null,
      };

    case 1: // Custom Node Setup
      return {
        next: 2,
        prev: 0,
      };

    case 2: // Select Machine
      // If docker_command_steps exists, skip to step 3 (Model Check)
      if (validation.hasEnvironment) {
        return {
          next: 3,
          prev: 0,
        };
      }
      return {
        next: validation.importOption === "default" ? 4 : 3,
        prev: validation.importOption === "default" ? 0 : 1,
      };

    case 3: // Model Checking
      return {
        next: 4,
        prev: validation.hasEnvironment ? 0 : 2,
      };

    case 4: // Machine Settings
      return {
        next: null,
        prev: validation.hasEnvironment
          ? 3
          : validation.importOption === "default"
            ? 2
            : 3,
      };

    default:
      return {
        next: null,
        prev: null,
      };
  }
}

// Add type for search params
type SearchParams = {
  workflow_json?: string;
};

export default function WorkflowImport() {
  const navigate = useNavigate();
  const [validation, setValidation] = useState<StepValidation>({
    workflowName: "Untitled Workflow",
    importOption:
      (localStorage.getItem("workflowImportOption") as "import" | "default") ||
      "default",
    importJson: "",
    workflowJson: "",
    workflowApi: "",
    selectedMachineId: "",
    machineOption: "new",
    machineName: "Untitled Machine",
    gpuType: "A10G",
    comfyUiHash: comfyui_hash,
    selectedComfyOption: "recommended",
    dependencies: undefined,
    selectedConflictingNodes: {},
  });

  const createWorkflow = async (machineId?: string) => {
    const requestBody = {
      name: validation.workflowName,
      workflow_json:
        validation.importOption === "import"
          ? validation.importJson
          : validation.workflowJson,
      ...(validation.workflowApi && { workflow_api: validation.workflowApi }),
      ...(machineId && { machine_id: machineId }),
    };

    const result = await api({
      url: "workflow",
      init: {
        method: "POST",
        body: JSON.stringify(requestBody),
      },
    });

    return result;
  };

  // Define steps configuration
  const STEPS: Step<StepValidation>[] = [
    {
      id: 1,
      title: "Create Workflow",
      component: Import,
      validate: (validation) => {
        if (!validation.workflowName?.trim()) {
          return { isValid: false, error: "Please enter a workflow name" };
        }
        if (validation.importOption === "import") {
          if (!validation.importJson) {
            return { isValid: false, error: "Please provide workflow JSON" };
          }
          try {
            JSON.parse(validation.importJson);
          } catch (error) {
            return { isValid: false, error: "Please provide valid JSON" };
          }
        }
        return { isValid: true };
      },
      actions: {
        onNext: async () => {
          // Any actions needed after first step
          // console.log(validation);
          return true;
        },
      },
    },
    // Add more steps as needed:
    {
      id: 2,
      title: "Custom Node Setup",
      component: WorkflowImportCustomNodeSetup,
      validate: (validation) => {
        // If docker_command_steps is already set, skip the conversion
        if (validation.docker_command_steps) {
          return { isValid: true };
        }

        // Check if dependencies exist
        if (!validation.dependencies) {
          return { isValid: false, error: "No dependencies found" };
        }

        // Check custom nodes
        const customNodesWithoutHash = Object.entries(
          validation.dependencies.custom_nodes || {},
        ).filter(([_, node]) => !node.hash);

        if (customNodesWithoutHash.length > 0) {
          return {
            isValid: false,
            error: `Some custom nodes are missing hashes: ${customNodesWithoutHash
              .map(([url]) => url)
              .join(", ")}`,
          };
        }

        // Check selected conflicting nodes
        const selectedConflictsWithoutHash = Object.entries(
          validation.selectedConflictingNodes || {},
        ).flatMap(([nodeName, conflicts]) =>
          conflicts
            .filter((node) => !node.hash)
            .map((node) => `${nodeName} (${node.url})`),
        );

        if (selectedConflictsWithoutHash.length > 0) {
          return {
            isValid: false,
            error: `Some selected conflicting nodes are missing hashes: ${selectedConflictsWithoutHash.join(
              ", ",
            )}`,
          };
        }

        // Check if there is any duplicated nodes imported
        const duplicateNode = findFirstDuplicateNode(
          validation.dependencies?.custom_nodes,
          validation.selectedConflictingNodes,
        );
        if (duplicateNode) {
          return {
            isValid: false,
            error: `Duplicate node found: "${duplicateNode.url
              .split("/")
              .slice(-1)
              .join("/")}"`,
          };
        }

        if (validation.docker_command_steps) {
          return true;
        }

        const docker_commands = convertToDockerSteps(
          validation.dependencies?.custom_nodes,
          validation.selectedConflictingNodes,
        );

        setValidation((prev) => ({
          ...prev,
          docker_command_steps: docker_commands,
        }));

        console.log("docker_commands: ", docker_commands);

        return { isValid: true };
      },
      actions: {
        onNext: async () => {
          // If docker_command_steps is already set, skip the conversion

          return true;
        },
      },
    },
    {
      id: 3,
      title: "Select Machine",
      component: WorkflowImportSelectedMachine,
      validate: (validation) => {
        if (
          validation.machineOption === "existing" &&
          !validation.selectedMachineId
        ) {
          return { isValid: false, error: "Please select a machine" };
        }
        return { isValid: true };
      },
      actions: {
        onNext: async (validation) => {
          try {
            switch (validation.machineOption) {
              case "existing":
                return true;
              case "new":
                // Maybe store some state and continue to next step
                return true;

              default:
                return false;
            }
          } catch (error) {
            toast.error(`Failed to create workflow: ${error}`);
            return false;
          }
        },
      },
    },
    {
      id: 4,
      title: "Model Check",
      component: WorkflowModelCheck,
      validate: (validation) => {
        return { isValid: true };
      },
      actions: {
        onNext: async () => {
          return true;
        },
      },
    },
    {
      id: 5,
      title: "Machine Settings",
      component: WorkflowImportMachineSetup,
      validate: (validation) => {
        if (!validation.machineName?.trim()) {
          return { isValid: false, error: "Please enter a machine name" };
        }

        if (
          validation.selectedComfyOption === "custom" &&
          !validation.comfyUiHash?.trim()
        ) {
          return {
            isValid: false,
            error: "Please enter a ComfyUI commit hash",
          };
        }

        return { isValid: true };
      },
      actions: {
        onNext: async (validation) => {
          try {
            let response: any;
            // Type guard to ensure required fields exist
            if (validation.machineOption === "existing") {
              if (!validation.selectedMachineId) {
                throw new Error("missing machine id");
              }
              console.log("existing: ", validation.machineConfig);

              if (validation.machineConfig.type !== "comfy-deploy-serverless") {
                await api({
                  url: `machine/custom/${validation.selectedMachineId}`,
                  init: {
                    method: "PATCH",
                    body: JSON.stringify({
                      name: validation.machineConfig.name,
                      type: validation.machineConfig.type,
                      endpoint: validation.machineConfig.endpoint,
                      auth_token: validation.machineConfig.auth_token,
                    }),
                  },
                });

                const workflowResult = await createWorkflow(
                  validation.selectedMachineId,
                );

                toast.success(
                  `Workflow "${validation.workflowName}" created successfully!`,
                );
                if (workflowResult.workflow_id) {
                  navigate({
                    to: "/workflows/$workflowId/$view",
                    params: {
                      workflowId: workflowResult.workflow_id,
                      view: "workspace",
                    },
                  });
                }
                return true;
              } else {
                response = await api({
                  url: `machine/serverless/${validation.selectedMachineId}`,
                  init: {
                    method: "PATCH",
                    body: JSON.stringify(validation.machineConfig),
                  },
                });
              }
            } else {
              // New machine
              if (
                !validation.machineName ||
                !validation.comfyUiHash ||
                !validation.gpuType
              ) {
                throw new Error("Missing required fields");
              }

              response = await api({
                url: "machine/serverless",
                init: {
                  method: "POST",
                  body: JSON.stringify({
                    name: validation.machineName,
                    comfyui_version: validation.comfyUiHash,
                    gpu: validation.gpuType,
                    docker_command_steps: validation.docker_command_steps,
                    install_custom_node_with_gpu:
                      validation.install_custom_node_with_gpu,
                    base_docker_image: validation.base_docker_image,
                    python_version: validation.python_version,
                    concurrency_limit: 1,
                  }),
                },
              });
            }

            toast.success(`${validation.machineName} created successfully!`);
            const machineId = response.id;
            // Create workflow with the new machine ID
            const workflowResult = await createWorkflow(machineId);

            toast.success(
              `Workflow "${validation.workflowName}" created successfully!`,
            );
            if (workflowResult.workflow_id) {
              navigate({
                to: "/workflows/$workflowId/$view",
                params: {
                  workflowId: workflowResult.workflow_id,
                  view: "workspace",
                },
              });
            }

            // toast.info("Redirecting to machine page...");
            // navigate({
            //   to: "/machines/$machineId",
            //   params: { machineId },
            //   search: { view: undefined },
            // });

            return true;
          } catch (error) {
            toast.error(`Failed to create: ${error}`);
            return false;
          }
        },
      },
    },
  ];

  return (
    <StepForm
      steps={STEPS}
      validation={validation}
      setValidation={setValidation}
      getStepNavigation={getStepNavigation}
      onExit={() => navigate({ to: "/workflows", search: { view: undefined } })}
    />
  );
}

// Update component props
function Import({
  validation,
  setValidation,
}: StepComponentProps<StepValidation>) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2">
          <span className="font-medium text-sm">Workflow Name </span>
          <span className="text-red-500">*</span>
        </div>
        <Input
          placeholder="Workflow name..."
          value={validation.workflowName}
          onChange={(e) =>
            setValidation({ ...validation, workflowName: e.target.value })
          }
        />
      </div>

      <div>
        <div className="mb-2">
          <span className="font-medium text-sm">Choose an option</span>
          <span className="text-red-500">*</span>
        </div>

        <div>
          <Accordion
            type="single"
            className="flex w-full flex-col gap-2"
            defaultValue={validation.importOption}
            onValueChange={(value) => {
              // Store just the importOption
              localStorage.setItem("workflowImportOption", value);

              // console.log(value);

              setValidation({
                ...validation,
                importOption: value as "import" | "default",
                workflowJson: "",
                workflowApi: undefined,
              });
            }}
          >
            <DefaultOption
              validation={validation}
              setValidation={setValidation}
            />
            <ImportOptions
              validation={validation}
              setValidation={setValidation}
            />
          </Accordion>
        </div>
      </div>
    </div>
  );
}

// =============== Utils ===============

export type AccordionOptionProps = {
  value: string;
  selected: string | undefined;
  label: string | React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
};

export function AccordionOption({
  value,
  selected,
  label,
  content,
  disabled = false,
}: AccordionOptionProps) {
  return (
    <AccordionItem
      value={value}
      disabled={disabled}
      className={cn(
        "rounded-sm border border-gray-200 px-4 py-1",
        selected !== value && "opacity-50",
        selected === value && "ring-2 ring-gray-500 ring-offset-2",
        disabled && "cursor-not-allowed opacity-50 hover:opacity-50",
      )}
    >
      <AccordionTrigger className={disabled ? "cursor-not-allowed" : ""}>
        <div className={"flex flex-row items-center"}>
          {selected === value ? (
            <CircleCheckBig className="mr-4 h-3 w-3" />
          ) : (
            <Circle className="mr-4 h-3 w-3" />
          )}
          {label}
        </div>
      </AccordionTrigger>
      <AccordionContent>{content}</AccordionContent>
    </AccordionItem>
  );
}

function DefaultOption({
  validation,
  setValidation,
}: StepComponentProps<StepValidation>) {
  // Initialize innerSelected from validation if it exists, otherwise use default
  const [workflowSelected, setWorkflowSelected] = useState<string>(
    validation.workflowJson
      ? defaultWorkflowTemplates.find(
          (t) => t.workflowJson === validation.workflowJson,
        )?.workflowId || "sd1.5"
      : "sd1.5",
  );

  // Only update validation when template changes, not on every mount
  useEffect(() => {
    const selectedTemplate = defaultWorkflowTemplates.find(
      (template) => template.workflowId === workflowSelected,
    );

    if (selectedTemplate && validation.importOption === "default") {
      const updatedValidation = {
        ...validation,
        workflowJson: selectedTemplate.workflowJson,
        workflowApi: selectedTemplate.workflowApi,
        importJson: "",
        hasEnvironment: selectedTemplate.hasEnvironment || false,
      };

      // If the template has environment data, include those properties
      if (selectedTemplate.hasEnvironment) {
        try {
          const workflowData = JSON.parse(selectedTemplate.workflowJson);
          const environment = workflowData.environment;

          if (environment) {
            Object.assign(updatedValidation, {
              docker_command_steps: environment.docker_command_steps,
              gpuType: environment.gpu,
              comfyUiHash: environment.comfyui_version,
              install_custom_node_with_gpu:
                environment.install_custom_node_with_gpu,
              base_docker_image: environment.base_docker_image,
              python_version: environment.python_version,
            });
          }
        } catch (error) {
          console.error("Error parsing workflow JSON:", error);
        }
      }

      setValidation(updatedValidation);
    }
  }, [workflowSelected, validation.importOption]);

  return (
    <AccordionOption
      value="default"
      // Make sure this matches exactly with validation.importOption
      selected={validation.importOption}
      label="Templates"
      content={
        <div>
          <span className="text-muted-foreground">
            Select a workflow as your starting point.{" "}
          </span>

          <div className="mt-4 grid grid-cols-3 gap-1 md:gap-4">
            {defaultWorkflowTemplates.map((template, index) => (
              <button
                key={template.workflowId}
                type="button"
                className={cn(
                  "group relative h-[350px] w-full overflow-hidden rounded-lg border text-left transition-all duration-500 ease-in-out",
                  workflowSelected === template.workflowId
                    ? "opacity-100 shadow-lg"
                    : "opacity-70 grayscale hover:grayscale-0",
                )}
                onClick={() => setWorkflowSelected(template.workflowId)}
                aria-pressed={workflowSelected === template.workflowId}
              >
                <FileURLRender
                  url={template.workflowImageUrl}
                  imgClasses="h-full max-w-full w-full object-cover absolute inset-0 group-hover:scale-105 transition-all duration-500 pointer-events-none"
                />
                <div className="absolute right-0 bottom-0 left-0 flex flex-col gap-2 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-4">
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      {workflowSelected === template.workflowId ? (
                        <CircleCheckBig className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <h3 className="font-medium text-shadow">
                        {template.workflowName}
                      </h3>
                    </div>
                    {template.hasEnvironment && (
                      <Badge variant="yellow" className="whitespace-nowrap">
                        <Lightbulb className="h-3 w-3" />
                        With Preset
                      </Badge>
                    )}
                  </div>

                  <p className="line-clamp-1 text-muted-foreground text-sm backdrop-blur-[2px]">
                    {template.workflowDescription}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}

function ImportOptions({
  validation,
  setValidation,
}: StepComponentProps<StepValidation>) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [workflowJsonUrl, setWorkflowJsonUrl] = useQueryState("workflow_json");

  // Add useEffect to handle URL query parameter
  useEffect(() => {
    if (workflowJsonUrl) {
      // Fetch the JSON from the URL
      fetch(workflowJsonUrl)
        .then((response) => response.text())
        .then((text) => {
          try {
            postProcessImport(text);
          } catch (error) {
            toast.error("Failed to load workflow from URL");
          }
        })
        .catch((error) => {
          toast.error("Failed to fetch workflow from URL");
        });
    }
  }, [workflowJsonUrl]);

  const postProcessImport = useCallback(
    (text: string) => {
      if (!text.trim()) {
        setValidation((prev) => ({
          ...prev,
          importOption: "import",
          importJson: "",
          workflowJson: "",
          workflowApi: "",
          // Remove docker_command_steps when clearing
          docker_command_steps: undefined,
          hasEnvironment: false,
          gpuType: "A10G",
          comfyUiHash: comfyui_hash,
          install_custom_node_with_gpu: false,
          base_docker_image: undefined,
          python_version: "3.11",
        }));
        return;
      }

      const json = JSON.parse(text);

      const environment = json.environment;
      const workflowAPIJson = json.workflow_api;

      if (!environment) {
        setValidation((prev) => ({
          ...prev,
          importOption: "import",
          importJson: text,
          workflowJson: text,
          hasEnvironment: false,
          workflowApi: undefined,

          docker_command_steps: undefined,
          gpuType: "A10G",
          comfyUiHash: comfyui_hash,
          install_custom_node_with_gpu: false,
          base_docker_image: undefined,
          python_version: "3.11",
        }));
        return;
      }

      const data = {
        importOption: "import",
        importJson: text,
        workflowJson: "",
        workflowApi: JSON.stringify(workflowAPIJson), // Clear workflowApi

        docker_command_steps: environment.docker_command_steps,
        gpuType: environment.gpu,
        comfyUiHash: environment.comfyui_version,
        install_custom_node_with_gpu: environment.install_custom_node_with_gpu,
        base_docker_image: environment.base_docker_image,
        python_version: environment.python_version,
        hasEnvironment: true,
      } as StepValidation;

      console.log(data);

      setValidation((prev) => ({
        ...prev,
        ...data,
      }));
    },
    [validation, setValidation],
  );

  const handleFileSelect = async (file: File) => {
    if (file && file.type === "application/json") {
      const text = await file.text();
      try {
        postProcessImport(text);
      } catch (error) {
        toast.error("Invalid JSON file");
      }
    } else {
      toast.error("Please select a JSON file");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    await handleFileSelect(file);
  };

  return (
    <AccordionOption
      value="import"
      selected={validation.importOption}
      label="Import"
      content={
        <>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Upload file"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            className={cn(
              "cursor-pointer rounded-md border-2 border-dashed p-4 transition-colors duration-200",
              isDragging ? "border-green-500 bg-green-50" : "border-gray-200",
              "hover:border-gray-300",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Click or drag and drop your workflow JSON file here.
              </span>
              {validation.hasEnvironment && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-green-100 text-green-700 hover:bg-green-100"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Environment Detected
                </Badge>
              )}
            </div>

            <div className="mt-2">
              <Textarea
                placeholder="Or paste your workflow JSON here..."
                className="h-48"
                value={validation.importJson}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onChange={(e) => {
                  const text = e.target.value;
                  try {
                    postProcessImport(text);
                  } catch (error) {}
                }}
              />
            </div>
          </div>
        </>
      }
    />
  );
}
