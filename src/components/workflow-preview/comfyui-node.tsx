"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { memo } from "react";

// Define the node data structure
interface ComfyNodeData {
  label: string;
  type: string;
  inputs: any[];
  outputs: any[];
  widgets?: any[];
  properties?: any;
  color?: string;
  bgcolor?: string;
  apiInputs?: Record<string, any>;
  classType?: string;
}

// Add a new interface for unified port data
interface UnifiedPort {
  type: "input" | "output" | "direct";
  name: string;
  value?: any;
  portType?: string;
  isConnected?: boolean;
  index: number;
  originalIndex?: number;
}

export const ComfyNode = memo(({ data, ...props }) => {
  // Start with inputs collapsed by default
  const [isOpen, setIsOpen] = useState(false);

  // Use the provided color or generate one based on the node type
  const nodeColor = data.color || "#333";
  const nodeBgColor = data.bgcolor || "#444";

  // Helper function to normalize strings for comparison
  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric characters
      .replace(/\s+/g, ""); // Remove whitespace
  };

  // Get input name from API format if available
  const getInputName = (input: any, index: number) => {
    // First, use the name from the input object if available
    if (input.name) {
      return input.name;
    }

    // If no name in input object, try to find it in API format
    if (data.apiInputs) {
      // Find the input name in the API format
      for (const [key, value] of Object.entries(data.apiInputs)) {
        if (
          Array.isArray(value) &&
          value.length >= 2 &&
          value[0] === Number.parseInt(input.link) &&
          value[1] === index
        ) {
          return key;
        }
      }

      // If not found in connections, check if it's a direct input
      const directInputKeys = Object.keys(data.apiInputs).filter(
        (key) => !Array.isArray(data.apiInputs![key]),
      );

      if (index < directInputKeys.length) {
        return directInputKeys[index];
      }
    }

    // Fallback to type if no name is found
    return input.type || "unknown";
  };

  // Get input value from API format if available
  const getInputValue = (input: any, index: number) => {
    if (!data.apiInputs) return null;

    // Find the input name
    const inputName = getInputName(input, index);

    // Get the value if it's not a connection
    const value = data.apiInputs[inputName];
    if (value !== undefined && !Array.isArray(value)) {
      return formatWidgetValue(value);
    }

    return null;
  };

  // Format widget values for better display
  const formatWidgetValue = (value: any): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") return value.toString();
    if (typeof value === "string") {
      // If it's a filename or path, show just the filename
      if (value.includes("/") || value.includes("\\")) {
        const parts = value.split(/[/\\]/);
        return parts[parts.length - 1];
      }
      // For short strings, return the full string
      if (value.length <= 25) return value;
      // For longer strings that might be prompts, truncate with ellipsis
      return value.substring(0, 22) + "...";
    }
    if (typeof value === "object")
      return JSON.stringify(value).substring(0, 25) + "...";
    return String(value);
  };

  // Format type names for better display
  const formatTypeName = (type: string): string => {
    // Remove common prefixes but don't change case
    return type.replace(/WAN(VIDEO)?_?/i, "").replace(/^WANVID/i, "");
  };

  // Helper function to get unified ports
  const getUnifiedPorts = (): UnifiedPort[] => {
    const ports: UnifiedPort[] = [];

    // Add connection inputs first
    if (data.inputs) {
      data.inputs.forEach((input, index) => {
        const inputName = getInputName(input, index);
        const isConnected = input.connected;
        const inputValue = !isConnected ? getInputValue(input, index) : null;

        ports.push({
          type: "input",
          name: inputName,
          value: inputValue,
          portType: input.type,
          isConnected,
          index: ports.length,
          originalIndex: index,
        });
      });
    }

    // Add direct inputs (widgets) after inputs
    if (data.apiInputs) {
      Object.entries(data.apiInputs)
        .filter(([_, value]) => !Array.isArray(value))
        .forEach(([key, value], index) => {
          ports.push({
            type: "direct",
            name: key,
            value: value,
            index: ports.length,
          });
        });
    } else if (data.widgets) {
      data.widgets.forEach((value, index) => {
        ports.push({
          type: "direct",
          name: `Value ${index + 1}`,
          value: value,
          index: ports.length,
        });
      });
    }

    return ports;
  };

  // Helper function to get output ports
  const getOutputPorts = (): UnifiedPort[] => {
    const ports: UnifiedPort[] = [];

    if (data.outputs) {
      data.outputs.forEach((output, index) => {
        ports.push({
          type: "output",
          name: output.name || formatTypeName(output.type),
          portType: output.type,
          index: index, // Use original index for outputs
        });
      });
    }

    return ports;
  };

  const unifiedPorts = getUnifiedPorts();
  const outputPorts = getOutputPorts();
  const handleSpacing = 28;
  const baseHeight = 80;
  const minHeight =
    baseHeight +
    Math.max(unifiedPorts.length, outputPorts.length) * handleSpacing;
  const headerHeight = 40;
  const topPadding = 12;

  // Determine if the label and type are the same to avoid duplication
  // This improved check handles cases where the strings are semantically the same
  // but have different formatting, spaces, or special characters
  const showTypeAsBadge = (() => {
    const normalizedLabel = normalizeString(data.label);
    const normalizedType = normalizeString(data.type);
    const normalizedClassType = data.classType
      ? normalizeString(data.classType)
      : "";

    // Don't show badge if the normalized strings match
    if (
      normalizedLabel === normalizedType ||
      normalizedLabel === normalizedClassType
    ) {
      return false;
    }

    // Also check if the type is contained within the label or vice versa
    if (
      normalizedLabel.includes(normalizedType) ||
      normalizedType.includes(normalizedLabel)
    ) {
      return false;
    }

    // Same for class type
    if (
      normalizedClassType &&
      (normalizedLabel.includes(normalizedClassType) ||
        normalizedClassType.includes(normalizedLabel))
    ) {
      return false;
    }

    return true;
  })();

  // Get direct inputs (not connections) from API format
  const getDirectInputs = () => {
    if (!data.apiInputs) return [];

    return Object.entries(data.apiInputs)
      .filter(([_, value]) => !Array.isArray(value))
      .map(([key, value]) => ({ key, value }));
  };

  // Get direct inputs from widgets
  const getWidgetInputs = () => {
    if (!data.widgets || data.widgets.length === 0) return [];

    return data.widgets.map((value, index) => ({
      key: `Value ${index + 1}`,
      value,
    }));
  };

  // Combine API inputs and widgets
  const directInputs = data.apiInputs ? getDirectInputs() : getWidgetInputs();

  // Order inputs based on API format if available
  const getOrderedInputs = () => {
    if (!data.inputs) return [];

    // If we have API inputs, try to order based on that
    if (data.apiInputs) {
      // Create a map of input index to position in the API
      const inputOrder = new Map<number, number>();

      // First, add all inputs that are in the API format
      let position = 0;
      for (const [key, value] of Object.entries(data.apiInputs)) {
        if (Array.isArray(value)) {
          // This is a connection, find the corresponding input index
          for (let i = 0; i < data.inputs.length; i++) {
            if (getInputName(data.inputs[i], i) === key) {
              inputOrder.set(i, position++);
              break;
            }
          }
        }
      }

      // Then add any remaining inputs that weren't in the API
      for (let i = 0; i < data.inputs.length; i++) {
        if (!inputOrder.has(i)) {
          inputOrder.set(i, position++);
        }
      }

      // Sort the inputs based on the order map
      return [...data.inputs].sort((a, b) => {
        const indexA = data.inputs.indexOf(a);
        const indexB = data.inputs.indexOf(b);
        return (inputOrder.get(indexA) || 0) - (inputOrder.get(indexB) || 0);
      });
    }

    // If no API inputs, return the original order
    return data.inputs;
  };

  // const orderedInputs = getOrderedInputs();

  return (
    <div className="relative">
      {/* Type badge positioned above the node */}
      {showTypeAsBadge && (
        <div className="absolute left-0 -top-6 z-10">
          <Badge
            variant="outline"
            className="text-xs truncate text-white rounded-full shadow-md px-3 py-1"
            style={{ backgroundColor: nodeColor }}
          >
            {data.classType || data.type}
          </Badge>
        </div>
      )}

      <Card
        className="shadow-md border-2 overflow-visible rounded-xl relative"
        style={{
          borderColor: nodeColor,
          background: nodeBgColor,
          width: "280px",
          minHeight: `${minHeight}px`,
        }}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle
              className="w-full truncate border-white/20 border-b pb-1 font-medium text-white text-xs"
              title={data.label}
            >
              {data.label}
            </CardTitle>
            {/* <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <button className="h-5 w-5 rounded-full hover:bg-muted/30 flex items-center justify-center text-white">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </CollapsibleTrigger>
            </Collapsible> */}
          </div>
        </CardHeader>

        {/* Unified port rendering */}
        {unifiedPorts.map((port, index) => {
          const handleColor = port.portType
            ? getHandleColorByType(port.portType)
            : "#888888";
          const position = headerHeight + topPadding + index * handleSpacing;

          return (
            <div
              key={`${port.type}-${index}`}
              className="absolute flex items-center"
              style={{
                left: -8,
                top: position,
                width: "auto",
                height: "24px",
              }}
            >
              <div className="absolute flex items-center">
                {/* Handle circle and dot for inputs */}
                {port.type === "input" && (
                  <div
                    className="relative -translate-x-4"
                    style={{ width: "20px", height: "20px" }}
                  >
                    <div
                      className="absolute rounded-full border-2 transition-all"
                      style={{
                        width: 16,
                        height: 16,
                        left: 2,
                        top: 2,
                        borderColor: handleColor,
                        backgroundColor: port.isConnected
                          ? "rgba(0,0,0,0.3)"
                          : "rgba(0,0,0,0.1)",
                      }}
                    />
                    <div
                      className="absolute rounded-full transition-all"
                      style={{
                        width: 6,
                        height: 6,
                        left: 7,
                        top: 7,
                        backgroundColor: handleColor,
                        zIndex: 10,
                        opacity: port.isConnected ? 1 : 0.5,
                      }}
                    />
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={`input-${port.originalIndex}`}
                      style={{
                        width: 20,
                        height: 20,
                        left: 0,
                        top: 10,
                        opacity: 0,
                        zIndex: 20,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Port label and value */}
              <div
                className="flex items-center ml-4"
                style={{
                  height: "24px",
                }}
              >
                <span
                  className="whitespace-nowrap rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white"
                  style={{
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={port.name}
                >
                  {port.name}
                </span>

                {/* Show value only for unconnected ports */}
                {port.value !== undefined &&
                  port.value !== "" &&
                  !port.isConnected && (
                    <span
                      className="ml-2 whitespace-nowrap rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-white/70"
                      style={{
                        maxWidth: "120px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={`Value: ${port.value}`}
                    >
                      {formatWidgetValue(port.value)}
                    </span>
                  )}
              </div>
            </div>
          );
        })}

        {/* Output ports rendering */}
        {outputPorts.map((port, index) => {
          const handleColor = port.portType
            ? getHandleColorByType(port.portType)
            : "#888888";
          const position = headerHeight + topPadding + index * handleSpacing;

          return (
            <div
              key={`output-${index}`}
              className="absolute flex items-center"
              style={{
                right: -8,
                top: position,
                width: "140px",
                height: "24px",
              }}
            >
              {/* Port label */}
              <div
                className="flex items-center justify-end"
                style={{
                  width: "140px",
                  height: "24px",
                }}
              >
                <span
                  className="whitespace-nowrap rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white"
                  style={{
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={port.name}
                >
                  {port.name}
                </span>
              </div>

              {/* Handle for outputs */}
              <div className="relative flex items-center">
                <div
                  className="relative translate-x-4"
                  style={{ width: "20px", height: "20px" }}
                >
                  <div
                    className="absolute rounded-full border-2 transition-all"
                    style={{
                      width: 16,
                      height: 16,
                      right: 2,
                      top: 2,
                      borderColor: handleColor,
                      backgroundColor: "rgba(0,0,0,0.3)",
                    }}
                  />
                  <div
                    className="absolute rounded-full transition-all"
                    style={{
                      width: 6,
                      height: 6,
                      right: 7,
                      top: 7,
                      backgroundColor: handleColor,
                      zIndex: 10,
                    }}
                  />
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`output-${index}`}
                    style={{
                      width: 20,
                      height: 20,
                      right: 0,
                      top: 10,
                      opacity: 0,
                      zIndex: 20,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
});

// Helper function to get a color for a handle based on its type
function getHandleColorByType(type: string): string {
  const colorMap: Record<string, string> = {
    IMAGE: "#4CAF50",
    LATENT: "#2196F3",
    MODEL: "#9C27B0",
    VAE: "#FF9800",
    CLIP: "#E91E63",
    CONTROL: "#00BCD4",
    MASK: "#FFEB3B",
    CONDITIONING: "#E91E63",
    STRING: "#607D8B",
    default: "#888888",
  };

  // Check if the type contains any of the keys (case insensitive)
  for (const [key, color] of Object.entries(colorMap)) {
    if (typeof type === "string" && type?.toUpperCase().includes(key)) {
      return color;
    }
  }

  return colorMap.default;
}

// Format property values for better display
function formatPropertyValue(value: any): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object")
    return (
      JSON.stringify(value).substring(0, 40) +
      (JSON.stringify(value).length > 40 ? "..." : "")
    );
  return (
    String(value).substring(0, 40) + (String(value).length > 40 ? "..." : "")
  );
}

// Format type names for better display
function formatTypeName(type: string): string {
  // Remove common prefixes but don't change case
  return type.replace(/WAN(VIDEO)?_?/i, "").replace(/^WANVID/i, "");
}
