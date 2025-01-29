import { getBranchInfo } from "@/hooks/use-github-branch-info";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { DependencyGraphType } from "comfyui-json";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { z } from "zod";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";

type CustomNodeList = {
  custom_nodes: {
    author: string;
    title: string;
    reference: string;
    pip: string[];
    files: string[];
    install_type: string;
    description: string;
  }[];
};

export type CustomNodeSelectorProps = {
  customTrigger?: React.ReactNode;
  value: any;
  onEdit: (newValue: any) => void;
  commandListClassName?: string;
  open?: boolean;
};

export function useCustomNodeSelector({
  value: initialValue,
  onEdit,
  commandListClassName,
  open,
}: CustomNodeSelectorProps) {
  const customNodeList = initialValue ?? ({} as Record<string, any>);

  const { data, isLoading, refetch } = useQuery<CustomNodeList>({
    queryKey: ["customNodeList"],
    queryFn: () =>
      fetch(
        "https://raw.githubusercontent.com/ltdrdata/ComfyUI-Manager/main/custom-node-list.json",
      ).then((res) => res.json()),
  });

  const blacklist = [
    "https://github.com/ltdrdata/ComfyUI-Manager",
    "https://github.com/kulsisme/openart-comfyui-deploy",
    // "https://github.com/BennyKok/comfyui-deploy",
    // Add more blacklisted references here
  ];

  const keys = useMemo(() => Object.keys(customNodeList), [customNodeList]);

  const [searchTerm, setSearchTerm] = useState("");
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null);

  const filteredNodes = useMemo(() => {
    if (!data?.custom_nodes) return [];

    // Normalize and tokenize the search term
    const searchWords = searchTerm
      .toLowerCase()
      .replace(/[^a-z0-9]/g, " ")
      .split(" ")
      .filter(Boolean); // Remove empty strings

    const lowerCaseBlacklist = new Set(blacklist.map((x) => x.toLowerCase()));

    return data.custom_nodes.filter((node) => {
      // Normalize the node text
      const nodeText = `${node.title} ${node.author} ${node.reference}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, " ");

      // Check if all search words are present in the node text
      return (
        searchWords.every((word) => nodeText.includes(word)) &&
        !lowerCaseBlacklist.has(node.reference.toLowerCase())
      );
    });
  }, [data?.custom_nodes, searchTerm, isLoading]);

  const customNodeListArray = useMemo(() => {
    return filteredNodes.filter((node) => keys.includes(node.title));
  }, [filteredNodes, keys]);

  const [selectedNodes, setSelectedNodes] = useState<
    CustomNodeList["custom_nodes"]
  >(customNodeListArray ?? []);
  const [submit, setSubmit] = useState(false);

  const selectedNodesUrl = useMemo(() => {
    if (submit) return [];
    return selectedNodes.map((node) => node.reference);
  }, [selectedNodes, submit]);

  const rowVirtualizer = useVirtualizer({
    count: filteredNodes.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 35, // Adjust this value based on your row height
    overscan: 30,
  });

  useEffect(() => {
    if (parentRef) {
      rowVirtualizer.measure();
    }
  }, [parentRef, filteredNodes.length]);

  useEffect(() => {
    setSelectedNodes((prev) => {
      const newNodes = customNodeListArray.filter(
        (node) => !prev.some((prevNode) => prevNode.title === node.title),
      );
      return [...prev, ...newNodes];
    });
  }, [customNodeListArray]);

  useEffect(() => {
    if (open) setSelectedNodes(customNodeListArray);
  }, [open]);

  const handleNodeSelection = (node: CustomNodeList["custom_nodes"][0]) => {
    setSelectedNodes((prev) => {
      const isSelected = prev.some((n) => n.title === node.title);
      if (isSelected) {
        return prev.filter((n) => n.title !== node.title);
      }

      return [...prev, node];
    });
  };

  const [isUpdating, setIsUpdating] = useState(false);

  const handleAddSelectedNodes = async () => {
    setIsUpdating(true);
    try {
      const newNodes = await selectedNodes.reduce(async (promise, node) => {
        const acc = await promise;

        if (customNodeList[node.title]) {
          return {
            ...acc,
            [node.title]: customNodeList[node.title],
          };
        }

        const branchInfo = await getBranchInfo(node.reference);
        if (!branchInfo) return acc;

        const value: z.infer<typeof DependencyGraphType>["custom_nodes"][0] = {
          name: node.title,
          hash: branchInfo.commit.sha,
          url: node.reference,
          files: node.files,
          install_type: node.install_type,
        };

        (value as any).meta = {
          message: branchInfo.commit.commit.message,
          committer: (branchInfo.commit.commit as any).committer,
          commit_url: (branchInfo.commit as any).html_url,
        };

        if (node.pip) value.pip = node.pip;

        return {
          ...acc,
          [node.title]: value,
        };
      }, Promise.resolve(customNodeList));

      const updatedNodes = { ...customNodeList, ...newNodes } as Record<
        string,
        z.infer<typeof DependencyGraphType>["custom_nodes"][0]
      >;

      // Handle deletion of nodes
      for (const nodeTitle of Object.keys(customNodeList)) {
        if (!selectedNodes.some((node) => node.title === nodeTitle)) {
          delete updatedNodes[nodeTitle];
        }
      }

      onEdit(updatedNodes);
    } finally {
      setIsUpdating(false);
      setSubmit(false);
    }
  };

  return {
    keys,
    selector: (
      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-center border-gray-300 border-b px-2">
          <Search size={18} className="text-gray-500" />
          <Input
            placeholder="Search by author, title, or GitHub url..."
            value={searchTerm}
            className="border-none focus-visible:outline-none focus-visible:ring-0"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div
          ref={setParentRef}
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent mx-1 h-[360px] overflow-auto"
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
              {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                <div
                  key={virtualRow.index}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="flex cursor-pointer items-center rounded-[8px] text-sm hover:bg-gray-100"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() =>
                    handleNodeSelection(filteredNodes[virtualRow.index])
                  }
                >
                  <Checkbox
                    checked={selectedNodes.some(
                      (n) => n.title === filteredNodes[virtualRow.index].title,
                    )}
                    onCheckedChange={() =>
                      handleNodeSelection(filteredNodes[virtualRow.index])
                    }
                    className="mr-2"
                  />
                  <span className="px-2">
                    {filteredNodes[virtualRow.index].title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={() => {
            setSubmit(true);
            handleAddSelectedNodes();
          }}
          disabled={selectedNodes.length === 0 || isUpdating}
        >
          {isUpdating
            ? "Updating..."
            : `Add Selected Nodes (${selectedNodes.length})`}
        </Button>
      </div>
    ),
  };
}
