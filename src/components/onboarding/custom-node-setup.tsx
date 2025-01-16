import type {
  CustomNodeData,
  DockerCommandStep,
  MachineStepValidation,
} from "@/components/machines/machine-create";
import type { StepComponentProps } from "@/components/step-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getBranchInfo } from "@/hooks/use-github-branch-info";
import type { BranchInfoData } from "@/hooks/use-github-branch-info";
import { cn } from "@/lib/utils";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ChevronRight,
  ExternalLink,
  Minus,
  Pencil,
  Plus,
  Save,
  Search,
  Star,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";

export type DefaultCustomNodeData = {
  title: string;
  author: string;
  reference: string;
  pip: string[];
  files: string[];
  install_type: string;
  description: string;
};

type DefaultCustomNodeStats = Record<
  string,
  {
    stars: number;
    last_update: string;
    author_account_age_days: number;
  }
>;

const BLACKLIST = [
  "https://github.com/ltdrdata/ComfyUI-Manager",
  "https://github.com/kulsisme/openart-comfyui-deploy",
  // "https://github.com/BennyKok/comfyui-deploy",
  // Add more blacklisted references here
  "https://github.com/mrhan1993/ComfyUI-Fooocus",
];

const POPULAR_NODES = [
  "https://github.com/WASasquatch/was-node-suite-comfyui",
  "https://github.com/ltdrdata/ComfyUI-Impact-Pack",
  "https://github.com/cubiq/ComfyUI_IPAdapter_plus",
  "https://github.com/cubiq/ComfyUI_essentials",
  "https://github.com/kijai/ComfyUI-KJNodes",
];

function isCustomNodeData(
  step: DockerCommandStep,
): step is DockerCommandStep & { data: CustomNodeData } {
  return step.type === "custom-node";
}

const updateNodeWithBranchInfo = async (
  node: DockerCommandStep,
  setValidation: (validation: MachineStepValidation) => void,
) => {
  if (!isCustomNodeData(node)) return;

  try {
    const branchInfo = await getBranchInfo(node.data.url);
    if (!branchInfo?.commit.sha) {
      throw new Error("Could not fetch latest commit hash");
    }

    setValidation((prev) => ({
      ...prev,
      docker_command_steps: {
        steps: prev.docker_command_steps.steps.map((step) =>
          step.id === node.id && isCustomNodeData(step)
            ? {
                ...step,
                data: {
                  ...step.data,
                  hash: branchInfo.commit.sha,
                  meta: {
                    message: branchInfo.commit.commit.message,
                    committer: branchInfo.commit.commit.committer,
                    latest_hash: branchInfo.commit.sha,
                    stargazers_count: branchInfo.stargazers_count,
                    commit_url: branchInfo.commit.html_url,
                  },
                },
              }
            : step,
        ),
      },
    }));

    toast.success("Updated to latest commit");
  } catch (error) {
    console.error("Failed to update hash:", error);
    toast.error("Failed to fetch repository information");
  }
};

export function CustomNodeSetup({
  validation,
  setValidation,
}: StepComponentProps<MachineStepValidation>) {
  return (
    <div>
      <div className="mb-2">
        <span className="font-medium text-sm">Custom Nodes </span>
        <div className="hidden lg:block">
          <DesktopLayout
            validation={validation}
            setValidation={setValidation}
          />
        </div>
        <div className="block lg:hidden">
          <MobileLayout validation={validation} setValidation={setValidation} />
        </div>
      </div>
    </div>
  );
}

// ==============================

