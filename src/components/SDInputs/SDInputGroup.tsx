import type React from "react";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Trash2, GripVertical } from "lucide-react";
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
}: SDInputGroupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);

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
      ref={setNodeRef}
      className={cn(
        "mb-4 rounded-lg border-2 border-dashed p-4 transition-all duration-200",
        isOver
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-300 dark:border-gray-600",
        isEmpty && "flex flex-col items-center justify-center",
      )}
    >
      <div className="mb-3 flex w-full items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          {isDraggable ? (
            <SortableDragHandle
              type="button"
              variant="ghost"
              className="hover:bg-muted p-1 rounded"
              size="sm"
            >
              <GripVertical size={16} className="text-muted-foreground" />
            </SortableDragHandle>
          ) : (
            <GripVertical size={16} className="text-muted-foreground" />
          )}
          {isEditing ? (
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
              className="text-sm font-medium"
              autoFocus
            />
          ) : (
            <h3
              className="text-sm font-medium cursor-pointer hover:text-blue-600"
              onClick={() => setIsEditing(true)}
            >
              {title}
            </h3>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(id)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {isEmpty ? (
        <div className="p-4 text-center text-muted-foreground text-sm">
          Drop inputs here to create a group
        </div>
      ) : (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">{children}</div>
        </SortableContext>
      )}
    </div>
  );
}
