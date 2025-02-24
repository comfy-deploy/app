import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

export const ExtraDockerCommandsType = z.array(
  z.object({
    commands: z.array(z.string()),
    when: z.union([z.literal("before"), z.literal("after")]),
  }),
);

interface ExtraDockerCommandsProps {
  value: z.infer<typeof ExtraDockerCommandsType>;
  onChange: (value: z.infer<typeof ExtraDockerCommandsType>) => void;
}

export function ExtraDockerCommands({
  value,
  onChange,
}: ExtraDockerCommandsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newCommand, setNewCommand] = useState("");
  const [runSelected, setRunSelected] = useState<"before" | "after">("after");
  const [editIndex, setEditIndex] = useState(-1);

  const commands = value || [];

  const addOrEditCommand = () => {
    const commandData = {
      commands: newCommand.split("\n"),
      when: runSelected,
    };
    const updatedCommands = [...commands];
    if (editIndex === -1) {
      updatedCommands.push(commandData);
    } else {
      updatedCommands[editIndex] = commandData;
    }
    onChange(updatedCommands);
    setNewCommand("");
    setIsOpen(false);
    setEditIndex(-1);
  };

  const deleteCommand = (index: number) => {
    const updatedCommands = commands.filter(
      (_, cmdIndex) => cmdIndex !== index,
    );
    onChange(updatedCommands);
  };

  const openEditDialog = (index: number) => {
    setEditIndex(index);
    setNewCommand(commands[index].commands.join("\n"));
    setRunSelected(commands[index].when);
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Extra Docker Commands</h3>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setEditIndex(-1);
            setNewCommand("");
            setIsOpen(true);
          }}
        >
          <Plus size={16} />
        </Button>
      </div>

      <div>
        <ul className="space-y-2">
          {commands.map((cmd, index) => (
            <li
              key={index}
              className="flex w-full items-center justify-between rounded-sm bg-gray-50 px-4 py-2 text-sm"
            >
              <div className="flex flex-col break-all">
                {cmd.commands.map((x, cmdIndex) => (
                  <div key={cmdIndex} className="font-mono">
                    {x}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Badge>{cmd.when}</Badge>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => openEditDialog(index)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => deleteCommand(index)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogTitle>
            {editIndex === -1
              ? "Add New Docker Command"
              : "Edit Docker Command"}
          </DialogTitle>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addOrEditCommand();
            }}
            className="flex flex-col gap-4"
          >
            <Textarea
              value={newCommand}
              onChange={(e) => setNewCommand(e.target.value)}
              placeholder="Enter Docker command"
            />
            <div>
              Run commands{" "}
              <Select
                value={runSelected}
                onValueChange={(value: "before" | "after") => {
                  setRunSelected(value);
                }}
              >
                <SelectTrigger className="relative inline-flex w-fit">
                  <SelectValue placeholder="Run command before or after" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>When</SelectLabel>
                    <SelectItem value="before">Before</SelectItem>
                    <SelectItem value="after">After</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>{" "}
              custom nodes installation.
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
                {editIndex === -1 ? "Add" : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
