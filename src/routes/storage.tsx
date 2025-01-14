import { PaddingLayout } from "@/components/PaddingLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense } from "react";
import ModelBrowserAsync from "../components/storage/ModelBrowserAsync";
import { ModelInfo } from "../components/storage/ModelInfoCard";
import { ModelList } from "../components/storage/model-list";
import {
  ModelListHeader,
  ModelListView,
} from "../components/storage/model-list-view";

export const Route = createFileRoute("/storage")({
  component: StoragePage,
});

export function StoragePage() {
  return (
    <PaddingLayout className="flex h-full w-full gap-2 pb-10 h-[calc(100vh-60px)] max-w-[1200px] mx-auto">
      <div className="flex h-full flex-1 flex-col gap-2 rounded-md border border-gray-200 bg-muted/20 p-4">
        <div className="flex items-center justify-between font-bold">
          <ModelListHeader />
        </div>
        <Suspense
          fallback={
            <div className="flex h-full w-full flex-col gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-[18px] w-full" />
              ))}
            </div>
          }
        >
          {/* <ModelBrowserAsync> */}
          <ModelListView className="h-[calc(100vh-172px)]">
            <ModelList
              apiEndpoint={process.env.COMFY_DEPLOY_SHARED_MACHINE_API_URL}
            />
          </ModelListView>
          {/* </ModelBrowserAsync> */}
        </Suspense>
      </div>
      <div className="hidden w-[500px] lg:block">
        <ModelInfo />
      </div>
    </PaddingLayout>
  );
}
