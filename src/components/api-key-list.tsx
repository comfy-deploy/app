import { useAPIKeyList } from "@/hooks/use-user-settings";
import type { SortingState } from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { ApiKeyAdd } from "./api-key-add";
import { Input } from "./ui/input";
import { VirtualizedInfiniteList } from "./virtualized-infinite-list";
import { UserIcon } from "./run/SharePageComponent";
import { Key, Search, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { deleteAPIKey } from "./api-key-api";
import { getRelativeTime } from "@/lib/get-relative-time";
import { Badge } from "./ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { toast } from "sonner";

export type APIKey = {
  id: string;
  key: string;
  name: string;
  user_id: string;
  org_id: string | null;
  revoked: boolean;
  created_at: Date;
  updated_at: Date;
};

function APIKeyRow({ item, onDelete }: { item: APIKey; onDelete: () => void }) {
  const handleDelete = async () => {
    try {
      await deleteAPIKey(item.id);
      toast.success("API Key deleted successfully");
      onDelete();
    } catch (error) {
      toast.error("Failed to delete API key");
    }
  };

  return (
    <div className="border-border/50 border-b bg-background transition-colors hover:bg-muted/30 dark:bg-transparent dark:hover:bg-zinc-700/50">
      <div className="group mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {/* Icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Key className="h-4 w-4 text-primary" />
          </div>

          {/* Name and Key */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium text-foreground text-sm">
                {item.name}
              </h3>
              {item.revoked && (
                <Badge variant="destructive" className="text-xs">
                  Revoked
                </Badge>
              )}
            </div>
            <code className="rounded bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
              {item.key}
            </code>
          </div>

          {/* User */}
          <div className="flex w-28 items-center justify-start">
            <UserIcon user_id={item.user_id} displayName className="h-5 w-5" />
          </div>

          {/* Date */}
          <div className="hidden w-24 text-right sm:block">
            <div className="line-clamp-1 text-muted-foreground text-xs">
              {getRelativeTime(item.created_at)}
            </div>
            <div className="text-[10px] text-muted-foreground">Created</div>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-4 flex w-8 items-center justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100 dark:text-red-500 dark:hover:bg-red-500/10"
              >
                <span className="sr-only">Delete API key</span>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{item.name}"? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete API Key
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function TableHeader() {
  return (
    <div className="sticky top-0 z-10 border-border border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-screen-2xl items-center px-6 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="w-10" /> {/* Icon space */}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-muted-foreground text-sm">
              API Key
            </h3>
          </div>
          <div className="w-28">
            <h3 className="font-medium text-muted-foreground text-sm">User</h3>
          </div>
          <div className="hidden w-24 text-right sm:block">
            <h3 className="font-medium text-muted-foreground text-sm">
              Created
            </h3>
          </div>
        </div>
        <div className="ml-4 w-8" /> {/* Actions space */}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <>
      <TableHeader />
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Key className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-semibold text-lg">No API keys found</h3>
        <p className="mt-2 text-muted-foreground text-sm">
          Get started by creating your first API key.
        </p>
        <div className="mt-4">
          <ApiKeyAdd onKeyCreated={() => {}} />
        </div>
      </div>
    </>
  );
}

function LoadingState({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <>
      {withHeader && <TableHeader />}
      <div className="mx-auto max-w-screen-2xl space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`loading-${index}`}
            className="flex animate-pulse items-center gap-4"
          >
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
            <div className="h-6 w-6 rounded-full bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-8 w-8 rounded bg-muted" />
          </div>
        ))}
      </div>
    </>
  );
}

export function APIKeyList() {
  const [searchValue, setSearchValue] = useState<string | null>(null);
  const [debouncedSearchValue] = useDebounce(searchValue, 250);

  const data = useAPIKeyList(debouncedSearchValue ?? "");

  const flatData = data.data?.pages.flat() ?? [];
  const isLoading = data.isLoading;
  const isEmpty = !isLoading && flatData.length === 0;

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="border-border border-b bg-background dark:bg-transparent">
        <div className="mx-auto flex items-center justify-between gap-2 p-4">
          {/* Search */}
          <div className="relative w-full">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search API keys..."
              value={searchValue ?? ""}
              onChange={(event) => {
                if (event.target.value === "") {
                  setSearchValue(null);
                } else {
                  setSearchValue(event.target.value);
                }
              }}
              className="max-w-sm pl-10"
            />
          </div>

          <ApiKeyAdd onKeyCreated={() => data.refetch()} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden pb-4">
        {isLoading ? (
          <LoadingState />
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <VirtualizedInfiniteList
            queryResult={data}
            estimateSize={64}
            header={<TableHeader />}
            className="!h-full"
            renderItem={(item: APIKey) => (
              <APIKeyRow item={item} onDelete={() => data.refetch()} />
            )}
            renderLoading={() => <LoadingState withHeader={false} />}
          />
        )}
      </div>
    </div>
  );
}
