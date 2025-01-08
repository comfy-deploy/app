import { useIsAdminOnly } from "@/components/permissions";
import { openAddModelModal } from "@/components/storage/model-list-view";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { LoadingIcon } from "@/components/ui/custom/loading-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentPlan } from "@/hooks/use-current-plan";
import { useCurrentWorkflow } from "@/hooks/use-current-workflow";
import { useMachine } from "@/hooks/use-machine";
import { getRelativeTime } from "@/lib/get-relative-time";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { CommandLoading } from "cmdk";
import {
  ArrowLeft,
  ArrowRight,
  Book,
  Box,
  CircleGauge,
  CreditCard,
  Database,
  Folder,
  Github,
  Key,
  LineChart,
  MessageCircle,
  Plus,
  Rss,
  Server,
  Settings,
  Workflow,
} from "lucide-react";
import { type ReactElement, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

// ------------------Props-------------------

interface ComfyCommandProps {
  navigate: (args: any) => void;
  setOpen: (open: boolean) => void;
  setCurrentPageName?: (currentPageName: string) => void;
  search?: string;
  onRefetchingChange?: (isRefetching: boolean) => void;
}

interface workflowSchema {
  id: string;
  name: string;
  created_at: string;
}

interface machineSchema {
  id: string;
  name: string;
  updated_at: string;
}

// ------------------Component-------------------

export function ComfyCommand() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPageName, setCurrentPageName] = useState<string | null>(null);
  const [isAnyRefetching, setIsAnyRefetching] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!isDetailPage()) {
      setCurrentPageName?.(null);
    }
  }, [router.state.location.pathname]);

  // Helper function to check if we're in a detail page
  const isDetailPage = () => {
    const path = router.state.location.pathname;
    return (
      path.match(/^\/workflows\/[^/]+/) || path.match(/^\/machines\/[^/]+/)
    );
  };

  // Helper function to check if we're in a workflow detail page
  const isWorkflowDetailPage = () => {
    const path = router.state.location.pathname;
    return path.match(/^\/workflows\/[^/]+/);
  };

  // Helper function to check if we're in a machine detail page
  const isMachineDetailPage = () => {
    const path = router.state.location.pathname;
    return path.match(/^\/machines\/[^/]+/);
  };

  // Create a combined state handler
  const handleRefetchingState = (isRefetching: boolean) => {
    setIsAnyRefetching(isRefetching);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      shouldFilter={!isAnyRefetching || Boolean(isDetailPage())}
    >
      {currentPageName && (
        <div className="mx-4 mt-4 mb-2 w-fit max-w-[calc(100%-2rem)] rounded-sm bg-gray-100 px-2 py-1 text-xs">
          <span className="block truncate">{currentPageName}</span>
        </div>
      )}
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={(value) => setSearch(value)}
      />
      <CommandList>
        <CommandEmpty>
          {isAnyRefetching ? (
            <div className="flex flex-col gap-1 px-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton
                  key={`skeleton-${i}`}
                  className="h-[47px]"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          ) : (
            "No results found."
          )}
        </CommandEmpty>

        {isWorkflowDetailPage() && (
          <WorkflowActionCommand
            navigate={navigate}
            setOpen={setOpen}
            setCurrentPageName={setCurrentPageName}
          />
        )}

        {isMachineDetailPage() && (
          <MachineActionCommand
            navigate={navigate}
            setOpen={setOpen}
            setCurrentPageName={setCurrentPageName}
          />
        )}

        {!isDetailPage() &&
          [
            {
              Component: WorkflowPartCommand,
              path: "/workflows",
            },
            {
              Component: MachinePartCommand,
              path: "/machines",
            },
            {
              Component: StoragePartCommand,
              path: "/storage",
            },
          ]
            .sort((a, b) => {
              const currentPath = router.state.location.pathname;
              return (
                (currentPath.startsWith(a.path) ? 0 : 1) -
                (currentPath.startsWith(b.path) ? 0 : 1)
              );
            })
            .reduce((acc: ReactElement[], { Component }, index) => {
              const componentEl = (
                <Component
                  key={Component.name}
                  navigate={navigate}
                  setOpen={setOpen}
                  search={search}
                  onRefetchingChange={handleRefetchingState}
                />
              );

              if (index === 1) {
                acc.push(
                  <NavigationPartCommand
                    key="nav"
                    navigate={navigate}
                    setOpen={setOpen}
                  />,
                );
              }
              acc.push(componentEl);
              return acc;
            }, [])}

        {isDetailPage() && (
          <NavigationPartCommand navigate={navigate} setOpen={setOpen} />
        )}
        <AccountPartCommand navigate={navigate} setOpen={setOpen} />
        <LinkPartCommand navigate={navigate} setOpen={setOpen} />
      </CommandList>
    </CommandDialog>
  );
}

