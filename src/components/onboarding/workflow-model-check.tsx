import type { StepValidation } from "@/components/onboarding/workflow-import";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  TriangleAlert,
} from "lucide-react";
import { memo, useEffect, useMemo, useState, useCallback } from "react";
import { FolderTree } from "@/components/models/folder-tree";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddModelDialog } from "@/components/models/add-model-dialog";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { sendEventToCD } from "../workspace/sendEventToCD";

// -----------------------types------------------------

export type WorkflowNode = {
  id: number;
  type: string;
  pos: [number, number];
  widgets_values: string[];
  inputs: {
    name: string;
  }[];
  outputs: {
    name: string;
  }[];
};

export type WorkflowJson = {
  nodes: WorkflowNode[];
};

export type FileList = {
  category: string;
  filePaths: FilePaths[];
};

export type FilePaths = {
  name: string;
  volumeType: "public" | "private";
};

export type NodeCategory = {
  type: string;
  folder: string | string[];
  noOfNodes?: number;
  onlyRootFiles?: boolean;
};

export type NodeCategories = {
  [category: string]: NodeCategory;
};

export type FileEntry = {
  path: string;
  type: 1 | 2; // 1 for file, 2 for folder
  mtime: number;
  size: number;
};

// -----------------------constants------------------------

// TODO:
// StyleModelLoader
// GLIGENLoader
// DiffusersLoader
// HypernetworkLoader
// PhotoMakerLoader

export const NodeToBeFocus: NodeCategories = {
  Image: {
    type: "LoadImage",
    folder: "input",
    onlyRootFiles: true,
  },
  Checkpoint: {
    type: "CheckpointLoaderSimple",
    folder: "checkpoints",
  },
  LoRA: {
    type: "LoraLoader",
    folder: "loras",
  },
  VAE: {
    type: "VAELoader",
    folder: "vae",
  },
  "IP-Adapter": {
    type: "IPAdapterModelLoader",
    folder: "ipadapter",
  },
  "Clip Vision": {
    type: "CLIPVisionLoader",
    folder: "clip_vision",
  },
  "Load Diffusion Model": {
    type: "UNETLoader",
    folder: ["unet", "diffusion_models"],
  },
  Clip: {
    type: "CLIPLoader",
    folder: "clip",
  },
  "Dual Clip": {
    type: "DualCLIPLoader",
    folder: "clip",
    noOfNodes: 2,
  },
  unClip: {
    type: "unCLIPCheckpointLoader",
    folder: "checkpoints",
  },
  ControlNet: {
    type: "ControlNetLoader",
    folder: "controlnet",
  },
  DiffControlNet: {
    type: "DiffControlNetLoader",
    folder: "controlnet",
  },
  "LoRA (Model Only)": {
    type: "LoraLoaderModelOnly",
    folder: "loras",
  },
  ImageOnly: {
    type: "ImageOnlyCheckpointLoader",
    folder: "checkpoints",
  },
  ControlNetAdvanced: {
    type: "ControlNetLoaderAdvanced",
    folder: "controlnet",
  },
  ACN_SparseCtrl: {
    type: "ACN_SparseCtrlLoaderAdvanced",
    folder: "controlnet",
  },
  UpScale: {
    type: "UpscaleModelLoader",
    folder: "upscale_models",
  },
  ADE_LoadAnimateDiff: {
    type: "ADE_LoadAnimateDiffModel",
    folder: "animatediff_models",
  },
  ACN_SparseCtrlMerged: {
    type: "ACN_SparseCtrlMergedLoaderAdvanced",
    folder: "controlnet",
    noOfNodes: 2,
  },
};

// -----------------------components------------------------

// Helper function to get the model name without parent
export function getModelNameWithoutParent(path: string) {
  if (!path) return "";

  // Split the path by '/'
  const parts = path.split("/");

  // If there's only one part or no parts, return the original path
  if (parts.length <= 1) return path;

  // Remove only the first part (top-level category folder)
  // But keep all subdirectories and the filename
  return parts.slice(1).join("/");
}

