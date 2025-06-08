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
  onCollapseToggle?: (id: string, collapsed: boolean) => void;
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
  onCollapseToggle,
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

  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseToggle?.(id, newCollapsedState);
  };

  return (
    <div
      className={cn(
        "rounded-lg transition-all duration-200",
        isEditMode && "p-4",
        isEditMode &&
          cn(
            "border-2 border-dashed",
            isOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600",
          ),
        isEmpty && !isCollapsed && "flex flex-col items-center justify-center",
      )}
    >
      {isEditMode && !isEmpty && !isCollapsed && (
        <div
          ref={setNodeRef}
          className={cn(
            "absolute inset-0 z-10 rounded-lg transition-all duration-200",
          )}
          style={{ pointerEvents: isOver ? "auto" : "none" }}
        />
      )}

      <div
        className="flex w-full items-center justify-between"
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
                isEditMode ? () => setIsEditing(true) : handleCollapseToggle
              }
            >
              {title}
            </h3>
          )}
          {!isEditMode && <div className="h-px w-full max-w-64 bg-border/50" />}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCollapseToggle}
            className="h-6 w-6 shrink-0 p-0 hover:bg-muted"
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
          "relative overflow-hidden pl-2 transition-all duration-300 ease-in-out",
          isCollapsed ? "max-h-0 opacity-0" : "mt-2 max-h-[2000px] opacity-100",
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
