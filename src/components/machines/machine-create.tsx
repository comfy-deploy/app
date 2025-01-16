import { WorkflowImportMachineSetup } from "@/components/onboarding/workflow-machine-import";
import { type Step, StepForm } from "@/components/step-form";
import { useCurrentPlan } from "@/hooks/use-current-plan";
import { api } from "@/lib/api";
import { comfyui_hash } from "@/utils/comfydeploy-hash";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { StepValidation } from "../onboarding/workflow-import";

// export interface MachineStepValidation {
//   machineName: string;
//   gpuType: GpuTypes;
//   comfyUiHash: string;
//   selectedComfyOption: "recommended" | "latest" | "custom";
//   docker_command_steps: DockerCommandSteps;
//   firstTimeSelectGPU?: boolean;
//   isEditingHashOrAddingCommands?: boolean;
// }

export interface DockerCommandStep {
  id: string;
  type: "custom-node" | "commands";
  data: CustomNodeData | string;
}

// Separate interface for custom node data
export interface CustomNodeData {
  name: string;
  hash?: string;
  url: string;
  files: string[];
  install_type: "git-clone";
  pip?: string[];
  meta?: {
    message: string;
    latest_hash?: string;
    committer?: {
      name: string;
      email: string;
      date: string;
    };
    commit_url?: string;
    stargazers_count?: number;
  };
}

export interface DockerCommandSteps {
  steps: DockerCommandStep[];
}

interface MachineStepNavigation {
  next: number | null; // null means end of flow
  prev: number | null; // null means start of flow
}

function getStepNavigation(
  currentStep: number,
  _validation: MachineStepValidation,
): MachineStepNavigation {
  switch (currentStep) {
    default:
      return {
        next: null,
        prev: null,
      };
  }
}

export function MachineCreate() {
  const sub = useCurrentPlan();
  const navigate = useNavigate({ from: "/machines" });
  const [validation, setValidation] = useState<StepValidation>({
    machineName: "My Machine",
    gpuType: "A10G",
    comfyUiHash: comfyui_hash,
    selectedComfyOption: "recommended",
    firstTimeSelectGPU: false,
    docker_command_steps: {
      steps: [],
    },
    isEditingHashOrAddingCommands: false,
  });

  const STEPS: Step<StepValidation>[] = [
    {
      id: 1,
      title: "Create Machine",
      component: WorkflowImportMachineSetup,
      validate: (validation) => {
        const {
          machineName,
          comfyUiHash,
          gpuType,
          selectedComfyOption,
          isEditingHashOrAddingCommands,
        } = validation;

        if (!machineName?.trim()) {
          return { isValid: false, error: "Please enter a machine name" };
        }

        if (!gpuType) {
          return { isValid: false, error: "Please select a GPU type" };
        }

        if (selectedComfyOption === "custom" && !comfyUiHash?.trim()) {
          return {
            isValid: false,
            error: "Please enter a ComfyUI commit hash",
          };
        }

        if (isEditingHashOrAddingCommands) {
          return { isValid: false, error: "You have unsaved changes" };
        }

        return { isValid: true };
      },
      actions: {
        onNext: async () => {
          try {
            const data = {
              name: validation.machineName,
              comfyui_version: validation.comfyUiHash,
              gpu: validation.gpuType,
              docker_command_steps: validation.docker_command_steps,

              // default values
              machine_builder_version: "4",
              allow_concurrent_inputs: 1,
              concurrency_limit: 2,
              run_timeout: 300,
              idle_timeout: 60,
              ws_timeout: 2,
              python_version: "3.11",
            };

            const response = await api({
              url: "machine/serverless",
              init: {
                method: "POST",
                body: JSON.stringify(data),
              },
            });

            toast.success(`${validation.machineName} created successfully!`);
            const machineId = response.id;

            toast.info("Redirecting to machine page...");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            navigate({
              to: "/machines/$machineId",
              params: { machineId },
              search: { view: "deployments" },
            });

            return true;
          } catch (error) {
            toast.error(`Failed to create: ${error}`);
            return false;
          }
        },
      },
    },
  ];

  useEffect(() => {
    if (sub?.features.machineLimited) {
      navigate({
        search: { view: undefined },
      });
    }
  }, [sub, navigate]);

  return (
    <StepForm
      hideProgressBar
      steps={STEPS}
      validation={validation}
      setValidation={setValidation}
      getStepNavigation={getStepNavigation}
      onExit={() => navigate({ to: "/machines", search: { view: undefined } })}
    />
  );
}

