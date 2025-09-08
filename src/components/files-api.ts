import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

export async function uploadFile(file: File) {
  // Ensure upload folder exists
  try {
    await api({
      url: "assets/folder",
      init: {
        method: "POST",
        body: JSON.stringify({ name: "upload", parent_path: "/" }),
      },
    });
  } catch (error: any) {
    // Check for the "folder already exists" error in multiple ways
    const errorMessage = error?.message || error?.toString() || "";
    const errorDetail = error?.detail || "";
    const errorBody = error?.body || "";

    const isFolderExistsError =
      errorMessage.includes("Folder already exists") ||
      errorDetail === "Folder already exists" ||
      (errorMessage.includes("status: 400") &&
        errorMessage.includes("Folder already exists")) ||
      (typeof errorBody === "string" &&
        errorBody.includes("Folder already exists"));

    if (isFolderExistsError) {
      // This is expected and good - folder exists, we can continue
      console.log("Upload folder already exists - continuing");
    } else {
      // For any other error, throw it
      console.error("Failed to create upload folder:", error);
      throw new Error("Failed to ensure upload folder exists");
    }
  }

  // Handle small files with regular upload
  if (file.size < 50 * 1024 * 1024) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api({
      url: "assets/upload",
      skipDefaultHeaders: true,
      init: {
        method: "POST",
        body: formData,
      },
      params: {
        parent_path: "/upload",
      },
    });
    return response;
  }

  const toastId = toast.loading("Preparing upload...", {
    duration: Number.POSITIVE_INFINITY,
  });

  // Get presigned URL
  const presignedUrlResponse = await api({
    url: "assets/presigned-url",
    params: {
      file_name: file.name,
      parent_path: "/upload",
      size: file.size,
      type: file.type,
    },
  });

  toast.loading("Starting upload...", { id: toastId });

  // Upload to presigned URL with progress tracking
  const xhr = new XMLHttpRequest();

  const uploadPromise = new Promise((resolve, reject) => {
    xhr.open("PUT", presignedUrlResponse.url, true);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const progressPercentage = Math.round((e.loaded / e.total) * 80) + 10;
        toast.loading(`Uploading... ${progressPercentage}%`, { id: toastId });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload"));
    };

    xhr.send(file);
  });

  await uploadPromise;

  toast.loading("Finalizing upload...", { id: toastId });

  // Register the uploaded asset
  const registeredAsset = await api({
    url: "assets/register",
    init: {
      method: "POST",
      body: JSON.stringify({
        file_id: presignedUrlResponse.file_id,
        file_name: file.name,
        file_size: file.size,
        db_path: presignedUrlResponse.db_path,
        url: presignedUrlResponse.download_url,
        mime_type: file.type,
      }),
    },
  });

  toast.success("File uploaded successfully!", { id: toastId });
  return registeredAsset;
}

export async function generateUploadUrl(
  filename: string,
  contentType: string,
  size: number,
) {
  return await api({
    url: "volume/file/generate-upload-url",
    init: {
      method: "POST",
      body: JSON.stringify({
        filename,
        contentType,
        size,
      }),
    },
  });
}

export async function uploadFileToVolume({
  volumeName,
  file,
  filename,
  subfolder,
  targetPath,
  apiEndpoint,
  onProgress,
}: {
  volumeName: string;
  file: File;
  filename?: string;
  subfolder?: string;
  targetPath?: string;
  apiEndpoint: string;
  onProgress?: (
    progress: number,
    uploadedSize: number,
    totalSize: number,
    estimatedTime: number,
  ) => void;
}) {
  const url = `${apiEndpoint}`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("filename", filename || file.name);
  formData.append("volume_name", volumeName);
  if (targetPath) {
    formData.append("target_path", targetPath);
  }
  if (subfolder) {
    formData.append("subfolder", subfolder);
  }

  console.log(file.name, url);

  try {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        const uploadedSize = event.loaded;
        const totalSize = event.total;
        const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
        const uploadSpeed = uploadedSize / elapsedTime; // bytes per second
        const remainingSize = totalSize - uploadedSize;
        const estimatedTime = remainingSize / uploadSpeed; // in seconds

        onProgress(progress, uploadedSize, totalSize, estimatedTime);
      }
    };

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          console.log("File uploaded successfully:", result);
          resolve(result);
        } else {
          // Return the error from the server as plain text
          const errorMessage =
            xhr.responseText || `Server error: ${xhr.statusText}`;
          reject(new Error(errorMessage));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error occurred during file upload"));
      };

      xhr.send(formData);
    });
  } catch (error: any) {
    console.error("Error uploading file:", error.message);
    throw error;
  }
}