function DesktopLayout({
  validation,
  setValidation,
}: StepComponentProps<MachineStepValidation>) {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={50} minSize={40} collapsible>
        <SearchNodeList validation={validation} setValidation={setValidation} />
      </ResizablePanel>
      <ResizableHandle className="mx-2" withHandle />
      <ResizablePanel defaultSize={50} minSize={40} collapsible>
        <SelectedNodeList
          validation={validation}
          setValidation={setValidation}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function MobileLayout({
  validation,
  setValidation,
}: StepComponentProps<MachineStepValidation>) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div>
      <SelectedNodeList
        validation={validation}
        setValidation={setValidation}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
      />
      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <SearchNodeList
              validation={validation}
              setValidation={setValidation}
            />
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>
              <Button variant="outline" className="w-full">
                Done
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// ==============================

function SearchNodeList({
  validation,
  setValidation,
}: StepComponentProps<MachineStepValidation>) {
  const { data, isLoading } = useQuery<DefaultCustomNodeData[]>({
    queryKey: ["custom-node-list"],
    queryFn: async () => {
      const response = await fetch(
        "https://raw.githubusercontent.com/ltdrdata/ComfyUI-Manager/main/custom-node-list.json",
      );
      const json = await response.json();
      return json.custom_nodes;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: defaultCustomNodeStats } = useQuery<DefaultCustomNodeStats>({
    queryKey: ["custom-node-stats"],
    queryFn: async () => {
      const response = await fetch(
        "https://raw.githubusercontent.com/ltdrdata/ComfyUI-Manager/refs/heads/main/github-stats.json",
      );
      const json = await response.json();
      return json;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null);

  const handleAddNode = async (node: DefaultCustomNodeData) => {
    const nodeRefLower = node.reference.toLowerCase();
    if (
      validation.docker_command_steps.steps.some(
        (step) =>
          isCustomNodeData(step) &&
          step.data.url.toLowerCase() === nodeRefLower,
      )
    ) {
      return;
    }

    try {
      const branchInfo = await getBranchInfo(node.reference);
      const newNode: DockerCommandStep = {
        id: crypto.randomUUID().slice(0, 10),
        type: "custom-node",
        data: {
          name: node.title,
          url: node.reference,
          files: node.files,
          install_type: "git-clone",
          pip: node.pip,
          hash: branchInfo?.commit.sha,
          meta: {
            message: branchInfo?.commit.commit.message,
            committer: (branchInfo?.commit.commit as any).committer,
            latest_hash: branchInfo?.commit.sha,
            stargazers_count: branchInfo?.stargazers_count,
            commit_url: (branchInfo?.commit as any).html_url,
          },
        },
      };

      setValidation((prev) => ({
        ...prev,
        docker_command_steps: {
          steps: [...prev.docker_command_steps.steps, newNode],
        },
      }));
    } catch (error) {
      console.error("Failed to fetch branch info:", error);
      toast.error("Failed to fetch repository information");
    }
  };

  const nonBlacklistedNodes = useMemo(() => {
    if (!data) return [];

    const lowerCaseBlacklist = new Set(BLACKLIST.map((x) => x.toLowerCase()));
    const lowerCasePopular = new Set(POPULAR_NODES.map((x) => x.toLowerCase()));

    // Filter out blacklisted nodes and sort popular ones to the top
    return data
      .filter((node) => !lowerCaseBlacklist.has(node.reference.toLowerCase()))
      .sort((a, b) => {
        const aIsPopular = lowerCasePopular.has(a.reference.toLowerCase());
        const bIsPopular = lowerCasePopular.has(b.reference.toLowerCase());
        if (aIsPopular && !bIsPopular) return -1;
        if (!aIsPopular && bIsPopular) return 1;
        return 0;
      });
  }, [data]); // Only recompute when data changes

  const filteredNodes = useMemo(() => {
    if (!searchTerm) return nonBlacklistedNodes;

    const searchWords = searchTerm
      .toLowerCase()
      .replace(/[^a-z0-9]/g, " ")
      .split(" ")
      .filter(Boolean);

    return nonBlacklistedNodes.filter((node) => {
      const nodeText = `${node.title} ${node.author} ${node.reference}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, " ");

      return searchWords.every((word) => nodeText.includes(word));
    });
  }, [nonBlacklistedNodes, searchTerm]);

  const rowVirtualizer = useVirtualizer({
    count: filteredNodes.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 50, // Adjust this value based on your row height
    overscan: 30,
  });

  useEffect(() => {
    if (parentRef) {
      rowVirtualizer.measure();
    }
  }, [parentRef, filteredNodes.length]);

  return (
    <div className="flex w-full flex-col gap-4 rounded-sm border border-gray-200 bg-white px-4 pb-4 shadow-sm">
      <div className="mt-1 flex flex-row items-center border-gray-300 border-b px-2">
        <Search size={18} className="text-gray-500" />
        <div className="relative flex-1">
          <Input
            placeholder="Search by author, title, or GitHub url..."
            value={searchTerm}
            className="border-none focus-visible:outline-none focus-visible:ring-0"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="-translate-y-1/2 absolute top-1/2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="flex max-h-[400px] flex-col gap-1 overflow-y-auto">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[50px] w-full animate-pulse rounded-[6px] bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <div
          ref={setParentRef}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent mx-1 h-[500px] overflow-auto"
        >
          {filteredNodes.length === 0 ? (
            <div className="flex justify-center text-gray-500 text-sm">
              No custom nodes found.
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
                const node = filteredNodes[virtualRow.index];
                const nodeRefLower = node.reference.toLowerCase();

                return (
                  <div
                    key={nodeRefLower}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className={cn(
                      "flex items-center rounded-[6px] text-sm hover:bg-gray-100",
                      index % 2 === 0 && "bg-gray-50",
                    )}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div
                      className={cn(
                        "w-full px-2",
                        validation.docker_command_steps.steps.some(
                          (n) =>
                            isCustomNodeData(n) &&
                            n.data.url.toLowerCase() === nodeRefLower,
                        ) && "opacity-30",
                      )}
                    >
                      <div className="flex flex-row items-center justify-between">
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">
                            {POPULAR_NODES.some(
                              (p) =>
                                p.toLowerCase() ===
                                node.reference.toLowerCase(),
                            ) && "🔥 "}
                            {node.title}
                          </span>
                          <div className="flex items-center">
                            <span className="text-2xs text-gray-500 leading-snug">
                              {node.author}
                            </span>
                            <Link
                              to={node.reference}
                              target="_blank"
                              className="ml-1 inline-flex items-center text-gray-500 hover:text-gray-700"
                            >
                              <ExternalLink size={12} />
                            </Link>
                            <span className="mx-2 text-muted-foreground">
                              •
                            </span>
                            <Star
                              size={12}
                              className="mr-1 fill-yellow-400 text-yellow-400"
                            />
                            <span className="text-2xs text-gray-500 leading-snug">
                              {
                                defaultCustomNodeStats?.[
                                  Object.keys(
                                    defaultCustomNodeStats || {},
                                  ).find(
                                    (key) => key.toLowerCase() === nodeRefLower,
                                  ) ?? ""
                                ]?.stars
                              }
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <Button
                            type="button"
                            variant="ghost"
                            className="hover:bg-gray-200"
                            onClick={async () => {
                              await handleAddNode(
                                filteredNodes[virtualRow.index],
                              );
                            }}
                            disabled={validation.docker_command_steps.steps.some(
                              (n) =>
                                isCustomNodeData(n) &&
                                n.data.url.toLowerCase() === nodeRefLower,
                            )}
                          >
                            <Plus size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SelectedNodeList({
  validation,
  setValidation,
  mobileDrawerOpen,
  setMobileDrawerOpen,
}: StepComponentProps<MachineStepValidation> & {
  mobileDrawerOpen?: boolean;
  setMobileDrawerOpen?: (open: boolean) => void;
}) {
  const [editingHash, setEditingHash] = useState<string | null>(null);
  const [editingCommand, setEditingCommand] = useState<string | null>(null);
  const [scriptMode, setScriptMode] = useState(false);
  const [showNewCommand, setShowNewCommand] = useState(false);
  const [commandText, setCommandText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = validation.docker_command_steps.steps.findIndex(
        (step) => step.id === active.id,
      );
      const newIndex = validation.docker_command_steps.steps.findIndex(
        (step) => step.id === over.id,
      );

      setValidation((prev) => {
        const newSteps = [...prev.docker_command_steps.steps];
        const [removed] = newSteps.splice(oldIndex, 1);
        newSteps.splice(newIndex, 0, removed);

        return {
          ...prev,
          docker_command_steps: {
            ...prev.docker_command_steps,
            steps: newSteps,
          },
        };
      });
    }
  };

  const handleRemoveNode = (node: DockerCommandStep) => {
    setValidation((prev) => ({
      ...prev,
      docker_command_steps: {
        steps: prev.docker_command_steps.steps.filter(
          (step) => step.id !== node.id,
        ),
      },
    }));
  };

  const handleStartEdit = (node: DockerCommandStep) => {
    if (!isCustomNodeData(node)) {
      return;
    }

    setEditingHash(node.data.url);
  };

  const handleSaveHash = (node: DockerCommandStep, value: string) => {
    if (!isCustomNodeData(node)) {
      return;
    }

    // Early return if value is empty or unchanged
    if (value === node.data.hash) {
      setEditingHash(null);
      return;
    }

    setValidation((prev) => ({
      ...prev,
      docker_command_steps: {
        steps: prev.docker_command_steps.steps.map((step) =>
          isCustomNodeData(step) && step.data.url === node.data.url
            ? {
                ...step,
                data: {
                  ...(step.data as CustomNodeData),
                  hash: value || node.data.meta?.latest_hash,
                },
              }
            : step,
        ),
      },
    }));

    setEditingHash(null);
  };

  const handleSaveCommand = () => {
    setValidation((prev) => ({
      ...prev,
      isEditingHashOrAddingCommands: false,
    }));

    // Skip if empty
    if (!commandText.trim()) {
      setShowNewCommand(false);
      return;
    }

    // Create new command step
    const newCommand: DockerCommandStep = {
      id: crypto.randomUUID().slice(0, 10),
      type: "commands",
      data: commandText.replace(/\r?\n/g, "\n"), // Normalize line endings
    };

    // Add to steps
    setValidation((prev) => ({
      ...prev,
      docker_command_steps: {
        steps: [...prev.docker_command_steps.steps, newCommand],
      },
    }));

    // Reset and close
    setCommandText("");
    setShowNewCommand(false);
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-row items-center justify-between">
        <h2 className="font-medium text-md">
          Selected Nodes ({validation.docker_command_steps.steps.length})
        </h2>
        <div className="flex flex-col items-end gap-2 md:flex-row">
          {!scriptMode && (
            <Button
              size={"xs"}
              type="button"
              variant={"outline"}
              className="hidden lg:flex lg:flex-row"
              onClick={() => {
                setShowNewCommand(true);
                setValidation((prev) => ({
                  ...prev,
                  isEditingHashOrAddingCommands: true,
                }));
              }}
            >
              Commands
              <Plus size={12} className="ml-2" />
            </Button>
          )}
          <Button
            type="button"
            size={"xs"}
            variant={scriptMode ? "default" : "outline"}
            onClick={() => setScriptMode(!scriptMode)}
          >
            View JSON
            {scriptMode ? (
              <ToggleRight className="ml-2 h-4 w-4" />
            ) : (
              <ToggleLeft className="ml-2 h-4 w-4" />
            )}
          </Button>
          {!scriptMode && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  size={"xs"}
                  type="button"
                  variant={"outline"}
                  className="flex flex-row lg:hidden"
                >
                  Add Node
                  <Plus size={12} className="ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Add Node</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setMobileDrawerOpen?.(true);
                  }}
                >
                  Custom Node
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setShowNewCommand(true);
                    setValidation((prev) => ({
                      ...prev,
                      isEditingHashOrAddingCommands: true,
                    }));
                  }}
                >
                  Command
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {showNewCommand && (
        <div className="flex flex-col gap-2 rounded-[6px] border border-gray-200 bg-gray-50 p-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">New Custom Command</span>
            <div className="flex">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
                onClick={handleSaveCommand}
              >
                <Save size={14} />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-600"
                onClick={() => {
                  setCommandText("");
                  setShowNewCommand(false);
                  setValidation((prev) => ({
                    ...prev,
                    isEditingHashOrAddingCommands: false,
                  }));
                }}
              >
                <X size={14} />
              </Button>
            </div>
          </div>
          <Textarea
            value={commandText}
            onChange={(e) => setCommandText(e.target.value)}
            placeholder="RUN cd some_folder..."
            className="min-h-[100px] font-mono text-sm"
          />
        </div>
      )}

      {scriptMode ? (
        <Textarea
          placeholder="Enter your script here..."
          value={JSON.stringify(validation.docker_command_steps, null, 2)}
          className="h-[400px] font-mono text-2xs"
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              // Basic validation to ensure the structure is correct
              if (typeof parsed === "object" && Array.isArray(parsed.steps)) {
                setValidation((prev) => ({
                  ...prev,
                  docker_command_steps: parsed,
                }));
              }
            } catch (error) {
              // Optional: Show error toast when invalid JSON is entered
              toast.error("Invalid JSON format");
              console.error("Invalid JSON:", error);
            }
          }}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={validation.docker_command_steps.steps.map((node) => node.id)}
            strategy={verticalListSortingStrategy}
          >
            {validation.docker_command_steps.steps.length > 1 && (
              <span className="text-gray-500 text-xs">
                <span className="text-red-500">* </span>Long press and drag to
                reorder the nodes.
              </span>
            )}
            <div
              className={cn(
                "flex max-h-[500px] flex-col gap-1 overflow-y-auto overflow-x-hidden p-2 pb-0",
              )}
            >
              {validation.docker_command_steps.steps.length === 0 ? (
                <div className="text-gray-500 text-sm">No nodes selected.</div>
              ) : (
                validation.docker_command_steps.steps.map((node) => (
                  <SortableCustomNodeCard
                    key={node.id}
                    node={node}
                    editingHash={editingHash}
                    editingCommand={editingCommand}
                    setEditingCommand={setEditingCommand}
                    handleSaveHash={handleSaveHash}
                    handleStartEdit={handleStartEdit}
                    handleRemoveNode={handleRemoveNode}
                    setValidation={setValidation}
                    validation={validation}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableCustomNodeCard(props: {
  node: DockerCommandStep;
  editingHash: string | null;
  editingCommand: string | null;
  setEditingCommand: (command: string | null) => void;
  handleSaveHash: (node: DockerCommandStep, value: string) => void;
  handleStartEdit: (node: DockerCommandStep) => void;
  handleRemoveNode: (node: DockerCommandStep) => void;
  setValidation: (validation: MachineStepValidation) => void;
  validation: MachineStepValidation;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.node.id,
    disabled:
      (isCustomNodeData(props.node) &&
        props.editingHash === props.node.data.url) ||
      (props.node.type === "commands" &&
        props.editingCommand === props.node.id),
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    scale: isDragging ? 1.02 : 1,
    borderRadius: isDragging ? "10px" : "6px",
    boxShadow: isDragging
      ? "rgba(0, 0, 0, 0.15) 0px 10px 20px, rgba(0, 0, 0, 0.1) 0px 3px 6px"
      : "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group cursor-auto active:cursor-grabbing"
    >
      <div onClick={(e) => e.stopPropagation()}>
        <CustomNodeCard {...props} />
      </div>
    </div>
  );
}

function CustomNodeCard({
  node,
  editingHash,
  editingCommand,
  setEditingCommand,
  handleSaveHash,
  handleStartEdit,
  handleRemoveNode,
  setValidation,
  validation,
}: {
  node: DockerCommandStep;
  editingHash: string | null;
  editingCommand: string | null;
  setEditingCommand: (command: string | null) => void;
  handleSaveHash: (node: DockerCommandStep, value: string) => void;
  handleStartEdit: (node: DockerCommandStep) => void;
  handleRemoveNode: (node: DockerCommandStep) => void;
  setValidation: (validation: MachineStepValidation) => void;
  validation: MachineStepValidation;
}) {
  // Handle command type
  if (node.type === "commands") {
    return (
      <div className="group relative flex flex-col rounded-[6px] border border-gray-200 bg-gray-50 p-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            {editingCommand === node.id ? (
              <Textarea
                autoFocus
                defaultValue={node.data as string}
                className="min-h-[60px] font-mono text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) {
                    setValidation({
                      ...validation,
                      isEditingHashOrAddingCommands: false,
                      docker_command_steps: {
                        steps: validation.docker_command_steps.steps.map(
                          (step) =>
                            step.id === node.id
                              ? { ...step, data: e.currentTarget.value }
                              : step,
                        ),
                      },
                    });
                    setEditingCommand(null);
                  }
                }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-gray-600 text-xs">
                $ {node.data as string}
              </pre>
            )}
          </div>
          <div className="flex">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn(
                "text-gray-500",
                editingCommand !== node.id &&
                  "opacity-0 transition-opacity duration-200 hover:text-gray-700 group-hover:opacity-100",
              )}
              onClick={(e) => {
                if (editingCommand === node.id) {
                  // Find the textarea element and get its value
                  const textarea =
                    e.currentTarget.parentElement?.parentElement?.querySelector(
                      "textarea",
                    );
                  if (textarea) {
                    setValidation({
                      ...validation,
                      isEditingHashOrAddingCommands: false,
                      docker_command_steps: {
                        steps: validation.docker_command_steps.steps.map(
                          (step) =>
                            step.id === node.id
                              ? { ...step, data: textarea.value }
                              : step,
                        ),
                      },
                    });
                    setEditingCommand(null);
                  }
                } else {
                  setValidation({
                    ...validation,
                    isEditingHashOrAddingCommands: true,
                  });
                  setEditingCommand(node.id);
                }
              }}
            >
              {editingCommand === node.id ? (
                <Save size={14} />
              ) : (
                <Pencil size={14} />
              )}
            </Button>
          </div>
        </div>
        {editingCommand !== node.id && (
          <div className="-top-2 -right-2 absolute">
            <button
              type="button"
              onClick={() => handleRemoveNode(node)}
              className="shrink-0 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            >
              <Minus size={12} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Existing custom node rendering
  if (!isCustomNodeData(node)) {
    return null;
  }

  const isHashChanged = node.data.hash !== node.data.meta?.latest_hash;

  return (
    <div
      key={node.data.url}
      className="relative flex items-center justify-between gap-2 rounded-[6px] border border-gray-200 bg-gray-50 px-2 py-1 text-sm"
    >
      <div className="group flex w-full flex-col">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex-[2] truncate font-medium text-xs">
              {node.data.name}
            </span>
            <div className="flex min-w-fit flex-1 items-center">
              <span className="truncate text-2xs text-gray-500">
                {node.data.url.split("/").slice(-2)[0]}
              </span>
              <Link
                to={node.data.url}
                target="_blank"
                className="ml-1 inline-flex shrink-0 items-center text-gray-500 hover:text-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
          {/* <Button
          type="button"
          variant="ghost"
          className="h-3 shrink-0 text-red-500 opacity-0 transition-opacity duration-200 hover:text-red-600 group-hover:opacity-100"
          onClick={() => handleRemoveNode(node)}
        >
          <Minus size={14} />
        </Button> */}
        </div>

        {node.data && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex w-full items-center gap-2 text-2xs text-gray-500 leading-snug">
              <span className="whitespace-nowrap font-medium">
                {isHashChanged || editingHash === node.data.url
                  ? "Custom hash"
                  : "Latest commit"}
                :
              </span>
              {editingHash === node.data.url ? (
                <Input
                  autoFocus
                  defaultValue={node.data.hash}
                  placeholder="commit hash..."
                  className="h-7 max-w-96 rounded-[6px] px-2 py-0 font-mono text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setValidation({
                        ...validation,
                        isEditingHashOrAddingCommands: false,
                      });
                      handleSaveHash(node, e.currentTarget.value);
                    }
                  }}
                />
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <code className="shrink-0 rounded bg-gray-100 px-1 py-0.5 text-[10px]">
                    <span className={cn(isHashChanged && "text-amber-600")}>
                      {node.data.hash?.slice(0, 7)}
                    </span>
                  </code>
                </div>
              )}
            </div>
            {editingHash === node.data.url && (
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "shrink-0 text-gray-500",
                  editingHash !== node.data.url &&
                    "h-3 opacity-0 transition-opacity duration-200 hover:text-red-600 group-hover:opacity-100",
                )}
                onClick={(e) => {
                  if (editingHash === node.data.url) {
                    // Find the input element and get its value
                    const input =
                      e.currentTarget.parentElement?.querySelector("input");
                    if (input) {
                      setValidation({
                        ...validation,
                        isEditingHashOrAddingCommands: false,
                      });
                      handleSaveHash(node, input.value);
                    }
                  } else {
                    setValidation({
                      ...validation,
                      isEditingHashOrAddingCommands: true,
                    });
                    handleStartEdit(node);
                  }
                }}
              >
                <Save size={12} />
              </Button>
            )}
          </div>
        )}
      </div>
      {editingHash !== node.data.url && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="shrink-0 text-gray-500 opacity-0 transition-opacity duration-200 hover:text-gray-700 group-hover:opacity-100"
              >
                <Pencil size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="truncate">
                Hash Settings
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => handleStartEdit(node)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => updateNodeWithBranchInfo(node, setValidation)}
              >
                Update to Latest
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="-top-2 -right-2 absolute">
            <button
              type="button"
              onClick={() => handleRemoveNode(node)}
              className="shrink-0 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            >
              <Minus size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
