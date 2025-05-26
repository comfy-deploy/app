"use client";

import { SDForm } from "@/components/SDInputs/SDForm";
import {
  type RGBColor,
  SDInputsRender,
} from "@/components/SDInputs/SDInputsRender";
import { Button } from "@/components/ui/button";
// import { getFileDownloadUrlV2 } from "@/db/getFileDownloadUrl";
import { useAuthStore } from "@/lib/auth-store";
import { callServerPromise } from "@/lib/call-server-promise";
import {
  type WorkflowInputsType,
  type getInputsFromWorkflow,
  getInputsFromWorkflowJSON,
} from "@/lib/getInputsFromWorkflow";
import { cn } from "@/lib/utils";
import { plainInputsToZod } from "@/lib/workflowVersionInputsToZod";
// import { HandleFileUpload } from "@/server/uploadFile";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { Edit, GripVertical, Play, Save, X } from "lucide-react";
import { useQueryState } from "nuqs";
import {
  type FormEvent,
  type ReactNode,
  use,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Sortable,
  SortableItem,
  SortableDragHandle,
} from "@/components/custom/sortable";
import { 
  DndContext, 
  DragEndEvent, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GroupContainer } from "@/components/SDInputs/GroupContainer";
import { UniqueIdentifier } from "@dnd-kit/core";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import type { z } from "zod";
import { uploadFile } from "../files-api";
import { publicRunStore } from "./VersionSelect";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { api } from "@/lib/api";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { queryClient } from "@/lib/providers";

const MAX_FILE_SIZE_BYTES = 250_000_000; // 250MB

