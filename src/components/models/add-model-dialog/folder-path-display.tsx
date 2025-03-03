import { cn } from "@/lib/utils";
import { FolderIcon } from "lucide-react";

interface FolderPathDisplayProps {
  path: string;
  className?: string;
}

export function FolderPathDisplay({ path, className }: FolderPathDisplayProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-muted-foreground text-sm",
        className,
      )}
    >
      <FolderIcon className="h-4 w-4" />
      <span>{path || "/"}</span>
    </div>
  );
}
