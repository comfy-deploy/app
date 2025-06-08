import { LoadingWrapper } from "@/components/loading-wrapper";
import { CardContent } from "@/components/ui/card";
import { useWorkflowIdInWorkflowPage } from "@/hooks/hook";
import { FilterDropdown, RunsTable } from "./RunsTable";

import { motion } from "framer-motion";
import { parseAsBoolean, useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ChevronDown, ChevronUp, Play, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MyDrawer } from "../drawer";
import { useSearch } from "@tanstack/react-router";
import {
  getDefaultValuesFromWorkflow,
  getInputsFromWorkflow,
} from "@/lib/getInputsFromWorkflow";
import { RunWorkflowInline } from "../run/RunWorkflowInline";
import { useSelectedVersion } from "../version-select";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { LoadingIcon } from "../ui/custom/loading-icon";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getFormattedInputs } from "../run/SharePageComponent";
import { Input } from "../ui/input";

export default function RunComponent(props: {
  defaultData?: any;
}) {
  const workflow_id = useWorkflowIdInWorkflowPage();
  const [runId] = useQueryState("run-id");
  const [inputModalOpen] = useQueryState("input");

  if (!workflow_id) {
    return null;
  }

  return (
    <motion.div className="w-full" layout>
      <div
        className={cn(
          "relative h-fit w-full transition-all duration-300",
          inputModalOpen && "xl:w-[calc(100%-494px)]",
          runId && "xl:w-[calc(100%-594px)]",
        )}
      >
        <CardContent className="px-0 pt-6">
          <div className="flex items-center justify-between px-2 pb-4">
            <h2 className="font-bold text-2xl">Requests</h2>
            <div className="flex items-center gap-2">
              <SearchRunIdInputBox />
              <FilterDropdown workflowId={workflow_id} />
              <InputComponent workflowId={workflow_id} />
            </div>
          </div>
          <LoadingWrapper tag="runs">
            <RunsTable
              workflow_id={workflow_id}
              defaultData={props.defaultData}
            />
          </LoadingWrapper>
        </CardContent>

        <div className="mx-6 flex items-center justify-end gap-1 text-2xs text-muted-foreground">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-[6px] bg-white/90 shadow-sm backdrop-blur-sm"
            aria-label="Up"
            disabled
          >
            <ChevronUp size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-[6px] bg-white/90 shadow-sm backdrop-blur-sm"
            aria-label="Down"
            disabled
          >
            <ChevronDown size={16} />
          </Button>
          <span>Navigate Requests</span>
        </div>
      </div>
    </motion.div>
  );
}

function InputComponent({ workflowId }: { workflowId: string }) {
  const [inputModalOpen, setInputModalOpen] = useQueryState(
    "input",
    parseAsBoolean,
  );
  const [runId, setRunId] = useQueryState("run-id");
  const { tweak } = useSearch({ from: "/workflows/$workflowId/$view" });
  const [_, setTweakQuery] = useQueryState("tweak");
  const { value: version, isLoading: isVersionLoading } = useSelectedVersion(
    workflowId ?? "",
  );
  const { workflow } = useCurrentWorkflow(workflowId);
  const { data: run, isLoading: isRunLoading } = useQuery({
    enabled: !!runId,
    queryKey: ["run", runId],
    queryKeyHashFn: (queryKey) => [...queryKey, "outputs"].toString(),
  });
  const lastRunIdRef = useRef<string | null>(null);

  const [default_values, setDefaultValues] = useState(
    getDefaultValuesFromWorkflow(getInputsFromWorkflow(version)),
  );

  useEffect(() => {
    setDefaultValues(
      getDefaultValuesFromWorkflow(getInputsFromWorkflow(version)),
    );
  }, [version?.version]);

  useEffect(() => {
    if (runId) {
      setInputModalOpen(null);
    }
  }, [runId]);

  useEffect(() => {
    if (tweak && runId && run && runId !== lastRunIdRef.current) {
      setDefaultValues(getFormattedInputs(run));
      toast.success("Input values updated.");
      lastRunIdRef.current = runId;
      setTweakQuery(null);
      setRunId(null);
      setInputModalOpen(true);
    }
  }, [runId, run, tweak]);

  return (
    <>
      <Button
        onClick={() => {
          setInputModalOpen(!inputModalOpen);
          setRunId(null);
        }}
      >
        <Play className="mr-2 h-4 w-4" /> Run
      </Button>
      {inputModalOpen && (
        <MyDrawer
          desktopClassName="w-[500px] shadow-lg border border-gray-200 dark:border-zinc-700"
          backgroundInteractive={true}
          open={inputModalOpen}
          onClose={() => {
            setInputModalOpen(false);
            setInputModalOpen(null);
          }}
        >
          <div className="h-full">
            {isVersionLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <LoadingIcon />
              </div>
            ) : (
              <RunWorkflowInline
                blocking={false}
                default_values={default_values}
                inputs={getInputsFromWorkflow(version)}
                workflow_version_id={version?.id}
                machine_id={workflow?.selected_machine_id}
                workflow_api={version?.workflow_api}
              />
            )}
          </div>
        </MyDrawer>
      )}
    </>
  );
}

function SearchRunIdInputBox() {
  const [searchValue, setSearchValue] = useState("");
  const [_, setRunId] = useQueryState("run-id");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidUuid = (value: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  };

  const performSearch = () => {
    if (searchValue.trim() && isValidUuid(searchValue)) {
      setRunId(searchValue.trim());
      inputRef.current?.blur();
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    setRunId(null);
  };

  return (
    <div
      className={cn(
        "relative hidden transition-all duration-200 ease-in-out lg:block",
        isFocused ? "w-64" : "w-24 text-muted-foreground",
      )}
    >
      <Search className="-translate-y-1/2 absolute top-1/2 left-0 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder="Search by run ID"
        className="rounded-none border-0 border-b py-1 pr-6 pl-6 focus-visible:border-primary focus-visible:ring-0 dark:bg-transparent"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleSearch}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {searchValue && (
        <Button
          variant="ghost"
          size="icon"
          className="-translate-y-1/2 absolute top-1/2 right-0 h-6 w-6 p-0"
          onClick={clearSearch}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      {isFocused && searchValue && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover bg-white p-3 text-muted-foreground text-xs shadow-md hover:bg-gray-100 dark:bg-zinc-800 dark:text-zinc-400">
          {isValidUuid(searchValue) ? (
            <p className="line-clamp-1">
              Press Enter to search for "{searchValue}"
            </p>
          ) : (
            <p>Please enter a valid Run ID ...</p>
          )}
        </div>
      )}
    </div>
  );
}
