"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeTypes,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn } from "lucide-react";
import { ComfyNode } from "./comfyui-node";

// Define custom node types
const nodeTypes: NodeTypes = {
  comfyNode: ComfyNode,
};

interface ComfyUIFlowProps {
  workflow: any;
  apiFormat?: any;
}

export function ComfyUIFlow({ workflow, apiFormat }: ComfyUIFlowProps) {
  return (
    <ReactFlowProvider>
      <ComfyUIFlowContent workflow={workflow} apiFormat={apiFormat} />
    </ReactFlowProvider>
  );
}

function ComfyUIFlowContent({ workflow, apiFormat }: ComfyUIFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const { fitView } = useReactFlow();

  // Process the workflow data to create nodes and edges
  const processWorkflow = useCallback(() => {
    if (!workflow) return { nodes: [], edges: [] };

    setLoading(true);

    try {
      // First, process the edges so we can determine which inputs are connected
      const processedEdges: Edge[] = workflow.links.map(
        (link: any, index: number) => {
          // Get the type of the connection if available
          const sourceNode = workflow.nodes.find(
            (n: any) => n.id.toString() === link[1].toString(),
          );
          const sourceOutput = sourceNode?.outputs?.[link[2]];
          const connectionType = sourceOutput?.type || "default";

          return {
            id: `e${index}`,
            source: link[1].toString(),
            target: link[3].toString(),
            sourceHandle: `output-${link[2]}`,
            targetHandle: `input-${link[4]}`,
            // animated: true,
            type: "default",
            style: {
              stroke: getConnectionColor(connectionType),
              strokeWidth: 3,
              opacity: 0.8,
            },
            data: { type: connectionType },
            zIndex: 0, // Ensure edges are below nodes
          };
        },
      );

      // Create a map of connected inputs
      const connectedInputs = new Map<string, Set<number>>();
      processedEdges.forEach((edge) => {
        const [nodeId, inputIndex] = edge.targetHandle?.split("-") || ["", ""];
        if (!connectedInputs.has(edge.target)) {
          connectedInputs.set(edge.target, new Set());
        }
        connectedInputs.get(edge.target)?.add(Number.parseInt(inputIndex));
      });

      const processedNodes: Node[] = workflow.nodes.map((node: any) => {
        // Extract position
        const position = node.pos
          ? { x: node.pos[0], y: node.pos[1] }
          : { x: 0, y: 0 };

        // Get node color from workflow if available
        const nodeColor =
          node.color || getNodeColorByType(node.type || "default");

        // Get the set of connected inputs for this node
        const nodeConnectedInputs =
          connectedInputs.get(node.id.toString()) || new Set();

        // Mark which inputs are connected
        const inputs =
          node.inputs?.map((input: any, index: number) => ({
            ...input,
            connected: nodeConnectedInputs.has(index),
          })) || [];

        // Get API format data for this node if available
        const apiNode = apiFormat ? apiFormat[node.id.toString()] : null;
        const apiInputs = apiNode?.inputs || {};
        const apiTitle = apiNode?._meta?.title || null;

        // Use node size from workflow if available, otherwise calculate based on content
        const nodeSize = node.size || [
          280,
          calculateNodeHeight(node, apiInputs),
        ];

        // Create a node
        return {
          id: node.id.toString(),
          type: "comfyNode",
          position,
          data: {
            label: apiTitle || node.title || node.type || "Unknown Node",
            type: node.type || "Unknown",
            inputs: inputs,
            outputs: node.outputs || [],
            widgets: node.widgets_values || [],
            properties: node.properties || {},
            color: nodeColor,
            bgcolor: node.bgcolor,
            apiInputs: apiInputs,
            classType: apiNode?.class_type || node.type,
          },
          style: {
            zIndex: 1, // Ensure nodes are above edges
            width: nodeSize[0],
            height: nodeSize[1],
          },
        };
      });

      return { nodes: processedNodes, edges: processedEdges };
    } catch (error) {
      console.error("Error processing workflow:", error);
      return { nodes: [], edges: [] };
    } finally {
      setLoading(false);
    }
  }, [workflow, apiFormat]);

  // Helper function to calculate node height based on content
  function calculateNodeHeight(node: any, apiInputs: any): number {
    const inputCount = node.inputs?.length || 0;
    const outputCount = node.outputs?.length || 0;
    const maxIOCount = Math.max(inputCount, outputCount);

    // Base height for header
    let height = 80;

    // Add height for each IO port
    height += maxIOCount * 22;

    // Add height for direct inputs (from API or widgets)
    const directInputCount = apiInputs
      ? Object.values(apiInputs).filter((v: any) => !Array.isArray(v)).length
      : node.widgets_values?.length || 0;

    // Add height for each direct input (approximate)
    if (directInputCount > 0) {
      height += 10 + directInputCount * 35; // padding + height per input
    }

    // Ensure there's enough space for all handles
    const minHeightForHandles = 80 + maxIOCount * 22;

    return Math.max(height, minHeightForHandles, 120); // Minimum height
  }

  // Update nodes and edges when workflow changes
  useEffect(() => {
    if (workflow) {
      const { nodes: processedNodes, edges: processedEdges } =
        processWorkflow();
      setNodes(processedNodes);
      setEdges(processedEdges);

      // Give time for the nodes to render before fitting view
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 100);
    }
  }, [workflow, processWorkflow, setNodes, setEdges, fitView]);

  // Handle fit view
  const handleFitView = () => {
    fitView({ padding: 0.2 });
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      maxZoom={2}
      attributionPosition="bottom-right"
      connectionLineType={ConnectionLineType.SimpleBezier}
      connectionLineStyle={{ stroke: "#888", strokeWidth: 2 }}
      defaultEdgeOptions={{
        type: "default",
        style: { strokeWidth: 2, opacity: 1 },
      }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnScroll={true}
      panOnDrag={true}
      zoomOnPinch={true}
      zoomOnDoubleClick={true}
      preventScrolling={false}
      className="comfyui-flow"
      style={{ touchAction: "auto" }}
    >
      <Background color="#555" gap={16} size={1} />
      <Controls />
      <MiniMap
        nodeStrokeWidth={3}
        zoomable
        pannable
        nodeColor={(node) => {
          return node.data.color || "#666";
        }}
      />
      {/* <Panel position="top-right" className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleFitView}>
          <ZoomIn className="h-4 w-4 mr-1" /> Fit View
        </Button>
      </Panel> */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Processing workflow...</p>
          </div>
        </div>
      )}
    </ReactFlow>
  );
}

