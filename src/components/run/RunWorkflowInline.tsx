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
import { ChevronDown, ChevronRight, Edit, GripVertical, Play, PlusCircle, Save, X } from "lucide-react";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
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
  workflow: z.infer<typeof workflowType>;
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

  type Group = {
    id: string;
    name: string;
    isExpanded: boolean;
    items: string[]; // Input IDs
  };

  const [groups, setGroups] = useState<Group[]>([]);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<{ type: 'input' | 'group', id: string } | null>(null);
  const [overGroupId, setOverGroupId] = useState<string | null>(null);
  
  const workflowId = useWorkflowIdInWorkflowPage();
  const { workflow } = useCurrentWorkflow(workflowId);

  useEffect(() => {
    if (isEditMode && inputs) {
      setReorderedInputs([...inputs]);
      
      if (workflow_api) {
        const parsedWorkflowApi = typeof workflow_api === 'string' 
          ? JSON.parse(workflow_api) 
          : workflow_api;
        
        const groupMap = new Map<string, Group>();
        
        inputs.forEach(input => {
          const nodeId = input.nodeId as string | undefined;
          if (nodeId && parsedWorkflowApi[nodeId]) {
            const groupId = parsedWorkflowApi[nodeId]?._meta?.['comfydeploy-group-id'];
            if (groupId) {
              if (!groupMap.has(groupId)) {
                groupMap.set(groupId, {
                  id: groupId,
                  name: parsedWorkflowApi[nodeId]?._meta?.['comfydeploy-group-name'] || 'Group',
                  isExpanded: parsedWorkflowApi[nodeId]?._meta?.['comfydeploy-group-expanded'] !== false,
                  items: []
                });
              }
              const group = groupMap.get(groupId)!;
              group.items.push(input.input_id || '');
            }
          }
        });
        
        setGroups(Array.from(groupMap.values()));
      } else {
        setGroups([]);
      }
    }
  }, [isEditMode, inputs, workflow_api]);

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

  const createNewGroup = () => {
    const newGroupId = `group-${Date.now()}`;
    setGroups([
      ...groups,
      {
        id: newGroupId,
        name: 'New Group',
        isExpanded: true,
        items: []
      }
    ]);
  };

  const renameGroup = (groupId: string, newName: string) => {
    setGroups(groups.map(group => 
      group.id === groupId ? { ...group, name: newName } : group
    ));
  };

  const toggleGroupExpansion = (groupId: string) => {
    setGroups(groups.map(group => 
      group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group
    ));
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter(group => group.id !== groupId));
  };

  const addInputToGroup = (inputId: string, groupId: string) => {
    const updatedGroups = groups.map(group => ({
      ...group,
      items: group.items.filter(item => item !== inputId)
    }));
    
    setGroups(updatedGroups.map(group => 
      group.id === groupId 
        ? { ...group, items: [...group.items, inputId] } 
        : group
    ));
  };

  const removeInputFromGroup = (inputId: string) => {
    setGroups(groups.map(group => ({
      ...group,
      items: group.items.filter(item => item !== inputId)
    })));
  };

  const saveReordering = async () => {
    if (!workflow_version_id || !reorderedInputs) return;

    try {
      setIsLoading(true);
      if (!workflow_api) {
        toast.error("No workflow API found");
        return;
      }

      const workflowApi = typeof workflow_api === 'string' 
        ? JSON.parse(workflow_api) 
        : workflow_api as Record<string, any>;

      const nonEmptyGroups = groups.filter(group => group.items.length > 0);

      reorderedInputs.forEach((input, index) => {
        const nodeId = input.nodeId as string | undefined;
        if (nodeId && workflowApi[nodeId]) {
          const group = nonEmptyGroups.find(group => 
            group.items.includes(input.input_id || '')
          );
          
          workflowApi[nodeId]._meta = {
            ...(workflowApi[nodeId]._meta || {}),
            "comfydeploy-order": index,
          };
          
          if (group) {
            workflowApi[nodeId]._meta["comfydeploy-group-id"] = group.id;
            workflowApi[nodeId]._meta["comfydeploy-group-name"] = group.name;
            workflowApi[nodeId]._meta["comfydeploy-group-expanded"] = group.isExpanded;
            
            const groupItemIndex = group.items.indexOf(input.input_id || '');
            workflowApi[nodeId]._meta["comfydeploy-group-position"] = groupItemIndex;
          } else {
            delete workflowApi[nodeId]._meta["comfydeploy-group-id"];
            delete workflowApi[nodeId]._meta["comfydeploy-group-name"];
            delete workflowApi[nodeId]._meta["comfydeploy-group-expanded"];
            delete workflowApi[nodeId]._meta["comfydeploy-group-position"];
          }
        }
      });

      await callServerPromise(
        api({
          url: `workflow/${workflowId}/version`,
          init: {
            method: "POST",
            body: JSON.stringify({
              workflow: workflow,
              workflow_api: workflowApi,
              comment: "Reordered and grouped inputs",
            }),
          },
        }),
        {
          loadingText: "Saving input organization...",
        },
      );

      toast.success("Input organization saved successfully");
      queryClient.invalidateQueries({
        queryKey: ["workflow", workflowId, "versions"],
      });
      setIsEditMode(false);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      toast.error(
        `Failed to save input organization: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="relative h-full">
      <style jsx>{`
        :global(.sortable-item-transition) {
          transition-property: transform, opacity;
          transition-duration: 0.2s;
          transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
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
                type="button"
              >
                <X size={16} className="mr-1" />
                Cancel
              </Button>
              <Button
                onClick={createNewGroup}
                variant="outline"
                size="xs"
                className="shadow-sm backdrop-blur-sm mr-2"
                type="button"
              >
                <PlusCircle size={16} className="mr-1" />
                Add Group
              </Button>
              <Button
                onClick={saveReordering}
                variant="default"
                size="xs"
                className="shadow-sm backdrop-blur-sm"
                isLoading={isLoading}
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
            <Button
              disabled={!inputs || isEditMode}
              type="submit"
              className="w-full"
              isLoading={isLoading || loading}
              variant="expandIcon"
              iconPlacement="right"
              Icon={Play}
            >
              Run
            </Button>
          )
        }
        scrollAreaClassName={cn("h-full", scrollAreaClassName)}
      >
        {inputs ? (
          isEditMode ? (
            <div className="space-y-4">

              
              {/* Groups */}
              {groups.length > 0 && (
                <div className="mb-4">
                  <Sortable
                    value={groups.map(group => ({ id: group.id, ...group }))}
                    onValueChange={(items) => {
                      setGroups(items);
                    }}
                    onDragStart={(event) => {
                      setActiveId(event.active.id.toString());
                      setActiveData({
                        type: 'group',
                        id: event.active.id.toString()
                      });
                    }}
                    onDragEnd={() => {
                      setActiveId(null);
                      setActiveData(null);
                      setOverGroupId(null);
                    }}
                    orientation="vertical"
                  >
                    {groups.map((group) => (
                      <SortableItem
                        key={group.id}
                        value={group.id}
                        className={cn(
                          "mb-4 border rounded-md p-3 bg-card sortable-item-transition",
                          overGroupId === group.id && "ring-2 ring-primary border-primary"
                        )}
                        id={`group-${group.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <SortableDragHandle
                              variant="ghost"
                              className="p-1 hover:bg-muted rounded"
                              size="sm"
                              type="button"
                            >
                              <GripVertical size={16} />
                            </SortableDragHandle>
                            
                            <Input
                              value={group.name}
                              onChange={(e) => renameGroup(group.id, e.target.value)}
                              className="h-8 w-40 font-medium"
                            />
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleGroupExpansion(group.id)}
                              className="p-1 h-8 w-8"
                              type="button"
                            >
                              {group.isExpanded ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGroup(group.id)}
                            className="p-1 h-8 w-8 text-destructive hover:text-destructive"
                            type="button"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                        
                        {group.isExpanded && (
                          <Collapsible open={true}>
                            <CollapsibleContent className="pl-8">
                              {group.items.length > 0 ? (
                                <Sortable
                                  value={group.items.map(itemId => {
                                    const input = reorderedInputs.find(input => input.input_id === itemId);
                                    return { id: itemId, input };
                                  })}
                                  onValueChange={(items) => {
                                    setGroups(groups.map(g => 
                                      g.id === group.id 
                                        ? { ...g, items: items.map(item => item.id.toString()) } 
                                        : g
                                    ));
                                  }}
                                  onDragStart={(event) => {
                                    setActiveId(event.active.id.toString());
                                    setActiveData({
                                      type: 'input',
                                      id: event.active.id.toString()
                                    });
                                  }}
                                  onDragEnd={(event) => {
                                    const { active, over } = event;
                                    
                                    if (over && active.id !== over.id && activeData?.type === 'input') {
                                      if (over.id.toString().includes('group-')) {
                                        const targetGroupId = over.id.toString().replace('group-', '');
                                        if (targetGroupId !== group.id) {
                                          removeInputFromGroup(active.id.toString());
                                          addInputToGroup(active.id.toString(), targetGroupId);
                                        }
                                      } 
                                      else if (!over.id.toString().includes('group-')) {
                                        removeInputFromGroup(active.id.toString());
                                      }
                                    }
                                    
                                    setActiveId(null);
                                    setActiveData(null);
                                    setOverGroupId(null);
                                  }}
                                  orientation="vertical"
                                >
                                  {group.items.map(itemId => {
                                    const input = reorderedInputs.find(input => input.input_id === itemId);
                                    if (!input) return null;
                                    
                                    return (
                                      <SortableItem
                                        key={itemId}
                                        value={itemId}
                                        className="flex items-center border rounded-md p-2 bg-card mb-2 sortable-item-transition"
                                      >
                                        <div className="flex items-center w-full">
                                          <SortableDragHandle
                                            variant="ghost"
                                            className="mr-2 p-1 hover:bg-muted rounded"
                                            size="sm"
                                            type="button"
                                          >
                                            <GripVertical size={16} />
                                          </SortableDragHandle>
                                          <div className="flex-1">
                                            <SDInputsRender
                                              key={input.input_id}
                                              inputNode={input}
                                              updateInput={() => {}}
                                              inputValue={values[input.input_id || ""]}
                                            />
                                          </div>
                                        </div>
                                      </SortableItem>
                                    );
                                  })}
                                </Sortable>
                              ) : (
                                <div className="py-2 text-center text-muted-foreground text-sm border border-dashed rounded-md">
                                  Drag inputs here
                                </div>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </SortableItem>
                    ))}
                  </Sortable>
                </div>
              )}
              
              {/* Non-grouped inputs */}
              <Sortable
                value={reorderedInputs
                  .filter(input => !groups.some(group => 
                    group.items.includes(input.input_id || '')
                  ))
                  .map((item, index) => ({
                    id: item.input_id || `item-${index}`,
                    ...item,
                  }))}
                onValueChange={(items) => {
                  const groupedInputIds = groups.flatMap(group => group.items);
                  const groupedInputs = reorderedInputs.filter(input => 
                    groupedInputIds.includes(input.input_id || '')
                  );
                  
                  setReorderedInputs([
                    ...items,
                    ...groupedInputs
                  ]);
                }}
                onDragStart={(event) => {
                  setActiveId(event.active.id.toString());
                  setActiveData({
                    type: 'input',
                    id: event.active.id.toString()
                  });
                }}
                onDragOver={(event) => {
                  if (event.over && activeData?.type === 'input') {
                    const overId = event.over.id.toString();
                    if (overId.startsWith('group-')) {
                      const targetGroupId = overId.replace('group-', '');
                      const group = groups.find(g => g.id === targetGroupId);
                      if (group) {
                        setOverGroupId(targetGroupId);
                      } else {
                        setOverGroupId(null);
                      }
                    } else {
                      setOverGroupId(null);
                    }
                  }
                }}
                onDragEnd={(event) => {
                  const { active, over } = event;
                  
                  if (over && active.id !== over.id && activeData?.type === 'input') {
                    const overId = over.id.toString();
                    if (overId.startsWith('group-')) {
                      const targetGroupId = overId.replace('group-', '');
                      const group = groups.find(g => g.id === targetGroupId);
                      if (group) {
                        addInputToGroup(active.id.toString(), targetGroupId);
                      }
                    }
                  }
                  
                  setActiveId(null);
                  setActiveData(null);
                  setOverGroupId(null);
                }}
                orientation="vertical"
                overlay={(active) => {
                  const activeInput = reorderedInputs.find(
                    (input) => input.input_id === active?.id,
                  );

                  return (
                    <div className="border rounded-md p-2 bg-card/95 backdrop-blur-sm shadow-xl transform scale-105 translate-y-[-4px] sortable-item-transition">
                      <div className="flex items-center w-full">
                        <div className="p-1 mr-2">
                          <GripVertical size={16} />
                        </div>
                        <div className="flex-1">
                          {activeInput && (
                            <SDInputsRender
                              key={activeInput.input_id}
                              inputNode={activeInput}
                              updateInput={() => {}}
                              inputValue={values[activeInput.input_id || ""]}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }}
              >
                {reorderedInputs
                  .filter(input => !groups.some(group => 
                    group.items.includes(input.input_id || '')
                  ))
                  .map((item) => (
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
                          type="button"
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
              </Sortable>
            </div>
          ) : (
            inputs.map((item) => {
              if (!item?.input_id) {
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
            })
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
