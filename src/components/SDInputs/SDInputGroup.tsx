import type React from "react";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortableDragHandle } from "@/components/custom/sortable";

interface SDInputGroupProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onTitleChange: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  isEmpty: boolean;
  items: any[];
  isDraggable?: boolean;
  isEditMode?: boolean;
  defaultCollapsed?: boolean;
}

export function SDInputGroup({
  id,
  title,
  children,
  onTitleChange,
  onDelete,
  isEmpty,
  items,
  isDraggable = false,
  isEditMode = true,
  defaultCollapsed = false,
}: SDInputGroupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const { isOver, setNodeRef } = useDroppable({
    id: `group-${id}`,
    data: {
      type: "group",
      groupId: id,
    },
  });

  const handleTitleSubmit = () => {
    onTitleChange(id, localTitle);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "rounded-lg transition-all duration-200",
        isEditMode && "p-4",
        isEditMode && !isCollapsed
          ? cn(
              "border-2 border-dashed",
              isOver
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600",
            )
          : isEditMode && isCollapsed
            ? "border border-gray-200 dark:border-gray-700"
            : "",
        isEmpty && !isCollapsed && "flex flex-col items-center justify-center",
      )}
    >
      {isEditMode && !isEmpty && !isCollapsed && (
        <div
          ref={setNodeRef}
          className={cn(
            "absolute inset-0 z-10 rounded-lg transition-all duration-200",
            isOver && "bg-blue-500/10 ring-2 ring-blue-500 ring-inset",
          )}
          style={{ pointerEvents: isOver ? "auto" : "none" }}
        />
      )}

      <div
        className="mb-3 flex w-full items-center justify-between"
        ref={isEmpty ? setNodeRef : undefined}
      >
        <div
          className={cn(
            "flex flex-1 items-center gap-2",
            !isEditMode && "justify-between",
          )}
        >
          {isEditMode &&
            (isDraggable ? (
              <SortableDragHandle
                type="button"
                variant="ghost"
                className="rounded p-0 px-1 hover:bg-muted"
                size="sm"
              >
                <GripVertical
                  size={14}
                  className="shrink-0 text-muted-foreground"
                />
              </SortableDragHandle>
            ) : (
              <GripVertical
                size={14}
                className="shrink-0 text-muted-foreground"
              />
            ))}
          {isEditMode && isEditing ? (
            <Input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setLocalTitle(title);
                  setIsEditing(false);
                }
              }}
              className="font-medium text-sm"
              autoFocus
            />
          ) : (
            <h3
              className={cn(
                "select-none text-xs",
                isEditMode &&
                  "cursor-pointer whitespace-nowrap font-medium hover:text-blue-600",
                !isEditMode &&
                  "cursor-pointer whitespace-nowrap text-muted-foreground hover:text-foreground/80",
              )}
              onClick={
                isEditMode
                  ? () => setIsEditing(true)
                  : () => setIsCollapsed(!isCollapsed)
              }
            >
              {title}
            </h3>
          )}
          {!isEditMode && <div className="h-px w-full max-w-64 bg-border/50" />}
          {!isEditMode && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              {isCollapsed ? (
                <ChevronRight
                  size={14}
                  className="text-muted-foreground transition-transform duration-200"
                />
              ) : (
                <ChevronDown
                  size={14}
                  className="text-muted-foreground transition-transform duration-200"
                />
              )}
            </Button>
          )}
        </div>
        {isEditMode && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(id)}
            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      <div
        className={cn(
          "overflow-hidden pl-2 transition-all duration-300 ease-in-out relative",
          isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100",
        )}
      >
        {isEmpty ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Drop inputs here to create a group
          </div>
        ) : (
          <>
            {isEditMode && (
              <div
                ref={setNodeRef}
                className={cn(
                  "w-full h-4 -mb-2 z-20 relative",
                  isOver && "bg-blue-500/20 rounded",
                )}
              />
            )}
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 pb-2 relative">
                {children}
                {isEditMode && (
                  <div
                    ref={setNodeRef}
                    className={cn(
                      "w-full h-4 -mt-2 z-20 relative",
                      isOver && "bg-blue-500/20 rounded",
                    )}
                  />
                )}
              </div>
            </SortableContext>
          </>
        )}
      </div>
    </div>
  );
}
