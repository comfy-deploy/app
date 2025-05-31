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
import { motion, AnimatePresence } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

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
  isNewInterface,
}: {
  log: LogEntry;
  logRefs: React.RefObject<{ [key: string]: HTMLDivElement | null } | null>;
  selectedType: LogType;
  handleLogClick: (logId: string) => void;
  isNewInterface?: boolean;
}) => {
  const content = (
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

  if (isNewInterface) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

export function LogDisplay(props: {
  control?: boolean;
  newInterface?: boolean;
  className?: string;
  containerClassName?: string;
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
  const [autoScroll, setAutoScroll] = useLocalStorage("log-auto-scroll", true);

  const logRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Filter logs based on selected type
  const filteredLogs = useMemo(() => {
    return processedLogs.filter(
      (log) =>
        selectedType.type === "All" ||
        log.type.type === selectedType.type ||
        log.type.type === "Function",
    );
  }, [processedLogs, selectedType]);

  // Set up virtualizer with dynamic sizing
  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => scrollAreaRef.current,
    estimateSize: () => 30, // Initial estimate, will be refined by measurements
    overscan: 10,
    measureElement: (element) => {
      // This will measure the actual rendered height of each item
      return element.getBoundingClientRect().height;
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current && autoScroll && filteredLogs.length > 0) {
      if (props.newInterface) {
        // Smooth scroll to bottom for new interface
        virtualizer.scrollToIndex(filteredLogs.length - 1, {
          behavior: "smooth",
          align: "end",
        });
      } else {
        // Instant scroll for old interface
        virtualizer.scrollToIndex(filteredLogs.length - 1, { align: "end" });
      }
    }
  }, [filteredLogs, autoScroll, props.newInterface, virtualizer]);

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
    <div className={cn("w-[540px]", props.className)}>
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
            {props.newInterface && (
              <Button
                className="h-8 w-8"
                variant="ghost"
                size="icon"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => setAutoScroll(!autoScroll)}
                title={
                  autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"
                }
              >
                <CornerDownLeft
                  size={16}
                  className={!autoScroll ? "opacity-50" : ""}
                />
              </Button>
            )}
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
      <AnimatePresence>
        <ScrollArea
          ref={scrollAreaRef}
          className={cn(
            props.newInterface
              ? "group relative h-[200px] bg-transparent p-4 font-mono text-gray-400 text-xs transition-all duration-300 hover:h-[440px]"
              : "h-[440px] rounded-md bg-black p-4 font-mono text-gray-400 text-xs transition-all duration-300",
            props.containerClassName,
          )}
        >
          {filteredLogs.length > 0 ? (
            <div
              ref={parentRef}
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const log = filteredLogs[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <LogEntryView
                      key={log.id}
                      log={log}
                      logRefs={logRefs}
                      selectedType={selectedType}
                      handleLogClick={handleLogClick}
                      isNewInterface={props.newInterface}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No logs available.</p>
          )}
          {props.newInterface && (
            <>
              <div className="pointer-events-none absolute top-0 right-0 left-0 h-28 bg-gradient-to-t from-transparent to-[#141414] opacity-100 transition-opacity duration-300 group-hover:opacity-0" />
              <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-28 bg-gradient-to-b from-transparent to-[#141414] opacity-100 transition-opacity duration-300 group-hover:opacity-0" />
            </>
          )}
        </ScrollArea>
      </AnimatePresence>
    </div>
  );
}
