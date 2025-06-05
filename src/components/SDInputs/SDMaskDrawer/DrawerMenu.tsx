import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Brush, Eraser, Undo2 } from "lucide-react";

export function DrawerMenu({ onUndo }: { onUndo?: () => void }) {
  function onSelectBrush() {
    const event = new KeyboardEvent("keydown", {
      key: "d",
      code: "KeyD",
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
    });

    // Dispatch the event to enable draw mode
    document.dispatchEvent(event);
  }

  function onSelectEraser() {
    const event = new KeyboardEvent("keydown", {
      key: "e",
      code: "KeyE",
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
    });

    // Dispatch the event on the document to enable eraser
    document.dispatchEvent(event);
  }

  return (
    <div className="flex gap-2">
      <ToggleGroup type="single" defaultValue="brush">
        <ToggleGroupItem
          value="brush"
          aria-label="Toggle brush"
          onClick={onSelectBrush}
        >
          <Brush />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="ereaser"
          aria-label="Toggle ereaser"
          onClick={onSelectEraser}
        >
          <Eraser />
        </ToggleGroupItem>
      </ToggleGroup>
      <Button variant="ghost" size="icon" onClick={onUndo} aria-label="Undo">
        <Undo2 className="h-5 w-5" />
      </Button>
    </div>
  );
}
