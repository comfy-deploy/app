import { SDForm } from "@/components/SDInputs/SDForm";
import {
  type RGBColor,
  SDInputsRender,
} from "@/components/SDInputs/SDInputsRender";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { getFileDownloadUrlV2 } from "@/db/getFileDownloadUrl";
import { useAuthStore } from "@/lib/auth-store";
import { callServerPromise } from "@/lib/call-server-promise";
import {
  type WorkflowInputsType,
  type getInputsFromWorkflow,
  getGroupsFromWorkflowAPI,
} from "@/lib/getInputsFromWorkflow";
import { cn } from "@/lib/utils";
// import { HandleFileUpload } from "@/server/uploadFile";
import { useAuth, useClerk } from "@clerk/clerk-react";
import {
  Edit,
  GripVertical,
  Play,
  Plus,
  Save,
  Settings,
  X,
} from "lucide-react";
import { useQueryState } from "nuqs";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  memo,
} from "react";
import { SortableItem, SortableDragHandle } from "@/components/custom/sortable";
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SDInputGroup } from "@/components/SDInputs/SDInputGroup";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import type { z } from "zod";
import { uploadFile } from "../files-api";
import { publicRunStore } from "./VersionSelect";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { api } from "@/lib/api";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { queryClient } from "@/lib/providers";
import { useDebouncedFormState } from "@/hooks/use-debounced-state";

const MAX_FILE_SIZE_BYTES = 250_000_000; // 250MB