function NavigationPartCommand({ navigate, setOpen }: ComfyCommandProps) {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <CommandGroup heading="Navigation">
      {!currentPath.startsWith("/workflows/") && (
        <CommandItem
          onSelect={() => {
            navigate({ to: "/workflows" });
            setOpen(false);
          }}
        >
          <Workflow className="!h-4 !w-4 mr-2" />
          <span>Workflows</span>
        </CommandItem>
      )}
      {!currentPath.startsWith("/machines/") && (
        <CommandItem
          onSelect={() => {
            navigate({
              to: "/machines",
              search: { view: undefined },
            });
            setOpen(false);
          }}
        >
          <Server className="!h-4 !w-4 mr-2" />
          <span>Machines</span>
        </CommandItem>
      )}
      <CommandItem
        onSelect={() => {
          navigate({
            to: "/storage",
          });
          setOpen(false);
        }}
      >
        <Database className="!h-4 !w-4 mr-2" />
        <span>Storage</span>
      </CommandItem>
      <CommandItem
        onSelect={() => {
          navigate({
            to: "/assets",
          });
          setOpen(false);
        }}
      >
        <Folder className="!h-4 !w-4 mr-2" />
        <span>Assets</span>
      </CommandItem>
    </CommandGroup>
  );
}

function AccountPartCommand({ navigate, setOpen }: ComfyCommandProps) {
  const sub = useCurrentPlan();
  const isAdminOnly = useIsAdminOnly();

  return (
    <CommandGroup heading="Account">
      <CommandItem
        onSelect={() => {
          navigate({
            to: "/settings",
          });
          setOpen(false);
        }}
      >
        <Settings className="!h-4 !w-4 mr-2" />
        <span>Settings</span>
      </CommandItem>
      <CommandItem
        onSelect={() => {
          navigate({
            to: "/api-keys",
          });
          setOpen(false);
        }}
      >
        <Key className="!h-4 !w-4 mr-2" />
        <span>API Keys</span>
      </CommandItem>

      {isAdminOnly && (
        <CommandItem
          onSelect={() => {
            navigate({
              to: "/usage",
            });
            setOpen(false);
          }}
        >
          <CircleGauge className="!h-4 !w-4 mr-2" />
          <span>Usage</span>
        </CommandItem>
      )}

      {sub?.plans && (
        <CommandItem
          onSelect={() => {
            navigate({
              to: "/analytics",
            });
            setOpen(false);
          }}
        >
          <LineChart className="!h-4 !w-4 mr-2" />
          <span>Analytics</span>
        </CommandItem>
      )}

      <CommandItem
        onSelect={() => {
          navigate({
            to: "/pricing",
          });
          setOpen(false);
        }}
      >
        <CreditCard className="!h-4 !w-4 mr-2" />
        <span>Plan</span>
      </CommandItem>
    </CommandGroup>
  );
}

function LinkPartCommand({ navigate, setOpen }: ComfyCommandProps) {
  return (
    <CommandGroup heading="Links">
      <CommandItem
        onSelect={() => {
          window.open("https://docs.comfydeploy.com", "_blank");
          setOpen(false);
        }}
      >
        <Book className="!h-4 !w-4 mr-2" />
        <span>Documentation</span>
      </CommandItem>
      <CommandItem
        onSelect={() => {
          window.open("https://discord.com/invite/c222Cwyget", "_blank");
          setOpen(false);
        }}
      >
        <MessageCircle className="!h-4 !w-4 mr-2" />
        <span>Discord</span>
      </CommandItem>
      <CommandItem
        onSelect={() => {
          window.open("https://demo2.comfydeploy.com", "_blank");
          setOpen(false);
        }}
      >
        <Box className="!h-4 !w-4 mr-2" />
        <span>NextJS Demo</span>
      </CommandItem>
      <CommandItem
        onSelect={() => {
          window.open("https://github.com/BennyKok/comfyui-deploy", "_blank");
          setOpen(false);
        }}
      >
        <Github className="!h-4 !w-4 mr-2" />
        <span>GitHub</span>
      </CommandItem>
      <CommandItem
        onSelect={() => {
          window.open("https://www.comfydeploy.com/blog", "_blank");
          setOpen(false);
        }}
      >
        <Rss className="!h-4 !w-4 mr-2" />
        <span>Blog</span>
      </CommandItem>
    </CommandGroup>
  );
}