// Helper function to get a color for a connection type
function getConnectionColor(type: string): string {
  const colorMap: Record<string, string> = {
    IMAGE: "#4CAF50",
    LATENT: "#2196F3",
    MODEL: "#9C27B0",
    VAE: "#FF9800",
    CLIP: "#E91E63",
    CONTROL: "#00BCD4",
    MASK: "#FFEB3B",
    WANVIDEOMODEL: "#9C27B0",
    WANVAE: "#FF9800",
    WANVIDEOTEXTEMBEDS: "#E91E63",
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

// Helper function to get a color for a node type
function getNodeColorByType(type: string): string {
  // ComfyUI uses different colors for different node categories
  if (
    type.includes("Loader") ||
    type.includes("Load") ||
    type.includes("Checkpoint")
  ) {
    return "#223344";
  } else if (type.includes("Sampler") || type.includes("KSampler")) {
    return "#332233";
  } else if (type.includes("VAE")) {
    return "#443322";
  } else if (type.includes("Image")) {
    return "#224433";
  } else if (type.includes("Upscale")) {
    return "#222244";
  } else if (
    type.includes("Condition") ||
    type.includes("Encode") ||
    type.includes("CLIP")
  ) {
    return "#442222";
  } else if (type.includes("Save")) {
    return "#224422";
  } else {
    return "#333333";
  }
}
