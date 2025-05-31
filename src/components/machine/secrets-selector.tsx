"use client";

import type React from "react";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Link,
  Link2Off,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { MyDrawer } from "@/components/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  type EnvironmentVariableType,
  type SecretGroup,
  addNewSecret,
  deleteSecret,
  updateMachineWithSecret,
  updateSecret,
  useGetLinkedMachineSecrets,
  useGetSecrets,
  useGetUnLinkedMachineSecrets,
} from "@/hooks/use-secrets-api";
import { toast } from "sonner";
import { RebuildMachineDialog } from "../machines/machine-list";
import { Badge } from "../ui/badge";

export function SecretsSelector({ machine }: { machine: any }) {
  const [visibleValues, setVisibleValues] = useState<Record<number, boolean>>(
    {},
  );
  const [showNewValue, setShowNewValue] = useState(false);
  const [isAddingSecret, setIsAddingSecret] = useState(false);
  const [isEditingSecret, setIsEditingSecret] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newValueName, setNewValueName] = useState("");
  const [newSecretValue, setNewSecretValue] = useState("");
  const [editingValueIndex, setEditingValueIndex] = useState<number | null>(
    null,
  );
  const [editValueName, setEditValueName] = useState("");
  const [editSecretValue, setEditSecretValue] = useState("");
  const [addingMode, setAddingMode] = useState<"group" | "value">("group");
  const [showDeleteValueConfirm, setShowDeleteValueConfirm] = useState(false);
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [machineRebuildDialogOpen, setMachineRebuildDialogOpen] =
    useState(false);
  const [deleteValueIndex, setDeleteValueIndex] = useState<number | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: secretGroups, refetch } = useGetSecrets();
  const { data: linkedMachineSecrets, refetch: refetchLinkedMachineSecrets } =
    useGetLinkedMachineSecrets({
      machine_id: machine.id,
    });
  const {
    data: unlinkedMachineSecrets,
    refetch: refetchUnlinkedMachineSecrets,
  } = useGetUnLinkedMachineSecrets({
    machine_id: machine.id,
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const selectedGroup = secretGroups?.find(
    (g: SecretGroup) => g.id === selectedGroupId,
  );

  const handleAddSecret = async () => {
    if (
      addingMode === "group" &&
      newGroupName &&
      newValueName &&
      newSecretValue
    ) {
      const newGroup = {
        machine_id: machine.id,
        secret_name: newGroupName,
        secret: [
          {
            key: newValueName,
            value: newSecretValue,
          },
        ],
      };

      try {
        const group = await addNewSecret(newGroup);
        if (group) {
          setNewGroupName("");
          setNewValueName("");
          setNewSecretValue("");
          setIsAddingSecret(false);
          setShowNewValue(false);
          setMachineRebuildDialogOpen(true);
          refetch();
          refetchLinkedMachineSecrets();
          setLinkDialogOpen(false);
          toast.success("Created the Secret successfully");
        }
      } catch (error) {
        toast.error("Error creating the Secret", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } else if (
      addingMode === "value" &&
      selectedGroupId &&
      newValueName &&
      newSecretValue &&
      selectedGroup
    ) {
      const secret = [
        ...selectedGroup.environment_variables,
        { key: newValueName, value: newSecretValue },
      ];
      try {
        const updatedSecret = await updateSecret({
          secret_id: selectedGroup.id,
          secret,
        });
        if (updatedSecret) {
          refetchLinkedMachineSecrets();
          refetchUnlinkedMachineSecrets();
          refetch();
          setNewValueName("");
          setNewSecretValue("");
          setIsAddingSecret(false);
          setShowNewValue(false);
          setMachineRebuildDialogOpen(true);
          toast.success("Added the Environment Variable successfully");
        }
      } catch (error: unknown) {
        toast.error("Error adding the Environment Variable", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  };

  const handleEditSecret = async () => {
    if (
      editingValueIndex &&
      editValueName &&
      editSecretValue &&
      selectedGroup
    ) {
      const updatedEnvs = selectedGroup?.environment_variables.map(
        (value: EnvironmentVariableType, index: number) => {
          if (index + 1 === editingValueIndex) {
            return {
              ...value,
              key: editValueName,
              value: editSecretValue,
            };
          }
          return value;
        },
      );

      try {
        const updatedSecret = await updateSecret({
          secret_id: selectedGroup.id,
          secret: updatedEnvs,
        });
        if (updatedSecret) {
          refetch();
          setEditingValueIndex(null);
          setIsEditingSecret(false);
          setMachineRebuildDialogOpen(true);
          toast.success("Updated the Environment Variable successfully");
        }
      } catch (error) {
        toast.error("Error editing the Secret");
      }
    }
  };

  const handleDeleteValue = async () => {
    if (deleteValueIndex && selectedGroupId) {
      const selectedGroup = secretGroups?.find(
        (g: SecretGroup) => g.id === selectedGroupId,
      );

      if (selectedGroup && selectedGroup.environment_variables.length <= 1) {
        setDeleteValueIndex(null);
        setShowDeleteValueConfirm(false);
        return;
      }

      if (!selectedGroup) return;

      const hasValue = selectedGroup.environment_variables.some(
        (v: EnvironmentVariableType, index: number) =>
          index + 1 === deleteValueIndex,
      );

      if (!hasValue) return;

      if (hasValue) {
        const secret = selectedGroup.environment_variables.filter(
          (_, index: number) => index + 1 !== deleteValueIndex,
        );

        try {
          const updatedSecret = await updateSecret({
            secret,
            secret_id: selectedGroup.id,
          });
          if (updatedSecret) {
            setDeleteValueIndex(null);
            setShowDeleteValueConfirm(false);
            refetch();
            setMachineRebuildDialogOpen(true);
            toast.success("Deleted the Environment Variable successfully");
            setVisibleValues({});
          }
        } catch (error) {
          toast.error("Error deleting the environment variable");
        }
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (deleteGroupId) {
      try {
        await deleteSecret({ secret_id: deleteGroupId });
        setDeleteGroupId(null);
        setShowDeleteGroupConfirm(false);
        refetch();
        refetchLinkedMachineSecrets();
        refetchUnlinkedMachineSecrets();
        setMachineRebuildDialogOpen(true);
        toast.success("Deleted the Secret successfully");
      } catch (error) {
        toast.error("Error Deleting the Secret");
      }
    }
  };

  const openDeleteConfirmation = (groupId: string) => {
    setDeleteGroupId(groupId);
    setShowDeleteGroupConfirm(true);
  };

  const openAddDialog = (mode: "group" | "value", groupId?: string) => {
    setAddingMode(mode);
    if (mode === "value" && groupId) {
      setSelectedGroupId(groupId);
    }
    setIsAddingSecret(true);
    setShowNewValue(false); // Hide new value by default

    setNewGroupName("");
    setNewValueName("");
    setNewSecretValue("");
  };

  const openEditDialog = (index: number, name: string, value: string) => {
    setEditingValueIndex(index);
    setEditValueName(name);
    setEditSecretValue(value);
    setIsEditingSecret(true);
    setShowNewValue(false); // Hide value by default when editing
  };

  const confirmDeleteValue = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteValueIndex(index);
    setShowDeleteValueConfirm(true);
  };

  const toggleValueVisibility = (index: number) => {
    setVisibleValues((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleShowNewValue = () => {
    setShowNewValue(!showNewValue);
  };

  const selectGroup = async (groupId: string) => {
    try {
      setSelectedGroupId(null);
      const response = await updateMachineWithSecret({
        machine_id: machine.id,
        secret_id: groupId,
      });
      if (response.status === 200) {
        toast.success(response.message);
        setLinkDialogOpen(false);
        refetchLinkedMachineSecrets();
        refetchUnlinkedMachineSecrets();
        setMachineRebuildDialogOpen(true);
      }
    } catch (error) {
      toast.error("Error selecting Secret");
    }
  };

  const seeSecret = (groupId: string) => {
    setSelectedGroupId(groupId);
    setDrawerOpen(true);
  };

  const backToGroups = () => {
    setSelectedGroupId(null);
  };

  // Empty state - no secrets at all
  if (secretGroups?.length === 0) {
    return (
      <div className="py-8 text-center">
        <RebuildMachineDialog
          machine={machine}
          dialogOpen={machineRebuildDialogOpen}
          setDialogOpen={setMachineRebuildDialogOpen}
        />
        <div className="flex flex-col items-center justify-center space-y-3 py-4">
          <div className="rounded-full bg-muted p-3">
            <KeyRound className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg">No Secrets Available</h3>
          <p className="max-w-md text-muted-foreground text-sm">
            You haven't added any secrets to this machine yet. Secrets help you
            store sensitive information securely.
          </p>
          <Button onClick={() => openAddDialog("group")} className="mt-2">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Secret Group
          </Button>
        </div>

        <Dialog open={isAddingSecret} onOpenChange={setIsAddingSecret}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {addingMode === "group"
                  ? "Create Secret Group"
                  : "Add Environment Variable"}
              </DialogTitle>
              <DialogDescription>
                {addingMode === "group"
                  ? "Create a new group with an initial environment variable."
                  : `Add a new environment variable to the "${selectedGroup?.name}" secret group.`}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {addingMode === "group" && (
                <div className="grid gap-2">
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Open API Key"
                  />
                </div>
              )}

              <Separator className="my-2" />

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="value-name">Key</Label>
                  <Input
                    id="value-name"
                    value={newValueName}
                    onChange={(e) => setNewValueName(e.target.value)}
                    placeholder="OPENAI_API_KEY"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="secret-value">Value</Label>
                  <div className="relative">
                    <Input
                      id="secret-value"
                      value={newSecretValue}
                      onChange={(e) => setNewSecretValue(e.target.value)}
                      type={showNewValue ? "text" : "password"}
                      placeholder="Enter secret value"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground"
                      onClick={toggleShowNewValue}
                    >
                      {showNewValue ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showNewValue ? "Hide" : "Show"} value
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddingSecret(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSecret}
                disabled={
                  !newValueName ||
                  !newSecretValue ||
                  (addingMode === "group" && !newGroupName)
                }
              >
                {addingMode === "group" ? "Create" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Secret Group Dropdown
  const SecretGroupDropdown = ({
    isBack,
    isLinkSecretGroup,
  }: {
    isBack?: boolean;
    isLinkSecretGroup?: boolean;
  }) => (
    <div className="mb-4 flex items-center justify-between">
      {isBack ? (
        <Button variant="ghost" className="mr-2" onClick={backToGroups}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      ) : null}
      <div className="ml-auto flex items-center gap-x-2">
        {isLinkSecretGroup ? (
          <Button
            // variant="ghost"
            type="button"
            // className="border border-gray-400 border-dashed hover:bg-gray-50"
            onClick={() => setLinkDialogOpen(true)}
          >
            Link Secret
          </Button>
        ) : null}
        <Button
          onClick={() => openAddDialog("group")}
          variant="ghost"
          size="sm"
        >
          <Plus className="mr-1 h-3 w-3" />
          {"Add Secret Group"}
        </Button>
      </div>
    </div>
  );

  const filteredValues = selectedGroup?.environment_variables;

  // Show list of all secret groups
  return (
    <div>
      {selectedGroup && selectedGroupId && filteredValues && (
        <div>
          <MyDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <div className="flex h-full flex-col">
              <h2 className="mb-4 flex items-center justify-between font-semibold text-lg">
                {selectedGroup.name}

                <Button
                  onClick={() => openAddDialog("value", selectedGroupId)}
                  size="sm"
                  variant="ghost"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Environment Variable
                </Button>
              </h2>

              {filteredValues?.length > 0 ? (
                <div className="space-y-2 overflow-auto">
                  {filteredValues.map(
                    (env: EnvironmentVariableType, index: number) => (
                      <div
                        key={env.key + env.value + Math.random()}
                        className="overflow-hidden rounded-md border"
                      >
                        <div className="relative flex items-center justify-between bg-muted/10 p-2">
                          <div className="flex flex-1 items-center">
                            <span className="mr-4 truncate font-medium text-sm">
                              {env.key}
                            </span>
                            <div className="flex-1 truncate font-mono text-sm">
                              {visibleValues[index]
                                ? env.value
                                : "•••••••••••••••"}
                            </div>
                          </div>
                          <div className="absolute right-0 flex items-center gap-1 rounded-md bg-gray-50 pr-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleValueVisibility(index)}
                            >
                              {visibleValues[index] ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                              <span className="sr-only">
                                {visibleValues[index] ? "Hide" : "Show"} value
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                openEditDialog(index + 1, env.key, env.value);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">
                                Edit environment variable
                              </span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) =>
                                selectedGroup.environment_variables.length > 1
                                  ? confirmDeleteValue(index + 1, e)
                                  : e.stopPropagation()
                              }
                              disabled={
                                selectedGroup.environment_variables.length <= 1
                              }
                              title={
                                selectedGroup.environment_variables.length <= 1
                                  ? "Cannot delete the only environment variable"
                                  : "Delete environment variable"
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">
                                Delete environment variable
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="rounded-md border py-4 text-center">
                  <p className="mb-2 text-muted-foreground text-sm">
                    {"No environment variables in this secret group"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddDialog("value", selectedGroup.id)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Add Environment Variable
                  </Button>
                </div>
              )}
            </div>
          </MyDrawer>
        </div>
      )}
      {/* Add Environment Variable Dialog */}
      <Dialog open={isAddingSecret} onOpenChange={setIsAddingSecret}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addingMode === "group"
                ? "Create Secret Group"
                : "Add Environment Variable"}
            </DialogTitle>
            <DialogDescription>
              {addingMode === "group"
                ? "Create a new group with an initial environment variable."
                : `Add a new environment variable to the "${selectedGroup?.name}" secret group.`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {addingMode === "group" && (
              <div className="grid gap-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Open API Key"
                />
              </div>
            )}

            <Separator className="my-2" />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="value-name">Key</Label>
                <Input
                  id="value-name"
                  value={newValueName}
                  onChange={(e) => setNewValueName(e.target.value)}
                  placeholder="OPENAI_API_KEY"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secret-value">Value</Label>
                <div className="relative">
                  <Input
                    id="secret-value"
                    value={newSecretValue}
                    onChange={(e) => setNewSecretValue(e.target.value)}
                    type={showNewValue ? "text" : "password"}
                    placeholder="Enter secret value"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground"
                    onClick={toggleShowNewValue}
                  >
                    {showNewValue ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showNewValue ? "Hide" : "Show"} value
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingSecret(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSecret}
              disabled={
                !newValueName ||
                !newSecretValue ||
                (addingMode === "group" && !newGroupName)
              }
            >
              {addingMode === "group" ? "Create" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Environment Variable Dialog */}
      <Dialog open={isEditingSecret} onOpenChange={setIsEditingSecret}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Environment Variable</DialogTitle>
            <DialogDescription>
              Update the name and value for this environment variable.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="value-name">Key</Label>
                <Input
                  id="value-name"
                  value={editValueName}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue.includes(" ")) {
                      toast.error(
                        "Please don't use space while adding keys, add underscore instead.",
                      );
                    } else {
                      setEditValueName(newValue);
                    }
                  }}
                  placeholder="OPENAI_API_KEY"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-secret-value">Value</Label>
                <div className="relative">
                  <Input
                    id="edit-secret-value"
                    value={editSecretValue}
                    onChange={(e) => setEditSecretValue(e.target.value)}
                    type={showNewValue ? "text" : "password"}
                    placeholder="Enter secret value"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground"
                    onClick={toggleShowNewValue}
                  >
                    {showNewValue ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showNewValue ? "Hide" : "Show"} password
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingSecret(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSecret}
              disabled={!editValueName || !editSecretValue}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Environment Variable Confirmation */}
      <AlertDialog
        open={showDeleteValueConfirm}
        onOpenChange={setShowDeleteValueConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Environment Variable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this environment variable? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteValue}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Secret Group Confirmation */}
      <AlertDialog
        open={showDeleteGroupConfirm}
        onOpenChange={setShowDeleteGroupConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Secret Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entire secret group and all
              its environment variables? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RebuildMachineDialog
        machine={machine}
        dialogOpen={machineRebuildDialogOpen}
        setDialogOpen={setMachineRebuildDialogOpen}
      />

      <SecretGroupDropdown isLinkSecretGroup />

      {linkedMachineSecrets?.length === 0 ? (
        <div className="mx-auto max-w-md py-8 text-center">
          <div className="mb-3 flex justify-center">
            <KeyRound className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-medium">No Linked Secrets</h3>
          <p className="text-muted-foreground text-sm">
            No secrets are currently linked to this machine. Click "Link
            secrets" to link existing secret groups or create a new one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {linkedMachineSecrets?.map((group: SecretGroup) => (
            <SecretGroupContainer
              key={group.id}
              group={group}
              selectGroup={selectGroup}
              seeGroup={seeSecret}
              isLinked={true}
              isLinking={false}
              openDeleteConfirmation={openDeleteConfirmation}
            />
          ))}
        </div>
      )}

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Secret</DialogTitle>
          </DialogHeader>
          {!unlinkedMachineSecrets || unlinkedMachineSecrets.length === 0 ? (
            <h3 className="py-4 text-center text-gray-500">
              No groups available to link.
            </h3>
          ) : (
            <div className="mt-2 space-y-2">
              {unlinkedMachineSecrets.length > 0 ? (
                unlinkedMachineSecrets.map((group: SecretGroup) => (
                  <SecretGroupContainer
                    key={group.id}
                    group={group}
                    selectGroup={selectGroup}
                    seeGroup={seeSecret}
                    isLinked={false}
                    isLinking
                    openDeleteConfirmation={openDeleteConfirmation}
                  />
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">
                  No groups available to link.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SecretGroupProps {
  selectGroup: (groupId: string) => Promise<void>;
  seeGroup: (groupId: string) => void;
  group: SecretGroup;
  openDeleteConfirmation: (groupId: string) => void;
  isLinked: boolean;
  isLinking: boolean | undefined;
}

const SecretGroupContainer = ({
  group,
  selectGroup,
  seeGroup,
  openDeleteConfirmation,
  isLinked,
  isLinking,
}: SecretGroupProps) => {
  return (
    <div
      key={group.id}
      className={"cursor-pointer rounded-md border px-4 py-2 hover:bg-muted/50"}
      onClick={() => {
        if (isLinking) return;
        seeGroup(group.id);
      }}
      onKeyDown={() => {}}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="font-medium">{group.name}</div>
        </div>
        <div className="relative flex items-center gap-x-2">
          <Badge className="text-muted-foreground text-2xs py-1 px-2">
            {group.environment_variables.length} env{" "}
            {group.environment_variables.length === 1
              ? "variable"
              : "variables"}
          </Badge>

          {isLinked ? (
            <Button
              variant="destructiveHover"
              className="gap-1"
              confirm
              onClick={(e) => {
                e.stopPropagation();
                selectGroup(group.id);
              }}
              Icon={Link2Off}
              iconPlacement="right"
            >
              Unlink
            </Button>
          ) : (
            <Button
              // variant="ghost"
              size="sm"
              confirm
              className="gap-1"
              // className="absolute right-8 z-30 flex items-center justify-center border border-gray-400 border-dashed py-1"
              onClick={(e) => {
                e.stopPropagation();
                selectGroup(group.id);
              }}
              Icon={Link}
              iconPlacement="right"
            >
              Link
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              openDeleteConfirmation(group.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete secret group</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