function WorkflowActionCommand({
  navigate,
  setOpen,
  setCurrentPageName,
}: ComfyCommandProps) {
  // Get the current workflow ID from the URL
  const router = useRouter();
  const workflowId = router.state.location.pathname.split("/")[2];
  const { workflow } = useCurrentWorkflow(workflowId);

  useEffect(() => {
    if (workflow?.name && workflow?.versions?.[0]?.version) {
      setCurrentPageName?.(
        `${workflow?.name} - v${workflow?.versions?.[0]?.version}`,
      );
    }
  }, [workflow, setCurrentPageName]);

  return (
    <>
      <CommandGroup heading="Actions">
        <CommandItem
          onSelect={() => {
            navigate({ to: `/workflows/${workflowId}/workspace` });
            setOpen(false);
          }}
        >
          <ArrowRight className="!h-4 !w-4 mr-2" />
          <span>To Workspace...</span>
        </CommandItem>
        <CommandItem
          onSelect={() => {
            navigate({ to: `/workflows/${workflowId}/requests` });
            setOpen(false);
          }}
        >
          <ArrowRight className="!h-4 !w-4 mr-2" />
          <span>To Requests...</span>
        </CommandItem>
        <CommandItem
          onSelect={() => {
            navigate({ to: `/workflows/${workflowId}/containers` });
            setOpen(false);
          }}
        >
          <ArrowRight className="!h-4 !w-4 mr-2" />
          <span>To Containers...</span>
        </CommandItem>
        <CommandItem
          onSelect={() => {
            navigate({ to: `/workflows/${workflowId}/deployment` });
            setOpen(false);
          }}
        >
          <ArrowRight className="!h-4 !w-4 mr-2" />
          <span>To Deployment...</span>
        </CommandItem>
        <CommandItem
          onSelect={() => {
            navigate({ to: `/workflows/${workflowId}/playground` });
            setOpen(false);
          }}
        >
          <ArrowRight className="!h-4 !w-4 mr-2" />
          <span>To Playground...</span>
        </CommandItem>
        <CommandItem
          onSelect={() => {
            navigate({ to: `/workflows/${workflowId}/gallery` });
            setOpen(false);
          }}
        >
          <ArrowRight className="!h-4 !w-4 mr-2" />
          <span>To Gallery...</span>
        </CommandItem>
        <CommandItem
          onSelect={() => {
            navigate({ to: "/workflows" });
            setOpen(false);
          }}
        >
          <ArrowLeft className="!h-4 !w-4 mr-2" />
          <span>Back to Workflows...</span>
        </CommandItem>
      </CommandGroup>
    </>
  );
}

function MachineActionCommand({
  navigate,
  setOpen,
  setCurrentPageName,
}: ComfyCommandProps) {
  // Get the current machine ID from the URL
  const router = useRouter();
  const machineId = router.state.location.pathname.split("/")[2];
  const { data: machine } = useMachine(machineId);

  useEffect(() => {
    if (machine?.name) {
      setCurrentPageName?.(machine?.name);
    }
  }, [machine, setCurrentPageName]);

  return (
    <>
      <CommandGroup heading="Actions">
        <CommandItem
          onSelect={() => {
            navigate({
              to: `/machines/${machineId}`,
              search: { view: "overview" },
            });
            setOpen(false);
          }}
        >
          <ArrowRight className="!h-4 !w-4 mr-2" />
          <span>To Overview...</span>
        </CommandItem>
        <CommandItem
          onSelect={() => {
            navigate({
              to: `/machines/${machineId}`,
              search: { view: "settings" },
            });
            setOpen(false);
          }}
        >
          <ArrowRight className="!h-4 !w-4 mr-2" />
          <span>To Settings...</span>
        </CommandItem>
        <CommandItem
          onSelect={() => {
            navigate({
              to: `/machines/${machineId}`,
              search: { view: "deployments" },
            });
            setOpen(false);
          }}
        >
          <ArrowRight className="!h-4 !w-4 mr-2" />
          <span>To Deployments...</span>
        </CommandItem>
        <CommandItem
          onSelect={() => {
            navigate({
              to: "/machines",
            });
            setOpen(false);
          }}
        >
          <ArrowLeft className="!h-4 !w-4 mr-2" />
          <span>Back to Machines...</span>
        </CommandItem>
      </CommandGroup>
    </>
  );
}