export async function parseFilesToImgURLs(
  values: Record<string, any>,
  toZip = false,
) {
  const processFile = async (file: File) => {
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const uploadFileResponse = await uploadFile(file);
      toast.success(`${file.name} uploaded successfully to assets`, {
        id: toastId,
      });
      return uploadFileResponse.url;
    } catch (error) {
      toast.error(
        `Failed to upload ${file.name}, ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { id: toastId },
      );
      throw error;
    }
  };

  const processValue = async (value: any): Promise<any> => {
    if (value instanceof File) {
      return processFile(value);
    }
    if (Array.isArray(value)) {
      if (toZip) {
        // Lazy load JSZip only when needed
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const item of value) {
          if (item instanceof File) {
            zip.file(item.name, item);
          }
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFile = new File([zipBlob], "files.zip", {
          type: "application/zip",
        });
        console.log(zipFile);
        return processFile(zipFile);
      }

      // Turn that in serialized array
      return JSON.stringify(
        await Promise.all(value.map((item) => processValue(item))),
      );
    }
    if (value && typeof value === "object") {
      const entries = Object.entries(value);
      const processedEntries = await Promise.all(
        entries.map(async ([key, val]) => {
          const processedValue = await processValue(val);
          return [key, processedValue];
        }),
      );
      return Object.fromEntries(processedEntries);
    }
    return value;
  };

  const newValues: Record<string, any> = {};
  for (const [key, value] of Object.entries(values)) {
    newValues[key] = await processValue(value);
  }
  console.log(newValues);

  return newValues;
}

export const WorkflowInputsForm = memo(function WorkflowInputsForm({
  values,
  setValues,
  defaultValues,
  ...props
}: {
  workflow: any;
  inputs: ReturnType<typeof getInputsFromWorkflow>;
  defaultValues: Record<string, any>;
  onSubmit: (
    e: FormEvent<HTMLFormElement>,
    // values: Record<string, any>,
  ) => AsyncGenerator<
    {
      children: ReactNode;
      tooltip?: string;
    },
    void,
    unknown
  >;
  hideRunButton?: boolean;
  actionArea?: ReactNode;
  values?: Record<string, any>;
  setValues?: any;
}) {
  const { inputs, hideRunButton } = props;

  const updateInput = useCallback(
    (
      key: string,
      val: string | File | undefined | (File | string)[] | boolean | RGBColor[],
    ) => {
      if (val instanceof File && val.size > MAX_FILE_SIZE_BYTES) {
        toast.error("Cannot upload files bigger than 250MB");
        return;
      }
      setValues((prev: any) => ({ ...prev, [key]: val }));
    },
    [setValues]
  );

  const [_isLoading, setIsLoading] = useState(false);
  const isLoading = _isLoading;

  const [childrenOverrides, setChildrenOverrides] = useState<ReactNode>();
  const [tooltip, setTooltip] = useState<string | undefined>(undefined);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    // e.preventDefault();
    if (isLoading) return;

    const currentChildren = "Run";
    const currentTooltip = tooltip;

    setIsLoading(true);
    if (props.onSubmit) {
      e.preventDefault();
      const generator = props.onSubmit(e);
      for await (const message of generator) {
        // setChildren(message.children);
        setChildrenOverrides(message.children);
        setTooltip(message.tooltip);
      }
    }
    setIsLoading(false);
    // setChildren(currentChildren);
    setChildrenOverrides(undefined);
    setTooltip(currentTooltip);
  }, [isLoading, props.onSubmit, tooltip]);

  const handleReset = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setValues(defaultValues);
  }, [defaultValues, setValues]);

  return (
    <SDForm
      onSubmit={handleSubmit}
      actionArea={
        // props.actionArea
        !hideRunButton && (
          <div className="flex justify-end gap-2 pr-3">
            <Button
              variant="outline"
              onClick={handleReset}
            >
              Reset default
            </Button>
            <Button
              type="submit"
              // disabled={isLoading || loading}
              isLoading={isLoading}
            >
              {childrenOverrides ?? "Run with inputs"}
              {/* {isLoading || loading ? <LoadingIcon /> : <Play size={14} />} */}
            </Button>
          </div>
        )
      }
      scrollAreaClassName="[&>[data-radix-scroll-area-viewport]]:max-h-[500px]"
    >
      {inputs?.map((item) => {
        if (!values || !item?.input_id) {
          return null;
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
  );
});

export function parseInputValues(valuesParsed: Record<string, any>) {
  return Object.entries(valuesParsed)
    .filter(([_, value]) => value != null)
    .reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]:
          typeof value === "string"
            ? // Try to parse JSON strings, fall back to original value if parsing fails
              (() => {
                try {
                  return JSON.parse(value);
                } catch {
                  return value;
                }
              })()
            : value,
      }),
      {},
    );
}

// Memoized component for draggable input item
const DraggableInputItem = memo(function DraggableInputItem({
  input,
  value,
  updateInput,
}: {
  input: any;
  value: any;
  updateInput: (key: string, value: any) => void;
}) {
  return (
    <SortableItem
      value={input.input_id || ""}
      className="mb-2 flex items-center rounded-md border bg-card p-2 sortable-item-transition"
    >
      <div className="flex w-full items-center">
        <SortableDragHandle
          type="button"
          variant="ghost"
          className="mr-2 rounded p-1 hover:bg-muted"
          size="sm"
        >
          <GripVertical size={16} />
        </SortableDragHandle>
        <div className="flex-1">
          <SDInputsRender
            inputNode={input}
            updateInput={updateInput}
            inputValue={value}
          />
        </div>
      </div>
    </SortableItem>
  );
});

// Memoized component for input group
const InputGroupWithItems = memo(function InputGroupWithItems({
  group,
  inputs,
  values,
  updateInput,
  onTitleChange,
  onDelete,
  isDraggable,
  collapsed,
  onCollapseToggle,
}: {
  group: { id: string; title: string };
  inputs: any[];
  values: Record<string, any>;
  updateInput: (key: string, value: any) => void;
  onTitleChange: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  isDraggable: boolean;
  collapsed: boolean;
  onCollapseToggle: (id: string, collapsed: boolean) => void;
}) {
  const content = isDraggable ? (
    <SortableItem value={group.id} className="mb-4">
      <SDInputGroup
        id={group.id}
        title={group.title}
        onTitleChange={onTitleChange}
        onDelete={onDelete}
        isEmpty={inputs.length === 0}
        items={inputs.map((item) => item.input_id || "")}
        isDraggable={true}
        defaultCollapsed={collapsed}
        onCollapseToggle={onCollapseToggle}
      >
        {inputs.length === 0 ? (
          <div className="rounded-md border-2 border-muted-foreground/20 border-dashed p-4 text-center text-muted-foreground text-sm">
            Drag items here to add them to this group
          </div>
        ) : (
          inputs.map((item, index) => {
            const stableKey = item.input_id || `item-${index}`;
            return (
              <DraggableInputItem
                key={stableKey}
                input={item}
                value={values[item.input_id || ""]}
                updateInput={updateInput}
              />
            );
          })
        )}
      </SDInputGroup>
    </SortableItem>
  ) : (
    <SDInputGroup
      id={group.id}
      title={group.title}
      onTitleChange={() => {}}
      onDelete={() => {}}
      isEmpty={false}
      items={inputs.map((item) => item.input_id || "")}
      isDraggable={false}
      isEditMode={false}
      defaultCollapsed={collapsed}
      onCollapseToggle={onCollapseToggle}
    >
      {inputs.map((item) => (
        <div key={item.input_id} className="mb-2">
          <SDInputsRender
            inputNode={item}
            updateInput={updateInput}
            inputValue={values[item.input_id || ""]}
          />
        </div>
      ))}
    </SDInputGroup>
  );

  return inputs.length === 0 && !isDraggable ? null : content;
});

// For share page
export function RunWorkflowInline({
  inputs,
  deployment_id,
  default_values = {},
  workflow_version_id,
  machine_id,
  hideRunButton = false,
  runOrigin = "public-share",
  blocking = true,
  model_id,
  workflow_api,
  scrollAreaClassName,
  canEditOrder = false,
}: {
  inputs: z.infer<typeof WorkflowInputsType>;
  workflow_version_id?: string;
  machine_id?: string;
  deployment_id: string;
  default_values?: Record<string, any>;
  hideRunButton?: boolean;
  runOrigin?: any;
  blocking?: boolean;
  model_id?: string;
  scrollAreaClassName?: string;
  workflow_api?: string;
  canEditOrder?: boolean;
}) {
  // Use debounced state for form values to prevent excessive re-renders
  const { values, debouncedValues, updateValue, setValues } = useDebouncedFormState(
    default_values,
    200 // 200ms debounce delay
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [currentRunId, setCurrentRunId] = useQueryState("run-id");
  const [currentWorkflowVersion, setCurrentWorkflowVersion] =
    useQueryState("version");
  const [batchNumber, setBatchNumber] = useState(1);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [reorderedInputs, setReorderedInputs] = useState<typeof inputs>([]);
  const [inputGroups, setInputGroups] = useState<
    Array<{
      id: string;
      title: string;
    }>
  >([]);

  const [layoutOrder, setLayoutOrder] = useState<
    Array<{ type: "group" | "input"; id: string }>
  >([]);

  // Add a ref to track if we've initialized
  const isInitializedRef = useRef(false);

  // Add collapse state tracking after line 44
  const [groupCollapseStates, setGroupCollapseStates] = useState<
    Record<string, boolean>
  >({});

  // Modify the initialization effect (around line 335) to include collapse state
  useEffect(() => {
    if (!workflow_api || !inputs) {
      return;
    }

    // Reset and mark as initialized for this version
    isInitializedRef.current = true;

    // Load existing groups
    const existingGroups = getGroupsFromWorkflowAPI(workflow_api);
    if (existingGroups.length > 0) {
      setInputGroups(existingGroups);
    } else {
      setInputGroups([]); // Clear previous groups
    }

    // Load collapse states from metadata
    const collapseStates: Record<string, boolean> = {};
    Object.entries(workflow_api).forEach(([nodeId, value]: [string, any]) => {
      if (
        value._meta?.cd_input_group_id &&
        value._meta?.cd_group_collapsed !== undefined
      ) {
        collapseStates[value._meta.cd_input_group_id] =
          value._meta.cd_group_collapsed;
      }
    });
    setGroupCollapseStates(collapseStates);

    // Initialize reorderedInputs with group information
    const inputsWithGroups = inputs.map((input) => ({
      ...input,
      groupId: input.groupId || undefined,
    }));
    setReorderedInputs(inputsWithGroups);

    // Build initial layout order
    const newLayoutOrder: Array<{ type: "group" | "input"; id: string }> = [];
    const processedGroups = new Set<string>();

    // Process inputs in their saved order (they're already sorted by cd_input_order)
    for (const input of inputsWithGroups) {
      if (input.groupId && !processedGroups.has(input.groupId)) {
        // Add group when we encounter its first input
        newLayoutOrder.push({ type: "group", id: input.groupId });
        processedGroups.add(input.groupId);
      } else if (!input.groupId && input.input_id) {
        // Add ungrouped input
        newLayoutOrder.push({ type: "input", id: input.input_id });
      }
    }

    // If no layout order was built (no groups, no metadata), add all inputs as ungrouped
    if (newLayoutOrder.length === 0) {
      for (const input of inputsWithGroups) {
        if (input.input_id) {
          newLayoutOrder.push({ type: "input", id: input.input_id });
        }
      }
    }

    setLayoutOrder(newLayoutOrder);
  }, [workflow_api, inputs]);

  // Add a separate effect to reset initialization when version changes
  useEffect(() => {
    isInitializedRef.current = false;
  }, [workflow_version_id]);

  // Remove all the other useEffects related to isEditMode
  // Only keep this one for handling input changes
  useEffect(() => {
    if (!inputs || !isInitializedRef.current) return;

    // Update reorderedInputs when inputs change, but preserve groupId assignments
    setReorderedInputs((prevReorderedInputs) => {
      // Create a map of existing groupId assignments
      const groupIdMap = new Map<string, string | undefined>();
      prevReorderedInputs.forEach((input) => {
        if (input.input_id) {
          groupIdMap.set(input.input_id, input.groupId);
        }
      });

      // Update inputs while preserving manual groupId assignments
      return inputs.map((input) => ({
        ...input,
        groupId:
          groupIdMap.get(input.input_id || "") ?? input.groupId ?? undefined,
      }));
    });
  }, [inputs]);

  const createGroup = () => {
    const newGroup = {
      id: `group-${Date.now()}`,
      title: "New Group",
    };
    setInputGroups((prevGroups) => [...prevGroups, newGroup]);

    // Add the new group to the top of the layout order
    setLayoutOrder((prevOrder) => [
      { type: "group", id: newGroup.id },
      ...prevOrder,
    ]);
  };

  const deleteGroup = (groupId: string) => {
    // First, get all inputs that are in this group before we modify them
    const inputsInGroup = reorderedInputs.filter(
      (input) => input.groupId === groupId,
    );

    setReorderedInputs((prevInputs) =>
      prevInputs.map((input) =>
        input.groupId === groupId ? { ...input, groupId: undefined } : input,
      ),
    );

    setInputGroups((prevGroups) => prevGroups.filter((g) => g.id !== groupId));

    // Remove the group from layout order AND add the ungrouped inputs back
    setLayoutOrder((prevOrder) => {
      const filteredOrder = prevOrder.filter((item) => item.id !== groupId);

      // Add the inputs that were in the deleted group back to the layout
      const inputsToAdd = inputsInGroup
        .filter((input) => input.input_id) // Make sure input_id exists
        .map((input) => ({ type: "input" as const, id: input.input_id! }));

      // Add them at the position where the group was, or at the end
      const groupIndex = prevOrder.findIndex((item) => item.id === groupId);
      if (groupIndex !== -1) {
        // Insert at the group's position
        filteredOrder.splice(groupIndex, 0, ...inputsToAdd);
        return filteredOrder;
      } else {
        // Add at the end
        return [...filteredOrder, ...inputsToAdd];
      }
    });
  };

  const updateGroupTitle = (groupId: string, title: string) => {
    setInputGroups(
      inputGroups.map((g) => (g.id === groupId ? { ...g, title } : g)),
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const isDraggingRef = useRef(false);
  const [activeIdState, setActiveIdState] = useState<string | null>(null);
  const { setNodeRef: setUngroupedRef } = useDroppable({
    id: "ungrouped-container",
    data: { type: "ungrouped" },
  });

  const handleDragStart = (event: any) => {
    isDraggingRef.current = true;
    setActiveIdState(event.active.id);
  };

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;

      // Always reset dragging state immediately
      isDraggingRef.current = false;
      setActiveIdState(null);

      if (!over) {
        return;
      }

      const activeId = active.id;
      const overId = over.id;

      console.log(`Drag end: ${activeId} -> ${overId}`, {
        overData: over.data?.current,
        isGroup: activeId.toString().startsWith("group-"),
        isUngrouped: over.data?.current?.type === "ungrouped",
      });

      // Handle group reordering
      if (
        activeId.toString().startsWith("group-") &&
        overId.toString().startsWith("group-")
      ) {
        console.log("Group reordering detected");
        const oldIndex = inputGroups.findIndex(
          (group) => group.id === activeId,
        );
        const newIndex = inputGroups.findIndex((group) => group.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          setInputGroups((prevGroups) =>
            arrayMove(prevGroups, oldIndex, newIndex),
          );

          // keep layout order in sync when groups are reordered
          setLayoutOrder((prevOrder) => {
            const fromIndex = prevOrder.findIndex(
              (item) => item.id === activeId,
            );
            const toIndex = prevOrder.findIndex((item) => item.id === overId);
            if (fromIndex !== -1 && toIndex !== -1) {
              return arrayMove(prevOrder, fromIndex, toIndex);
            }
            return prevOrder;
          });
        }
        return;
      }

      // Handle dropping into a group
      if (over.data?.current?.type === "group") {
        const groupId = over.data.current.groupId;

        setReorderedInputs((prevInputs) =>
          prevInputs.map((input) =>
            input.input_id === activeId ? { ...input, groupId } : input,
          ),
        );

        // ALSO update layoutOrder to remove the input from ungrouped items
        setLayoutOrder((prevOrder) =>
          prevOrder.filter((item) => item.id !== activeId),
        );

        return;
      }

      // Handle group positioning among ungrouped items OR dissolving groups
      if (
        activeId.toString().startsWith("group-") &&
        (over.data?.current?.type === "ungrouped" ||
          (!overId.toString().startsWith("group-") &&
            over.data?.current?.type !== "group"))
      ) {
        // If dropping specifically into ungrouped area (not on a specific item), dissolve the group
        if (
          over.data?.current?.type === "ungrouped" &&
          !overId.toString().includes("input")
        ) {
          const groupId = activeId;
          const groupToDissolve = inputGroups.find((g) => g.id === groupId);
          const itemCount = reorderedInputs.filter(
            (input) => input.groupId === groupId,
          ).length;

          console.log(`Dissolving group ${groupId} with ${itemCount} items`);

          setReorderedInputs((prevInputs) =>
            prevInputs.map((input) =>
              input.groupId === groupId
                ? { ...input, groupId: undefined }
                : input,
            ),
          );

          setInputGroups((prevGroups) =>
            prevGroups.filter((group) => group.id !== groupId),
          );

          if (groupToDissolve && itemCount > 0) {
            toast.success(
              `Dissolved "${groupToDissolve.title}" - ${itemCount} item${itemCount > 1 ? "s" : ""} moved to ungrouped`,
            );
          }
          return;
        }

        // Otherwise, position the group among ungrouped items
        console.log("Group positioning among ungrouped items detected");

        const targetLayoutIndex = layoutOrder.findIndex(
          (item) => item.id === overId,
        );

        if (targetLayoutIndex !== -1) {
          const groupId = activeId;

          setLayoutOrder((prevOrder) => {
            const filteredOrder = prevOrder.filter(
              (item) => item.id !== groupId,
            );

            const newOrder = [...filteredOrder];
            newOrder.splice(targetLayoutIndex, 0, {
              type: "group",
              id: groupId,
            });

            return newOrder;
          });
        }
        return;
      }

      // Move input out of a group into ungrouped items
      if (!activeId.toString().startsWith("group-") && over) {
        const oldIndex = reorderedInputs.findIndex(
          (item) => item.input_id === activeId,
        );
        const newIndex = reorderedInputs.findIndex(
          (item) => item.input_id === overId,
        );
        const activeItem = reorderedInputs[oldIndex];
        const overItem = reorderedInputs[newIndex];

        if (
          activeItem?.groupId &&
          (!overItem?.groupId || over.data?.current?.type === "ungrouped")
        ) {
          setReorderedInputs((prev) => {
            const updated = prev.map((inp) =>
              inp.input_id === activeId ? { ...inp, groupId: undefined } : inp,
            );
            if (oldIndex !== -1 && newIndex !== -1) {
              return arrayMove(updated, oldIndex, newIndex);
            }
            return updated;
          });

          setLayoutOrder((prev) => {
            const filtered = prev.filter((i) => i.id !== activeId);
            const overLayoutIndex = prev.findIndex((i) => i.id === overId);
            if (overLayoutIndex === -1) {
              return [...filtered, { type: "input", id: activeId }];
            }
            const newOrder = [...filtered];
            newOrder.splice(overLayoutIndex, 0, {
              type: "input",
              id: activeId,
            });
            return newOrder;
          });

          return;
        }
      }

      // Position ungrouped input relative to a group
      if (
        !activeId.toString().startsWith("group-") &&
        overId.toString().startsWith("group-") &&
        activeId !== overId
      ) {
        setLayoutOrder((prevOrder) => {
          const activeLayoutIndex = prevOrder.findIndex(
            (item) => item.id === activeId,
          );
          const overLayoutIndex = prevOrder.findIndex(
            (item) => item.id === overId,
          );
          if (activeLayoutIndex !== -1 && overLayoutIndex !== -1) {
            return arrayMove(prevOrder, activeLayoutIndex, overLayoutIndex);
          }
          return prevOrder;
        });
        return;
      }

      // Handle reordering within the same context
      if (activeId !== overId) {
        const oldIndex = reorderedInputs.findIndex(
          (item) => item.input_id === activeId,
        );
        const newIndex = reorderedInputs.findIndex(
          (item) => item.input_id === overId,
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const activeItem = reorderedInputs[oldIndex];
          const overItem = reorderedInputs[newIndex];

          const bothUngrouped = !activeItem.groupId && !overItem.groupId;
          const sameGroup =
            activeItem.groupId &&
            overItem.groupId &&
            activeItem.groupId === overItem.groupId;

          if (bothUngrouped || sameGroup) {
            console.log(
              `Reordering: moving item from ${oldIndex} to ${newIndex}`,
            );
            setReorderedInputs((prevInputs) =>
              arrayMove(prevInputs, oldIndex, newIndex),
            );

            // Also update layoutOrder if reordering ungrouped items
            if (bothUngrouped) {
              setLayoutOrder((prevOrder) => {
                const activeLayoutIndex = prevOrder.findIndex(
                  (item) => item.id === activeId,
                );
                const overLayoutIndex = prevOrder.findIndex(
                  (item) => item.id === overId,
                );

                if (activeLayoutIndex !== -1 && overLayoutIndex !== -1) {
                  return arrayMove(
                    prevOrder,
                    activeLayoutIndex,
                    overLayoutIndex,
                  );
                }
                return prevOrder;
              });
            }
          }
        }
      }
    },
    [reorderedInputs, inputGroups, layoutOrder],
  );

  const workflowId = useWorkflowIdInWorkflowPage();
  const { workflow } = useCurrentWorkflow(workflowId);

  const user = useAuth();
  const clerk = useClerk();

  const fetchToken = useAuthStore((state) => state.fetchToken);

  const {
    setRunId,
    loading,
    setLoading: setLoading2,
    setStatus,
    setImage,
  } = publicRunStore();

  // Memoize the updateInput callback to prevent unnecessary re-renders
  const updateInput = useCallback(
    (
      key: string,
      val: string | File | undefined | (File | string)[] | boolean | RGBColor[],
    ) => {
      if (val instanceof File && val.size > MAX_FILE_SIZE_BYTES) {
        toast.error("Cannot upload files bigger than 250MB");
        return;
      }
      updateValue(key as keyof typeof values, val);
    },
    [updateValue]
  );

  // Use debouncedValues for the actual workflow submission
  const runWorkflow = async () => {
    if (!user.isSignedIn) {
      clerk.openSignIn({
        redirectUrl: window.location.href,
      });
      return;
    }

    // Use debouncedValues instead of values for submission
    const valuesToSubmit = debouncedValues;

    // Check for folder inputs and validate
    const folderInputs = Object.entries(valuesToSubmit).filter(([key, value]) => {
      // Handle folder stored as JSON string
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return (
            parsed && typeof parsed === "object" && parsed.type === "folder"
          );
        } catch {
          return false;
        }
      }
      // Handle folder stored as object
      return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof File) &&
        "type" in value &&
        (value as any).type === "folder"
      );
    });

    if (folderInputs.length > 1) {
      toast.error("Multiple folder selections are not supported");
      return;
    }

    if (folderInputs.length > 0 && batchNumber > 1) {
      toast.error("Batch runs are not supported with folder selection");
      return;
    }

    if (folderInputs.length > 0) {
      // Process folder sequentially
      await processFolderSequentially(folderInputs[0]);
    } else {
      await runSingleWorkflow();
    }
  };

  const processFolderSequentially = async ([inputKey, folderValue]: [
    string,
    any,
  ]) => {
    const CONCURRENT_LIMIT = 3; // Process 3 images at once

    try {
      setLoading2(true);
      setIsLoading(true);

      const folderData =
        typeof folderValue === "string" ? JSON.parse(folderValue) : folderValue;

      const folderContents = await api({
        url: "assets",
        params: { path: folderData.path },
      });

      const imageFiles = folderContents.filter(
        (item: any) =>
          !item.is_folder &&
          item.mime_type &&
          item.mime_type.startsWith("image/"),
      );

      if (imageFiles.length === 0) {
        toast.error("No image files found in the selected folder");
        setIsLoading(false);
        setLoading2(false);
        return;
      }

      toast.success(`Processing ${imageFiles.length} images from folder`);

      // Helper function to process a single image
      const processImage = async (image: any, index: number) => {
        const currentValues = {
          ...debouncedValues,
          [inputKey]: image.url,
        };

        setStatus({
          state: "preparing",
          live_status: `Processing image ${index + 1} of ${imageFiles.length}`,
          progress: ((index + 1) / imageFiles.length) * 100,
        });

        const valuesParsed = await parseFilesToImgURLs(currentValues);
        const val = parseInputValues(valuesParsed);

        const auth = await fetchToken();
        const body = model_id
          ? { model_id: model_id, inputs: val }
          : {
              workflow_version_id: workflow_version_id,
              machine_id: machine_id,
              deployment_id: deployment_id,
              inputs: val,
              origin: runOrigin,
              batch_number: 1, // Always 1 for folder processing
            };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_CD_API_URL}/api/run${model_id ? "/sync" : ""}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${auth}`,
            },
            body: JSON.stringify(body),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to process image ${index + 1}: ${await response.text()}`,
          );
        }

        return response.json();
      };

      // Process images in batches of CONCURRENT_LIMIT
      for (let i = 0; i < imageFiles.length; i += CONCURRENT_LIMIT) {
        const batch = imageFiles.slice(i, i + CONCURRENT_LIMIT);

        // Process all images in this batch simultaneously
        const batchPromises = batch.map((image: any, batchIndex: number) =>
          processImage(image, i + batchIndex),
        );

        // Wait for ALL images in this batch to complete before moving to next batch
        const batchResults = await Promise.all(batchPromises);

        // Handle results (set run_id from first result, etc.)
        if (i === 0 && batchResults[0]) {
          const firstResult = batchResults[0];
          if (runOrigin === "public-share") {
            setRunId(firstResult.run_id);
          } else {
            setCurrentRunId(firstResult.run_id);
          }
        }
      }

      toast.success(`Successfully processed all ${imageFiles.length} images`);
      setIsLoading(false);
      if (!blocking) {
        setLoading2(false);
      }
    } catch (error) {
      setIsLoading(false);
      setLoading2(false);
      toast.error(
        `Failed to process folder: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  };

  const runSingleWorkflow = async () => {
    setLoading2(true);
    setIsLoading(true);
    try {
      const valuesParsed = await parseFilesToImgURLs({ ...debouncedValues });
      const val = parseInputValues(valuesParsed);
      console.log(val);
      setStatus({ state: "preparing", live_status: "", progress: 0 });
      // if (v2RunApi || model_id) {
      const auth = await fetchToken();
      const body = model_id
        ? { model_id: model_id, inputs: val }
        : {
            workflow_version_id: workflow_version_id,
            machine_id: machine_id,
            deployment_id: deployment_id,
            inputs: val,
            origin: runOrigin,
            batch_number: batchNumber,
          };

      if (model_id) {
        setLoading2(true);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CD_API_URL}/api/run${model_id ? "/sync" : ""}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth}`,
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      if (runOrigin === "public-share") {
        setRunId(data.run_id);
      } else {
        setCurrentRunId(data.run_id);
      }

      if (model_id) {
        const data = await response.json();
        setLoading2(false);
        const mediaData = data[0]?.data;
        if (mediaData?.images?.[0]?.url) {
          setImage([{ url: mediaData.images[0].url }]);
        } else if (mediaData?.video?.[0]?.url) {
          setImage([{ url: mediaData.video[0].url }]);
        }
      }
      setIsLoading(false);
      if (!blocking) {
        setLoading2(false);
      }
    } catch (error) {
      setIsLoading(false);
      setLoading2(false);
      toast.error(
        `Failed to run workflow: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  };

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    runWorkflow();
  }

  useHotkeys(
    "meta+enter",
    (e) => {
      e.preventDefault();
      runWorkflow();
      // console.log("meta+enter");
    },
    {
      enableOnFormTags: ["input", "select", "textarea"],
    },
  );

  // if default value changes, update the values
  useEffect(() => {
    setValues(default_values);
  }, [default_values]);

  // Add a function to toggle collapse state
  const toggleGroupCollapse = (groupId: string) => {
    setGroupCollapseStates((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Modify the saveReordering function (around line 698) to save collapse states
  const saveReordering = async () => {
    if (!workflow_version_id || !reorderedInputs) return;

    try {
      setIsSavingOrder(true);
      if (!workflow_api) {
        toast.error("No workflow API found");
        return;
      }

      // Check for empty groups
      const emptyGroups = inputGroups.filter((group) => {
        const hasInputs = reorderedInputs.some(
          (input) => input.groupId === group.id,
        );
        return !hasInputs;
      });

      if (emptyGroups.length > 0) {
        toast.warning(
          `${emptyGroups.length} empty group${emptyGroups.length > 1 ? "s" : ""} will not be saved. Drag inputs into groups before saving.`,
          { duration: 5000 },
        );
      }

      const workflowApi = JSON.parse(JSON.stringify(workflow_api));

      // Store existing group information before clearing
      const existingGroupInfo = new Map<
        string,
        { groupId: string; groupName?: string }
      >();
      for (const nodeId of Object.keys(workflowApi)) {
        const meta = workflowApi[nodeId]._meta;
        if (meta?.cd_input_group_id) {
          existingGroupInfo.set(nodeId, {
            groupId: meta.cd_input_group_id,
            groupName: meta.cd_group_name,
          });
        }
      }

      // Clear existing meta data for inputs
      for (const nodeId of Object.keys(workflowApi)) {
        if (workflowApi[nodeId]._meta) {
          delete workflowApi[nodeId]._meta.cd_input_order;
          delete workflowApi[nodeId]._meta.cd_input_group_id;
          delete workflowApi[nodeId]._meta.cd_group_name;
        }
      }

      // If layoutOrder is empty, reconstruct it from reorderedInputs
      let effectiveLayoutOrder = layoutOrder;

      if (layoutOrder.length === 0) {
        const reconstructedOrder: Array<{
          type: "group" | "input";
          id: string;
        }> = [];
        const processedGroups = new Set<string>();

        // First try to use existing group info from workflow_api
        for (const input of reorderedInputs) {
          const nodeId = input.nodeId as string | undefined;
          const groupInfo = nodeId ? existingGroupInfo.get(nodeId) : undefined;

          if (groupInfo && !processedGroups.has(groupInfo.groupId)) {
            reconstructedOrder.push({ type: "group", id: groupInfo.groupId });
            processedGroups.add(groupInfo.groupId);
          } else if (!groupInfo && input.input_id) {
            reconstructedOrder.push({ type: "input", id: input.input_id });
          }
        }

        // If still no order, fallback to current groupId from inputs
        if (reconstructedOrder.length === 0) {
          const processedGroups2 = new Set<string>();
          for (const input of reorderedInputs) {
            if (input.groupId && !processedGroups2.has(input.groupId)) {
              reconstructedOrder.push({ type: "group", id: input.groupId });
              processedGroups2.add(input.groupId);
            } else if (!input.groupId && input.input_id) {
              reconstructedOrder.push({ type: "input", id: input.input_id });
            }
          }
        }

        effectiveLayoutOrder = reconstructedOrder;
        console.log(
          "Using reconstructed layoutOrder for save:",
          reconstructedOrder,
        );
      }

      // Assign continuous order numbers based on effectiveLayoutOrder
      let orderIndex = 0;

      for (const layoutItem of effectiveLayoutOrder) {
        if (layoutItem.type === "group") {
          // Process all inputs in this group
          const groupInputs = reorderedInputs.filter(
            (input) => input.groupId === layoutItem.id,
          );
          const group = inputGroups.find((g) => g.id === layoutItem.id);

          // If no group info exists, try to get it from existingGroupInfo
          let groupName = group?.title;
          if (!groupName) {
            // Find any input with this group ID that has a group name
            for (const input of groupInputs) {
              const nodeId = input.nodeId as string | undefined;
              const groupInfo = nodeId
                ? existingGroupInfo.get(nodeId)
                : undefined;
              if (groupInfo?.groupName) {
                groupName = groupInfo.groupName;
                break;
              }
            }
          }

          for (const [idx, input] of groupInputs.entries()) {
            const nodeId = input.nodeId as string | undefined;
            if (nodeId && workflowApi[nodeId]) {
              if (!workflowApi[nodeId]._meta) {
                workflowApi[nodeId]._meta = {};
              }
              workflowApi[nodeId]._meta.cd_input_order = orderIndex++;
              workflowApi[nodeId]._meta.cd_input_group_id = layoutItem.id;

              // Save collapse state
              workflowApi[nodeId]._meta.cd_group_collapsed =
                groupCollapseStates[layoutItem.id] || false;

              // Only add group name to the first input in the group
              if (idx === 0 && groupName) {
                workflowApi[nodeId]._meta.cd_group_name = groupName;
              }
            }
          }
        } else {
          // Process ungrouped input
          const input = reorderedInputs.find(
            (i) => i.input_id === layoutItem.id,
          );
          if (input) {
            const nodeId = input.nodeId as string | undefined;
            if (nodeId && workflowApi[nodeId]) {
              if (!workflowApi[nodeId]._meta) {
                workflowApi[nodeId]._meta = {};
              }
              workflowApi[nodeId]._meta.cd_input_order = orderIndex++;
              workflowApi[nodeId]._meta.cd_input_group_id = null;
            }
          }
        }
      }

      const data = await callServerPromise(
        api({
          url: `workflow/${workflowId}/version`,
          init: {
            method: "POST",
            body: JSON.stringify({
              workflow: workflow.versions[0].workflow,
              workflow_api: workflowApi,
              comment: "Reordered inputs",
            }),
          },
        }),
        {
          loadingText: "Saving input order...",
        },
      );

      toast.success("Input order saved successfully");
      queryClient.invalidateQueries({
        queryKey: ["workflow", workflowId, "versions"],
      });
      setCurrentWorkflowVersion(data.version);
      setIsEditMode(false);
      setIsSavingOrder(false);
    } catch (error) {
      setIsSavingOrder(false);
      toast.error(
        `Failed to save input order: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Memoize the grouped and ungrouped inputs to prevent unnecessary re-renders
  const { groupedInputsByGroup, ungroupedInputs } = useMemo(() => {
    const grouped: Record<string, typeof inputs> = {};
    const ungrouped: typeof inputs = [];

    for (const input of reorderedInputs) {
      if (input.groupId) {
        if (!grouped[input.groupId]) {
          grouped[input.groupId] = [];
        }
        grouped[input.groupId].push(input);
      } else {
        ungrouped.push(input);
      }
    }

    return {
      groupedInputsByGroup: grouped,
      ungroupedInputs: ungrouped,
    };
  }, [reorderedInputs]);

  return (
    <div className="relative h-full">
      <style>{`
        .sortable-item-transition {
          transition-property: transform, opacity;
          transition-duration: 0.2s;
          transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
      {/* Edit button */}
      {canEditOrder && inputs && inputs.length > 0 && (
        <div className="absolute top-0 right-1 z-[100] flex gap-2">
          {isEditMode ? (
            <>
              <Button
                onClick={() => {
                  // On cancel, restore the original state from workflow_api
                  if (workflow_api && inputs) {
                    // Restore original groups
                    const existingGroups =
                      getGroupsFromWorkflowAPI(workflow_api);
                    setInputGroups(existingGroups);

                    // Restore original reorderedInputs with their original groupIds
                    const inputsWithGroups = inputs.map((input) => ({
                      ...input,
                      groupId: input.groupId || undefined,
                    }));
                    setReorderedInputs(inputsWithGroups);

                    // Restore original layout order
                    if (
                      existingGroups.length > 0 ||
                      inputs.some((i) => i.groupId)
                    ) {
                      const newLayoutOrder: Array<{
                        type: "group" | "input";
                        id: string;
                      }> = [];
                      const processedGroups = new Set<string>();

                      for (const input of inputsWithGroups) {
                        if (
                          input.groupId &&
                          !processedGroups.has(input.groupId)
                        ) {
                          newLayoutOrder.push({
                            type: "group",
                            id: input.groupId,
                          });
                          processedGroups.add(input.groupId);
                        } else if (!input.groupId && input.input_id) {
                          newLayoutOrder.push({
                            type: "input",
                            id: input.input_id,
                          });
                        }
                      }

                      setLayoutOrder(newLayoutOrder);
                    } else {
                      // No groups, just ungrouped inputs
                      setLayoutOrder(
                        inputs
                          .filter((i) => i.input_id)
                          .map((i) => ({
                            type: "input" as const,
                            id: i.input_id!,
                          })),
                      );
                    }
                  }

                  setIsEditMode(false);
                }}
                variant="outline"
                size="xs"
                className="shadow-sm backdrop-blur-sm"
                type="button"
              >
                <X size={16} className="mr-1" />
                Cancel
              </Button>
              <Button
                onClick={saveReordering}
                variant="default"
                size="xs"
                className="shadow-sm backdrop-blur-sm"
                isLoading={isSavingOrder}
                type="button"
              >
                <Save size={16} className="mr-1" />
                Save
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditMode(true)}
              variant="default"
              size="xs"
              className="shadow-sm backdrop-blur-sm"
              type="button"
            >
              <Edit size={16} className="mr-1" />
              Reorder
            </Button>
          )}
        </div>
      )}

      <SDForm
        onSubmit={onSubmit}
        actionArea={
          !hideRunButton && (
            <div className="space-y-2">
              {/* Advanced Settings */}
              <Collapsible
                open={showAdvancedSettings}
                onOpenChange={setShowAdvancedSettings}
              >
                <CollapsibleContent className="space-y-3 rounded-md bg-gray-100 p-2 dark:bg-zinc-700/80">
                  {/* Batch Number Controls */}
                  {(() => {
                    // Check if there's a folder selected
                    const hasFolderInput = Object.values(values).some(
                      (value) => {
                        // Handle folder stored as JSON string
                        if (typeof value === "string") {
                          try {
                            const parsed = JSON.parse(value);
                            return (
                              parsed &&
                              typeof parsed === "object" &&
                              parsed.type === "folder"
                            );
                          } catch {
                            return false;
                          }
                        }
                        // Handle folder stored as object
                        return (
                          typeof value === "object" &&
                          value !== null &&
                          !Array.isArray(value) &&
                          !(value instanceof File) &&
                          "type" in value &&
                          (value as any).type === "folder"
                        );
                      },
                    );

                    return (
                      <div className="flex items-center justify-between gap-3">
                        <Label
                          htmlFor="batch-number"
                          className="text-sm font-medium"
                        >
                          Batch Size
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              setBatchNumber(Math.max(1, batchNumber - 1))
                            }
                            disabled={batchNumber <= 1 || hasFolderInput}
                          >
                            -
                          </Button>
                          <Input
                            id="batch-number"
                            type="number"
                            min="1"
                            max="99"
                            value={batchNumber}
                            onChange={(e) => {
                              if (!hasFolderInput) {
                                const value = Math.max(
                                  1,
                                  Math.min(
                                    99,
                                    Number.parseInt(e.target.value) || 1,
                                  ),
                                );
                                setBatchNumber(value);
                              }
                            }}
                            className="h-8 w-16 text-center text-sm"
                            disabled={hasFolderInput}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              setBatchNumber(Math.min(99, batchNumber + 1))
                            }
                            disabled={batchNumber >= 99 || hasFolderInput}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </CollapsibleContent>
              </Collapsible>

              {/* Run Button Row */}
              <div className="flex gap-2">
                <Button
                  disabled={!inputs || isEditMode}
                  type="submit"
                  className="flex-1"
                  isLoading={isLoading || loading}
                  variant="expandIcon"
                  iconPlacement="right"
                  Icon={Play}
                >
                  {batchNumber > 1 ? `Run (${batchNumber}x)` : "Run"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="h-10 w-10 p-0"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  <Settings size={16} />
                </Button>
              </div>
            </div>
          )
        }
        scrollAreaClassName={cn("h-full", scrollAreaClassName)}
      >
        {inputs ? (
          isEditMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={
                  activeIdState &&
                  !layoutOrder.some((i) => i.id === activeIdState)
                    ? [...layoutOrder.map((item) => item.id), activeIdState]
                    : layoutOrder.map((item) => item.id)
                }
                strategy={verticalListSortingStrategy}
              >
                <div className="absolute top-0 z-50 h-24 w-full bg-gradient-to-b from-white to-transparent dark:from-zinc-900" />
                <div ref={setUngroupedRef} className="space-y-2">
                  {/* Create Group Button */}
                  <Button
                    onClick={createGroup}
                    variant="outline"
                    size="sm"
                    className="sticky top-8 z-50 mb-8 w-full shadow-md"
                    type="button"
                  >
                    <Plus size={16} className="mr-1" />
                    Create Group
                  </Button>

                  {/* Render items based on layout order */}
                  {layoutOrder.map((layoutItem) => {
                    if (layoutItem.type === "group") {
                      const group = inputGroups.find(
                        (g) => g.id === layoutItem.id,
                      );
                      if (!group) return null;

                      const groupInputs = groupedInputsByGroup[group.id] || [];
                      const isEmpty = groupInputs.length === 0;

                      // Hide the dragged group placeholder while moving it
                      if (
                        isDraggingRef.current &&
                        isEmpty &&
                        activeIdState === group.id
                      ) {
                        return null;
                      }

                      // For empty groups, render without SortableItem to prevent dragging
                      if (isEmpty) {
                        return (
                          <div key={group.id} className="mb-4">
                            <SDInputGroup
                              id={group.id}
                              title={group.title}
                              onTitleChange={updateGroupTitle}
                              onDelete={deleteGroup}
                              isEmpty={true}
                              items={[]}
                              isDraggable={false}
                              defaultCollapsed={
                                groupCollapseStates[group.id] || false
                              }
                              onCollapseToggle={(id, collapsed) => {
                                setGroupCollapseStates((prev) => ({
                                  ...prev,
                                  [id]: collapsed,
                                }));
                              }}
                            >
                              <div className="rounded-md border-2 border-muted-foreground/20 border-dashed p-4 text-center text-muted-foreground text-sm">
                                Drag items here to add them to this group
                              </div>
                            </SDInputGroup>
                          </div>
                        );
                      }

                      return (
                        <InputGroupWithItems
                          key={group.id}
                          group={group}
                          inputs={groupInputs}
                          values={values}
                          updateInput={updateInput}
                          onTitleChange={updateGroupTitle}
                          onDelete={deleteGroup}
                          isDraggable={true}
                          collapsed={groupCollapseStates[group.id] || false}
                          onCollapseToggle={(id, collapsed) => {
                            setGroupCollapseStates((prev) => ({
                              ...prev,
                              [id]: collapsed,
                            }));
                          }}
                        />
                      );
                    }
                    const input = ungroupedInputs.find(
                      (i) => i.input_id === layoutItem.id,
                    );
                    if (!input) return null;

                    return (
                      <DraggableInputItem
                        key={input.input_id}
                        input={input}
                        value={values[input.input_id || ""]}
                        updateInput={updateInput}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            // Render inputs respecting groups in non-edit mode
            (() => {
              // If no groups exist, render inputs normally
              if (inputGroups.length === 0) {
                return inputs.map((item) => {
                  if (!item?.input_id) {
                    return null;
                  }
                  return (
                    <SDInputsRender
                      key={item.input_id}
                      inputNode={item}
                      updateInput={updateInput}
                      inputValue={values[item.input_id]}
                    />
                  );
                });
              }

              // Render with groups
              const renderedItems: ReactNode[] = [];
              const renderedInputIds = new Set<string>();

              // First render items based on layout order
              for (const layoutItem of layoutOrder) {
                if (layoutItem.type === "group") {
                  const group = inputGroups.find((g) => g.id === layoutItem.id);
                  if (!group) continue;

                  const groupInputs = inputs.filter(
                    (input) =>
                      input.groupId === layoutItem.id && input.input_id,
                  );

                  if (groupInputs.length > 0) {
                    renderedItems.push(
                      <InputGroupWithItems
                        key={group.id}
                        group={group}
                        inputs={groupInputs}
                        values={values}
                        updateInput={updateInput}
                        onTitleChange={() => {}}
                        onDelete={() => {}}
                        isDraggable={false}
                        collapsed={groupCollapseStates[group.id] || false}
                        onCollapseToggle={(id, collapsed) => {
                          setGroupCollapseStates((prev) => ({
                            ...prev,
                            [id]: collapsed,
                          }));
                        }}
                      />
                    );
                    groupInputs.forEach(item => {
                      if (item.input_id) {
                        renderedInputIds.add(item.input_id);
                      }
                    });
                  }
                } else {
                  // Render ungrouped input
                  const input = inputs.find(
                    (i) => i.input_id === layoutItem.id && !i.groupId,
                  );
                  if (input?.input_id) {
                    renderedInputIds.add(input.input_id);
                    renderedItems.push(
                      <SDInputsRender
                        key={input.input_id}
                        inputNode={input}
                        updateInput={updateInput}
                        inputValue={values[input.input_id]}
                      />,
                    );
                  }
                }
              }

              // Render any remaining inputs that weren't in layoutOrder
              for (const item of inputs) {
                if (item.input_id && !renderedInputIds.has(item.input_id)) {
                  renderedItems.push(
                    <SDInputsRender
                      key={item.input_id}
                      inputNode={item}
                      updateInput={updateInput}
                      inputValue={values[item.input_id]}
                    />,
                  );
                }
              }

              return renderedItems;
            })()
          )
        ) : (
          <div className="py-2 text-center text-muted-foreground text-sm">
            Please save a new version in ComfyUI to run this workflow.
          </div>
        )}
      </SDForm>
    </div>
  );
}
