import {
  Link,
  useLocation,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useSidebar } from "./ui/sidebar";
import { OrganizationSwitcher, UserButton } from "@clerk/clerk-react";
import { UserMenu } from "./app-sidebar";
import { Button } from "./ui/button";
import {
  ArrowLeftIcon,
  CircleGauge,
  CreditCard,
  Database,
  Folder,
  KeyRound,
  LineChart,
  type LucideIcon,
  MenuIcon,
  Monitor,
  Server,
  Settings,
  Workflow,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BreadcrumbSeparator } from "./ui/breadcrumb";
import { useEffect, useRef, useState } from "react";

export function NavBar() {
  const { toggleSidebar } = useSidebar();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const router = useRouter();

  const isRootLevel = pathname.split("/").filter(Boolean).length === 1;
  const previousIsRootLevel = useRef(isRootLevel);
  const previousPathname = useRef(pathname);

  const [currentRootLevel, setCurrentRootLevel] = useState("/");

  useEffect(() => {
    if (!isRootLevel && previousIsRootLevel.current) {
      setCurrentRootLevel(previousPathname.current);
    }
    previousIsRootLevel.current = isRootLevel;
    previousPathname.current = pathname;
  }, [isRootLevel, pathname]);

  return (
    <>
      <div className="sticky top-2 z-50 my-2 w-full">
        <nav className="flex w-full items-center justify-between ">
          <div
            className={cn(
              "mx-auto h-[46px] w-full max-w-[520px] rounded-lg border border-gray-200 bg-white",
              !isRootLevel && "max-w-[520px]",
              !isRootLevel && "shadow-md",
            )}
          >
            <div className="flex h-full w-full items-center gap-1 pr-2 pl-1">
              {!isRootLevel && (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.history.push(currentRootLevel)}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
              {isRootLevel && (
                <div className="flex w-full justify-between gap-1">
                  <div className="flex w-full items-center gap-1">
                    <NavItem
                      to="/workflows"
                      label="Workflows"
                      icon={Workflow}
                    />
                    <NavItem to="/home" label="Workspace" icon={Monitor} />
                    <NavItem
                      to="/deployments"
                      label="Deployments"
                      icon={Server}
                    />
                    <NavItem to="/storage" label="Storage" icon={Database} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                      >
                        <MenuIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {/* <DropdownMenuLabel>My Account</DropdownMenuLabel> */}
                      {/* <DropdownMenuSeparator /> */}
                      <DropdownMenuItem asChild>
                        <Link
                          to="/machines"
                          className="flex items-center gap-2"
                        >
                          <Server className="h-4 w-4" /> Machines
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/assets" className="flex items-center gap-2">
                          <Folder className="h-4 w-4" /> Assets
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/settings"
                          className="flex items-center gap-2"
                        >
                          <Settings className="h-4 w-4" /> Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/api-keys"
                          className="flex items-center gap-2"
                        >
                          <KeyRound className="h-4 w-4" /> API Keys
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/usage" className="flex items-center gap-2">
                          <CircleGauge className="h-4 w-4" /> Usage
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/analytics"
                          className="flex items-center gap-2"
                        >
                          <LineChart className="h-4 w-4" /> Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/pricing" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" /> Plan
                        </Link>
                      </DropdownMenuItem>
                      {/* <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuItem>Subscription</DropdownMenuItem> */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {!isRootLevel && (
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                  id="nav-bar-items"
                />
              )}
              {/* </AnimatePresence> */}
            </div>
          </div>

          <div id="nav-bar-items-right" />
        </nav>
      </div>

      <div
        className={cn(
          "absolute top-0 left-2 z-50 mx-auto my-2 hidden h-[40px] w-fit rounded-lg border border-gray-200 bg-white md:block",
        )}
      >
        <div className="flex h-full w-full items-center gap-1">
          <UserMenu />
          /
          <OrganizationSwitcher />
        </div>
      </div>
    </>
  );
}

export function NavItem({
  to,
  label,
  params,
  icon: Icon,
}: {
  to: string;
  label?: string;
  icon?: LucideIcon;
  params?: Record<string, string>;
}) {
  return (
    <Link
      to={to}
      params={params}
      activeProps={{
        className: "bg-gray-100 border-b-2 border-gray-200",
      }}
      inactiveProps={{
        className: "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
      }}
      className="flex items-center gap-1 rounded-md px-3 py-1 font-medium text-sm transition-all hover:bg-gray-100"
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Link>
  );
}
