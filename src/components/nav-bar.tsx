import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useSidebar } from "./ui/sidebar";
import { OrganizationSwitcher, UserButton } from "@clerk/clerk-react";
import { UserMenu } from "./app-sidebar";
import { Button } from "./ui/button";
import {
  ArrowLeftIcon,
  Database,
  type LucideIcon,
  MenuIcon,
  Monitor,
  Server,
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

export function NavBar() {
  const { toggleSidebar } = useSidebar();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isRootLevel = pathname.split("/").filter(Boolean).length === 1;

  return (
    <>
      <div className="sticky top-2 z-50 my-2 w-full">
        <nav className="flex w-full items-center justify-between ">
          <div
            className={cn(
              "mx-auto h-[46px] w-full max-w-[500px] rounded-lg border border-gray-200 bg-white",
              !isRootLevel && "max-w-[500px]",
              !isRootLevel && "shadow-md",
            )}
          >
            <div className="flex h-full w-full items-center gap-1 pl-1 pr-2">
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
                    onClick={() =>
                      navigate({
                        to: "/",
                      })
                    }
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
              {isRootLevel && (
                <div className="flex w-full justify-between gap-1">
                  <div className="flex w-full items-center gap-1">
                    <NavItem to="/home" label="Workspace" icon={Monitor} />
                    <NavItem
                      to="/workflows"
                      label="Workflows"
                      icon={Workflow}
                    />
                    <NavItem to="/machines" label="Machines" icon={Server} />
                    <NavItem to="/storage" label="Storage" icon={Database} />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                      >
                        <MenuIcon className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {/* <DropdownMenuLabel>My Account</DropdownMenuLabel> */}
                      {/* <DropdownMenuSeparator /> */}
                      <DropdownMenuItem asChild>
                        <Link to="/settings">Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/api-keys">API Keys</Link>
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

function NavItem({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon?: LucideIcon;
}) {
  return (
    <Link
      to={to}
      activeProps={{
        className: "bg-gray-100 border-b-2 border-gray-200",
      }}
      inactiveProps={{
        className: "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
      }}
      className="flex items-center gap-1 rounded-md px-3 py-1 font-medium text-sm hover:bg-gray-100 transition-all"
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Link>
  );
}
