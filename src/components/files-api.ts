import { api } from "@/lib/api";

export async function uploadFile(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api({
    url: "file/upload",
    skipDefaultHeaders: true,
    init: {
      method: "POST",
      body: formData,
      redirect: "follow",
    },
  });
  return response;
}

export async function uploadFileToVolume({
  file,
  filename,
  subfolder,
  targetPath,
  onProgress,
}: {
  volumeName: string;
  file: File;
  filename?: string;
  subfolder?: string;
  targetPath?: string;
  onProgress?: (
    progress: number,
    uploadedSize: number,
    totalSize: number,
    estimatedTime: number,
  ) => void;
}) {
  try {
    const fileType = file.type || "application/octet-stream";
    const fileNameToUse = filename || file.name;
    const parentPath = subfolder
      ? `${(targetPath || "/").replace(/\/$/, "")}/${subfolder.replace(/^\//, "")}`
      : targetPath || "/";

    onProgress?.(5, 0, file.size, 0);

    const presignedUrlResponse = await api({
      url: "assets/presigned-url",
      params: {
        file_name: file.name,
        parent_path: parentPath,
        size: file.size,
        type: fileType,
      },
    });

    onProgress?.(10, 0, file.size, 0);

    const s3Url = presignedUrlResponse.url || presignedUrlResponse.data?.url;
    if (!s3Url) {
      throw new Error("No S3 URL found in presignedUrlResponse");
    }

    const xhr = new XMLHttpRequest();
    const startTime = Date.now();
    const uploadPromise = new Promise<void>((resolve, reject) => {
      xhr.open("PUT", s3Url, true);
      xhr.setRequestHeader("Content-Type", fileType);
      xhr.setRequestHeader("x-amz-acl", "public-read");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const progressPercentage = 10 + (e.loaded / e.total) * 80;
          const uploadedSize = e.loaded;
          const totalSize = e.total;
          const elapsedTime = (Date.now() - startTime) / 1000;
          const uploadSpeed = uploadedSize / elapsedTime;
          const remainingSize = totalSize - uploadedSize;
          const estimatedTime = remainingSize / uploadSpeed;
          onProgress(
            progressPercentage,
            uploadedSize,
            totalSize,
            estimatedTime,
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during upload"));
      };

      xhr.send(file);
    });

    try {
      await uploadPromise;
    } catch (error: any) {
      throw new Error("Failed to upload file to storage");
    }

    onProgress?.(90, file.size, file.size, 0);

    // 4. Register with volume/model endpoint
    try {
      await api({
        url: "volume/model",
        init: {
          method: "POST",
          body: JSON.stringify({
            downloadLink: presignedUrlResponse.download_url,
            source: "link",
            filename: fileNameToUse,
            folderPath: parentPath,
            s3_upload: true,
          }),
        },
      });
    } catch (error) {
      throw new Error("Error while uploading volume to modal");
    }

    onProgress?.(100, file.size, file.size, 0);
  } catch (error) {
    console.error("File upload error:", error);
    throw error instanceof Error
      ? error
      : new Error("Unknown error during file upload");
  }
}
