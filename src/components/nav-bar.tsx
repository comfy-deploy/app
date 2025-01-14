import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useSidebar } from "./ui/sidebar";
import { UserButton } from "@clerk/clerk-react";
import { UserMenu } from "./app-sidebar";
import { Button } from "./ui/button";
import { ArrowLeftIcon, MenuIcon } from "lucide-react";
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

export function NavBar() {
  const { toggleSidebar } = useSidebar();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isRootLevel = pathname.split("/").filter(Boolean).length === 1;

  return (
    <div className="sticky top-0 z-50 my-2 w-full">
      <div className="flex w-full items-center justify-center ">
        <nav
          className={cn(
            "mx-auto h-[40px] w-full max-w-[500px] rounded-lg border border-gray-200 bg-white",
            !isRootLevel && "max-w-[1000px]",
          )}
        >
          <div className="flex h-full w-full items-center gap-1 pr-1">
            {/* <AnimatePresence> */}
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
                      to: "..",
                    })
                  }
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
            <motion.div layout transition={{ duration: 0.2 }}>
              <UserMenu />
            </motion.div>
            {isRootLevel && (
              <>
                <NavItem to="/home" label="Workspace" />
                <NavItem to="/workflows" label="Workflows" />
                <NavItem to="/machines" label="Machines" />
                <NavItem to="/storage" label="Storage" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleSidebar}>
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
              </>
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
        </nav>
      </div>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{
        className: "bg-gray-100 border-b-2 border-gray-200",
      }}
      inactiveProps={{
        className: "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
      }}
      className="rounded-md px-3 py-1 font-medium text-sm hover:bg-gray-100 transition-all"
    >
      {label}
    </Link>
  );
}
