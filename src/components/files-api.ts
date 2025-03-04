import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

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
