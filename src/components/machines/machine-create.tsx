import { Button } from "@/components/ui/button";
import { useCurrentPlan } from "@/hooks/use-current-plan";
import { useMachine } from "@/hooks/use-machine";
import { api } from "@/lib/api";
import { comfydeploy_hash, comfyui_hash } from "@/utils/comfydeploy-hash";
import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MachineSettingsWrapper } from "../machine/machine-settings";
import { LoadingIcon } from "../ui/custom/loading-icon";
import { Input } from "../ui/input";

const newMachine = {
  name: "My New Machine",
  id: "new",
  type: "comfy-deploy-serverless",
  gpu: "A10G",
  comfyui_version: comfyui_hash,
  docker_command_steps: {
    steps: [
      {
        id: "comfyui-deploy",
        type: "custom-node",
        data: {
          name: "ComfyUI Deploy",
          url: "https://github.com/BennyKok/comfyui-deploy",
          files: ["https://github.com/BennyKok/comfyui-deploy"],
          install_type: "git-clone",
          hash: comfydeploy_hash,
        },
      },
    ],
  },

  // default values
  machine_builder_version: "4",
  allow_concurrent_inputs: 1,
  concurrency_limit: 1,
  run_timeout: 300,
  idle_timeout: 60,
  ws_timeout: 2,
  python_version: "3.11",
};

export function filterMachineConfig(machine: any) {
  // Pick only the fields defined in MachineConfig
  return {
    id: machine.id,
    name: `${machine.name} (Clone)`,
    type: machine.type,
    comfyui_version: machine.comfyui_version,
    docker_command_steps: machine.docker_command_steps,
    gpu: machine.gpu,
    concurrency_limit: machine.concurrency_limit,
    run_timeout: machine.run_timeout,
    idle_timeout: machine.idle_timeout,
    keep_warm: machine.keep_warm,
    install_custom_node_with_gpu: machine.install_custom_node_with_gpu,
    ws_timeout: machine.ws_timeout,
    extra_docker_commands: machine.extra_docker_commands,
    allow_concurrent_inputs: machine.allow_concurrent_inputs,
    machine_builder_version: machine.machine_builder_version,
    base_docker_image: machine.base_docker_image,
    python_version: machine.python_version,
    extra_args: machine.extra_args,
    disable_metadata: machine.disable_metadata,
    prestart_command: machine.prestart_command,
  };
}

export function MachineCreate() {
  const navigate = useNavigate({ from: "/machines" });
  const sub = useCurrentPlan();
  const [cloneMachineId, setCloneMachineId] = useQueryState("machineId");
  const { data: machine, isLoading } = useMachine(cloneMachineId ?? undefined);

  // Initialize with newMachine if not cloning, otherwise wait for machine data
  const [formValues, setFormValues] = useState<any>(
    cloneMachineId ? undefined : newMachine,
  );

  // Update formValues when machine data is loaded
  useEffect(() => {
    if (machine && cloneMachineId) {
      setFormValues(filterMachineConfig(machine));
    }
  }, [machine, cloneMachineId]);

  // machine limit effect
  useEffect(() => {
    if (sub?.features.machineLimited) {
      navigate({
        search: { view: undefined },
      });
    }
  }, [sub, navigate]);

  if (cloneMachineId && (!formValues || isLoading)) {
    return (
      <div>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div className="flex h-full w-full justify-center md:py-0">
        <div className="mx-4 my-auto w-full max-w-5xl py-20">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ filter: "blur(2px)", opacity: 0, y: 20 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              exit={{ filter: "blur(2px)", opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <h1 className="mb-4 font-medium text-xl">
                {cloneMachineId ? "Clone Machine" : "Create Machine"}
              </h1>
              <div className="mb-1">
                <div className="mb-2">
                  <span className="font-medium text-sm">Machine Name </span>
                  <span className="text-red-500">*</span>
                </div>
                <Input
                  placeholder="Machine name..."
                  value={formValues?.name}
                  onChange={(e) =>
                    setFormValues((prev) =>
                      prev ? { ...prev, name: e.target.value } : newMachine,
                    )
                  }
                />
              </div>
              <MachineSettingsWrapper
                title={<div />}
                machine={formValues}
                onValueChange={(key, value) => {
                  setFormValues((prev) =>
                    prev ? { ...prev, [key]: value } : newMachine,
                  );
                }}
                disableUnsavedChangesWarningServerless={true}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed right-8 bottom-12 flex flex-row gap-2">
        <Button
          variant="outline"
          onClick={() => {
            navigate({
              to: "/machines",
              search: { view: undefined, machineId: undefined },
            });
          }}
          className="drop-shadow-md"
        >
          Back
        </Button>
        <Button
          Icon={ChevronRight}
          iconPlacement="right"
          disabled={!formValues?.name.trim()}
          onClick={async () => {
            const { id, ...filteredData } = formValues;
            if (filteredData.machine_builder_version < 4) {
              toast.warning(
                "Required to upgrade to builder v4 for better compatibility...",
              );
              filteredData.machine_builder_version = 4;
            }

            try {
              const response = await api({
                url: "machine/serverless",
                init: {
                  method: "POST",
                  body: JSON.stringify(filteredData),
                },
              });

              toast.success(`${filteredData?.name} created successfully!`);
              const machineId = response.id;

              // toast.info("Redirecting to machine page...");
              await new Promise((resolve) => setTimeout(resolve, 1000));
              navigate({
                to: "/machines/$machineId",
                params: { machineId },
              });

              return true;
            } catch (error) {
              toast.error(`Failed to create: ${error}`);
              return false;
            }
          }}
          className="drop-shadow-md"
        >
          {cloneMachineId ? "Clone" : "Create"}
        </Button>
      </div>
    </div>
  );
}