// export function WorkflowImportNewMachineSetup({
//   validation,
//   setValidation,
// }: StepComponentProps<MachineStepValidation>) {
//   const { data: latestComfyUI, isLoading } = useGithubBranchInfo(
//     "https://github.com/comfyanonymous/ComfyUI",
//   );
//   const sub = useCurrentPlan();

//   const comfyUIOptions: ComfyUIOption[] = [
//     {
//       id: "recommended",
//       name: "Recommended",
//       hash: comfyui_hash,
//     },
//     {
//       id: "latest",
//       name: "Latest",
//       hash: latestComfyUI?.commit.sha || null,
//     },
//     {
//       id: "custom",
//       name: "Custom",
//       hash: null,
//     },
//   ];

//   const [showAllGpu, setShowAllGpu] = useState(false);

//   const visibleGpus = gpuOptions.filter((gpu) => {
//     if (validation.firstTimeSelectGPU && validation.gpuType && !showAllGpu) {
//       return gpu.id === validation.gpuType;
//     }
//     return showAllGpu || !gpu.isHidden;
//   });

//   // Add refs for each section
//   const gpuSectionRef = useRef<HTMLDivElement>(null);
//   const comfyUISectionRef = useRef<HTMLDivElement>(null);
//   const customNodeSectionRef = useRef<HTMLDivElement>(null);

//   // Helper function for smooth scrolling
//   const scrollToNextSection = (ref: React.RefObject<HTMLDivElement | null>) => {
//     setTimeout(() => {
//       ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
//     }, 250);
//   };

//   return (
//     <SnapshotImportZoneSteps
//       validation={validation}
//       setValidation={setValidation}
//     >
//       <div className="relative flex flex-col gap-4">
//         <div>
//           <div className="mb-2">
//             <span className="font-medium text-sm">Machine Name </span>
//             <span className="text-red-500">*</span>
//           </div>
//           <Input
//             placeholder="Machine name..."
//             value={validation.machineName}
//             onChange={(e) =>
//               setValidation({ ...validation, machineName: e.target.value })
//             }
//           />
//         </div>

//         <div ref={gpuSectionRef}>
//           <div>
//             <div className="mb-2">
//               <span className="font-medium text-sm">GPU </span>
//               <span className="text-red-500">*</span>
//             </div>
//             <div className="flex flex-col gap-2">
//               <AnimatePresence>
//                 {visibleGpus.map((gpu) => (
//                   <motion.div
//                     key={gpu.id}
//                     initial={{ opacity: 0, height: 0 }}
//                     animate={{ opacity: 1, height: "auto" }}
//                     exit={{ opacity: 0, height: 0 }}
//                     transition={{ duration: 0.2, ease: "easeOut" }}
//                   >
//                     <div
//                       onClick={() => {
//                         if (!sub?.plans?.plans && !gpu.isForFreePlan) {
//                           return;
//                         }
//                         setValidation({
//                           ...validation,
//                           gpuType: gpu.id,
//                           firstTimeSelectGPU: true,
//                         });
//                         setShowAllGpu(false);
//                         scrollToNextSection(comfyUISectionRef);
//                       }}
//                       className={cn(
//                         "cursor-pointer rounded-lg border p-4 transition-all duration-200",
//                         "hover:border-gray-400",
//                         validation.gpuType === gpu.id
//                           ? "border-gray-500 ring-2 ring-gray-500 ring-offset-2"
//                           : "border-gray-200 opacity-60",
//                         !sub?.plans?.plans &&
//                           !gpu.isForFreePlan &&
//                           "cursor-not-allowed",
//                       )}
//                     >
//                       <div className="mb-1 flex items-center justify-between">
//                         <span className="flex flex-row items-center gap-1 font-medium">
//                           {gpu.name}
//                           {!sub?.plans?.plans && !gpu.isForFreePlan && (
//                             <Lock className="h-3 w-3" />
//                           )}
//                         </span>
//                         <span className="text-gray-600 text-sm">{gpu.ram}</span>
//                       </div>
//                       <div className="flex items-center justify-between">
//                         <span className="max-w-[70%] text-[11px] text-gray-400">
//                           <span className="font-medium text-gray-600">
//                             {gpu.description.bold}
//                           </span>{" "}
//                           {gpu.description.regular}
//                         </span>
//                       </div>
//                     </div>
//                   </motion.div>
//                 ))}
//               </AnimatePresence>

