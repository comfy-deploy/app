"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  ExternalLinkIcon,
  Folder,
  MoreVertical,
  Pencil,
  Ruler,
  Trash,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatFileSize } from "./FileTable";
import { useSelectedModel } from "./model-list";

export function ModelInfo({
  // volume_name,
}: {
  // volume_name: string;
}) {
  const { selectedModel, setSelectedModel } = useSelectedModel();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const isFile = selectedModel?.type === "file";
  const modelFileLink = undefined;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);
  // console.log(selectedModel);

  // const handleDelete = async () => {
  //   if (!selectedModel) {
  //     return;
  //   }

  //   setIsDeleting(true);
  //   try {
  //     await deleteFileFromVolume(volume_name, {
  //       path: selectedModel.path,
  //       type: selectedModel.type === "file" ? 1 : 0,
  //       mtime: selectedModel.updated_at,
  //       size: selectedModel.size,
  //       model: selectedModel
  //     });
  //     toast.success("File deleted");
  //     window.location.reload();
  //   } catch (error) {
  //     toast.error(`Failed to delete file: ${error}`);
  //   } finally {
  //     setIsDeleting(false);
  //   }
  // };

  // const DeleteConfirmationModal = () => (
  //   <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
  //     <DialogContent>
  //       <DialogHeader>
  //         <DialogTitle>Confirm Deletion</DialogTitle>
  //       </DialogHeader>
  //       <DialogDescription>
  //         Are you sure you want to delete
  //         <br />
  //         <span className="font-bold">{selectedModel?.path}</span>
  //         <br />
  //         This action cannot be undone.
  //       </DialogDescription>
  //       <div className="flex justify-end gap-4">
  //         <Button variant="default" onClick={closeDeleteModal}>
  //           Cancel
  //         </Button>
  //         <Button
  //           variant="destructive"
  //           onClick={handleDelete}
  //           disabled={isDeleting}
  //         >
  //           {isDeleting ? (
  //             <LoaderCircle className="h-4 w-4 animate-spin" />
  //           ) : (
  //             "Delete"
  //           )}
  //         </Button>
  //       </div>
  //     </DialogContent>
  //   </Dialog>
  // );

  const [newFileName, setNewFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFileName(e.target.value);
  };

  // const handleSave = async () => {
  //   if (!selectedModel) {
  //     return;
  //   }
  //   setIsSaving(true);
  //   try {
  //     await renameFileFromVolume(volume_name, {
  //       path: selectedModel.path,
  //       type: selectedModel.type === "file" ? 1 : 0,
  //       mtime: selectedModel.updated_at,
  //       size: selectedModel.size,
  //       model: selectedModel
  //     }, newFileName);
  //     toast.success("File name updated successfully");
  //     window.location.reload();
  //   } catch (error) {
  //     toast.error(`Failed to update file name: ${error}`);
  //   } finally {
  //     setIsSaving(false);
  //     setIsEditingName(false);
  //   }
  // };

  if (!selectedModel) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start bg-muted/50">
          <div className="grid gap-0.5">
            <CardTitle className="text-lg">Model Details</CardTitle>
            <CardDescription>Select a model to view details</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-muted-foreground text-sm">
          No model selected
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* <DeleteConfirmationModal /> */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start bg-muted/50">
          <div className="grid gap-0.5">
            <CardTitle className="group flex items-center gap-2 pr-1 text-lg">
              {isEditingName ? (
                <div className="flex w-full">
                  <X
                    className="mx-auto my-auto mr-2 h-8 gap-1 text-sm"
                    onClick={() => setIsEditingName(false)}
                  />
                </div>
              ) : (
                <div className="min-w-0 max-w-[300px] flex-shrink">
                  <Tooltip>
                    <TooltipTrigger className="block w-full">
                      <span className="block truncate">
                        {selectedModel.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{selectedModel.name}</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </CardTitle>
            <CardDescription />
          </div>
          <div className="ml-auto flex items-center gap-1">
            {isFile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="h-6 gap-1"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={openDeleteModal}
                  >
                    <Trash className="h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 text-sm">
          <div className="grid gap-3">
            <div className="font-semibold">File Information</div>
            <dl className="grid gap-3">
              <div className="flex items-center justify-between" key="path">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  <Folder className="h-4 w-4" />
                  Path
                </dt>
                <dd className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedModel.path);
                      toast.success("Path copied to clipboard");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <div className="min-w-0 max-w-[300px] flex-shrink">
                    <Tooltip>
                      <TooltipTrigger className="block w-full">
                        <span className="block truncate text-right">
                          {selectedModel.path}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{selectedModel.path}</TooltipContent>
                    </Tooltip>
                  </div>
                </dd>
              </div>
              {selectedModel.size !== undefined && (
                <div className="flex items-center justify-between" key="size">
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <Ruler className="h-4 w-4" />
                    Size
                  </dt>
                  <dd>
                    {formatFileSize(selectedModel.size) === "0 bytes"
                      ? "-"
                      : formatFileSize(selectedModel.size)}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between" key="type">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  Type
                </dt>
                <dd className="min-w-0 max-w-[300px] flex-shrink">
                  <span className="block truncate text-right">
                    {selectedModel.type}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
          {selectedModel && (
            <>
              <Separator className="my-4" />
              <div className="grid gap-3">
                <div className="font-semibold">Model Information</div>
                <dl className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1 text-muted-foreground">
                      Model Link
                    </dt>
                    <dd>
                      {modelFileLink ? (
                        <>
                          <button
                            className="mr-4 inline-flex items-center space-x-2"
                            onClick={() => {
                              navigator.clipboard.writeText(modelFileLink);
                              toast("URL Copied");
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy URL</span>
                          </button>
                          <a
                            href={modelFileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2"
                          >
                            <ExternalLinkIcon className="h-3.5 w-3.5" />
                            <span>Go to URL</span>
                          </a>
                        </>
                      ) : (
                        <span>No download link available</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1 text-muted-foreground">
                      Status
                    </dt>
                    <dd>
                      <Badge
                        variant={
                          selectedModel.status === "failed"
                            ? "red"
                            : selectedModel.status === "started"
                              ? "yellow"
                              : "green"
                        }
                      >
                        {selectedModel.status}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1 text-muted-foreground">
                      Progress
                    </dt>
                    {/* <dd>
                      {`${selectedModel.download_progress || 0}%`}
                      <Progress value={selectedModel.download_progress || 0} className="min-w-[65px]" />
                    </dd> */}
                  </div>
                </dl>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
          {selectedModel.created_at && (
            <div className="text-muted-foreground text-xs">
              Updated{" "}
              <time dateTime={selectedModel.created_at.toString()}>
                {selectedModel.created_at.toLocaleString()}
              </time>
            </div>
          )}
        </CardFooter>
      </Card>
    </>
  );
}
