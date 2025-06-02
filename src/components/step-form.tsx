import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export interface Step<T> {
  id: number;
  title: string;
  component: React.ComponentType<StepComponentProps<T>>;
  validate: (validation: T) => {
    isValid: boolean;
    error?: string;
  };
  actions: {
    onNext: (validation: T) => Promise<boolean> | boolean;
  };
}

export interface StepComponentProps<T> {
  validation: T;
  setValidation: (validation: T | ((prev: T) => T)) => void;
}

interface StepFormProps<T> {
  steps: Step<T>[];
  validation: T;
  setValidation: (validation: T | ((prev: T) => T)) => void;
  getStepNavigation: (
    currentStep: number,
    validation: T,
  ) => {
    next: number | null;
    prev: number | null;
  };
  onExit?: () => void;
  hideProgressBar?: boolean;
}

export function StepForm<T>({
  steps,
  validation,
  setValidation,
  getStepNavigation,
  onExit,
  hideProgressBar,
}: StepFormProps<T>) {
  const [step, setStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigation = async (direction: "next" | "prev") => {
    if (isNavigating) return;

    setIsNavigating(true);
    const navigation = getStepNavigation(step, validation);
    const nextStep = direction === "next" ? navigation.next : navigation.prev;

    if (direction === "next") {
      const validationResult = steps[step].validate(validation);
      if (!validationResult.isValid) {
        if (validationResult.error) {
          toast.error(validationResult.error);
        }
        setIsNavigating(false);
        return;
      }

      const actionResult = await steps[step].actions.onNext(validation);
      if (!actionResult) {
        setIsNavigating(false);
        return;
      }
    }

    if (nextStep === null) {
      if (direction === "prev" && onExit) {
        onExit();
      }
      setIsNavigating(false);
      return;
    }

    setStep(nextStep);

    setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  };

  const handleBreadcrumbClick = (targetStep: number) => {
    if (isNavigating) return;

    // If going backwards, skip validation
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }

    // If going forwards, validate only accessible steps in between
    let currentCheck = step;
    while (currentCheck < targetStep) {
      const navigation = getStepNavigation(currentCheck, validation);

      // Validate current step
      const validationResult = steps[currentCheck].validate(validation);
      if (!validationResult.isValid) {
        if (validationResult.error) {
          toast.error(validationResult.error);
        }
        return;
      }

      // Check if next step is accessible
      if (navigation.next === null || navigation.next > targetStep) {
        return; // Target step is not accessible from this path
      }

      currentCheck = navigation.next;
    }

    setStep(targetStep);
  };

  const CurrentStepComponent = steps[step].component;

  const progress = useMemo(() => {
    const navigation = getStepNavigation(step, validation);
    const accessibleSteps = steps.filter((_, index) => {
      let currentCheck = 0;
      const visitedSteps = new Set<number>();

      while (currentCheck < index) {
        if (visitedSteps.has(currentCheck)) return false;
        visitedSteps.add(currentCheck);

        const nav = getStepNavigation(currentCheck, validation);
        if (nav.next !== index && nav.next !== currentCheck + 1) return false;
        currentCheck++;
      }
      return true;
    });

    const totalSteps = accessibleSteps.length - 1;
    const currentStepIndex = accessibleSteps.indexOf(steps[step]);

    return navigation.next === null
      ? 100
      : Math.round((currentStepIndex / totalSteps) * 100);
  }, [step, validation, steps, getStepNavigation]);

  if (!steps.length) {
    return null; // or some fallback UI
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {!hideProgressBar && (
        <div className="sticky top-0 left-0 z-50 mx-auto mt-10 w-full max-w-5xl">
          <div className="relative overflow-hidden bg-background dark:bg-transparent">
            <Breadcrumb>
              <BreadcrumbList>
                {steps.map((stepItem, index) => {
                  const isStepAccessible = (targetIndex: number) => {
                    let currentCheck = 0;
                    const visitedSteps = new Set<number>();

                    while (currentCheck < targetIndex) {
                      if (visitedSteps.has(currentCheck)) return false; // Prevent infinite loops
                      visitedSteps.add(currentCheck);

                      const nav = getStepNavigation(currentCheck, validation);

                      // If there's no next step, this path is invalid
                      if (nav.next === null) return false;

                      // If the next step takes us directly to target, that's valid
                      if (nav.next === targetIndex) return true;

                      // If the next step goes beyond our target, this path is invalid
                      if (nav.next > targetIndex) return false;

                      // Continue checking from the next step
                      currentCheck = nav.next;
                    }

                    // If we reached the target through valid steps, it's accessible
                    return currentCheck === targetIndex;
                  };

                  const isAccessible = isStepAccessible(index);
                  const hasNextAccessibleStep = steps
                    .slice(index + 1)
                    .some((_, i) => isStepAccessible(index + 1 + i));

                  return isAccessible ? (
                    <BreadcrumbItem key={`step-${stepItem.id}`}>
                      <BreadcrumbLink
                        onClick={
                          index !== step
                            ? () => handleBreadcrumbClick(index)
                            : undefined
                        }
                        className={cn(
                          "relative cursor-pointer",
                          index === step ? "text-primary" : "",
                        )}
                      >
                        <motion.span
                          animate={{
                            fontVariationSettings:
                              index === step ? "'wght' 700" : "'wght' 400",
                          }}
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.2,
                          }}
                        >
                          {stepItem.title}
                        </motion.span>
                        {index === step && (
                          <motion.div
                            layoutId="underline"
                            className="absolute right-0 bottom-0 left-0 h-[1px] bg-current"
                            transition={{
                              type: "spring",
                              bounce: 0.2,
                              duration: 0.6,
                            }}
                          />
                        )}
                      </BreadcrumbLink>
                      {hasNextAccessibleStep && <BreadcrumbSeparator />}
                    </BreadcrumbItem>
                  ) : null;
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      )}

      <div className="flex w-full flex-1 justify-center overflow-auto md:py-0">
        <div className="mx-4 my-auto w-full max-w-5xl py-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ filter: "blur(2px)", opacity: 0, y: 20 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              exit={{ filter: "blur(2px)", opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <h1 className="mb-4 font-medium text-xl">{steps[step].title}</h1>
              <CurrentStepComponent
                validation={validation}
                setValidation={setValidation}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed right-8 bottom-12 flex flex-row gap-2">
        <Button
          variant="outline"
          // Icon={ChevronLeft}
          // iconPlacement="left"
          onClick={() => handleNavigation("prev")}
          className="drop-shadow-md"
        >
          Back
        </Button>
        <Button
          // variant="expandIcon"
          Icon={ChevronRight}
          iconPlacement="right"
          onClick={() => handleNavigation("next")}
          className="drop-shadow-md"
        >
          {getStepNavigation(step, validation).next === null
            ? "Finish"
            : "Next"}
        </Button>
      </div>
    </div>
  );
}
