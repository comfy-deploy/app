"use client";

import type { ImgView } from "@/components/SDInputs/SDImageInput";
import { brushPreview } from "@/components/SDInputs/SDMaskDrawerUtils/brushPreview";
import { fabricImage } from "@/components/SDInputs/SDMaskDrawerUtils/fabricImage";
import { Canvas, Image, PencilBrush } from "fabric";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import "./main.css";

type SDMaskDrawerProps = {
  image: ImgView;
  getCanvasURL: (e: any) => void;
};

export const SDDrawerCanvas = forwardRef(
  ({ image, getCanvasURL }: SDMaskDrawerProps, ref) => {
    const containerEl = useRef<HTMLDivElement>(null);
    const canvasEl = useRef<HTMLCanvasElement>(null);
    const canvasMask = useRef<HTMLCanvasElement>(null);
    const canvasBrush = useRef<HTMLDivElement>(null);
    const history = useRef<any[]>([]);

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
        if (history.current.length > 0) {
          const lastObject = history.current.pop();
          if (lastObject && canvasMask.current) {
            const canvas = canvasMask.current as any;
            if (canvas.__fabric_instance) {
              canvas.__fabric_instance.remove(lastObject);
              canvas.__fabric_instance.renderAll();
            }
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

      const minZoom =
        (containerEl.current?.offsetHeight || 1) / (image.height || 1);
      canvas.setZoom(minZoom);
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
      const minZoom =
        (containerEl.current?.offsetHeight || 1) / (image.height || 1);
      canvas.setZoom(minZoom);
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
      canvas.freeDrawingBrush.width = 100; // Brush width

      canvas.on('path:created', function(e) {
        history.current.push(e.path);
      });

      function toggleEraser(enable: boolean) {
        if (enable) {
          canvas.freeDrawingBrush!.color = "Black";
        } else {
          canvas.freeDrawingBrush!.color = "rgba(255, 255, 255, 1)";
        }
      }

      document.addEventListener("keydown", (e) => {
        if (e.key === "e") {
          // Press 'E' to toggle eraser
          toggleEraser(true);
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "d") {
          // Press 'D' to toggle draw mode
          toggleEraser(false);
        }
      });

      brushPreview(canvas, canvasBrush.current, minZoom);

      return () => {
        history.current = [];
        canvas.dispose();
      };
    }, []);

    useEffect(() => {
      const circle = canvasBrush.current;
      const contaienr = containerEl.current;
      if (!circle || !contaienr) {
        return;
      }

      function moveCircle(e: MouseEvent) {
        if (!circle || !contaienr) {
          return;
        }
        // Update circle position to follow mouse cursor
        // Offset by half the circle's dimensions to center it on the cursor
        circle.style.left =
          e.pageX -
          contaienr.getBoundingClientRect().left -
          circle.offsetWidth / 2 +
          "px";
        circle.style.top =
          e.pageY -
          contaienr.getBoundingClientRect().top -
          circle.offsetHeight / 2 +
          "px";
      }

      document.addEventListener("mousemove", moveCircle);
      return () => {
        if (!circle || !contaienr) {
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