export async function parseFilesToImgURLs(
  values: Record<string, any>,
  toZip = false,
) {
  const processFile = async (file: File) => {
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const uploadFileResponse = await uploadFile(file);
      toast.success(`${file.name} uploaded successfully`, { id: toastId });
      return uploadFileResponse.file_url;
    } catch (error) {
      toast.error(`Failed to upload ${file.name}`, { id: toastId });
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

export function WorkflowInputsForm({
  values,
  setValues,
  defaultValues,
  ...props
}: {
  workflow: any; // TODO: Fix workflowType reference
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

  function updateInput(
    key: string,
    val: string | File | undefined | (File | string)[] | boolean | RGBColor[],
  ) {
    if (val instanceof File && val.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Cannot upload files bigger than 250MB");
      return;
    }
    setValues((prev: any) => ({ ...prev, [key]: val }));
  }

  const [_isLoading, setIsLoading] = useState(false);
  const isLoading = _isLoading;

  const [childrenOverrides, setChildrenOverrides] = useState<ReactNode>();
  const [tooltip, setTooltip] = useState<string | undefined>(undefined);

  return (
    <SDForm
      onSubmit={async (e) => {
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
      }}
      actionArea={
        // props.actionArea
        !hideRunButton && (
          <div className="flex justify-end gap-2 pr-3">
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                setValues(defaultValues);
              }}
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
  );
}

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
  const [values, setValues] =
    useState<
      Record<
        string,
        string | File | undefined | (File | string)[] | boolean | RGBColor[]
      >
    >(default_values);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRunId, setCurrentRunId] = useQueryState("run-id");

  const [isEditMode, setIsEditMode] = useState(false);
  const [reorderedInputs, setReorderedInputs] = useState<typeof inputs>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [groupExpanded, setGroupExpanded] = useState<Record<string, boolean>>({});

  const workflowId = useWorkflowIdInWorkflowPage();
  const { workflow } = useCurrentWorkflow(workflowId);
  
  const groupedInputs = useMemo(() => {
    const grouped: Record<string, typeof inputs> = { root: [] };
    
    inputs?.forEach(item => {
      if (!item?.input_id) return;
      
      const groupName = item.cd_group_name || 'root';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
        if (groupName !== 'root' && !groups.includes(groupName)) {
          setGroups(prev => [...prev, groupName]);
        }
      }
      grouped[groupName].push(item);
    });
    
    Object.keys(grouped).forEach(group => {
      if (grouped[group]?.length) {
        grouped[group].sort((a, b) => {
          const orderA = a.nodeId && (workflow_api as unknown as Record<string, any>)?.[a.nodeId as string]?._meta?.cd_input_order;
          const orderB = b.nodeId && (workflow_api as unknown as Record<string, any>)?.[b.nodeId as string]?._meta?.cd_input_order;
          return (orderA ?? Number.MAX_SAFE_INTEGER) - (orderB ?? Number.MAX_SAFE_INTEGER);
        });
      }
    });
    
    return grouped;
  }, [inputs, groups, workflow_api]);

  useEffect(() => {
    if (isEditMode && inputs) {
      setReorderedInputs([...inputs]);
    }
  }, [isEditMode, inputs]);
  
  const addGroup = () => {
    const groupName = `Group ${groups.length + 1}`;
    setGroups(prev => [...prev, groupName]);
    setGroupExpanded(prev => ({ ...prev, [groupName]: true }));
  };
  
  const deleteGroup = (groupName: string) => {
    setGroups(prev => prev.filter(g => g !== groupName));
    
    setGroupExpanded(prev => {
      const { [groupName]: _, ...rest } = prev;
      return rest;
    });
    
    if (workflow_api && workflowId) {
    }
  };
  
  const updateInputGroup = (inputId: string, groupName: string) => {
    if (!workflow_api || !workflowId) return;
    
    const inputToUpdate = inputs?.find(input => input.input_id === inputId);
    if (!inputToUpdate || !inputToUpdate.nodeId) return;
    
  const workflowApiClone = workflow_api ? { ...(workflow_api as unknown as Record<string, any>) } : {};
    
    if (workflowApiClone[inputToUpdate.nodeId as string]) {
      if (!workflowApiClone[inputToUpdate.nodeId as string]._meta) {
        workflowApiClone[inputToUpdate.nodeId as string]._meta = {};
      }
      
      workflowApiClone[inputToUpdate.nodeId as string]._meta.cd_group_name = groupName;
      
      setIsLoading(true);
      callServerPromise(
        api({
          url: `workflow/${workflowId}/version`,
          init: {
            method: "POST",
            body: JSON.stringify({
              workflow: workflow?.versions[0].workflow,
              workflow_api: workflowApiClone,
              comment: `Updated input group: ${inputId} to ${groupName}`,
            }),
          },
        }),
        {
          loadingText: "Updating input group...",
        },
      ).then(() => {
        toast.success("Input group updated successfully");
        queryClient.invalidateQueries({
          queryKey: ["workflow", workflowId, "versions"],
        });
        setIsLoading(false);
      }).catch((error) => {
        setIsLoading(false);
        toast.error(
          `Failed to update input group: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      });
    }
  };

  const toggleGroupExpanded = (groupName: string, expanded: boolean) => {
    setGroupExpanded(prev => ({ ...prev, [groupName]: expanded }));
  };
  
  const itemTypes = useMemo(() => {
    const types: Record<string, 'group' | 'input'> = {};
    
    groups.forEach(group => {
      types[group] = 'group';
    });
    
    inputs?.forEach(input => {
      if (input.input_id) {
        types[input.input_id] = 'input';
      }
    });
    
    reorderedInputs?.forEach(input => {
      if (input.input_id) {
        types[input.input_id] = 'input';
      }
    });
    
    return types;
  }, [groups, inputs, reorderedInputs]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeType = itemTypes[activeId];
    const overType = itemTypes[overId];
    
    if (isEditMode) {
      const activeIndex = reorderedInputs.findIndex(item => item.input_id === activeId);
      const overIndex = reorderedInputs.findIndex(item => item.input_id === overId);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const newInputs = [...reorderedInputs];
        const [movedItem] = newInputs.splice(activeIndex, 1);
        newInputs.splice(overIndex, 0, movedItem);
        setReorderedInputs(newInputs);
      }
      return;
    }
    
    if (activeType === 'input' && overType === 'group') {
      updateInputGroup(activeId, overId);
      return;
    }
    
    if (activeType === 'input' && overType === 'input') {
      let groupName = 'root';
      const activeInput = inputs?.find(input => input.input_id === activeId);
      const overInput = inputs?.find(input => input.input_id === overId);
      
      if (activeInput?.cd_group_name === overInput?.cd_group_name) {
        groupName = activeInput?.cd_group_name || 'root';
        
        if (groupedInputs[groupName]) {
          const activeIndex = groupedInputs[groupName].findIndex(item => item.input_id === activeId);
          const overIndex = groupedInputs[groupName].findIndex(item => item.input_id === overId);
          
          if (activeIndex !== -1 && overIndex !== -1) {
            updateInputGroup(activeId, groupName);
          }
        }
      } else {
        updateInputGroup(activeId, overInput?.cd_group_name || 'root');
      }
      return;
    }
    
    if (activeType === 'group' && overType === 'group') {
      setGroups(prev => {
        const oldIndex = prev.indexOf(activeId);
        const newIndex = prev.indexOf(overId);
        
        if (oldIndex === -1 || newIndex === -1) return prev;
        
        const newGroups = [...prev];
        newGroups.splice(oldIndex, 1);
        newGroups.splice(newIndex, 0, activeId);
        return newGroups;
      });
    }
  };

  const user = useAuth();
  const clerk = useClerk();

  const schema = useMemo(() => {
    return plainInputsToZod(inputs);
  }, [inputs]);

  const fetchToken = useAuthStore((state) => state.fetchToken);

  const {
    setRunId,
    loading,
    setLoading: setLoading2,
    setStatus,
    setImage,
  } = publicRunStore();

  const runWorkflow = async () => {
    if (!user.isSignedIn) {
      clerk.openSignIn({
        redirectUrl: window.location.href,
      });
      return;
    }

    setLoading2(true);
    setIsLoading(true);
    const valuesParsed = await parseFilesToImgURLs({ ...values });
    const val = parseInputValues(valuesParsed);
    console.log(val);
    setStatus({ state: "preparing", live_status: "", progress: 0 });
    try {
      const origin = window.location.origin;
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
            batch_number: 1,
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

  function updateInput(
    key: string,
    val: string | File | undefined | (File | string)[] | boolean | RGBColor[],
  ) {
    if (val instanceof File && val.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Cannot upload files bigger than 250MB");
      return;
    }
    setValues((prev) => ({ ...prev, [key]: val }));
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

  const saveChanges = async () => {
    if (!workflow_version_id || !reorderedInputs) return;

    try {
      setIsLoading(true);
      if (!workflow_api) {
        toast.error("No workflow API found");
        return;
      }

      const workflowApi = workflow_api;

      reorderedInputs.forEach((input, index) => {
        const nodeId = input.nodeId as string | undefined;
        if (nodeId && (workflowApi as unknown as Record<string, any>)[nodeId]) {
          (workflowApi as unknown as Record<string, any>)[nodeId]._meta = {
            ...((workflowApi as unknown as Record<string, any>)[nodeId]._meta || {}),
            cd_input_order: index,
            cd_group_name: input.cd_group_name || undefined,
          };
        }
      });

      await callServerPromise(
        api({
          url: `workflow/${workflowId}/version`,
          init: {
            method: "POST",
            body: JSON.stringify({
              workflow: workflow.versions[0].workflow,
              workflow_api: workflowApi,
              comment: "Updated inputs order and groups",
            }),
          },
        }),
        {
          loadingText: "Saving changes...",
        },
      );

      toast.success("Changes saved successfully");
      queryClient.invalidateQueries({
        queryKey: ["workflow", workflowId, "versions"],
      });
      setIsEditMode(false);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      toast.error(
        `Failed to save changes: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="relative h-full">
      <style dangerouslySetInnerHTML={{
        __html: `
        .sortable-item-transition {
          transition-property: transform, opacity;
          transition-duration: 0.2s;
          transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
        }
        `
      }} />
      {/* Edit button */}
      {canEditOrder && (
        <div className="absolute top-0 right-1 z-10 flex gap-2">
          {isEditMode ? (
            <>
              <Button
                onClick={() => setIsEditMode(false)}
                variant="outline"
                size="xs"
                className="shadow-sm backdrop-blur-sm"
              >
                <X size={16} className="mr-1" />
                Cancel
              </Button>
              <Button
                onClick={saveChanges}
                variant="default"
                size="xs"
                className="shadow-sm backdrop-blur-sm"
                isLoading={isLoading}
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
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={addGroup}
              >
                Add Group
              </Button>
              <Button
                disabled={!inputs || isEditMode}
                type="submit"
                className="flex-1"
                isLoading={isLoading || loading}
                variant="expandIcon"
                iconPlacement="right"
                Icon={Play}
              >
                Run
              </Button>
            </div>
          )
        }
        scrollAreaClassName={cn("h-full", scrollAreaClassName)}
      >
        {inputs ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {isEditMode ? (
              <SortableContext 
                items={reorderedInputs.map(item => item.input_id || `item-${Math.random()}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {reorderedInputs.map((item) => (
                    <SortableItem
                      key={item.input_id || `item-${Math.random()}`}
                      value={item.input_id || `item-${Math.random()}`}
                      className="flex items-center border rounded-md p-2 bg-card mb-2 sortable-item-transition"
                    >
                      <div className="flex items-center w-full">
                        <SortableDragHandle
                          variant="ghost"
                          className="mr-2 p-1 hover:bg-muted rounded"
                          size="sm"
                        >
                          <GripVertical size={16} />
                        </SortableDragHandle>
                        <div className="flex-1">
                          <SDInputsRender
                            key={item.input_id}
                            inputNode={item}
                            updateInput={() => {}}
                            inputValue={values[item.input_id || ""]}
                          />
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            ) : (
              <SortableContext 
                items={groups.map(g => g)}
                strategy={verticalListSortingStrategy}
              >
                {/* Render grouped inputs */}
                {groups.map(groupName => (
                  <SortableItem 
                    key={groupName} 
                    value={groupName}
                    className="mb-4"
                  >
                    <GroupContainer
                      groupName={groupName}
                      onDelete={deleteGroup}
                      isExpanded={groupExpanded[groupName] ?? true}
                      onToggleExpanded={(expanded) => toggleGroupExpanded(groupName, expanded)}
                    >
                      {groupedInputs[groupName]?.map((item) => (
                        <SortableItem 
                          key={item.input_id} 
                          value={item.input_id || ''}
                          className="flex items-center border rounded-md p-2 bg-card mb-2 sortable-item-transition"
                        >
                          <div className="flex items-center w-full">
                            <SortableDragHandle
                              variant="ghost"
                              className="mr-2 p-1 hover:bg-muted rounded"
                              size="sm"
                            >
                              <GripVertical size={16} />
                            </SortableDragHandle>
                            <div className="flex-1">
                              <SDInputsRender
                                key={item.input_id}
                                inputNode={item}
                                updateInput={updateInput}
                                inputValue={values[item.input_id || ""]}
                              />
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </GroupContainer>
                  </SortableItem>
                ))}
                
                {/* Render ungrouped inputs */}
                {groupedInputs.root?.map((item) => (
                  <SortableItem 
                    key={item.input_id} 
                    value={item.input_id || ''}
                    className="flex items-center border rounded-md p-2 bg-card mb-2 sortable-item-transition"
                  >
                    <div className="flex items-center w-full">
                      <SortableDragHandle
                        variant="ghost"
                        className="mr-2 p-1 hover:bg-muted rounded"
                        size="sm"
                      >
                        <GripVertical size={16} />
                      </SortableDragHandle>
                      <div className="flex-1">
                        <SDInputsRender
                          key={item.input_id}
                          inputNode={item}
                          updateInput={updateInput}
                          inputValue={values[item.input_id || ""]}
                        />
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </SortableContext>
            )}
          </DndContext>
        ) : (
          <div className="py-2 text-center text-muted-foreground text-sm">
            Please save a new version in ComfyUI to run this workflow.
          </div>
        )}
      </SDForm>
    </div>
  );
}