//               {/* Show/Hide button - show it always */}
//               <motion.div
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//               >
//                 <Button
//                   variant="ghost"
//                   className="w-full text-muted-foreground text-xs hover:text-primary"
//                   onClick={() => setShowAllGpu(!showAllGpu)}
//                 >
//                   <div className="flex items-center gap-2">
//                     {showAllGpu ? (
//                       <>
//                         Show Less <ChevronUp className="h-3 w-3" />
//                       </>
//                     ) : (
//                       <>
//                         {validation.gpuType ? (
//                           <>Change GPU Selection</>
//                         ) : (
//                           <>Show More Options</>
//                         )}{" "}
//                         <ChevronDown className="h-3 w-3" />
//                       </>
//                     )}
//                   </div>
//                 </Button>
//               </motion.div>
//             </div>
//           </div>
//         </div>

//         <div ref={comfyUISectionRef}>
//           <div>
//             <div className="mb-2">
//               <span className="font-medium text-sm">ComfyUI Version </span>
//               <span className="text-red-500">*</span>
//             </div>
//             <div className="flex flex-col gap-2">
//               {comfyUIOptions.map((option) => (
//                 <div
//                   key={option.id}
//                   onClick={() => {
//                     setValidation({
//                       ...validation,
//                       selectedComfyOption: option.id,
//                       comfyUiHash:
//                         option.id === "custom"
//                           ? validation.comfyUiHash
//                           : option.hash || "",
//                     });
//                     scrollToNextSection(customNodeSectionRef);
//                   }}
//                   className={cn(
//                     "cursor-pointer rounded-lg border p-4 transition-all duration-200",
//                     "hover:border-gray-400",
//                     validation.selectedComfyOption === option.id
//                       ? "border-gray-500 ring-2 ring-gray-500 ring-offset-2"
//                       : "border-gray-200 opacity-60",
//                   )}
//                 >
//                   <div className="mb-1 flex items-center justify-between">
//                     <span className="font-medium">{option.name}</span>
//                     {option.id !== "custom" && (
//                       <Link
//                         href={`https://github.com/comfyanonymous/ComfyUI/commits/${option.hash}`}
//                         target="_blank"
//                         className="text-muted-foreground"
//                       >
//                         <ExternalLink className="h-3 w-3" />
//                       </Link>
//                     )}
//                   </div>
//                   <div className="flex items-center justify-between">
//                     {option.id === "custom" ? (
//                       <Input
//                         className="w-full font-mono text-[11px]"
//                         placeholder="Enter commit hash..."
//                         value={validation.comfyUiHash || ""}
//                         onChange={(e) => {
//                           setValidation({
//                             ...validation,
//                             selectedComfyOption: "custom",
//                             comfyUiHash: e.target.value,
//                           });
//                         }}
//                       />
//                     ) : (
//                       <span className="text-[11px] text-gray-400">
//                         {option.id === "latest" && isLoading ? (
//                           <Skeleton className="h-4 w-24" />
//                         ) : (
//                           <span className="font-mono">{option.hash}</span>
//                         )}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         <div ref={customNodeSectionRef}>
//           <CustomNodeSetup
//             validation={validation}
//             setValidation={setValidation}
//           />
//         </div>

//         <div />
//       </div>
//     </SnapshotImportZoneSteps>
//   );
// }
