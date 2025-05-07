import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  type EnvironmentVariable,
  type Secret,
  useUpdateSecrets,
} from "@/stores/update-secrets";
import { toast } from "sonner";
import { SecretEnvs } from "./secret-envs";

export function AddSecret() {
  const [open, setOpen] = useState(false);
  const [variables, setVariables] = useState<EnvironmentVariable[]>([
    { key: "", value: "" },
  ]);

  const { setSecrets, secrets, setFilteredSecrets } = useUpdateSecrets(
    (state) => state,
  );

  const handleAddVariable = () => {
    setVariables([...variables, { key: "", value: "" }]);
  };

  const handleRemoveVariable = (index: number) => {
    const newVariables = [...variables];
    newVariables.splice(index, 1);
    setVariables(newVariables);
  };

  const handleChange = (
    index: number,
    field: keyof EnvironmentVariable,
    value: string,
  ) => {
    setVariables((prevVariables) =>
      prevVariables.map((variable, i) =>
        i === index
          ? { ...variable, [field]: field === "key" ? value : value }
          : variable,
      ),
    );
  };

  const handleSubmit = () => {
    const nonEmptyVariables = variables.filter(
      (v) => v.key.trim() !== "" || v.value.trim() !== "",
    );

    if (nonEmptyVariables.length === 0) {
      toast.error("Please add environment variable");
      return;
    }

    for (const variable of nonEmptyVariables) {
      if (variable.key.trim() === "") {
        toast.error("Secret key cannot be empty");
        return;
      }
      
      if (variable.value.trim() === "") {
        toast.error(`Secret value cannot be empty for key "${variable.key}"`);
        return;
      }
    }

    const validVariables = nonEmptyVariables.filter(
      (v) => v.key.trim() !== "" && v.value.trim() !== "",
    );

    toast.success(
      `${validVariables.length} environment variable(s) saved successfully`,
    );

    const newSecret: Secret = {
      id: `secret-${secrets.length + 1}`,
      secretName: `secret-${secrets.length + 1}`,
      keys: variables.map((item) => item.key),
      user_id: "user_235453",
      org_id: "org_2350st",
      created_at: new Date(),
      updated_at: new Date(),
    };
    setSecrets([...secrets, newSecret]);
    setFilteredSecrets([...secrets, newSecret]);

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Create Secret</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <SecretEnvs
          isAddSecret
          variables={variables}
          handleChange={handleChange}
          handleAddVariable={handleAddVariable}
          handleRemoveVariable={handleRemoveVariable}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Variables</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
