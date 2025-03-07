"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  CircleX,
  Copy,
  CornerDownLeft,
  FileClock,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  type JSX,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type React from "react";
import { toast } from "sonner";
import { useLog } from "./LogContext";
import type { LogEntry, LogType } from "./LogContext";

function getColor(logType: LogType) {
  const styles = {
    Error: { backgroundColor: "#351215", color: "#D63D40" },
    Warning: { backgroundColor: "#2C1900", color: "#F68E00" },
    Function: { backgroundColor: "#262626", color: "#A9A9A9" },
    All: { backgroundColor: "inherit", color: "inherit" }, // Default style
  };

  return styles[logType.type];
}

const LogEntryView = ({
  log,
  logRefs,
  selectedType,
  handleLogClick,
}: {
  log: LogEntry;
  logRefs: React.RefObject<{ [key: string]: HTMLDivElement | null } | null>;
  selectedType: LogType;
  handleLogClick: (logId: string) => void;
}) => (
  <div
    ref={(el) => {
      logRefs!.current![log.id] = el;
    }}
    className="hover:!bg-gray-800 group mb-0.5 flex items-start justify-start space-x-2 bg-gray-950 leading-normal transition-all duration-300"
    style={getColor(log.type)}
  >
    {log.timestamp && (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger
            onClick={() => {
              toast.success("Copied to clipboard");
              navigator.clipboard.writeText(log.message);
            }}
          >
            <span>{log.timestamp}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-sans text-xs">
              {log.previousTime} since previous log
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
    <span className="whitespace-pre-wrap">{log.message}</span>
    {selectedType.type !== "All" && (
      <div className="relative opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <Button
          variant="expandIcon"
          Icon={CornerDownLeft}
          iconPlacement="right"
          className="h-5 font-sans text-xs"
          onClick={() => {
            handleLogClick(log.id);
          }}
        >
          View in All
        </Button>
      </div>
    )}
  </div>
);

export function LogDisplay(props: {
  control?: boolean;
  newInterface?: boolean;
}) {
  const state = useLog();

  const {
    logs,
    clearLogs,
    processedLogs,
    errorCount,
    warningCount,
    totalCount,
  } = useDeferredValue(state);

  const [selectedType, setSelectedType] = useState<LogType>({ type: "All" });

  const logRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [processedLogs]);

  const LogTypeBadge = ({
    type,
    icon,
    count,
  }: {
    type: LogType["type"];
    icon: JSX.Element;
    count: number;
  }) => (
    <Badge
      variant="outline"
      className={`cursor-pointer rounded-full transition-all duration-300 hover:bg-gray-50 ${
        selectedType.type === type ? "bg-gray-100" : ""
      }`}
      onClick={() => setSelectedType({ type })}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {icon}
      {type} ({count})
    </Badge>
  );

  const scrollToLogById = useCallback((logId: string) => {
    const logElement = logRefs.current[logId];
    if (logElement) {
      logElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const handleLogClick = useCallback(
    (logId: string) => {
      if (selectedType.type !== "All") {
        setSelectedType({ type: "All" });
        setTimeout(() => scrollToLogById(logId), 50);
      }
    },
    [selectedType, scrollToLogById],
  );

  return (
    <div className="w-[540px]">
      {props.control && (
        <div className="flex justify-between pb-2">
          <div className={"flex gap-2"}>
            <LogTypeBadge
              type="All"
              icon={<FileClock size={14} />}
              count={totalCount}
            />
            <LogTypeBadge
              type="Error"
              icon={<CircleX size={14} />}
              count={errorCount}
            />
            <LogTypeBadge
              type="Warning"
              icon={<TriangleAlert size={14} />}
              count={warningCount}
            />
          </div>
          <div className={"flex gap-1"}>
            <Button
              className="h-8 w-8"
              variant="ghost"
              size="icon"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => {
                clearLogs();
                toast.success("Cleared logs!");
              }}
            >
              <Trash2 size={16} />
            </Button>
            <Button
              className="h-8 w-8"
              variant="ghost"
              size="icon"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
                toast.success("Copied to clipboard!");
              }}
            >
              <Copy size={16} />
            </Button>
          </div>
        </div>
      )}
      <ScrollArea
        ref={scrollAreaRef}
        className={
          props.newInterface
            ? "relative h-[200px] rounded-md bg-black/90 p-4 font-mono text-gray-400 text-xs transition-all duration-300"
            : "h-[440px] rounded-md bg-black p-4 font-mono text-gray-400 text-xs transition-all duration-300"
        }
      >
        <div>
          {processedLogs
            .filter(
              (log) =>
                selectedType.type === "All" ||
                log.type.type === selectedType.type ||
                log.type.type === "Function",
            )
            .map((log) => (
              <LogEntryView
                key={log.id}
                log={log}
                logRefs={logRefs}
                selectedType={selectedType}
                handleLogClick={handleLogClick}
              />
            ))}
          {processedLogs.length === 0 && <p>No logs available.</p>}
        </div>
        <div className="absolute top-0 right-0 left-0 h-10 bg-gradient-to-t from-transparent to-black" />
        <div className="absolute right-0 bottom-0 left-0 h-10 bg-gradient-to-b from-transparent to-black" />
      </ScrollArea>
    </div>
  );
}
