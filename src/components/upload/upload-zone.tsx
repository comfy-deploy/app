import { useAssetUpload } from "@/hooks/hook";
import { useAssetBrowserStore } from "@/stores/asset-browser-store";
import { useUploadStore } from "@/stores/upload-store";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

interface UploadZoneProps {
  className?: string;
  children?: React.ReactNode;
  iframeEndpoint?: string;
}

export function UploadZone({
  className,
  children,
  iframeEndpoint,
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadAsset } = useAssetUpload();
  const setFileInput = useUploadStore((state) => state.setFileInput);
  const setProgress = useUploadStore((state) => state.setProgress);
  const addToQueue = useUploadStore((state) => state.addToQueue);
  const removeFromQueue = useUploadStore((state) => state.removeFromQueue);
  const fileQueue = useUploadStore((state) => state.fileQueue);
  const isUploading = useUploadStore((state) => state.isUploading);
  const setCurrentFile = useUploadStore((state) => state.setCurrentFile);
  const addFailedFile = useUploadStore((state) => state.addFailedFile);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const { currentPath } = useAssetBrowserStore();

  useEffect(() => {
    if (fileInputRef.current) {
      setFileInput(fileInputRef.current);
    }
  }, [setFileInput]);

  const processQueue = useCallback(async () => {
    if (fileQueue.length === 0 || isUploading) return;

    const nextFile = removeFromQueue();
    if (!nextFile) return;

    // Set the current file being processed
    setCurrentFile(nextFile);

    try {
      setProgress(0);
      await uploadAsset({
        file: nextFile,
        parent_path: currentPath,
        onProgress: (progress) => {
          setProgress(progress);
        },
      });
      toast.success(`${nextFile.name} uploaded successfully`);
    } catch (e) {
      toast.error(`Error uploading ${nextFile.name}`);
      // Track failed uploads
      addFailedFile(nextFile.name);
    } finally {
      setProgress(null);
      setCurrentFile(null);
      // Process next file if there are more in the queue
      if (fileQueue.length > 0) {
        setTimeout(() => processQueue(), 500); // Small delay before next file
      }
    }
  }, [
    uploadAsset,
    currentPath,
    setProgress,
    fileQueue,
    removeFromQueue,
    isUploading,
    setCurrentFile,
    addFailedFile,
  ]);

  // Monitor queue and start processing when files are added
  useEffect(() => {
    if (fileQueue.length > 0 && !isUploading) {
      processQueue();
    }
  }, [fileQueue, isUploading, processQueue]);

  const handleFilesImport = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      addToQueue(fileArray);

      if (fileArray.length > 1) {
        toast.info(`Added ${fileArray.length} files to upload queue`);
      }
    },
    [addToQueue],
  );

  // Document-level handlers
  useEffect(() => {
    const handleDocumentDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current++;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDocumentDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };

    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      if (e.dataTransfer?.files?.length) {
        handleFilesImport(e.dataTransfer.files);
      }
    };

    window.addEventListener("dragenter", handleDocumentDragEnter, {
      capture: true,
    });
    window.addEventListener("dragleave", handleDocumentDragLeave, {
      capture: true,
    });
    window.addEventListener("drop", handleDocumentDrop, {
      capture: true,
    });
    window.addEventListener("dragover", (e) => e.preventDefault(), {
      capture: true,
    });

    return () => {
      window.removeEventListener("dragenter", handleDocumentDragEnter, {
        capture: true,
      });
      window.removeEventListener("dragleave", handleDocumentDragLeave, {
        capture: true,
      });
      window.removeEventListener("drop", handleDocumentDrop, {
        capture: true,
      });
      window.removeEventListener("dragover", (e) => e.preventDefault(), {
        capture: true,
      });
    };
  }, [handleFilesImport]);

  useEffect(() => {
    if (!iframeEndpoint) return;

    const receiveMessage = async (event: any) => {
      // It's important to check the origin for security reasons
      if (event.origin !== iframeEndpoint) return;

      if (event.data.type) {
        const { type, data } = event.data;

        switch (type) {
          case "file_drop":
            console.log("Files dropped:", data.files);
            console.log("Drop position:", data.x, data.y);
            setIsDragging(false);
            handleFilesImport(data.files);
            break;

          case "file_dragover":
            console.log("Drag position:", data.x, data.y);
            setIsDragging(true);
            break;

          case "file_dragenter":
            console.log("Drag enter");
            setIsDragging(true);
            break;

          case "file_dragleave":
            console.log("Drag leave");
            setIsDragging(false);
            break;
        }
      }
    };

    window.addEventListener("message", receiveMessage, {
      capture: true,
    });

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("message", receiveMessage, {
        capture: true,
      });
    };
  }, [iframeEndpoint, handleFilesImport]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    handleFilesImport(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesImport(files);
      e.target.value = ""; // Reset input
    }
  };

  return (
    <div
      className={`relative ${className}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleFileDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        multiple
      />

      {/* Drag overlay */}
      <div
        className={`fixed inset-0 z-[9999] transition-all duration-300 ${
          isDragging
            ? "rounded-sm border-2 border-blue-500 border-dashed bg-blue-500/10 opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg bg-white p-6 text-center shadow-lg">
              <p className="font-medium text-gray-700 text-lg">
                Drop files here
              </p>
              <p className="mt-1 text-gray-500 text-sm">
                Release to upload assets
              </p>
            </div>
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
