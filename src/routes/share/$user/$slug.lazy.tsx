import { FileURLRender } from "@/components/output-render";
import { RunWorkflowInline } from "@/components/run/RunWorkflowInline";
import { publicRunStore } from "@/components/run/VersionSelect";
import { getDefaultValuesFromWorkflow } from "@/lib/getInputsFromWorkflow";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { UserIcon } from "@/components/run/SharePageComponent";
import { LoadingIcon } from "@/components/loading-icon";
import { useUser } from "@clerk/clerk-react";

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

  const { data: shareDeployment, isLoading } = useQuery<ShareDeployment>({
    queryKey: ["share", user, slug],
    queryFn: () => {
      return fetch(
        `${process.env.NEXT_PUBLIC_CD_API_URL}/api/share/${user}/${slug}`,
      ).then((res) => res.json());
    },
  });

  const { isSignedIn } = useUser();

  const [default_values, setDefaultValues] = useState(
    getDefaultValuesFromWorkflow(shareDeployment?.input_types),
  );

  // Store completed image URL to persist between polling updates
  const [completedImageUrl, setCompletedImageUrl] = useState<string | null>(
    null,
  );
  const { runId } = publicRunStore();

  const { data: runResult } = useQuery<RunResult>({
    queryKey: ["run"],
    queryKeyHashFn: (queryKey) => [...queryKey, runId].toString(),
    meta: {
      params: {
        run_id: runId,
      },
    },
    refetchInterval: runId && !completedImageUrl ? 3000 : false,
    enabled: !!runId,
  });

  // Update completed image URL when run succeeds OR when starting new run
  useEffect(() => {
    if (runId === "") {
      setCompletedImageUrl(null);
    } else if (runResult?.outputs?.[0]?.data?.images?.[0]?.url) {
      setCompletedImageUrl(runResult.outputs[0].data.images[0].url);
    } else {
      // Clear image when starting a new run
      setCompletedImageUrl(null);
    }
  }, [runId, runResult?.outputs]);

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
    <div className="mx-auto w-full max-w-[1400px] gap-6 p-4">
      <div className="mb-4 flex flex-col gap-2 pl-2">
        <div className="flex flex-row items-end gap-2">
          <h1 className="text-xl">{shareDeployment.workflow.name}</h1>
          <h2 className="text-muted-foreground text-sm">
            {shareDeployment.share_slug}
          </h2>
        </div>
        {isSignedIn ? (
          <UserIcon className="h-5 w-5" user_id={shareDeployment.user_id} />
        ) : (
          <span className="text-muted-foreground text-sm">{user}</span>
        )}
        <span className="text-muted-foreground text-sm">
          {shareDeployment.description}
        </span>
      </div>

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
            {runId && !completedImageUrl && (
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
            {completedImageUrl && (
              <FileURLRender
                url={completedImageUrl}
                imgClasses="max-w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
