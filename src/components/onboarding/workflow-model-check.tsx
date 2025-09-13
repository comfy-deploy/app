import { useImportWorkflowStore, type StepValidation } from "@/components/onboarding/workflow-import";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  ChevronsUpDown,
} from "lucide-react";
import { memo, useEffect, useMemo, useState, useCallback } from "react";
import { FolderTree } from "@/components/models/folder-tree";
import { ModelSelectorDialog } from "@/components/models/model-selector-dialog";
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
  // Disabled LoadImage as requested - users will configure in workspace
  // Image: {
  //   type: "LoadImage",
  //   folder: "input",
  //   onlyRootFiles: true,
  // },
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
  workflow: propWorkflow,
  onWorkflowUpdate,
}: {
  workflow?: string;
  onWorkflowUpdate?: (workflow: any) => void;
} = {}) {
  const validation = useImportWorkflowStore();
  const setValidation = validation.setValidation;

  // Use props if provided (navbar context), otherwise use Zustand store (import context)
  const workflow = propWorkflow || validation.workflowJson;
  const updateWorkflowJson = validation.setWorkflowJson;
  const updateImportJson = validation.setImportJson;
  const importOption = validation.importOption;

  // Simplified workflow update - directly update the store or call callback
  const updateNodeInWorkflow = useCallback((nodeId: number, widgetValues: string[]) => {
    try {
      const parsedWorkflow = JSON.parse(workflow || '{}');
      const nodeIndex = parsedWorkflow.nodes?.findIndex(
        (node: any) => node.id === nodeId,
      );

      if (nodeIndex !== -1) {
        // Update the specific node's widget values
        parsedWorkflow.nodes[nodeIndex].widgets_values = widgetValues;
        useImportWorkflowStore.getState().setWorkflowJson(JSON.stringify(parsedWorkflow));
        // console.log(useImportWorkflowStore.getState());
      }
    } catch (e) {
      console.error("Error updating workflow:", e);
    }
  }, [workflow, importOption, updateImportJson, updateWorkflowJson, onWorkflowUpdate]);

  const [isModelBrowserExpanded, setIsModelBrowserExpanded] = useState(false);
  const [showAddModelDialog, setShowAddModelDialog] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState("");

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
    if (!workflow) return [];
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

  if (!workflow) return null;


  // Hide entire component if no nodes to focus on
  // if (!nodesToFocus || nodesToFocus.length === 0) {
  //   return null;
  // }

  return (
    <div className="flex h-full gap-4">
      <div className="w-full flex-1">
        <OptionList
          workflowNodeList={nodesToFocus}
          updateNodeInWorkflow={updateNodeInWorkflow}
          isModelBrowserExpanded={isModelBrowserExpanded}
          privateFiles={privateFiles}
          publicFiles={publicFiles}
          isLoading={isLoadingPrivate || isLoadingPublic}
          isModal={false}
        />
      </div>
      {/* {true && (
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
      )} */}

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

// Removed StatusTooltip as we're using inline tooltips now

const OptionList = memo(
  ({
    workflowNodeList,
    updateNodeInWorkflow,
    isModelBrowserExpanded,
    privateFiles,
    publicFiles,
    isLoading,
    isModal = false,
  }: {
    workflowNodeList: WorkflowNode[] | undefined;
    updateNodeInWorkflow: (nodeId: number, widgetValues: string[]) => void;
    isModelBrowserExpanded: boolean;
    privateFiles: FileEntry[] | undefined;
    publicFiles: FileEntry[] | undefined;
    isLoading: boolean;
    isModal?: boolean;
  }) => {
    const [fileList, setFileList] = useState<FileList[]>([]);
    const [showCompleted, setShowCompleted] = useState(false);

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

    // Get all node types that exist in the workflow AND have missing items
    const defaultExpandedValues = useMemo(() => {
      if (!workflowNodeList || fileList.length === 0) {
        // If no file list yet, expand all incomplete
        return Object.entries(NodeToBeFocus)
          .filter(([category, node]) => {
            const matchingNodes = workflowNodeList?.filter(
              (wNode) => wNode.type === node.type,
            );
            if (!matchingNodes || matchingNodes.length === 0) return false;

            const { success, total } = calculateSuccessRatio(category, node.type);
            return success < total; // Only include if incomplete
          })
          .map(([_, node]) => node.type);
      }

      // Only expand categories that have missing items
      return Object.entries(NodeToBeFocus)
        .filter(([category, node]) => {
          const matchingNodes = workflowNodeList.filter(
            (wNode) => wNode.type === node.type,
          );
          if (matchingNodes.length === 0) return false;

          const { success, total } = calculateSuccessRatio(category, node.type);
          return success < total; // Only expand if there are missing items
        })
        .map(([_, node]) => node.type);
    }, [workflowNodeList, fileList]);

    // Replace the single accordionValue with an array of values
    const [accordionValues, setAccordionValues] = useState<string[]>(
      defaultExpandedValues,
    );

    useEffect(() => {
      const files = getVolumeFileList(privateFiles, publicFiles, NodeToBeFocus);
      setFileList(files);
    }, [privateFiles, publicFiles]);

    // Update accordion values when defaultExpandedValues changes
    useEffect(() => {
      setAccordionValues(defaultExpandedValues);
    }, [defaultExpandedValues]);

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
          <div className="flex flex-row gap-0.5 whitespace-nowrap">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-destructive text-xs">Empty</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Please add a {category} file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        if (!isNodeSuccessful(value, category)) {
          const folders = Array.isArray(folder) ? folder.join(", ") : folder;
          
          // Special handling for LoadImage nodes to provide better guidance
          if (category === "Image") {
            return (
              <StatusTooltip
                content={
                  <div className="space-y-2">
                    <div>
                      Fail to find the <b>"{value}"</b> file! 
                    </div>
                    <div className="text-xs text-muted-foreground">
                      💡 <b>Tip:</b> You can replace this image file in your workspace by uploading a new image with the same name, or update the LoadImage node to reference a different image file.
                    </div>
                  </div>
                }
                variant="yellow"
              >
                Not Exist
              </StatusTooltip>
            );
          }
          
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-yellow-600 dark:text-yellow-500 text-xs">Not Exist</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Cannot find "{value}" in {folders} folder</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return (
          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
        );
      },
    );



    // Separate completed and incomplete categories
    const categorizedItems = useMemo(() => {
      const items = Object.entries(NodeToBeFocus)
        .map(([category, node]) => {
          const matchingNodes = workflowNodeList?.filter(
            (wNode) => wNode.type === node.type,
          );
          const { success, total } = calculateSuccessRatio(category, node.type);
          const successPercentage = total > 0 ? (success / total) * 100 : 0;
          return {
            category,
            node,
            success,
            total,
            successPercentage,
            matchingNodes,
            isComplete: successPercentage === 100,
          };
        })
        .filter((item) => item?.matchingNodes?.length ?? 0 > 0);

      console.log(items);

      return {
        incomplete: items.filter((item) => !item.isComplete),
        complete: items.filter((item) => item.isComplete),
      };
    }, [workflowNodeList, fileList]);

    const itemsToDisplay = showCompleted
      ? [...categorizedItems.incomplete, ...categorizedItems.complete]
      : categorizedItems.incomplete;

    // if (!workflowNodeList || workflowNodeList.length === 0)
    //   return <div>You are all set!</div>;

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
        <div className="mb-3 flex items-center justify-between gap-2">
          {!isModal ? (
            <span className="block text-muted-foreground text-sm">
              {categorizedItems.incomplete.length > 0 ? "Missing Models" : "All Models Complete"}
            </span>
          ) : (
            <span className="block text-muted-foreground text-sm">
              Click on a node to zoom in.
            </span>
          )}
          <div className="flex items-center gap-2">
            {/* {categorizedItems.complete.length > 0 && ( */}
            <Button
              variant={"ghost"}
              size="sm"
              className="h-7 shrink-0 text-xs"
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? "Hide" : "Show"} Completed ({categorizedItems.complete.length})
              <Check className="ml-1 h-3 w-3 text-green-600 dark:text-green-500" />
            </Button>
            {/* )} */}
            <Button
              variant={"ghost"}
              size="sm"
              className="h-7 shrink-0 text-xs"
              onClick={() => {
                // Get all visible categories
                const visibleCategories = itemsToDisplay.map((item) => item.node.type);

                if (accordionValues.length === visibleCategories.length) {
                  // If all are expanded, collapse all
                  setAccordionValues([]);
                } else {
                  // Otherwise, expand all visible
                  setAccordionValues(visibleCategories);
                }
              }}
            >
              {accordionValues.length > 0 ? "Collapse All" : "Expand All"}
              <ChevronsUpDown className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {/* Show incomplete models first */}
          <Accordion
            type="multiple"
            value={accordionValues}
            onValueChange={setAccordionValues}
            className="space-y-3"
          >
            {itemsToDisplay.map(
              ({
                category,
                node,
                success,
                total,
                successPercentage,
                matchingNodes,
                isComplete,
              }, index) => (
                <>
                  {/* Add separator before first complete item */}
                  {showCompleted &&
                    index === categorizedItems.incomplete.length &&
                    categorizedItems.incomplete.length > 0 &&
                    categorizedItems.complete.length > 0 && (
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center bg-background px-2 text-xs">
                          <span className="text-muted-foreground">Completed Models</span>
                        </div>
                      </div>
                    )}
                  <AccordionItem value={node.type} key={node.type} className="border rounded-lg">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex w-full flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {category}
                          </span>
                          {success < total ? (
                            <span className="text-xs text-yellow-600 dark:text-yellow-500">
                              {total - success} missing
                            </span>
                          ) : (
                            <span className="text-xs text-green-600 dark:text-green-500">Complete</span>
                          )}
                        </div>
                        <span className="mr-1 text-xs text-muted-foreground">
                          ({success}/{total})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-2 pt-0">
                      {matchingNodes
                        .sort((a, b) => a.id - b.id)
                        .map((workflowNode, index) => (
                          <div
                            key={`${workflowNode.type}-${workflowNode.id}-${index}`}
                            className={cn(
                              "flex gap-2 py-1.5",
                              index > 0 && "border-t",
                              isModelBrowserExpanded || isModal
                                ? "flex-col items-start"
                                : "items-center justify-between"
                            )}
                          >
                            <div className={cn(
                              "flex items-center gap-2",
                              isModelBrowserExpanded || isModal ? "w-full" : "flex-1"
                            )}>
                              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                              <p
                                className={cn(
                                  "text-xs text-muted-foreground",
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
                                #{workflowNode.id}
                              </p>
                              <HandleNodeStatus
                                category={category}
                                nodeData={workflowNode}
                              />
                            </div>
                            <div className={cn(
                              "flex items-center",
                              isModelBrowserExpanded || isModal
                                ? "w-full justify-start"
                                : "flex-1 justify-end"
                            )}>
                              <ModelSelectComboBox
                                workflowNode={workflowNode}
                                updateNodeInWorkflow={updateNodeInWorkflow}
                                fileList={fileList}
                              />
                            </div>
                          </div>
                        ))}
                    </AccordionContent>
                  </AccordionItem>
                </>
              ))}
          </Accordion>
        </div>
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
  workflowNode,
  updateNodeInWorkflow,
  fileList,
}: {
  workflowNode: WorkflowNode;
  updateNodeInWorkflow: (nodeId: number, widgetValues: string[]) => void;
  fileList: FileList[];
}) {
  const [openStates, setOpenStates] = useState<boolean[]>([]);
  const [selectorDialogOpen, setSelectorDialogOpen] = useState(false);
  const [selectedInputIndex, setSelectedInputIndex] = useState<number>(0);

  // Find the category for this node type
  const nodeCategory = useMemo(() => {
    return Object.entries(NodeToBeFocus).find(
      ([_, config]) => config.type === workflowNode.type,
    )?.[0];
  }, [workflowNode.type]);

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

  const handleModelSelect = (modelPath: string) => {
    // Create a copy of the widgets_values array
    const newWidgetsValues = [...workflowNode.widgets_values];

    // Ensure the array is long enough
    while (newWidgetsValues.length <= selectedInputIndex) {
      newWidgetsValues.push("");
    }

    // Extract model path without top directory (to match existing format)
    const displayPath = extractModelPathWithoutTopDir(modelPath);
    newWidgetsValues[selectedInputIndex] = displayPath;

    // Directly update the workflow with the new widget values
    updateNodeInWorkflow(workflowNode.id, newWidgetsValues);
    setSelectorDialogOpen(false);
  };

  const renderComboBox = (index: number) => {
    const currentValue = workflowNode.widgets_values[index] || "";
    const isValid = processedFiles.some(
      (file) => file.name === currentValue || file.displayPath === currentValue,
    );

    return (
      <div key={`combobox-${workflowNode.id}-${index}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedInputIndex(index);
            setSelectorDialogOpen(true);
          }}
          className={cn(
            "h-7 min-w-[200px] max-w-[300px] justify-between px-2 text-xs",
            !currentValue || isValid
              ? ""
              : "border-yellow-500 bg-yellow-50/50 dark:border-yellow-500 dark:bg-yellow-900/20",
          )}
        >
          <span className="truncate">
            {currentValue ? currentValue : "Select model..."}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </div>
    );
  };

  // If no category files are available, show a message
  if (!categoryFiles || categoryFiles.filePaths.length === 0) {
    return (
      <div className="text-muted-foreground text-xs">
        No models available
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {Array.from({ length: numInputs }, (_, index) => renderComboBox(index))}
      </div>

      <ModelSelectorDialog
        open={selectorDialogOpen}
        onOpenChange={setSelectorDialogOpen}
        onModelSelect={handleModelSelect}
        currentValue={workflowNode.widgets_values[selectedInputIndex] || ""}
        category={nodeCategory}
        title={`Select ${nodeCategory ? nodeCategory.charAt(0).toUpperCase() + nodeCategory.slice(1) : "Model"}`}
        description={`Browse and select a model for ${workflowNode.type}`}
      />
    </>
  );
}