function WorkflowPartCommand({
  navigate,
  setOpen,
  search,
  onRefetchingChange,
}: ComfyCommandProps) {
  const [debouncedSearch] = useDebounce(search, 250);
  const {
    data: workflows,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<workflowSchema[]>({
    queryKey: ["workflows", "all"],
    meta: {
      params: {
        limit: 5,
        search: debouncedSearch ?? "",
      },
    },
    staleTime: 5 * 60 * 1000, // 5 minutes in milliseconds
    gcTime: 5 * 60 * 1000, // 5 minutes in milliseconds
    refetchOnWindowFocus: false,
  });
  const router = useRouter();
  const isWorkflowsPage = router.state.location.pathname === "/workflows";

  useEffect(() => {
    if (onRefetchingChange) {
      onRefetchingChange(isRefetching);
    }
  }, [isRefetching, onRefetchingChange]);

  useEffect(() => {
    refetch();
  }, [debouncedSearch]);

  return (
    <CommandGroup heading="Workflows">
      <CommandItem
        onSelect={() => {
          navigate({
            to: "/workflows",
            search: { view: "import" },
          });
          setOpen(false);
        }}
      >
        <Plus className="!h-4 !w-4 mr-2" />
        <span>Create New Workflow...</span>
        {isWorkflowsPage && (
          <CommandShortcut>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
              C
            </kbd>
          </CommandShortcut>
        )}
      </CommandItem>
      {isLoading && (
        <CommandLoading>
          <div className="flex h-10 items-center justify-center text-muted-foreground">
            <LoadingIcon />
          </div>
        </CommandLoading>
      )}
      {workflows?.map((workflow) => {
        return (
          <CommandItem
            key={workflow.id}
            onSelect={() => {
              navigate({
                to: `/workflows/${workflow.id}/workspace`,
              });
              setOpen(false);
            }}
          >
            <Box className="!h-4 !w-4 mr-2" />
            <div className="flex flex-col leading-snug flex-1 min-w-0">
              <span className="truncate">{workflow.name}</span>
              <span className="font-mono text-[9px] text-muted-foreground">
                {workflow.id}
              </span>
            </div>
            <CommandShortcut className="text-2xs tracking-normal ml-2 flex-shrink-0">
              {getRelativeTime(workflow.created_at)}
            </CommandShortcut>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

function MachinePartCommand({
  navigate,
  setOpen,
  search,
  onRefetchingChange,
}: ComfyCommandProps) {
  const [debouncedSearch] = useDebounce(search, 250);
  const {
    data: machines,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<machineSchema[]>({
    queryKey: ["machines", "all"],
    meta: {
      params: {
        limit: 5,
        search: debouncedSearch ?? "",
      },
    },
    staleTime: 5 * 60 * 1000, // 5 minutes in milliseconds
    gcTime: 5 * 60 * 1000, // 5 minutes in milliseconds
    refetchOnWindowFocus: false,
  });
  const router = useRouter();
  const isMachinesPage = router.state.location.pathname === "/machines";

  useEffect(() => {
    if (onRefetchingChange) {
      onRefetchingChange(isRefetching);
    }
  }, [isRefetching, onRefetchingChange]);

  useEffect(() => {
    refetch();
  }, [debouncedSearch]);

  return (
    <CommandGroup heading="Machines">
      <CommandItem
        onSelect={() => {
          navigate({
            to: "/machines",
            search: { view: "create" },
          });
          setOpen(false);
        }}
      >
        <Plus className="!h-4 !w-4 mr-2" />
        <span>Create Serverless Machine...</span>
        {isMachinesPage && (
          <CommandShortcut>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
              C
            </kbd>
          </CommandShortcut>
        )}
      </CommandItem>
      {isLoading && (
        <CommandLoading>
          <div className="flex h-10 items-center justify-center text-muted-foreground">
            <LoadingIcon />
          </div>
        </CommandLoading>
      )}
      {machines?.map((machine) => {
        return (
          <CommandItem
            key={machine.id}
            onSelect={() => {
              navigate({
                to: `/machines/${machine.id}`,
                search: { view: "overview" },
              });
              setOpen(false);
            }}
          >
            <Server className="!h-4 !w-4 mr-2" />
            <div className="flex flex-col leading-snug flex-1 min-w-0">
              <span className="truncate">{machine.name}</span>
              <span className="font-mono text-[9px] text-muted-foreground">
                {machine.id}
              </span>
            </div>
            <CommandShortcut className="text-2xs tracking-normal ml-2 flex-shrink-0">
              {getRelativeTime(machine.updated_at)}
            </CommandShortcut>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

function StoragePartCommand({ navigate, setOpen }: ComfyCommandProps) {
  const router = useRouter();
  const isStoragePage = router.state.location.pathname === "/storage";

  return (
    <CommandGroup heading="Storage">
      <CommandItem
        onSelect={() => {
          navigate({
            to: "/storage",
          });
          setOpen(false);
          openAddModelModal();
        }}
      >
        <Plus className="!h-4 !w-4 mr-2" />
        <span>Add New Model...</span>
        {isStoragePage && (
          <CommandShortcut>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
              C
            </kbd>
          </CommandShortcut>
        )}
      </CommandItem>
    </CommandGroup>
  );
}
