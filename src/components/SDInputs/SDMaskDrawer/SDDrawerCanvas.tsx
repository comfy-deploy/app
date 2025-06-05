import type { ImgView } from "@/components/SDInputs/SDImageInput";
import { fabricImage } from "@/components/SDInputs/SDMaskDrawerUtils/fabricImage";
import { Canvas, Image, PencilBrush } from "fabric";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import "./main.css";

type SDMaskDrawerProps = {
  image: ImgView;
  getCanvasURL: (e: any) => void;
  onModeChange?: (mode: "brush" | "eraser") => void;
  onBrushSizeChange?: (size: number) => void;
  brushSize?: number;
};

export const SDDrawerCanvas = forwardRef(
  (
    {
      image,
      getCanvasURL,
      onModeChange,
      onBrushSizeChange,
      brushSize = 100,
    }: SDMaskDrawerProps,
    ref,
  ) => {
    const containerEl = useRef<HTMLDivElement>(null);
    const canvasEl = useRef<HTMLCanvasElement>(null);
    const canvasMask = useRef<HTMLCanvasElement>(null);
    const canvasBrush = useRef<HTMLDivElement>(null);
    const history = useRef<any[]>([]);
    const maskCanvasInstance = useRef<Canvas | null>(null);
    const currentBrushSize = useRef<number>(brushSize);
    const minZoom = useRef<number>(1);
    const callbacksRef = useRef({ onModeChange, onBrushSizeChange });
    const MAX_HISTORY_SIZE = 20;

    // Update callback refs when they change
    useEffect(() => {
      callbacksRef.current = { onModeChange, onBrushSizeChange };
    }, [onModeChange, onBrushSizeChange]);

    // Update brush size when prop changes
    useEffect(() => {
      currentBrushSize.current = brushSize;
      if (maskCanvasInstance.current?.freeDrawingBrush) {
        maskCanvasInstance.current.freeDrawingBrush.width = brushSize;
        // Update brush preview size
        if (canvasBrush.current) {
          canvasBrush.current.style.width = `${brushSize * minZoom.current}px`;
          canvasBrush.current.style.height = `${brushSize * minZoom.current}px`;
        }
      }
    }, [brushSize]);

    useImperativeHandle(ref, () => ({
      requestData() {
        if (!canvasMask.current || !image.width || !image.height) {
          return;
        }
        const originalContext = canvasMask.current;

        // Upscale canvas to the original size.
        // We play with the zoom to fit the image in the screen, but
        // that affects its widht and height
        const upscaledCanvas = document.createElement("canvas");
        upscaledCanvas.width = image.width;
        upscaledCanvas.height = image.height;
        const upscaledContext = upscaledCanvas.getContext("2d");
        if (!upscaledContext) {
          return;
        }

        upscaledContext.drawImage(
          originalContext,
          0,
          0,
          upscaledCanvas.width,
          upscaledCanvas.height,
        );
        getCanvasURL(upscaledCanvas.toDataURL());
      },
      undo() {
        console.log("undo");
        if (history.current.length > 0 && maskCanvasInstance.current) {
          const lastObject = history.current.pop();
          if (lastObject) {
            maskCanvasInstance.current.remove(lastObject);
            maskCanvasInstance.current.renderAll();
          }
        }
      },
      setBrushSize(size: number) {
        currentBrushSize.current = size;
        if (maskCanvasInstance.current?.freeDrawingBrush) {
          maskCanvasInstance.current.freeDrawingBrush.width = size;
          if (canvasBrush.current) {
            canvasBrush.current.style.width = `${size * minZoom.current}px`;
            canvasBrush.current.style.height = `${size * minZoom.current}px`;
          }
        }
      },
    }));

    useEffect(() => {
      const options = {
        height: containerEl.current?.offsetHeight,
        width: containerEl.current?.offsetWidth,
        backgroundColor: "pink",
      };
      const canvas = new Canvas(canvasEl.current!, options);

      const zoom =
        (containerEl.current?.offsetHeight || 1) / (image.height || 1);
      minZoom.current = zoom;
      canvas.setZoom(zoom);
      const center = {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
      };
      canvas.viewportTransform![4] =
        center.left - (canvas.getWidth() * canvas.getZoom()) / 2; // Center horizontally
      canvas.viewportTransform![5] =
        center.top - (canvas.getHeight() * canvas.getZoom()) / 2; // Center vertically
      const imgInstance = new Image(fabricImage(image.imgURL), {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: "center",
        originY: "center",
        hasControls: false,
        selectable: false,
      });
      canvas.add(imgInstance);
      return () => {
        canvas.dispose();
      };
    }, []);

    useEffect(() => {
      const options = {
        height: containerEl.current?.offsetHeight,
        width: containerEl.current?.offsetWidth,
        backgroundColor: "black",
      };
      const canvas = new Canvas(canvasMask.current!, options);
      maskCanvasInstance.current = canvas;
      const zoom =
        (containerEl.current?.offsetHeight || 1) / (image.height || 1);
      minZoom.current = zoom;
      canvas.setZoom(zoom);
      const center = {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
      };

      canvas.viewportTransform![4] =
        center.left - (canvas.getWidth() * canvas.getZoom()) / 2; // Center horizontally
      canvas.viewportTransform![5] =
        center.top - (canvas.getHeight() * canvas.getZoom()) / 2; // Center vertically

      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = "rgba(255, 255, 255, 1)"; // Brush color
      canvas.freeDrawingBrush.width = currentBrushSize.current; // Use current brush size

      canvas.on("path:created", (e) => {
        history.current.push(e.path);
        if (history.current.length > MAX_HISTORY_SIZE) {
          history.current.shift();
        }
      });

      function toggleEraser(enable: boolean) {
        if (enable) {
          canvas.freeDrawingBrush!.color = "Black";
        } else {
          canvas.freeDrawingBrush!.color = "rgba(255, 255, 255, 1)";
        }
      }

      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "e") {
          // Press 'E' to toggle eraser
          toggleEraser(true);
          callbacksRef.current.onModeChange?.("eraser");
        } else if (e.key === "d") {
          // Press 'D' to toggle draw mode
          toggleEraser(false);
          callbacksRef.current.onModeChange?.("brush");
        }
      }

      // Handle mouse wheel for brush size adjustment
      function handleMouseWheel(opt: any) {
        const delta = opt.e.deltaY < 0 ? 10 : -10;
        let newWidth = canvas.freeDrawingBrush.width + delta;
        newWidth = Math.max(1, Math.min(200, newWidth));

        canvas.freeDrawingBrush.width = newWidth;
        currentBrushSize.current = newWidth;
        callbacksRef.current.onBrushSizeChange?.(newWidth);

        // Update brush preview size
        if (canvasBrush.current) {
          canvasBrush.current.style.width = `${newWidth * minZoom.current}px`;
          canvasBrush.current.style.height = `${newWidth * minZoom.current}px`;
        }

        opt.e.preventDefault();
        opt.e.stopPropagation();
      }

      document.addEventListener("keydown", handleKeyDown);
      canvas.on("mouse:wheel", handleMouseWheel);

      // Set initial brush preview size
      if (canvasBrush.current) {
        canvasBrush.current.style.width = `${currentBrushSize.current * minZoom.current}px`;
        canvasBrush.current.style.height = `${currentBrushSize.current * minZoom.current}px`;
      }

      return () => {
        history.current = [];
        maskCanvasInstance.current = null;
        document.removeEventListener("keydown", handleKeyDown);
        canvas.dispose();
      };
    }, []); // REMOVED the callback dependencies that were causing the re-render

    useEffect(() => {
      const circle = canvasBrush.current;
      const container = containerEl.current;
      if (!circle || !container) {
        return;
      }

      function moveCircle(e: MouseEvent) {
        if (!circle || !container) {
          return;
        }
        // Update circle position to follow mouse cursor
        // Offset by half the circle's dimensions to center it on the cursor
        circle.style.left =
          e.pageX -
          container.getBoundingClientRect().left -
          circle.offsetWidth / 2 +
          "px";
        circle.style.top =
          e.pageY -
          container.getBoundingClientRect().top -
          circle.offsetHeight / 2 +
          "px";
      }

      document.addEventListener("mousemove", moveCircle);
      return () => {
        if (!circle || !container) {
          return;
        }
        document.removeEventListener("mousemove", moveCircle);
      };
    }, []);

    return (
      <div ref={containerEl} className="relative h-full w-full">
        <canvas ref={canvasEl} className="absolute" />
        <canvas ref={canvasMask} className="absolute opacity-50" />
        <div ref={canvasBrush} className="absolute" id="brush" />
      </div>
    );
  },
);
