import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Save,
  ArrowLeft,
  Settings,
  GitBranch,
  Box,
  Timer,
  Rocket,
} from "lucide-react";
import { Badge } from "../ui/badge";

const allGuideSteps = [
  {
    title: "Switch Workflows and Versions",
    image:
      "https://cd-misc.s3.us-east-2.amazonaws.com/guide/swap_workflow_and_version.png",
    description: [
      "Choose different workflows here",
      "Switch between saved versions of workflows",
    ],
  },
  {
    title: "Switch Machines",
    image: "https://cd-misc.s3.us-east-2.amazonaws.com/guide/swap_machine.png",
    description: [
      "Choose different machines to run your workflows",
      "Configure machine settings and resources",
      "Optimize performance based on your workload needs",
    ],
  },
  {
    title: "Start a Session",
    image: "https://cd-misc.s3.us-east-2.amazonaws.com/guide/start_session.png",
    description: [
      "Launch a ComfyUI session with 'Start ComfyUI' button",
      "Select session duration and GPU",
      "You can re-enter or terminate existing sessions",
    ],
  },
  {
    title: "Session Sidebar Top",
    image: "https://cd-misc.s3.us-east-2.amazonaws.com/guide/top_bar.png",
    description: [
      {
        text: "Back: Return to the dashboard",
        icon: <ArrowLeft size={16} />,
      },
      {
        text: "Save: Commit changes as a new version",
        icon: <Save size={16} />,
      },
      {
        text: "Branch: Switch branches or copy workflow JSON",
        icon: <GitBranch size={16} />,
      },
      {
        text: "Model Check: Verify all assets and models are properly imported",
        icon: <Box size={16} />,
      },
    ],
  },
  {
    title: "Session Sidebar Bottom",
    image: "https://cd-misc.s3.us-east-2.amazonaws.com/guide/bottom_bar.png",
    description: [
      {
        text: "Settings: Toggle features like auto-save and auto-extend",
        icon: <Settings size={16} />,
      },
      {
        text: "GPU: Shows your current GPU allocation",
        icon: <Badge>A10G</Badge>,
      },
      {
        text: "Timer: Displays remaining session time with option to extend",
        icon: <Timer size={16} />,
      },
    ],
  },
  {
    title: "External Input Nodes",
    image:
      "https://cd-misc.s3.us-east-2.amazonaws.com/guide/external_input.png",
    description: [
      "You can use external input nodes to expose specific inputs for api control",
      {
        text: "Learn more in our documentation",
        link: "https://www.comfydeploy.com/docs/v2/deployments/inputs",
      },
    ],
  },
  {
    title: "Deploy Workflow",
    image:
      "https://cd-misc.s3.us-east-2.amazonaws.com/guide/deploy_workflow.png",
    description: [
      {
        text: "Deploy workflows with a single click",
        icon: <Rocket size={16} />,
      },
      "Choose deployment environment (staging / production / public share)",
      "Monitor API requests in the requests page",
    ],
  },
];

export type GuideType = "workspace" | "session" | "deployment";

const getGuideSteps = (guideType: GuideType) => {
  switch (guideType) {
    case "workspace":
      return allGuideSteps.slice(0, 3);
    case "session":
      return allGuideSteps.slice(3, 6);
    case "deployment":
      return allGuideSteps.slice(6, 7);
    default:
      return [];
  }
};

const getGuideStorageKey = (guideType: GuideType) => {
  return `has-seen-${guideType}-guide`;
};

interface GuideDialogProps {
  guideType: GuideType;
}

export function GuideDialog({ guideType }: GuideDialogProps) {
  const storageKey = getGuideStorageKey(guideType);
  const [hasSeenGuide, setHasSeenGuide] = useLocalStorage(storageKey, false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const guideSteps = getGuideSteps(guideType);

  useEffect(() => {
    if (!hasSeenGuide && guideSteps.length > 0) {
      const imagePromises = guideSteps.map((step) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = step.image;
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      Promise.all(imagePromises)
        .then(() => {
          setIsOpen(true);
        })
        .catch((error) => {
          console.error("Failed to load guide images:", error);
          setIsOpen(true);
        });
    }
  }, [hasSeenGuide, guideSteps]);

  if (guideSteps.length === 0) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    setHasSeenGuide(true);
  };

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = guideSteps[currentStep];

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent className="border-none bg-zinc-100 p-0">
        <img
          src={currentStepData.image}
          alt={currentStepData.title}
          className="w-full rounded-t-md"
        />

        <div className="p-5 pt-2">
          <AlertDialogHeader>
            <AlertDialogTitle>{currentStepData.title}</AlertDialogTitle>
            <AlertDialogDescription>
              <ul className="list-disc space-y-1 pl-5 text-zinc-700">
                {currentStepData.description.map((item, i) => {
                  // Check if the item is a string or an object with icon
                  if (typeof item === "string") {
                    return (
                      <li key={`${currentStepData.title}-item-${i}`}>{item}</li>
                    );
                  }

                  // For items with icons
                  return (
                    <li
                      key={`${currentStepData.title}-item-${i}`}
                      className="-ml-5 flex list-none items-center gap-2"
                    >
                      {item.icon && (
                        <span className="text-primary">{item.icon}</span>
                      )}
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {item.text}
                        </a>
                      ) : (
                        <span>{item.text}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                className="text-muted-foreground hover:bg-zinc-200"
                onClick={handleBack}
              >
                Back
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep < guideSteps.length - 1 ? "Next" : "OK"}
            </Button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
