import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Brush, CircleDashed, Eraser, Undo2 } from "lucide-react";

export function DrawerMenu({
  onUndo,
  currentMode,
  onModeChange,
  brushSize,
  onBrushSizeChange,
}: {
  onUndo?: () => void;
  currentMode: "brush" | "eraser";
  onModeChange: (mode: "brush" | "eraser") => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
}) {
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
    onModeChange("brush");
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
    onModeChange("eraser");
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between">
        <div className="w-10" />
        <ToggleGroup
          type="single"
          value={currentMode}
          onValueChange={(value) => {
            if (value === "brush") onSelectBrush();
            else if (value === "eraser") onSelectEraser();
          }}
          className="flex"
        >
          <ToggleGroupItem value="brush" aria-label="Toggle brush">
            <Brush className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="eraser" aria-label="Toggle eraser">
            <Eraser className="h-5 w-5" />
          </ToggleGroupItem>
        </ToggleGroup>
        <Button variant="ghost" size="icon" onClick={onUndo} aria-label="Undo">
          <Undo2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex w-full max-w-48 flex-row items-center gap-2">
        <CircleDashed className="h-4 w-4 text-muted-foreground" />
        <Slider
          value={[brushSize]}
          onValueChange={(value) => onBrushSizeChange(value[0])}
          max={200}
          min={1}
          step={1}
          className="w-full"
        />
        <CircleDashed className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}
