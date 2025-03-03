import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEnvColor } from "@/components/workspace/ContainersTable";
import { useMachines } from "@/hooks/use-machine";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { Droplets, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

interface DeploymentConfirmationProps {
  workflowId: string;
  workflowVersionId: string;
  environment: "production" | "staging" | "public-share";
  machineId?: string;
  machineVersionId?: string;
  onClose: () => void;
  onSuccess: (deploymentId: string) => void;
  description?: string;
}

interface DeploymentForm {
  machineId: string;
}

export function DeploymentConfirmation({
  workflowId,
  workflowVersionId,
  environment,
  machineId: defaultMachineId,
  machineVersionId,
  onClose,
  onSuccess,
  description,
}: DeploymentConfirmationProps) {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue] = useDebounce(searchValue, 250);
  const { data: machinesData } = useMachines(debouncedSearchValue);
  const machines = machinesData?.pages.flat() ?? [];

  const form = useForm<DeploymentForm>({
    defaultValues: {
      machineId: defaultMachineId || "",
    },
  });

  // Reset form when defaultMachineId changes
  useEffect(() => {
    if (defaultMachineId) {
      form.reset({ machineId: defaultMachineId });
    }
  }, [defaultMachineId, form]);

  const onSubmit = async (data: DeploymentForm) => {
    try {
      const deployment = await callServerPromise(
        api({
          url: "deployment",
          init: {
            method: "POST",
            body: JSON.stringify({
              workflow_id: workflowId,
              workflow_version_id: workflowVersionId,
              machine_id: data.machineId,
              machine_version_id: machineVersionId,
              environment,
              ...(description && { description }),
            }),
          },
        }),
      );

      onSuccess(deployment.id);
      toast.success("Deployment created successfully");
    } catch (error) {
      toast.error("Failed to create deployment");
    }
  };

  const selectedMachine = machines.find(
    (machine) => machine.id === form.watch("machineId"),
  );

  return (
    <ScrollArea className="h-full px-1">
      <div className="flex flex-col gap-6 px-1">
        <div>
          <h2 className="font-semibold text-lg">Confirm Deployment</h2>
          <p className="text-muted-foreground text-sm flex gap-1 items-center">
            You are about to deploy this workflow version to{" "}
            <Badge className={cn("ml-1", getEnvColor(environment))}>
              {!!machineVersionId && (
                <div className="mr-2 rounded-full bg-blue-100 p-0.5">
                  <Droplets
                    strokeWidth={2}
                    className="h-[12px] w-[12px] text-blue-600"
                  />
                </div>
              )}
              {environment}
            </Badge>
          </p>
        </div>

        {!machineVersionId && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="machineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Machine</FormLabel>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search machines..."
                        className="pl-10 text-sm"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                      />
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a machine">
                            {selectedMachine && (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span>{selectedMachine.name}</span>
                                {selectedMachine.gpu && (
                                  <Badge variant="outline" className="ml-2">
                                    {selectedMachine.gpu}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {machines.map((machine) => (
                          <SelectItem
                            key={machine.id}
                            value={machine.id}
                            className="py-2"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <span>{machine.name}</span>
                              {machine.gpu && (
                                <Badge variant="outline" className="ml-2">
                                  {machine.gpu}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the machine to deploy this workflow version to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Deploy</Button>
              </div>
            </form>
          </Form>
        )}

        {machineVersionId && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => form.handleSubmit(onSubmit)()}>
              Deploy
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
