import { toast } from "sonner";

export const downloadImage = async ({
  url,
  fileName,
}: {
  url: string;
  fileName?: string;
}) => {
  console.log("Downloading the image...");

  if (!url) {
    toast.error("Something went wrong");
    return;
  }

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) {
      toast.error("Something went wrong");
      return;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName || "ComfyDeploy_download.jpg"; // Default filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Revoke the object URL to free memory
    URL.revokeObjectURL(blobUrl);
    toast.success("Image downloaded successfully");
  } catch (error) {
    toast.error("Something went wrong");
  }
};
