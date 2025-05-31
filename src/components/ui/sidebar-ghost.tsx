import { cn } from "@/lib/utils";

interface SidebarGhostProps {
  className?: string;
}

export function SidebarGhost({ className }: SidebarGhostProps) {
  return (
    <div
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "12rem",
        } as React.CSSProperties
      }
      className={cn(
        "border-gray-200 border-r duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex-shrink-0 group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] group-data-[side=left]:border-r group-data-[side=right]:border-l h-svh hidden inset-y-0 left-0 md:flex transition-[left,right,width] w-64 z-10",
        className,
      )}
    >
      <div
        data-sidebar="sidebar"
        className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
      >
        {/* Header */}
        <div data-sidebar="header" className="flex flex-col gap-2 p-2">
          <div className="flex flex-row items-start justify-between pt-2.5">
            {/* Logo skeleton */}
            <div className="ml-1 h-7 w-7 animate-pulse rounded bg-gray-200" />

            <div className="flex items-center gap-1">
              {/* Business badge skeleton */}
              <div className="h-5 w-16 animate-pulse rounded-md bg-gray-200" />

              {/* User button skeleton */}
              <div className="flex h-full w-10 items-center justify-center">
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
              </div>
            </div>
          </div>

          {/* Organization switcher skeleton */}
          <div className="mt-1 flex items-center justify-center gap-0 rounded-[8px] bg-gray-100">
            <div className="flex min-h-[44px] w-full items-center justify-center">
              <div className="flex w-full max-w-[221px] items-center gap-2 p-2 md:max-w-[190px]">
                <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200" />
                <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-3 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
            <div className="flex h-full items-center justify-center rounded-r-[8px] bg-gray-200/40 px-4">
              <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          data-sidebar="content"
          className="flex flex-1 flex-col gap-0 group-data-[collapsible=icon]:overflow-hidden min-h-0 overflow-auto scrollbar scrollbar-thumb-gray-200 scrollbar-track-transparent"
        >
          {/* <div id="sidebar-panel" /> */}

          {/* Main menu group */}
          <div
            data-sidebar="group"
            className="relative flex w-full min-w-0 flex-col p-2 pt-0"
          >
            <div data-sidebar="group-content" className="w-full text-sm">
              <ul
                data-sidebar="menu"
                className="flex w-full min-w-0 flex-col gap-1"
              >
                {/* Menu items skeleton */}
                {[
                  { hasIndicator: true, id: "workflows" },
                  { hasPanel: true, id: "machines" },
                  { hasPanel: true, id: "models" },
                  { id: "assets" },
                ].map((item) => (
                  <li
                    key={item.id}
                    data-sidebar="menu-item"
                    className="group/menu-item relative"
                  >
                    {item.hasIndicator && (
                      <div className="absolute bg-primary h-[20px] left-0 rounded-r-full top-[5px] w-[2px] z-10" />
                    )}
                    <div className="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2">
                      <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 flex-1 animate-pulse rounded bg-gray-200" />
                    </div>
                    {item.hasPanel && (
                      <div className="h-0" id={`sidebar-panel-${item.id}`} />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Account group */}
          <div
            data-sidebar="group"
            className="relative flex w-full min-w-0 flex-col p-2"
          >
            {/* Group label skeleton */}
            <div className="duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 h-8 items-center px-2 rounded-md shrink-0 transition-[margin,opacity]">
              <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
            </div>

            <div data-sidebar="group-content" className="w-full text-sm">
              <ul
                data-sidebar="menu"
                className="flex w-full min-w-0 flex-col gap-1"
              >
                {/* Account menu items skeleton */}
                {["settings", "api-keys", "usage", "plan"].map((item) => (
                  <li
                    key={item}
                    data-sidebar="menu-item"
                    className="group/menu-item relative"
                  >
                    <div className="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2">
                      <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 flex-1 animate-pulse rounded bg-gray-200" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          data-sidebar="footer"
          className="flex flex-col gap-2 justify-center p-2 pb-4 w-full"
        >
          {/* <div id="sidebar-panel-footer" /> */}

          {/* Footer links skeleton */}
          <div className="grid grid-cols-2 gap-2 px-2">
            {["docs", "discord", "demo", "github", "blog", "support"].map(
              (item) => (
                <div
                  key={item}
                  className="flex w-full flex-row items-center gap-2 pr-2"
                >
                  <div className="h-3 w-3 animate-pulse rounded bg-gray-200" />
                  <div className="h-2 flex-1 animate-pulse rounded bg-gray-200" />
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
