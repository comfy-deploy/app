import { useUploadStore } from "@/stores/upload-store";
import { Progress } from "../ui/progress";
import { X } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface UploadProgressProps {
  className?: string;
}

export function UploadProgress({ className }: UploadProgressProps) {
  const progress = useUploadStore((state) => state.progress);
  const fileQueue = useUploadStore((state) => state.fileQueue);
  const currentFile = useUploadStore((state) => state.currentFile);
  const failedFiles = useUploadStore((state) => state.failedFiles);
  const clearQueue = useUploadStore((state) => state.clearQueue);
  const clearFailedFiles = useUploadStore((state) => state.clearFailedFiles);

  if (
    progress === null &&
    fileQueue.length === 0 &&
    !currentFile &&
    failedFiles.length === 0
  )
    return null;

  // Calculate total size of files in queue
  const totalQueueSize = fileQueue.reduce(
    (total, file) => total + file.size,
    0,
  );
  const maxFilesToShow = 3; // Maximum number of files to display in the list

  return (
    <div
      className={`w-[300px] rounded-md border bg-white p-3 shadow-sm ${className}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-sm">File Upload</h3>
        {(fileQueue.length > 0 || failedFiles.length > 0) && (
          <button
            type="button"
            onClick={() => {
              clearQueue();
              clearFailedFiles();
            }}
            className="text-gray-500 text-xs hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Current upload progress */}
      {currentFile && progress !== null && (
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-gray-700 text-xs">
            <span className="max-w-[200px] truncate">{currentFile.name}</span>
            <span>{formatFileSize(currentFile.size)}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="mt-1 flex justify-between text-gray-500 text-xs">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </p>
        </div>
      )}

      {/* Pending files */}
      {fileQueue.length > 0 && (
        <div className="mt-2">
          <p className="mb-1 font-medium text-gray-700 text-xs">
            Pending ({fileQueue.length})
          </p>
          <div className="max-h-[100px] overflow-y-auto">
            {fileQueue.slice(0, maxFilesToShow).map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex justify-between py-1 text-gray-500 text-xs"
              >
                <span className="max-w-[200px] truncate">{file.name}</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
            ))}
            {fileQueue.length > maxFilesToShow && (
              <p className="mt-1 text-gray-500 text-xs">
                +{fileQueue.length - maxFilesToShow} more files (
                {formatFileSize(totalQueueSize)})
              </p>
            )}
          </div>
        </div>
      )}

      {/* Failed uploads */}
      {failedFiles.length > 0 && (
        <div className="mt-2 border-t pt-2">
          <p className="mb-1 font-medium text-red-500 text-xs">
            Failed ({failedFiles.length})
          </p>
          <div className="max-h-[60px] overflow-y-auto">
            {failedFiles.slice(0, 3).map((fileName, index) => (
              <div
                key={`failed-${index}`}
                className="truncate py-1 text-red-400 text-xs"
              >
                {fileName}
              </div>
            ))}
            {failedFiles.length > 3 && (
              <p className="text-red-400 text-xs">
                +{failedFiles.length - 3} more failed uploads
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
