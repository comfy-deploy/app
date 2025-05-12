"use client";

import * as React from "react";
import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const allGuideSteps = [
  {
    title: "Switch Workflows and Versions",
    image: "https://cd-misc.s3.us-east-2.amazonaws.com/guide/swap_workflow_and_version.png",
    description: "You can switch different workflow and swap the version here, for you to test through different workflow json."
  },
  {
    title: "Switch Machines",
    image: "https://cd-misc.s3.us-east-2.amazonaws.com/guide/swap_machine.png",
    description: "You can switch different machines to run this workflow here, and also can edit the machine settings."
  },
  {
    title: "Start a Session",
    image: "https://cd-misc.s3.us-east-2.amazonaws.com/guide/start_session.png",
    description: "You can press start ComfyUI to start a comfyui session. You can choose the session time range, and the GPU that u want to run. It will also list out all the current running sessions, and can re-enter the session or terminate it."
  },
  {
    title: "Session Sidebar Top",
    image: "https://cd-misc.s3.us-east-2.amazonaws.com/guide/session_sidebar_top.png",
    description: "This is the image of the top bar of the side bar. Press back button to go back to the dashboard. Save button to save the current changes and commit a new version. This is important to prevent the workflow edit lost. Branch button, to swap to different branch, and copy the workflow json. Model Check button, to make sure all the assets and model are well imported."
  },
  {
    title: "Session Sidebar Bottom",
    image: "https://cd-misc.s3.us-east-2.amazonaws.com/guide/session_sidebar_bottom.png",
    description: "Setting button, have some feature for user to switch on, like auto save, auto extend session. Gpu Badge display, to show what gpu is currently using. Timer, to show how long the session will timeout. Can be extended there."
  },
  {
    title: "External Input Nodes",
    image: "https://cd-misc.s3.us-east-2.amazonaws.com/guide/external_input.png",
    description: "You can expose inputs to API with our external input nodes. This allows you to parameterize your workflow for API calls. Learn more in our documentation at https://www.comfydeploy.com/docs/v2/deployments/inputs."
  },
  {
    title: "Deploy Workflow",
    image: "https://cd-misc.s3.us-east-2.amazonaws.com/guide/deploy_workflow.png",
    description: "User can press the deploy workflow here to get the api call. Can choose different environment, like staging, production or even public sharing. Can view the requests in request page."
  }
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
  const [isOpen, setIsOpen] = useState(!hasSeenGuide);
  const [currentStep, setCurrentStep] = useState(0);
  
  const guideSteps = getGuideSteps(guideType);
  
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
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{currentStepData.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {currentStepData.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-4">
          <img 
            src={currentStepData.image} 
            alt={currentStepData.title} 
            className="w-full rounded-md"
          />
        </div>
        
        <AlertDialogFooter>
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button onClick={handleNext}>
            {currentStep < guideSteps.length - 1 ? "Next" : "Finish"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
