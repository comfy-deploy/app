import { FileURLRender } from "@/components/output-render";
import {
  parseFilesToImgURLs,
  parseInputValues,
  RunWorkflowInline,
} from "@/components/run/RunWorkflowInline";
import { publicRunStore } from "@/components/run/VersionSelect";
import { getDefaultValuesFromWorkflow } from "@/lib/getInputsFromWorkflow";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, useParams } from "@tanstack/react-router";
import { Brush, Loader2, Stars } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { UserIcon } from "@/components/run/SharePageComponent";
import { LoadingIcon } from "@/components/loading-icon";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
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
import { VirtualizedInfiniteList } from "@/components/virtualized-infinite-list";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MyDrawer } from "@/components/drawer";
import { RunDetails } from "@/components/workflows/WorkflowComponent";

type ShareDeployment = {
  id: string;
  user_id: string;
  org_id: string;
  share_slug: string;
  description: string;
  input_types: Record<string, any>;
  workflow: {
    name: string;
    id: string;
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
  status: string;
};

export const Route = createLazyFileRoute("/share/$user/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user: userParam, slug } = useParams({ from: "/share/$user/$slug" });
  const clerk = useClerk();
  const user = useAuth();

  const {
    data: shareDeployment,
    isLoading,
    error,
  } = useQuery<ShareDeployment>({
    queryKey: ["share", userParam, slug],
    queryFn: () => {
      return fetch(
        `${process.env.NEXT_PUBLIC_CD_API_URL}/api/share/${userParam}/${slug}`,
      ).then((res) => (res.ok ? res.json() : null));
    },
  });

  const { isSignedIn } = useUser();

  const [default_values, setDefaultValues] = useState(
    getDefaultValuesFromWorkflow(shareDeployment?.input_types),
  );

  // Change the state to handle multiple images
  const [completedImageUrls, setCompletedImageUrls] = useState<string[]>([]);
  const { runId, setRunId, inputValues } = publicRunStore();

  const [runButtonLoading, setRunButtonLoading] = useState(false);
  const [isAdvanceOptionDrawerOpen, setIsAdvanceOptionDrawerOpen] =
    useState(false);
  const [isImageDetailDrawerOpen, setIsImageDetailDrawerOpen] = useState(false);
  const [isRunComplete, setIsRunComplete] = useState(false);

  const { data: runResult } = useQuery<RunResult>({
    queryKey: ["run"],
    queryKeyHashFn: (queryKey) => [...queryKey, runId].toString(),
    meta: {
      params: {
        run_id: runId,
      },
    },
    refetchInterval: runId && !isRunComplete ? 3000 : false,
    enabled: !!runId,
  });

  const { data: orgName } = useQuery({
    enabled: !!shareDeployment?.org_id,
    queryKey: ["org", shareDeployment?.org_id],
    queryFn: () => {
      return clerk.getOrganization(shareDeployment?.org_id || "");
    },
  });

  const galleryData = useGalleryData(shareDeployment?.workflow.id);

  const [selectedImageIndex, setSelectedImageIndex] = useState(-1);
  const selectedImageData = useMemo(() => {
    if (selectedImageIndex === -1 || !galleryData?.data?.pages) return null;
    return galleryData.data.pages.flat()[selectedImageIndex];
  }, [selectedImageIndex, galleryData?.data?.pages]);

  useEffect(() => {
    if (runId !== "") {
      setIsAdvanceOptionDrawerOpen(false);
    }
  }, [runId]);

  useEffect(() => {
    if (inputValues && Object.keys(inputValues).length > 0) {
      setDefaultValues(inputValues);
      setIsImageDetailDrawerOpen(false);
      setIsAdvanceOptionDrawerOpen(true);
    }
  }, [inputValues]);

  useEffect(() => {
    let lastEventTime = 0;
    const eventCooldown = 150;
    let isProcessing = false;

    const handleImageChange = (
      newIndex: number,
      virtualListContainer: HTMLElement,
      allImages: any[],
    ) => {
      const containerHeight = virtualListContainer?.offsetHeight || 384;
      const middleOffset = containerHeight / 2 - 32;
      const url = allImages[newIndex]?.data?.images?.[0]?.url;

      if (newIndex >= allImages.length - 5 && galleryData.hasNextPage) {
        galleryData.fetchNextPage();
      }

      if (newIndex < allImages.length && newIndex >= 0 && url) {
        setCompletedImageUrls([url]);
        virtualListContainer?.scrollTo({
          top: Math.max(0, newIndex * 64 - middleOffset),
          behavior: "smooth",
        });
        setSelectedImageIndex(newIndex);
      }
    };

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!galleryData?.data?.pages?.[0] || isProcessing) return;

      const currentTime = Date.now();
      if (currentTime - lastEventTime < eventCooldown) return;
      lastEventTime = currentTime;

      const allImages = galleryData.data.pages.flat();
      const virtualListContainer = document.querySelector(
        ".scrollbar-none",
      ) as HTMLElement;

      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        isProcessing = true;
        handleImageChange(
          selectedImageIndex - 1,
          virtualListContainer,
          allImages,
        );
        isProcessing = false;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        isProcessing = true;
        handleImageChange(
          selectedImageIndex + 1,
          virtualListContainer,
          allImages,
        );
        isProcessing = false;
      }
    };

    // Add wheel event handler with throttling
    let wheelTimeout: NodeJS.Timeout | null = null;
    const handleWheel = (e: WheelEvent) => {
      const isOverDrawer = (e.target as HTMLElement).closest('[role="dialog"]');
      if (isOverDrawer) return;

      if (!galleryData?.data?.pages?.[0] || isProcessing) return;

      const currentTime = Date.now();
      if (currentTime - lastEventTime < eventCooldown) return;
      lastEventTime = currentTime;

      if (wheelTimeout) return;

      wheelTimeout = setTimeout(() => {
        wheelTimeout = null;
      }, eventCooldown);

      const allImages = galleryData.data.pages.flat();
      const virtualListContainer = document.querySelector(
        ".scrollbar-none",
      ) as HTMLElement;

      const direction = e.deltaY > 0 ? 1 : -1;

      isProcessing = true;
      e.preventDefault();
      handleImageChange(
        selectedImageIndex + direction,
        virtualListContainer,
        allImages,
      );
      isProcessing = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [
    galleryData?.data?.pages,
    galleryData.hasNextPage,
    galleryData.fetchNextPage,
    selectedImageIndex, // Add this dependency
  ]);

  const displayImageUrls = useMemo(() => {
    if (runId === "") return [];
    const { urls: urlList } = getTotalUrlCountAndUrls(runResult?.outputs || []);
    // Take at most 4 images
    return urlList.slice(0, 4).map((url) => url.url);
  }, [runId, runResult?.outputs]);

  // Update the run status effect
  useEffect(() => {
    if (runId && runResult) {
      const isComplete = runResult.status === "success";
      setIsRunComplete(isComplete);

      if (isComplete) {
        setCompletedImageUrls(displayImageUrls);
        galleryData?.refetch();
      }
    } else if (!runId) {
      setIsRunComplete(false);
    }
  }, [runId, runResult?.status, displayImageUrls]);

  // Update the gallery image selection logic
  const handleGalleryImageSelect = (url: string, index: number) => {
    if (runId && !isRunComplete) return;

    setCompletedImageUrls([url]);
    setSelectedImageIndex(index);
    setRunId("");
    setIsRunComplete(false);
  };

  useEffect(() => {
    setDefaultValues(
      getDefaultValuesFromWorkflow(shareDeployment?.input_types),
    );
  }, [shareDeployment?.id]);

  useEffect(() => {
    if (displayImageUrls.length > 0) {
      const allImages = galleryData?.data?.pages?.flat() || [];
      const newImageIndex = allImages.findIndex(
        (item) => item.data.images[0].url === displayImageUrls[0],
      );

      if (newImageIndex !== -1) {
        setSelectedImageIndex(newImageIndex);
      }
    }
  }, [displayImageUrls, galleryData?.data?.pages]);

  const getDisplayState = () => {
    if (runId && !isRunComplete) {
      // Show progress when running, regardless of other states
      return "running";
    }
    if (completedImageUrls.length > 0) {
      // Show completed images (either from run or gallery selection)
      return "completed";
    }
    // Show initial state
    return "initial";
  };

  if (isLoading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingIcon />
      </div>
    );
  if (!shareDeployment)
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
        Not found
      </div>
    );

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
            <div className="flex flex-row items-center gap-1 text-muted-foreground">
              <UserIcon
                className="h-5 w-5"
                user_id={shareDeployment.user_id}
                displayName
              />
              {orgName && <span className="text-xs">•</span>}
              {orgName && <span className="text-xs">{orgName.name}</span>}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">{userParam}</span>
          )}
          <span className="text-muted-foreground text-sm">
            {shareDeployment.description}
          </span>
        </div>
      </div>

      {/* Center */}
      <AnimatePresence mode="wait" initial={false}>
        {isImageDetailDrawerOpen && (
          <motion.div
            className="fixed inset-0 z-10 bg-white/10 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "-translate-y-1/2 absolute top-1/2 z-20 transition-all duration-1000 ease-in-out",
          isImageDetailDrawerOpen
            ? "-translate-x-1/2 left-[calc(50%-250px)]" // Move right by half the drawer width (500px/2)
            : "-translate-x-1/2 left-1/2",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {getDisplayState() === "initial" && (
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

          {getDisplayState() === "running" && (
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

          {getDisplayState() === "completed" && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div
                className={cn(
                  "grid gap-2",
                  completedImageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1",
                )}
                onClick={() => setIsImageDetailDrawerOpen(true)}
              >
                {completedImageUrls.map((url, index) => (
                  <FileURLRender
                    key={url}
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

      <div className={cn("-translate-y-1/2 fixed top-1/2 left-2 z-20")}>
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={
            galleryData && !galleryData.isLoading
              ? { opacity: 1, x: 0 }
              : { opacity: 0, x: -100 }
          }
          exit={{ opacity: 0, x: 100 }}
          transition={{
            duration: 0.5,
            ease: "circOut",
          }}
          className="relative"
        >
          {galleryData && (
            <VirtualizedInfiniteList
              className="scrollbar-none !h-[384px] w-[70px]"
              queryResult={galleryData}
              renderItem={(item, index) => {
                return (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                  <div
                    onClick={() =>
                      handleGalleryImageSelect(item.data.images[0].url, index)
                    }
                    className="cursor-pointer shadow-md"
                  >
                    <FileURLRender
                      key={item.output_id}
                      url={item.data.images[0].url}
                      imgClasses="aspect-square max-w-full object-cover rounded-[6px] pointer-events-none"
                    />
                  </div>
                );
              }}
              renderItemClassName={(item, index) =>
                cn(
                  "transition-all duration-200 !w-[60px]",
                  item.data?.images?.[0]?.url === completedImageUrls?.[0] ||
                    index === selectedImageIndex
                    ? "ml-2"
                    : "hover:ml-1.5",
                )
              }
              estimateSize={64}
              renderLoading={() => {
                return [...Array(4)].map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-[60px] w-[60px] rounded-[6px]"
                  />
                ));
              }}
            />
          )}
        </motion.div>

        {/* Top gradient overlay */}
        <div className="pointer-events-none absolute top-0 left-0 h-10 w-full bg-gradient-to-b from-white to-transparent" />

        {/* Bottom gradient overlay */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-10 w-full bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* functions */}
      <div className="-translate-x-1/2 fixed bottom-6 left-1/2">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.5, ease: "circOut" }}
        >
          <div className="flex gap-2">
            <ShinyButton
              className="h-12 w-96 rounded-sm shadow-lg"
              disabled={runButtonLoading}
              onClick={async () => {
                try {
                  if (!user.isSignedIn) {
                    clerk.openSignIn({
                      redirectUrl: window.location.href,
                    });
                    return;
                  }

                  setRunButtonLoading(true);
                  const valuesParsed = await parseFilesToImgURLs({
                    ...default_values,
                  });
                  const val = parseInputValues(valuesParsed);
                  const run = await api({
                    url: "run",
                    init: {
                      method: "POST",
                      body: JSON.stringify({
                        deployment_id: shareDeployment.id,
                        origin: "public-share",
                        inputs: val,
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
              className="h-12 w-[52px] shadow-md"
              onClick={() => setIsAdvanceOptionDrawerOpen(true)}
            >
              <Brush className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      <Drawer
        open={isAdvanceOptionDrawerOpen}
        onOpenChange={setIsAdvanceOptionDrawerOpen}
      >
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

      <MyDrawer
        desktopClassName="w-[500px] shadow-lg border-2 border-gray-200"
        open={!!isImageDetailDrawerOpen}
        backgroundInteractive={true}
        onClose={() => setIsImageDetailDrawerOpen(false)}
      >
        <RunDetails
          run_id={selectedImageData?.run_id}
          onClose={() => setIsImageDetailDrawerOpen(false)}
          isShare={true}
        />
      </MyDrawer>
    </>
  );
}
