import React from "react";
import { LoadingIcon } from "@/components/ui/custom/loading-icon";
import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="relative h-screen w-full">
      {/* Blurred background layout */}
      <div className="h-screen w-full blur-sm">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="hidden w-64 border-r md:flex md:flex-col">
            {/* Logo */}
            <div className="border-b p-4">
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            </div>

            {/* Navigation */}
            <div className="flex-1 p-4">
              <div className="space-y-1">
                <div className="h-9 animate-pulse rounded bg-muted" />
                <div className="h-9 animate-pulse rounded bg-muted" />
                <div className="h-9 animate-pulse rounded bg-muted" />
                <div className="h-9 animate-pulse rounded bg-muted" />
              </div>
            </div>

            {/* Account section */}
            <div className="border-t p-4">
              <div className="space-y-2">
                <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                <div className="h-8 animate-pulse rounded bg-muted" />
                <div className="h-8 animate-pulse rounded bg-muted" />
                <div className="h-8 animate-pulse rounded bg-muted" />
              </div>
            </div>

            {/* Footer links */}
            <div className="border-t p-4">
              <div className="flex justify-between">
                <div className="h-6 w-12 animate-pulse rounded bg-muted" />
                <div className="h-6 w-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                  <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              </div>

              {/* Search bar */}
              <div className="mt-4 flex items-center gap-4">
                <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
                <div className="h-10 w-20 animate-pulse rounded-lg bg-muted" />
                <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                <div className="h-8 w-8 animate-pulse rounded bg-muted" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Card 1 */}
                <div className="rounded-lg border p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="h-6 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-6 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>

                {/* Card 2 */}
                <div className="rounded-lg border p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="h-6 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-6 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>

                {/* Card 3 */}
                <div className="rounded-lg border p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="h-6 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-6 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </div>
            </div>

            {/* Create button */}
            <div className="fixed right-6 bottom-6">
              <div className="h-12 w-40 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </div>

      {/* Centered loading overlay */}
      <div className="absolute inset-0 flex items-center justify-center ">
        <div className="flex flex-row items-center gap-4 rounded-lg  p-8 ">
          <p className="text-lg font-medium text-foreground">
            Loading your account...
          </p>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );
}
