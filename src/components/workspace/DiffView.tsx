"use client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

export function DiffView({
  workflow,
  oldWorkflow,
  className,
  differences,
}: {
  workflow: any;
  oldWorkflow: any;
  className?: string;
  differences: any;
}) {
  console.log(differences);

  // Update the getNodeInfoFromChanges function to also get node types from the workflow
  const getNodeInfoFromChanges = (workflow: any) => {
    const nodes = new Map();

    // Add existing nodes from workflow
    if (workflow?.nodes) {
      Object.entries(workflow.nodes).forEach(([id, node]: [string, any]) => {
        nodes.set(node.id, {
          type: node.type,
          existing: true,
        });
      });
    }

    return nodes;
  };

  // Update the component to use nodeInfo
  const nodeInfo = useMemo(() => getNodeInfoFromChanges(workflow), [workflow]);
  const oldNodeInfo = useMemo(
    () => getNodeInfoFromChanges(oldWorkflow),
    [oldWorkflow],
  );

  // Add this helper function
  const getNodeType = (path: string, nodeInfo: Map<number, any>) => {
    // Match any path that starts with 'nodes.' followed by a number
    // This will match: nodes.6, nodes.6.something, nodes.6.something.x.x
    const match = path.match(/^nodes\.(\d+)(?:\.|$)/);
    if (match) {
      const nodeId = Number.parseInt(match[1], 10);
      const type = nodeInfo.get(nodeId)?.type;
      console.log(nodeId, type);
      return type;
    }
    return null;
  };

  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >(() => {
    // Process differences to find paths containing .pos and set them as initially collapsed
    const initialState: Record<string, boolean> = {};
    const processChange = (change: any, path: string[] = []) => {
      const currentPath = [...path, change.key].join(".");
      if (currentPath.includes(".pos")) {
        const nodeType = getNodeType(currentPath, nodeInfo) || "other";
        // Get all paths containing .pos for this nodeType
        const pathsForType = Object.keys(initialState).filter(
          (key) => key.includes(`-${nodeType}-`) && key.startsWith("update"),
        );
        const index = pathsForType.length;
        ["update", "add", "remove"].forEach((type) => {
          initialState[`${type}-${nodeType}-${index}`] = true;
        });
      }
      if (change.changes) {
        change.changes.forEach((subChange: any) =>
          processChange(subChange, currentPath ? currentPath.split(".") : []),
        );
      }
    };
    differences.forEach((change: any) => processChange(change));
    console.log(initialState);

    return initialState;
  });

  console.log(collapsedSections);

  const isNodePath = (path: string) => path.startsWith("nodes.");

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const flattenChanges = (changes: any[]) => {
    const groupedChanges = {
      updates: new Map<
        string,
        Record<string, { oldValue: any; newValue: any }>
      >(),
      additions: new Map<string, any>(),
      removals: new Map<string, any>(),
    };

    // Keep track of removed paths to skip their children
    const removedPaths = new Set<string>();

    const processChange = (change: any, currentPath: string[] = []) => {
      const fullPath = currentPath.join(".");

      // Skip if any parent path has been removed
      if (Array.from(removedPaths).some((path) => fullPath.startsWith(path))) {
        return;
      }

      if (change.type === "REMOVE") {
        const path = [...currentPath, change.key].join(".");
        groupedChanges.removals.set(path, change.value);
        removedPaths.add(path);
        return; // Skip processing children of removed objects
      }

      if (change.type === "ADD") {
        const path = [...currentPath, change.key].join(".");
        groupedChanges.additions.set(path, change.value);
      } else if (change.type === "UPDATE") {
        if (change.value !== undefined || change.oldValue !== undefined) {
          const pathWithoutLast = currentPath.join(".");
          const lastKey = change.key;

          if (!groupedChanges.updates.has(pathWithoutLast)) {
            groupedChanges.updates.set(pathWithoutLast, {});
          }

          const group = groupedChanges.updates.get(pathWithoutLast)!;
          group[lastKey] = {
            oldValue: change.oldValue,
            newValue: change.value,
          };
        } else if (change.changes) {
          const newPath = [...currentPath];
          if (change.key) newPath.push(change.key);
          change.changes.forEach((subChange: any) =>
            processChange(subChange, newPath),
          );
        }
      }
    };

    changes.forEach((change) => processChange(change));
    return groupedChanges;
  };

  const groupedChanges = useMemo(() => {
    return flattenChanges(differences);
  }, [differences]);

  const sortChanges = (entries: [string, any][]) => {
    return entries.sort((a, b) => {
      const aIsNode = isNodePath(a[0]);
      const bIsNode = isNodePath(b[0]);
      if (aIsNode && !bIsNode) return -1;
      if (!aIsNode && bIsNode) return 1;
      return a[0].localeCompare(b[0]);
    });
  };

  // Add this helper function after getNodeType
  const formatPath = (path: string, nodeInfo: Map<string, any>) => {
    return path.replace(/nodes\.(\d+)/g, (match, nodeId) => {
      const type = nodeInfo.get(nodeId)?.type;
      return type ? `nodes.${type}` : match;
    });
  };

  // Add helper function to group all changes by node type
  const groupAllChangesByNodeType = (
    groupedChanges: any,
    nodeInfo: Map<number, any>,
    oldNodeInfo: Map<number, any>,
  ) => {
    const grouped = new Map<
      string | null,
      {
        updates: [string, any][];
        additions: [string, any][];
        removals: [string, any][];
      }
    >();

    // Helper to process each change type
    const processChanges = (
      changes: Map<string, any>,
      changeType: "updates" | "additions" | "removals",
    ) => {
      changes.forEach((value, path) => {
        const nodeType = getNodeType(
          path,
          changeType === "removals" ? oldNodeInfo : nodeInfo,
        );
        if (!grouped.has(nodeType)) {
          grouped.set(nodeType, {
            updates: [],
            additions: [],
            removals: [],
          });
        }
        grouped.get(nodeType)![changeType].push([path, value]);
      });
    };

    processChanges(groupedChanges.updates, "updates");
    processChanges(groupedChanges.additions, "additions");
    processChanges(groupedChanges.removals, "removals");

    // Sort groups so that null (non-node changes) comes last
    return new Map(
      [...grouped.entries()].sort((a, b) => {
        if (a[0] === null) return 1;
        if (b[0] === null) return -1;
        return (a[0] || "").localeCompare(b[0] || "");
      }),
    );
  };

  return (
    <div className={cn("space-y-6 pr-4", className)}>
      {Array.from(
        groupAllChangesByNodeType(groupedChanges, nodeInfo, oldNodeInfo),
      ).map(([nodeType, changes]) => (
        <div key={nodeType || "other"} className="space-y-3">
          <Badge className="text-lg font-semibold text-gray-900">
            {nodeType || "Other"}
          </Badge>

          {/* Updates */}
          {changes.updates.length > 0 && (
            <div className="space-y-2">
              {/* <h3 className="text-sm font-medium text-gray-700 ml-4">
                  Updates
                </h3> */}
              {changes.updates.map(([path, changes], index) => {
                const sectionId = `update-${nodeType}-${index}`;
                const isCollapsed = collapsedSections[sectionId];
                return (
                  <div
                    key={sectionId}
                    className={`${
                      isCollapsed ? "" : "border rounded-lg p-2"
                    } ml-6`}
                  >
                    <h3
                      className={`text-xs font-medium text-gray-500 flex items-center cursor-pointer ${
                        isCollapsed ? "" : "mb-1"
                      }`}
                      onClick={() => toggleSection(sectionId)}
                    >
                      <span className="mr-2">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </span>
                      {/* {nodeType && (
                          <span className="ml-2 text-blue-500">
                            ({nodeType})
                          </span>
                        )} */}
                      <Badge>{path}</Badge>
                    </h3>
                    {!isCollapsed && (
                      <div className="space-y-1">
                        {Object.entries(changes).map(([key, value]) => {
                          const { oldValue, newValue } = value as {
                            oldValue: unknown;
                            newValue: unknown;
                          };
                          // Check if this is a link type change (contains "CLIP", "LATENT", etc.)
                          const isLinkTypeChange =
                            typeof oldValue === "string" &&
                            typeof newValue === "string" &&
                            (oldValue.toUpperCase() === oldValue ||
                              newValue.toUpperCase() === newValue);

                          return (
                            <div
                              key={key}
                              className="text-xs flex items-center gap-2 bg-gray-50 px-2 py-1 rounded"
                            >
                              <span className="text-red-500 font-medium">
                                -
                              </span>
                              <span className="text-red-600">
                                {isLinkTypeChange ? (
                                  <span className="font-mono bg-red-100 px-1 rounded">
                                    {oldValue}
                                  </span>
                                ) : (
                                  JSON.stringify(oldValue)
                                )}
                              </span>
                              <span className="text-gray-400 mx-1">→</span>
                              <span className="text-green-500 font-medium">
                                +
                              </span>
                              <span className="text-green-600">
                                {isLinkTypeChange ? (
                                  <span className="font-mono bg-green-100 px-1 rounded">
                                    {newValue}
                                  </span>
                                ) : (
                                  JSON.stringify(newValue)
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Additions */}
          {changes.additions.length > 0 && (
            <div className="space-y-2">
              {/* <h3 className="text-sm font-medium text-green-700 ml-4">
                  Additions
                </h3> */}
              {changes.additions.map(([path, value], index) => {
                const sectionId = `add-${nodeType}-${index}`;
                const isCollapsed = collapsedSections[sectionId];
                return (
                  <div
                    key={sectionId}
                    className={`${
                      isCollapsed ? "" : "border rounded-lg p-2"
                    } ml-6`}
                  >
                    <h3
                      className={`text-xs font-medium text-green-600 flex items-center cursor-pointer ${
                        isCollapsed ? "" : "mb-1"
                      }`}
                      onClick={() => toggleSection(sectionId)}
                    >
                      <span className="mr-2">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </span>
                      {/* Added: {path}
                        {nodeType && (
                          <span className="ml-2 text-blue-500">
                            ({nodeType})
                          </span>
                        )} */}
                      <Badge>{path}</Badge>
                    </h3>
                    {!isCollapsed && (
                      <div className="bg-green-50 px-2 py-1 rounded text-xs">
                        <span className="text-green-500 font-medium">+</span>{" "}
                        {JSON.stringify(value, null, 2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Removals */}
          {changes.removals.length > 0 && (
            <div className="space-y-2">
              {/* <h3 className="text-sm font-medium text-red-700 ml-4">
                  Removals
                </h3> */}
              {changes.removals.map(([path, value], index) => {
                const sectionId = `remove-${nodeType}-${index}`;
                const isCollapsed = collapsedSections[sectionId];
                return (
                  <div
                    key={sectionId}
                    className={`${
                      isCollapsed ? "" : "border rounded-lg p-2"
                    } ml-6`}
                  >
                    <h3
                      className={`text-xs font-medium text-red-600 flex items-center cursor-pointer ${
                        isCollapsed ? "" : "mb-1"
                      }`}
                      onClick={() => toggleSection(sectionId)}
                    >
                      <span className="mr-2">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </span>
                      {/* Removed: {path} */}
                      {/* {nodeType && (
                          <span className="ml-2 text-blue-500">
                            ({nodeType})
                          </span>
                        )} */}
                      <Badge>{path}</Badge>
                    </h3>
                    {!isCollapsed && (
                      <div className="bg-red-50 px-2 py-1 rounded text-xs">
                        <span className="text-red-500 font-medium">-</span>{" "}
                        {JSON.stringify(value, null, 2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
