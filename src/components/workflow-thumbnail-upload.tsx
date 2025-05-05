import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAssetUpload } from "@/hooks/hook";
import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "./ui/progress";

interface WorkflowThumbnailUploadProps {
  workflowId: string;
  onUploadSuccess?: () => void;
}

export function WorkflowThumbnailUpload({
  workflowId,
  onUploadSuccess,
}: WorkflowThumbnailUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutateAsync: uploadAsset } = useAssetUpload();
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      
      setImageFile(file);
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };
  
  const clearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleUpload = async () => {
    if (!imageFile) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const result = await uploadAsset({
        file: imageFile,
        parent_path: "/",
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });
      
      await callServerPromise(
        api({
          url: `workflow/${workflowId}`,
          init: {
            method: "PATCH",
            body: JSON.stringify({ cover_image: result.url }),
          },
        }),
      );
      
      toast.success("Custom thumbnail uploaded!");
      setIsOpen(false);
      clearSelection();
      onUploadSuccess?.();
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      toast.error("Failed to upload thumbnail");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        clearSelection();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload Custom Thumbnail
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Custom Thumbnail</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!previewUrl ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 p-6 transition-colors hover:bg-gray-50"
            >
              <Upload className="mb-2 h-8 w-8 text-gray-400" />
              <p className="mb-1 text-gray-700">Click to select an image</p>
              <p className="text-gray-500 text-sm">PNG, JPG, WEBP up to 5MB</p>
            </div>
          ) : (
            <div className="relative">
              <button 
                onClick={clearSelection}
                className="absolute -right-2 -top-2 rounded-full bg-gray-800 p-1 text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="overflow-hidden rounded-md">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="aspect-square w-full object-cover"
                />
              </div>
            </div>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          
          {uploadProgress !== null && (
            <div className="rounded-md border bg-white p-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="mt-1 text-xs text-gray-500">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              className="mr-2"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!imageFile || isUploading}
              size="sm"
            >
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