export function WorkflowModelCheck({
  workflow: initialWorkflow,
  onWorkflowUpdate,
  validation,
  setValidation,
}: {
  workflow?: string;
  onWorkflowUpdate?: (updatedWorkflow: string) => void;
  validation?: StepValidation;
  setValidation?: (validation: StepValidation) => void;
}) {
  // Get initial workflow from either direct prop or validation object
  const [workflow, setWorkflowInternal] = useState<string>(() => {
    if (initialWorkflow) return initialWorkflow;
    if (validation) {
      return (
        (validation.importOption === "import"
          ? validation.importJson
          : validation.workflowJson) || ""
      );
    }
    return "";
  });

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isModelBrowserExpanded, setIsModelBrowserExpanded] = useState(false);
  const [showAddModelDialog, setShowAddModelDialog] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState("");

  // Function to update workflow in all necessary places
  const updateWorkflow = useCallback(
    (newWorkflow: string) => {
      // Update internal state
      setWorkflowInternal(newWorkflow);

      // If direct callback provided, use it
      if (onWorkflowUpdate) {
        onWorkflowUpdate(JSON.parse(newWorkflow));
      }

      // If using validation context, update that too
      if (validation && setValidation) {
        if (validation.importOption === "import") {
          setValidation({
            ...validation,
            importJson: newWorkflow,
          });
        } else if (validation.importOption === "default") {
          setValidation({
            ...validation,
            workflowJson: newWorkflow,
          });
        }
      }
    },
    [onWorkflowUpdate, validation, setValidation],
  );

  // Fetch model data from API
  const { data: privateFiles, isLoading: isLoadingPrivate } = useQuery({
    queryKey: ["volume", "private-models"],
    queryFn: async ({ queryKey }) => {
      const response = await api({
        url: queryKey.join("/"),
      });
      return response as Promise<FileEntry[]>;
    },
  });

  const { data: publicFiles, isLoading: isLoadingPublic } = useQuery({
    queryKey: ["volume", "public-models"],
    queryFn: async ({ queryKey }) => {
      const response = await api({
        url: queryKey.join("/"),
      });
      return response as Promise<FileEntry[]>;
    },
  });

  const nodesToFocus = useMemo(() => {
    try {
      return JSON.parse(workflow)?.nodes?.filter((node: any) =>
        Object.values(NodeToBeFocus).some(
          (focusNode) => focusNode.type === node.type,
        ),
      );
    } catch (e) {
      console.error("Failed to parse workflow JSON:", e);
      return [];
    }
  }, [workflow]);

  useEffect(() => {
    if (!selectedNode) return;

    try {
      // Parse the workflow JSON to get the nodes
      const parsedWorkflow = JSON.parse(workflow);

      // Find the corresponding node in the workflow
      const nodeIndex = parsedWorkflow.nodes.findIndex(
        (node: any) => node.id === selectedNode.id,
      );

      if (nodeIndex !== -1) {
        const node = parsedWorkflow.nodes[nodeIndex];

        // Find the node type configuration to get noOfNodes
        const nodeType = Object.entries(NodeToBeFocus).find(
          ([_, config]) => config.type === selectedNode.type,
        )?.[0];
        const numInputs = nodeType ? NodeToBeFocus[nodeType].noOfNodes || 1 : 1;

        // Check if any of the widget values are different
        let hasChanges = false;
        for (let i = 0; i < numInputs; i++) {
          if (node.widgets_values[i] !== selectedNode.widgets_values[i]) {
            node.widgets_values[i] = selectedNode.widgets_values[i];
            hasChanges = true;
          }
        }

        // Only update if there were changes
        if (hasChanges) {
          const updatedWorkflowJson = JSON.stringify(parsedWorkflow);
          updateWorkflow(updatedWorkflowJson);
        }
      }
    } catch (e) {
      console.error("Error updating selected node:", e);
    }
  }, [selectedNode, workflow, updateWorkflow]);

  const handleAddModel = (folderPath: string) => {
    setSelectedFolderPath(folderPath);
    setShowAddModelDialog(true);
  };

  return (
    <div className="flex h-full gap-4">
      <div className="w-full flex-1">
        <OptionList
          workflowNodeList={nodesToFocus}
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          isModelBrowserExpanded={isModelBrowserExpanded}
          privateFiles={privateFiles}
          publicFiles={publicFiles}
          isLoading={isLoadingPrivate || isLoadingPublic}
          isModal={!!initialWorkflow}
        />
      </div>
      {!initialWorkflow && (
        <div className="relative hidden md:block">
          {isModelBrowserExpanded && (
            <div className="w-[500px] rounded-xl border bg-white p-4 drop-shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mt-2 h-[calc(70vh)] overflow-auto bg-muted/20 dark:bg-zinc-900">
                <FolderTree onAddModel={handleAddModel} />
              </div>
            </div>
          )}
          <div className="-translate-y-1/2 -left-5 absolute top-[50%] hidden md:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={"outline"}
                    size={"icon"}
                    className="rounded-full shadow-md"
                    onClick={() =>
                      setIsModelBrowserExpanded(!isModelBrowserExpanded)
                    }
                  >
                    {isModelBrowserExpanded ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isModelBrowserExpanded ? "Hide" : "Show"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Add Model Dialog */}
      <Dialog open={showAddModelDialog} onOpenChange={setShowAddModelDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Model</DialogTitle>
          </DialogHeader>
          <AddModelDialog
            initialFolderPath={selectedFolderPath}
            onOpenChange={setShowAddModelDialog}
            open={showAddModelDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to organize files by category based on folder paths
function organizeFilesByCategory(
  files: FileEntry[] | undefined,
  isPrivate: boolean,
  nodeCategories: NodeCategories,
): FileList[] {
  if (!files) return [];

  const result: FileList[] = [];
  const categoryMap = new Map<string, FilePaths[]>();

  // Initialize categories
  for (const [category, _] of Object.entries(nodeCategories)) {
    categoryMap.set(category, []);
  }

  // Process each file
  for (const file of files) {
    // Only process files (type 1), not folders
    if (file.type === 1) {
      const filePath = file.path;
      const folderPath = filePath.split("/")[0]; // Get the top-level folder

      // Find matching category
      for (const [category, config] of Object.entries(nodeCategories)) {
        const folders = Array.isArray(config.folder)
          ? config.folder
          : [config.folder];

        if (folders.includes(folderPath)) {
          // Skip files in subdirectories if onlyRootFiles is true
          if (config.onlyRootFiles) {
            // Check if this is a file directly in the root folder
            // The path should have exactly one slash or none (top level file)
            const parts = filePath.split("/");
            if (parts.length > 2) {
              continue; // Skip this file, it's in a subdirectory
            }
          }

          const existingPaths = categoryMap.get(category) || [];
          existingPaths.push({
            name: filePath,
            volumeType: isPrivate ? "private" : "public",
          });
          categoryMap.set(category, existingPaths);
        }
      }
    }
  }

  // Convert map to array
  for (const [category, filePaths] of categoryMap.entries()) {
    if (filePaths.length > 0) {
      result.push({ category, filePaths });
    }
  }

  return result;
}

export function getVolumeFileList(
  privateFiles: FileEntry[] | undefined,
  publicFiles: FileEntry[] | undefined,
  nodes: NodeCategories,
): FileList[] {
  const privateFileList = organizeFilesByCategory(privateFiles, true, nodes);
  const publicFileList = organizeFilesByCategory(publicFiles, false, nodes);

  // Merge the two lists
  const mergedList: FileList[] = [...privateFileList];

  for (const publicCategory of publicFileList) {
    const existingCategory = mergedList.find(
      (item) => item.category === publicCategory.category,
    );

    if (existingCategory) {
      // Merge file paths if category already exists
      existingCategory.filePaths = [
        ...existingCategory.filePaths,
        ...publicCategory.filePaths,
      ];
    } else {
      // Add new category if it doesn't exist
      mergedList.push(publicCategory);
    }
  }

  return mergedList;
}

export const StatusTooltip = ({
  children,
  content,
  variant,
}: {
  children: React.ReactNode;
  content: string | React.ReactNode;
  variant: "destructive" | "yellow" | "success";
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger className="flex items-center">
        <Badge variant={variant}>{children}</Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-[300px]">
        <p className="break-words">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const OptionList = memo(
  ({
    workflowNodeList,
    selectedNode,
    setSelectedNode,
    isModelBrowserExpanded,
    privateFiles,
    publicFiles,
    isLoading,
    isModal = false,
  }: {
    workflowNodeList: WorkflowNode[] | undefined;
    selectedNode: WorkflowNode | null;
    setSelectedNode: (node: WorkflowNode | null) => void;
    isModelBrowserExpanded: boolean;
    privateFiles: FileEntry[] | undefined;
    publicFiles: FileEntry[] | undefined;
    isLoading: boolean;
    isModal?: boolean;
  }) => {
    const [fileList, setFileList] = useState<FileList[]>([]);

    // Get all node types that exist in the workflow
    const defaultExpandedValues = useMemo(
      () =>
        Object.values(NodeToBeFocus)
          .map((node) => node.type)
          .filter((type) =>
            workflowNodeList?.some((wNode) => wNode.type === type),
          ),
      [workflowNodeList],
    );

    // Replace the single accordionValue with an array of values
    const [accordionValues, setAccordionValues] = useState<string[]>(
      defaultExpandedValues,
    );

    useEffect(() => {
      const files = getVolumeFileList(privateFiles, publicFiles, NodeToBeFocus);
      setFileList(files);
    }, [privateFiles, publicFiles]);

    const isNodeSuccessful = (nodeValue: string, category: string) => {
      // If no value, it's not successful
      if (!nodeValue) return false;

      return (
        fileList.some((f) => f.category === category) &&
        fileList.some((f) =>
          f.filePaths.some((filePath) => {
            // Compare with the extracted path (without top dir)
            const extractedPath = extractModelPathWithoutTopDir(filePath.name);
            return extractedPath === nodeValue;
          }),
        )
      );
    };

    const calculateSuccessRatio = (category: string, type: string) => {
      if (!workflowNodeList) return { success: 0, total: 0 };
      const categoryNodes = workflowNodeList.filter(
        (node) => node.type === type,
      );
      const nodeToFocus = NodeToBeFocus[category];
      const numInputs = nodeToFocus.noOfNodes || 1;
      const totalInputs = categoryNodes.length * numInputs;
      const successfulInputs = categoryNodes.reduce((acc, node) => {
        return (
          acc +
          node.widgets_values
            .slice(0, numInputs)
            .filter((value) => isNodeSuccessful(value, category)).length
        );
      }, 0);
      return { success: successfulInputs, total: totalInputs };
    };

    const HandleNodeStatus = memo(
      ({
        category,
        nodeData,
      }: {
        category: string;
        nodeData: WorkflowNode;
      }) => {
        const nodeToFocus = NodeToBeFocus[category];
        const numInputs = nodeToFocus.noOfNodes || 1;
        const nodeValues = nodeData.widgets_values.slice(0, numInputs);

        return (
          <div className="flex flex-row gap-1 whitespace-nowrap">
            {nodeValues.map((value, index) => (
              <StatusBadge
                key={`${category}-${nodeToFocus.folder}-${index}`}
                value={value}
                category={category}
                folder={nodeToFocus.folder}
              />
            ))}
          </div>
        );
      },
    );

    const StatusBadge = memo(
      ({
        value,
        category,
        folder,
      }: {
        value: string;
        category: string;
        folder: string | string[];
      }) => {
        if (!value) {
          return (
            <StatusTooltip
              content={`Please add a ${category} file for it!`}
              variant="destructive"
            >
              Empty
            </StatusTooltip>
          );
        }

        if (!isNodeSuccessful(value, category)) {
          const folders = Array.isArray(folder) ? folder.join(", ") : folder;
          return (
            <StatusTooltip
              content={
                <div>
                  Fail to find the <b>"{value}"</b> file! Please update / add it
                  back to the <b>{folders}</b> folder.
                </div>
              }
              variant="yellow"
            >
              Not Exist
            </StatusTooltip>
          );
        }

        return (
          <StatusTooltip
            content={
              <div>
                File found! [<b>{value}</b>]
              </div>
            }
            variant="success"
          >
            <Check size={18} />
          </StatusTooltip>
        );
      },
    );

    if (!workflowNodeList || workflowNodeList.length === 0)
      return <div>You are all set!</div>;
    if (publicFiles === undefined && privateFiles === undefined)
      return (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={`skeleton-${index}-${Math.random()}`}
              className="h-[60px] w-full"
            />
          ))}
        </div>
      );

    return (
      <div>
        <div className="flex items-center justify-between gap-2">
          {!isModal ? (
            <span className="block text-muted-foreground text-sm leading-normal">
              Model Check helps find missing models and inputs for your
              workflow.
            </span>
          ) : (
            <span className="block text-muted-foreground text-sm leading-normal">
              Click on a node to zoom in.
            </span>
          )}
          <Button
            variant={"outline"}
            className="shrink-0"
            onClick={() => {
              if (accordionValues.length > 0) {
                setAccordionValues([]);
              } else {
                setAccordionValues(defaultExpandedValues);
              }
            }}
          >
            {accordionValues.length > 0 ? (
              <div className="flex flex-row items-center gap-2">
                <span>Collapse</span>
                <ChevronsDownUp className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex flex-row items-center gap-2">
                <span>Expand</span>
                <ChevronsUpDown className="h-4 w-4" />
              </div>
            )}
          </Button>
        </div>
        <ScrollArea hideHorizontal>
          <div className="max-h-[70vh]">
            <Accordion
              type="multiple"
              value={accordionValues}
              onValueChange={setAccordionValues}
            >
              {Object.entries(NodeToBeFocus)
                .map(([category, node]) => {
                  const matchingNodes = workflowNodeList?.filter(
                    (wNode) => wNode.type === node.type,
                  );
                  const { success, total } = calculateSuccessRatio(
                    category,
                    node.type,
                  );
                  const successPercentage =
                    total > 0 ? (success / total) * 100 : 0;
                  return {
                    category,
                    node,
                    success,
                    total,
                    successPercentage,
                    matchingNodes,
                  };
                })
                .filter((item) => item.matchingNodes?.length > 0)
                .map(
                  ({
                    category,
                    node,
                    success,
                    total,
                    successPercentage,
                    matchingNodes,
                  }) => (
                    <AccordionItem value={node.type} key={node.type}>
                      <AccordionTrigger className="py-3 text-base">
                        <div
                          className={`flex w-full flex-row items-center justify-between ${
                            successPercentage === 100
                              ? "opacity-60"
                              : "opacity-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                              {category}
                            </div>
                            {success < total ? (
                              <Badge variant="yellow">
                                {total - success} missing
                              </Badge>
                            ) : (
                              <Badge variant="success">Complete</Badge>
                            )}
                          </div>
                          <div className="flex flex-row items-center gap-2">
                            <Progress
                              value={successPercentage}
                              className="w-24"
                            />
                            <span className="w-12 text-right text-sm">
                              ({success}/{total})
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm">
                        {matchingNodes
                          .sort((a, b) => a.id - b.id)
                          .map((workflowNode, index) => (
                            <div
                              key={`${workflowNode.type}-${workflowNode.id}-${index}`}
                              className={cn(
                                "mb-0.5 flex flex-col items-center gap-2 rounded-[4px] px-2 py-2",
                                index % 2 === 1
                                  ? "bg-gray-100 dark:bg-zinc-700/50"
                                  : "",
                                isModelBrowserExpanded || isModal
                                  ? ""
                                  : "md:flex-row md:justify-between",
                              )}
                            >
                              <div
                                className={cn(
                                  "flex w-full flex-row items-center justify-between gap-2",
                                  isModelBrowserExpanded || isModal
                                    ? ""
                                    : "md:w-1/3",
                                )}
                              >
                                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                                <p
                                  className={cn(
                                    "overflow-hidden truncate whitespace-nowrap",
                                    isModal && "cursor-pointer hover:underline",
                                  )}
                                  onClick={() => {
                                    if (isModal) {
                                      sendEventToCD("zoom_to_node", {
                                        nodeId: workflowNode.id,
                                        position: workflowNode.pos,
                                      });
                                    }
                                  }}
                                >
                                  {`${workflowNode.type} #${workflowNode.id}`}
                                </p>
                                <HandleNodeStatus
                                  category={category}
                                  nodeData={workflowNode}
                                />
                              </div>
                              <div
                                className={cn(
                                  "w-full",
                                  isModelBrowserExpanded || isModal
                                    ? ""
                                    : "md:w-1/2",
                                )}
                              >
                                <ModelSelectComboBox
                                  selectedNode={workflowNode}
                                  setSelectedNode={setSelectedNode}
                                  fileList={fileList}
                                />
                              </div>
                            </div>
                          ))}
                      </AccordionContent>
                    </AccordionItem>
                  ),
                )}
            </Accordion>
          </div>
        </ScrollArea>
      </div>
    );
  },
);

// Clean up duplicate functions and replace with a single, well-named utility function
export function extractModelPathWithoutTopDir(path: string) {
  if (!path) return "";

  // Split the path by '/'
  const parts = path.split("/");

  // If there's only one part or no parts, return the original path
  if (parts.length <= 1) return path;

  // Remove only the first part (top-level category folder)
  // But keep all subdirectories and the filename
  return parts.slice(1).join("/");
}

export function ModelSelectComboBox({
  selectedNode,
  setSelectedNode,
  fileList,
}: {
  selectedNode: WorkflowNode;
  setSelectedNode: (node: WorkflowNode) => void;
  fileList: FileList[];
}) {
  const [openStates, setOpenStates] = useState<boolean[]>([]);

  // Find the category for this node type
  const nodeCategory = useMemo(() => {
    return Object.entries(NodeToBeFocus).find(
      ([_, config]) => config.type === selectedNode.type,
    )?.[0];
  }, [selectedNode.type]);

  // Get files for this category
  const categoryFiles = useMemo(() => {
    if (!nodeCategory) return null;
    return fileList.find((file) => file.category === nodeCategory);
  }, [nodeCategory, fileList]);

  // Number of inputs for this node type
  const numInputs = useMemo(() => {
    if (!nodeCategory) return 1;
    return NodeToBeFocus[nodeCategory].noOfNodes || 1;
  }, [nodeCategory]);

  // Initialize open states
  useEffect(() => {
    setOpenStates(new Array(numInputs).fill(false));
  }, [numInputs]);

  const processedFiles = useMemo(() => {
    if (!categoryFiles) return [];

    // Create a Map to store unique files by displayPath
    const uniqueFiles = new Map();

    for (const file of categoryFiles.filePaths) {
      const displayPath = extractModelPathWithoutTopDir(file.name);
      // Only keep the first occurrence of each displayPath
      if (!uniqueFiles.has(displayPath)) {
        uniqueFiles.set(displayPath, {
          ...file,
          displayPath,
        });
      }
    }

    // Convert Map values back to array
    return Array.from(uniqueFiles.values());
  }, [categoryFiles]);

  const renderComboBox = (index: number) => {
    const currentValue = selectedNode.widgets_values[index] || "";
    const isValid = processedFiles.some(
      (file) => file.name === currentValue || file.displayPath === currentValue,
    );

    return (
      <div
        key={`combobox-${selectedNode.id}-${index}`}
        className="mb-2 last:mb-0"
      >
        <Popover
          open={openStates[index]}
          onOpenChange={(open) => {
            const newStates = [...openStates];
            newStates[index] = open;
            setOpenStates(newStates);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openStates[index]}
              className={cn(
                "w-full justify-between rounded-md",
                !currentValue || isValid
                  ? ""
                  : "border-yellow-500 bg-yellow-50/80 dark:border-yellow-500 dark:bg-yellow-900/50",
              )}
            >
              <span className="truncate">
                {currentValue ? currentValue : "Select model..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search files..." />
              <CommandList>
                <CommandEmpty>No files found.</CommandEmpty>
                <CommandGroup>
                  {processedFiles.map((file) => (
                    <CommandItem
                      key={`${file.name}-${index}`}
                      value={file.name}
                      onSelect={() => {
                        // Create a copy of the widgets_values array
                        const newWidgetsValues = [
                          ...selectedNode.widgets_values,
                        ];

                        // Ensure the array is long enough
                        while (newWidgetsValues.length <= index) {
                          newWidgetsValues.push("");
                        }

                        // Store the model path without the top directory
                        // This preserves subdirectories like "upscale/x4-upscaler-ema.safetensors"
                        newWidgetsValues[index] = file.displayPath;

                        // Create a new node object with the updated widgets_values
                        const updatedNode = {
                          ...selectedNode,
                          widgets_values: newWidgetsValues,
                        };

                        // Update the selected node
                        setSelectedNode(updatedNode);

                        // Close the popover
                        const newStates = [...openStates];
                        newStates[index] = false;
                        setOpenStates(newStates);
                      }}
                    >
                      <div className="flex items-center">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            currentValue === file.displayPath
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <span>{file.displayPath}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // If no category files are available, show a message
  if (!categoryFiles || categoryFiles.filePaths.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No models available for this node type.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {Array.from({ length: numInputs }, (_, index) => renderComboBox(index))}
    </div>
  );
}

// ---------------deprecated----------------
function NodeDisplay({
  selectedNode,
  setSelectedNode,
  fileList,
}: {
  selectedNode: WorkflowNode;
  setSelectedNode: (node: WorkflowNode) => void;
  fileList: FileList[];
}) {
  return (
    <div className="relative p-4 md:p-10">
      <div
        className="-z-[1] absolute inset-0 min-h-[100px] overflow-hidden border border-neutral-600 bg-[#212121] shadow-lg"
        style={{
          backgroundImage: `
              linear-gradient(to right, #1B1B1B 1px, transparent 1px),
              linear-gradient(to bottom, #1B1B1B 1px, transparent 1px)
            `,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="flex justify-end px-2 py-1">
        <h3 className="rounded-[8px] bg-green-950 px-2 text-white text-xs">
          #{selectedNode.id}
        </h3>
      </div>
      <div className="min-h-[100px] rounded-xl border border-neutral-600 bg-neutral-700 shadow-lg outline outline-gray-400 outline-offset-4">
        {/* Header */}
        <div className="flex items-center gap-3 border-neutral-800 border-b px-4 py-2">
          <div className="h-3 w-3 rounded-full bg-neutral-600" />
          <h3 className="text-gray-300">{selectedNode.type}</h3>
        </div>

        {/* Inputs and Outputs */}
        <div className="flex flex-row justify-between px-4 py-2">
          {/* Inputs */}
          <div className="flex flex-col gap-1">
            {selectedNode.inputs?.map((input, index) => (
              <div
                key={`input-${input.name}-${index}`}
                className="flex items-center gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-purple-400" />
                <span className="text-gray-300 text-sm">{input.name}</span>
              </div>
            ))}
          </div>

          {/* Outputs */}
          <div className="flex flex-col items-end gap-1">
            {selectedNode.outputs?.map((output, index) => (
              <div
                key={`output-${output.name}-${index}`}
                className="flex items-center gap-2"
              >
                <span className="text-gray-300 text-sm">{output.name}</span>
                <div className="h-2 w-2 rounded-full bg-pink-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          <ModelSelectComboBox
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            fileList={fileList}
          />
        </div>
      </div>
    </div>
  );
}
