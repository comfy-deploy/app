import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SDInputGroupProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onTitleChange: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  isEmpty: boolean;
  items: any[];
}

export function SDInputGroup({
  id,
  title,
  children,
  onTitleChange,
  onDelete,
  isEmpty,
  items,
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
        "border-2 border-dashed rounded-lg p-4 mb-4 transition-all duration-200",
        isOver
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-300 dark:border-gray-600",
        isEmpty && "min-h-[120px] flex items-center justify-center"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical size={16} className="text-muted-foreground" />
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
          variant="ghost"
          size="sm"
          onClick={() => onDelete(id)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 size={14} />
        </Button>
      </div>
      
      {isEmpty ? (
        <div className="text-center text-muted-foreground text-sm">
          Drop inputs here to create a group
        </div>
      ) : (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {children}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