async function retryUpload<T>(
  uploadFn: () => Promise<T>,
  maxRetries: number = 3,
  delays: number[] = [1000, 2000, 4000] // 1s, 2s, 4s
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = delays[attempt] || delays[delays.length - 1];
      console.log(`Upload attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('All retry attempts failed');
}

async function uploadPart(url: string, data: Blob, partNumber: number): Promise<string> {
  return retryUpload(async () => {
    const response = await fetch(url, {
      method: 'PUT',
      body: data,
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Part ${partNumber} upload failed: ${response.status}`);
    }
    
    const etag = response.headers.get('ETag');
    if (!etag) {
      throw new Error(`No ETag received for part ${partNumber}`);
    }
    
    return etag;
  });
}

export async function uploadFileWithProgress(
  file: File,
  onProgress?: (progress: number, uploadedSize: number, totalSize: number, estimatedTime: number) => void
) {
  const uploadResponse = await generateUploadUrl(
    file.name,
    file.type || 'application/octet-stream',
    file.size
  );

  if (uploadResponse.isMultipart) {
    return await uploadMultipart(file, uploadResponse, onProgress);
  } else {
    return await uploadSingle(file, uploadResponse.uploadUrl, onProgress);
  }
}

async function uploadSingle(
  file: File, 
  uploadUrl: string, 
  onProgress?: (progress: number, uploadedSize: number, totalSize: number, estimatedTime: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        const elapsedTime = (Date.now() - startTime) / 1000;
        const uploadSpeed = event.loaded / elapsedTime;
        const remainingSize = event.total - event.loaded;
        const estimatedTime = remainingSize / uploadSpeed;

        onProgress(progress, event.loaded, event.total, estimatedTime);
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
      reject(new Error('Network error during upload'));
    };

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
}

async function uploadMultipart(
  file: File,
  uploadResponse: any,
  onProgress?: (progress: number, uploadedSize: number, totalSize: number, estimatedTime: number) => void
) {
  const { partUrls, partSize, uploadId, objectKey } = uploadResponse;
  const parts: Array<{ETag: string, PartNumber: number}> = [];
  
  let completedParts = 0;
  const totalParts = partUrls.length;
  const startTime = Date.now();

  try {
    const partPromises = partUrls.map(async (url: string, index: number) => {
      const partNumber = index + 1;
      const start = index * partSize;
      const end = Math.min(start + partSize, file.size);
      const partData = file.slice(start, end);

      const etag = await uploadPart(url, partData, partNumber);
      
      completedParts++;
      
      if (onProgress) {
        const progress = (completedParts / totalParts) * 100;
        const uploadedBytes = completedParts * partSize;
        const elapsedTime = (Date.now() - startTime) / 1000;
        const uploadSpeed = uploadedBytes / elapsedTime;
        const remainingBytes = file.size - uploadedBytes;
        const estimatedTime = remainingBytes / uploadSpeed;

        onProgress(progress, Math.min(uploadedBytes, file.size), file.size, estimatedTime);
      }

      return { ETag: etag, PartNumber: partNumber };
    });

    const completedPartsList = await Promise.all(partPromises);
    parts.push(...completedPartsList);

    await api({
      url: "volume/file/complete-multipart-upload",
      init: {
        method: "POST",
        body: JSON.stringify({
          objectKey,
          uploadId,
          parts: parts.sort((a, b) => a.PartNumber - b.PartNumber)
        })
      }
    });

  } catch (error) {
    try {
      await api({
        url: "volume/file/abort-multipart-upload",
        init: {
          method: "POST",
          body: JSON.stringify({
            objectKey,
            uploadId
          })
        }
      });
    } catch (cleanupError) {
      console.error('Failed to cleanup multipart upload:', cleanupError);
    }
    
    throw error;
  }
}
