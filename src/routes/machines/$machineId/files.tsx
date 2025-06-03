import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Folder, ChevronRight, Loader2, FileText } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { useMachine } from "@/hooks/use-machine";
import { MachineVersionBadge } from "@/components/machine/machine-version-badge";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  LastActiveEvent,
  MachineCostEstimate,
} from "@/components/machine/machine-overview";

// Type definitions for file system data
interface FileItem {
  type: "file";
  size: number;
  last_modified: number;
}

interface DirectoryItem {
  type: "directory";
}

interface FileSystemContents {
  [key: string]: FileItem | DirectoryItem;
}

interface FileSystemResponse {
  path: string;
  contents: FileSystemContents;
  directories: string[];
  files: string[];
}

export const Route = createFileRoute("/machines/$machineId/files")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      path: typeof search.path === "string" ? search.path : "/",
    };
  },
});

function RouteComponent() {
  const { machineId } = Route.useParams();
  const { data: machine } = useMachine(machineId);

  if (!machine) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-50 flex flex-row justify-between border-gray-200 border-b bg-[#fcfcfc] p-4 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-900">
        <div className="flex flex-row items-center gap-4">
          <Link
            to={`/machines/${machine.id}`}
            params={{ machineId: machine.id }}
            className="flex flex-row items-center gap-2 font-medium text-md"
          >
            {machine.name}
            {machine.machine_version_id && (
              <MachineVersionBadge machine={machine} isExpanded={true} />
            )}
          </Link>

          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-500 text-sm dark:text-gray-400">
            Files
          </span>
        </div>
        <div className="flex flex-row gap-2">
          <ErrorBoundary fallback={(error) => <div>{error.message}</div>}>
            <MachineCostEstimate machineId={machine.id} />
          </ErrorBoundary>
          <LastActiveEvent machineId={machine.id} />
        </div>
      </div>

      <MachineFileList />
    </div>
  );
}

// Extract breadcrumbs to its own component to avoid recreating functions on each render
function FileBreadcrumbs({
  currentPath,
  setCurrentPath,
  navigate,
}: {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  navigate: any; // Using proper navigation type from router would be better
}) {
  const breadcrumbs = currentPath
    .split("/")
    .filter(Boolean)
    .reduce<{ name: string; path: string }[]>(
      (acc, part) => {
        const lastPath = acc[acc.length - 1]?.path || "";
        acc.push({
          name: part,
          path: lastPath === "/" ? `/${part}` : `${lastPath}/${part}`,
        });
        return acc;
      },
      [{ name: "custom_nodes", path: "/" }],
    );

  return (
    <div className="flex shrink-0 items-center justify-between gap-4 p-4 pb-0">
      <div className="flex items-center gap-2 pl-1 text-gray-500 text-sm dark:text-gray-400">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.path} className="flex items-center">
            {i > 0 && <ChevronRight className="mr-2 h-4 w-4" />}
            <button
              type="button"
              onClick={() => {
                setCurrentPath(crumb.path);
                navigate({
                  search: (prev) => ({ ...prev, path: crumb.path }),
                });
              }}
              className="hover:text-gray-900 dark:hover:text-gray-100"
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MachineFileList() {
  const { machineId } = Route.useParams();
  const { path: apiPath } = Route.useSearch();
  const [currentPath, setCurrentPath] = useState(apiPath);
  const navigate = Route.useNavigate();

  useEffect(() => {
    setCurrentPath(apiPath);
  }, [apiPath]);

  const { data, isLoading } = useQuery<FileSystemResponse>({
    queryKey: ["machine", "serverless", machineId, "files"],
    queryKeyHashFn: (queryKey) => [...queryKey, apiPath].toString(),
    meta: {
      params: {
        path: apiPath,
      },
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const handleNavigate = (folderName: string) => {
    const newPath =
      currentPath === "/" ? `/${folderName}` : `${currentPath}/${folderName}`;

    navigate({
      search: (prev) => ({ ...prev, path: newPath }),
    });
  };

  if (isLoading) {
    return (
      <div className="@container mx-auto mt-2 flex h-full w-full max-w-screen-xl flex-col gap-2 overflow-hidden">
        <FileBreadcrumbs
          currentPath={currentPath}
          setCurrentPath={setCurrentPath}
          navigate={navigate}
        />
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-gray-500 text-sm dark:text-gray-400">
          No data available. Please rebuild your machine to view the files.
        </p>
      </div>
    );
  }

  return (
    <div className="@container mx-auto mt-2 flex h-full w-full max-w-screen-xl flex-col gap-2 overflow-hidden">
      <FileBreadcrumbs
        currentPath={currentPath}
        setCurrentPath={setCurrentPath}
        navigate={navigate}
      />

      {/* Scrollable container */}
      <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-1 overflow-y-auto">
        <div className="w-full p-4">
          {/* Column headers for list view */}
          <div className="sticky top-0 z-10 flex w-full items-center border-b bg-white px-3 py-2 font-medium text-gray-500 text-sm dark:border-zinc-700/50 dark:bg-zinc-900/50 dark:text-gray-400">
            <div className="flex flex-1 items-center">
              <div className="w-8" /> {/* Space for icon */}
              <div className="flex-1 px-2">Name</div>
              <div className="hidden w-32 text-left lg:block">Size</div>
              <div className="hidden w-32 text-left lg:block">Modified</div>
            </div>
          </div>

          {data.directories.length === 0 && data.files.length === 0 && (
            <div className="flex h-[200px] w-full items-center justify-center text-gray-500 text-sm">
              No files or directories in this location
            </div>
          )}

          {data.directories.map((dirName) => (
            <div
              key={dirName}
              className="group flex w-full items-center border-b px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              <div className="flex flex-1 items-center">
                {/* Icon column */}
                <div className="flex w-8 justify-center">
                  <Folder className="h-4 w-4 text-gray-400" />
                </div>

                {/* Name column */}
                <div className="flex-1 px-2">
                  <button
                    type="button"
                    onClick={() => handleNavigate(dirName)}
                    className="block w-full truncate text-left text-sm hover:underline"
                  >
                    {dirName}
                  </button>
                </div>

                {/* Size column */}
                <div className="hidden w-32 text-left text-muted-foreground text-xs lg:block">
                  -
                </div>

                {/* Time column */}
                <div className="hidden w-32 text-left text-muted-foreground text-xs lg:block">
                  -
                </div>
              </div>
            </div>
          ))}

          {data.files.map((fileName) => {
            const fileInfo = data.contents[fileName] as FileItem;
            return (
              <div
                key={fileName}
                className="group flex w-full items-center border-b px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800"
              >
                <div className="flex flex-1 items-center">
                  {/* Icon column */}
                  <div className="flex w-8 justify-center">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>

                  {/* Name column */}
                  <div className="flex-1 px-2">
                    <div className="max-w-[300px] truncate text-sm">
                      {fileName}
                    </div>
                  </div>

                  {/* Size column */}
                  <div className="hidden w-32 text-left text-muted-foreground text-xs lg:block">
                    {formatFileSize(fileInfo.size)}
                  </div>

                  {/* Time column */}
                  <div className="hidden w-32 text-left text-muted-foreground text-xs lg:block">
                    {new Date(
                      fileInfo.last_modified * 1000,
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
