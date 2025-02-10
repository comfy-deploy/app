import { FileURLRender } from "@/components/output-render";
import { RunWorkflowInline } from "@/components/run/RunWorkflowInline";
import { publicRunStore } from "@/components/run/VersionSelect";
import { getDefaultValuesFromWorkflow } from "@/lib/getInputsFromWorkflow";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, useParams } from "@tanstack/react-router";
import { Brush, Loader2, Stars } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { UserIcon } from "@/components/run/SharePageComponent";
import { LoadingIcon } from "@/components/loading-icon";
import { useUser } from "@clerk/clerk-react";
import { ShinyButton } from "@/components/magicui/shiny-button";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useGalleryData } from "@/components/GalleryView";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { getTotalUrlCountAndUrls } from "@/components/workflows/OutputRender";

type ShareDeployment = {
  id: string;
  user_id: string;
  share_slug: string;
  description: string;
  input_types: Record<string, any>;
  workflow: {
    name: string;
  };
};

type RunResult = {
  outputs: {
    data: {
      images: { url: string }[];
    };
  }[];
  live_status: string;
  progress: number;
};

export const Route = createLazyFileRoute("/share/$user/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user, slug } = useParams({ from: "/share/$user/$slug" });

  const {
    data: shareDeployment,
    isLoading,
    error,
  } = useQuery<ShareDeployment>({
    queryKey: ["share", user, slug],
    queryFn: () => {
      return fetch(
        `${process.env.NEXT_PUBLIC_CD_API_URL}/api/share/${user}/${slug}`,
      ).then((res) => (res.ok ? res.json() : null));
    },
  });

  const { isSignedIn } = useUser();

  const [default_values, setDefaultValues] = useState(
    getDefaultValuesFromWorkflow(shareDeployment?.input_types),
  );

  // Change the state to handle multiple images
  const [completedImageUrls, setCompletedImageUrls] = useState<string[]>([]);
  const { runId, setRunId } = publicRunStore();

  const [runButtonLoading, setRunButtonLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { data: runResult } = useQuery<RunResult>({
    queryKey: ["run"],
    queryKeyHashFn: (queryKey) => [...queryKey, runId].toString(),
    meta: {
      params: {
        run_id: runId,
      },
    },
    refetchInterval: runId && !completedImageUrls.length ? 3000 : false,
    enabled: !!runId,
  });

  //   const { data: galleryData } = useGalleryData(
  //     "a3c62c92-7647-48e4-9a26-1ac0e07392be",
  //   );

  //   console.log(galleryData);

  useEffect(() => {
    if (runId !== "") {
      setIsDrawerOpen(false);
    }
  }, [runId]);

  const displayImageUrls = useMemo(() => {
    if (runId === "") return [];
    const { urls: urlList } = getTotalUrlCountAndUrls(runResult?.outputs || []);
    // Take at most 4 images
    return urlList.slice(0, 4).map((url) => url.url);
  }, [runId, runResult?.outputs]);

  useEffect(() => {
    setCompletedImageUrls(displayImageUrls);
  }, [displayImageUrls]);

  useEffect(() => {
    setDefaultValues(
      getDefaultValuesFromWorkflow(shareDeployment?.input_types),
    );
  }, [shareDeployment?.id]);

  if (isLoading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingIcon />
      </div>
    );
  if (!shareDeployment) return <div>Not found</div>;

  return (
    <>
      {/* Useless Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="pointer-events-none"
      >
        <div className="-translate-x-[20%] -translate-y-1/2 absolute inset-1/2 h-[450px] w-[450px] animate-[pulse_9s_ease-in-out_infinite] rounded-full bg-blue-400 bg-opacity-30 blur-3xl" />
        <div className="-translate-x-[90%] -translate-y-[10%] absolute inset-1/2 h-72 w-72 animate-[pulse_7s_ease-in-out_infinite] rounded-full bg-purple-400 bg-opacity-30 blur-3xl delay-300" />
        <div className="-translate-x-[90%] -translate-y-[120%] absolute inset-1/2 h-52 w-52 animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-red-400 bg-opacity-40 blur-2xl delay-600" />
      </motion.div>

      <div className="mx-auto w-full max-w-[1400px] gap-6 p-4">
        <div className="mb-4 flex flex-col gap-2 pl-2">
          <div className="flex flex-row items-end gap-2">
            <h1 className="text-xl">{shareDeployment.workflow.name}</h1>
            <h2 className="text-muted-foreground text-sm">
              {shareDeployment.share_slug}
            </h2>
          </div>
          {isSignedIn ? (
            <UserIcon
              className="h-5 w-5"
              user_id={shareDeployment.user_id}
              displayName
            />
          ) : (
            <span className="text-muted-foreground text-sm">{user}</span>
          )}
          <span className="text-muted-foreground text-sm">
            {shareDeployment.description}
          </span>
        </div>
      </div>

      {/* Center */}
      <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2">
        <AnimatePresence mode="wait" initial={false}>
          {!runId && (
            <motion.div
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="animate-[pulse_4s_ease-in-out_infinite] text-muted-foreground text-sm">
                Press Run to start your first generation
              </span>
            </motion.div>
          )}
          {runId && !completedImageUrls.length && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex w-64 flex-col gap-1">
                <div className="animate-[pulse_4s_ease-in-out_infinite] text-center text-muted-foreground text-xs">
                  {runResult?.live_status || "Generating..."}
                </div>
                <Progress
                  value={(runResult?.progress || 0) * 100}
                  className="opacity-70"
                />
              </div>
            </motion.div>
          )}
          {completedImageUrls.length > 0 && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.4,
                ease: "easeInOut",
              }}
            >
              <div
                className={`grid gap-2 ${completedImageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
              >
                {completedImageUrls.map((url, index) => (
                  <FileURLRender
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    key={index}
                    url={url}
                    imgClasses={`${
                      completedImageUrls.length === 1
                        ? "max-w-[550px] h-full max-h-[65vh]"
                        : "max-w-[275px] max-h-[32.5vh]"
                    } object-cover shadow-lg`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Left */}
      <div />

      {/* functions */}
      <div className="-translate-x-1/2 fixed bottom-6 left-1/2">
        <div className="flex gap-2">
          <ShinyButton
            className="h-12 w-96 rounded-sm shadow-lg"
            disabled={runButtonLoading}
            onClick={async () => {
              try {
                setRunButtonLoading(true);
                const run = await api({
                  url: "run",
                  init: {
                    method: "POST",
                    body: JSON.stringify({
                      deployment_id: shareDeployment.id,
                      origin: "public-share",
                    }),
                  },
                });
                setRunId(run.run_id);
              } catch (error) {
                toast.error(`Failed to start run: ${error}`);
              } finally {
                setRunButtonLoading(false);
              }
            }}
          >
            <div className="flex h-full items-center justify-center">
              {runButtonLoading ? (
                <div className="flex animate-pulse items-center gap-2 text-muted-foreground">
                  <span>Starting...</span>
                  <LoadingIcon />
                </div>
              ) : (
                <>
                  Run <Stars className="ml-2 h-4 w-4" />
                </>
              )}
            </div>
          </ShinyButton>
          <Button
            size="icon"
            className="h-12 w-14 shadow-md"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Brush className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="mx-auto max-w-[500px]">
          <DrawerHeader>
            <DrawerTitle>Advanced Options</DrawerTitle>
            <DrawerDescription>
              Adjust the inputs to generate a different image.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <RunWorkflowInline
              blocking={false}
              default_values={default_values}
              inputs={shareDeployment?.input_types}
              runOrigin="public-share"
              deployment_id={shareDeployment.id}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

// deprecated

function Test() {
  return (
    <div className="flex w-full flex-col gap-6 md:flex-row">
      <div className="flex w-full max-w-[500px] flex-col gap-2">
        <span className="pl-2 text-muted-foreground text-sm">Inputs</span>
        <div className="w-full rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          <RunWorkflowInline
            blocking={false}
            default_values={default_values}
            inputs={shareDeployment?.input_types}
            runOrigin="public-share"
            deployment_id={shareDeployment.id}
          />
        </div>
      </div>
      <div className="flex w-full flex-col gap-2">
        <span className="pl-2 text-muted-foreground text-sm">Outputs</span>
        <div className="aspect-square w-full rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          {!runId && (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
              Press Run to start generation
            </div>
          )}
          {runId && !completedImageUrls && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
              <LoadingIcon />
              <div className="flex w-64 flex-col gap-2">
                <div className="text-center text-muted-foreground text-sm">
                  {runResult?.live_status}
                </div>
                <Progress value={(runResult?.progress || 0) * 100} />
              </div>
            </div>
          )}
          {completedImageUrls && (
            <FileURLRender
              url={completedImageUrls[0]}
              imgClasses="max-w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
}
