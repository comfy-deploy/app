import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { EnvironmentVariable } from "@/stores/update-secrets";

interface Props {
  handleChange?: (
    index: number,
    field: keyof EnvironmentVariable,
    value: string,
  ) => void;
  handleRemoveVariable?: (index: number) => void;
  handleAddVariable?: () => void;
  variables: EnvironmentVariable[];
  isAddSecret: boolean;
}

export const SecretEnvs = ({
  handleAddVariable,
  handleChange,
  handleRemoveVariable,
  isAddSecret,
  variables,
}: Props) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isAddSecret ? "Add Environment Variables" : "Environment Variables"}
        </DialogTitle>
        <DialogDescription>
          {isAddSecret
            ? `Add environment variables to your machine. These will be securely
          stored and available to your application.`
            : "These are all the environment variables for the secret."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {variables.map((variable, index) => (
          <div
            key={`variable-${index}`}
            className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
          >
            <div>
              <Label aria-disabled htmlFor={`key-${index}`} className="sr-only">
                Key
              </Label>
              <Input
                disabled={!isAddSecret}
                id={`key-${index}`}
                placeholder="KEY_NAME"
                value={variable.key}
                onChange={(e) => {
                  if (handleChange && isAddSecret) {
                    const value = e.target.value;
                    if (value.trim() === "") {
                    }
                    handleChange(index, "key", value);
                  }
                }}
                className="uppercase"
              />
            </div>
            <div>
              <Label
                aria-disabled
                htmlFor={`value-${index}`}
                className="sr-only"
              >
                Value
              </Label>
              <Input
                disabled={!isAddSecret}
                id={`value-${index}`}
                placeholder="value"
                value={variable.value}
                onChange={(e) => {
                  if (handleChange && isAddSecret) {
                    const value = e.target.value;
                    if (value.trim() === "") {
                    }
                    handleChange(index, "value", value);
                  }
                }}
              />
            </div>
            {isAddSecret && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (handleRemoveVariable) handleRemoveVariable(index);
                }}
                disabled={variables.length === 1}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            )}
          </div>
        ))}
        {isAddSecret && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleAddVariable}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Variable
          </Button>
        )}
      </div>
    </>
  );
};
