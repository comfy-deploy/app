import { Icon as IconWord } from "@/components/icon-word";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { OrganizationSwitcher, useClerk } from "@clerk/clerk-react";
import {
  Link,
  useLocation,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { delay, motion } from "framer-motion";
import {
  ArrowLeftIcon,
  ChevronRight,
  CircleGauge,
  Code,
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
  Sparkles,
  Workflow,
} from "lucide-react";
import { BookOpen, Github, PlayCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UserMenu } from "./app-sidebar";
import { ShineBorder } from "./magicui/shine-border";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { useSidebar } from "./ui/sidebar";

export function NavBar() {
  const { toggleSidebar } = useSidebar();
  const { pathname } = useLocation();
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
      <div className="sticky top-2 z-50 my-2 w-full ">
        <nav className="flex w-full items-center justify-between px-2 lg:px-0">
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
                    {/* <NavItem to="/home" label="Workspace" icon={Monitor} /> */}
                    <NavItem to="/machines" label="Machines" icon={Server} />
                    <NavItem
                      to="/deployments"
                      label="Deployments"
                      icon={Code}
                    />
                    <NavItem to="/models" label="Models" icon={Database} />
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
                      <DropdownMenuItem asChild>
                        <Link to="/home" className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" /> Workspace{" "}
                          <Badge variant="fuchsia">Beta</Badge>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          to="/featured"
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="h-4 w-4" /> Featured
                          <Badge variant="fuchsia">Beta</Badge>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/assets" className="flex items-center gap-2">
                          <Folder className="h-4 w-4" /> Assets
                          <Badge variant="fuchsia">Beta</Badge>
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
                        <Link
                          to="/analytics"
                          className="flex items-center gap-2"
                        >
                          <LineChart className="h-4 w-4" /> Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/usage" className="flex items-center gap-2">
                          <CircleGauge className="h-4 w-4" /> Usage
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/pricing" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" /> Plan
                        </Link>
                      </DropdownMenuItem>
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
            </div>
          </div>

          <div
            id="nav-bar-items-right"
            className="absolute top-1 right-0 mr-2"
          />
        </nav>
      </div>

      <div
        className={cn(
          "absolute top-0 left-2 z-50 mx-auto my-2 hidden h-[40px] w-fit rounded-lg border border-gray-200 bg-white lg:block",
        )}
      >
        <div className="flex h-full w-full items-center gap-1">
          <UserMenu />
          /
          <OrganizationSwitcher />
        </div>
      </div>

      <div
        className={cn(
          "absolute top-0 right-2 z-50 mx-auto my-2 hidden h-[40px] w-fit rounded-lg border border-gray-200 bg-white lg:block",
        )}
      >
        <div className="flex h-full w-full items-center gap-4 px-4">
          <a
            href="https://www.comfydeploy.com/docs/v2/introduction"
            className="flex items-center gap-2 text-gray-600 text-sm hover:text-gray-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen className="h-4 w-4" />
            Docs
          </a>
          <a
            href="https://discord.com/invite/c222Cwyget"
            className="flex items-center gap-2 text-gray-600 text-sm hover:text-gray-900"
            target="_blank"
            rel="noopener noreferrer"
          >
            <DiscordIcon />
            Discord
          </a>
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
      {label && <span className="hidden md:inline">{label}</span>}
    </Link>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Delay between each item
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 2 },
  show: { opacity: 1, y: 0 },
};

export function SignedOutNavBar() {
  const clerk = useClerk();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60"
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-2 py-[9px]">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <IconWord />

          {/* Main Navigation */}
          <NavigationMenu>
            <motion.div variants={container} initial="hidden" animate="show">
              <NavigationMenuList>
                {/* Blog */}
                <motion.div variants={item}>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                      href="https://comfydeploy.com/blog"
                    >
                      Blog
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </motion.div>

                {/* Nodes */}
                <motion.div variants={item}>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                      href="https://comfydeploy.com/ai"
                    >
                      Nodes
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </motion.div>

                {/* Developers Dropdown */}
                <motion.div variants={item}>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Developers</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[250px] gap-1 p-2">
                        <li>
                          <NavigationMenuLink asChild>
                            <a
                              href="https://comfydeploy.com/docs"
                              className="flex items-center gap-4 rounded-md p-2 hover:bg-gray-50"
                            >
                              <BookOpen className="h-4 w-4 shrink-0" />
                              <div>
                                <div className="font-medium text-sm">
                                  Documentation
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  Start integrating our APIs
                                </p>
                              </div>
                            </a>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink asChild>
                            <a
                              href="https://demo2.comfydeploy.com/"
                              className="flex items-center gap-4 rounded-md p-2 hover:bg-gray-50"
                            >
                              <PlayCircle className="h-4 w-4 shrink-0" />
                              <div>
                                <div className="font-medium text-sm">Demo</div>
                                <p className="text-muted-foreground text-xs">
                                  See it in action
                                </p>
                              </div>
                            </a>
                          </NavigationMenuLink>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </motion.div>

                {/* Community Dropdown */}
                <motion.div variants={item}>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Community</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[250px] gap-2 p-2">
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              to="https://github.com/BennyKok/comfyui-deploy"
                              className="flex items-center gap-4 rounded-md p-2 hover:bg-gray-50"
                            >
                              <Github className="h-4 w-4 shrink-0" />
                              <div>
                                <div className="font-medium text-sm">
                                  GitHub
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  Check our open source work
                                </p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              to="https://discord.com/invite/c222Cwyget"
                              rel="noopener noreferrer"
                              target="_blank"
                              className="flex items-center gap-4 rounded-md p-2 hover:bg-gray-50"
                            >
                              <DiscordIcon />
                              <div>
                                <div className="font-medium text-sm">
                                  Discord
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  Join our community
                                </p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </motion.div>
              </NavigationMenuList>
            </motion.div>
          </NavigationMenu>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              clerk.openSignIn({
                fallbackRedirectUrl: window.location.href,
              });
            }}
          >
            Sign In
          </Button>
          <ShineBorder
            className="!min-h-0 !min-w-0 p-[2px]"
            borderRadius={10}
            borderWidth={2}
            color="gray"
          >
            <Button
              variant="expandIcon"
              Icon={ChevronRight}
              iconPlacement="right"
              className="rounded-[8px]"
              onClick={() => {
                clerk.openSignIn({
                  fallbackRedirectUrl: "/onboarding-call",
                });
              }}
            >
              Book a Call
            </Button>
          </ShineBorder>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1200px]">
        <Separator className="opacity-40" />
      </div>
    </motion.div>
  );
}

function DiscordIcon() {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="18"
      height="18"
      viewBox="0 0 50 50"
    >
      <path
        stroke="currentColor" // Use current color or specify a color
        strokeWidth="1" // Adjust this value to make lines thicker
        d="M 18.90625 7 C 18.90625 7 12.539063 7.4375 8.375 10.78125 C 8.355469 10.789063 8.332031 10.800781 8.3125 10.8125 C 7.589844 11.480469 7.046875 12.515625 6.375 14 C 5.703125 15.484375 4.992188 17.394531 4.34375 19.53125 C 3.050781 23.808594 2 29.058594 2 34 C 1.996094 34.175781 2.039063 34.347656 2.125 34.5 C 3.585938 37.066406 6.273438 38.617188 8.78125 39.59375 C 11.289063 40.570313 13.605469 40.960938 14.78125 41 C 15.113281 41.011719 15.429688 40.859375 15.625 40.59375 L 18.0625 37.21875 C 20.027344 37.683594 22.332031 38 25 38 C 27.667969 38 29.972656 37.683594 31.9375 37.21875 L 34.375 40.59375 C 34.570313 40.859375 34.886719 41.011719 35.21875 41 C 36.394531 40.960938 38.710938 40.570313 41.21875 39.59375 C 43.726563 38.617188 46.414063 37.066406 47.875 34.5 C 47.960938 34.347656 48.003906 34.175781 48 34 C 48 29.058594 46.949219 23.808594 45.65625 19.53125 C 45.007813 17.394531 44.296875 15.484375 43.625 14 C 42.953125 12.515625 42.410156 11.480469 41.6875 10.8125 C 41.667969 10.800781 41.644531 10.789063 41.625 10.78125 C 37.460938 7.4375 31.09375 7 31.09375 7 C 31.019531 6.992188 30.949219 6.992188 30.875 7 C 30.527344 7.046875 30.234375 7.273438 30.09375 7.59375 C 30.09375 7.59375 29.753906 8.339844 29.53125 9.40625 C 27.582031 9.09375 25.941406 9 25 9 C 24.058594 9 22.417969 9.09375 20.46875 9.40625 C 20.246094 8.339844 19.90625 7.59375 19.90625 7.59375 C 19.734375 7.203125 19.332031 6.964844 18.90625 7 Z M 18.28125 9.15625 C 18.355469 9.359375 18.40625 9.550781 18.46875 9.78125 C 16.214844 10.304688 13.746094 11.160156 11.4375 12.59375 C 11.074219 12.746094 10.835938 13.097656 10.824219 13.492188 C 10.816406 13.882813 11.039063 14.246094 11.390625 14.417969 C 11.746094 14.585938 12.167969 14.535156 12.46875 14.28125 C 17.101563 11.410156 22.996094 11 25 11 C 27.003906 11 32.898438 11.410156 37.53125 14.28125 C 37.832031 14.535156 38.253906 14.585938 38.609375 14.417969 C 38.960938 14.246094 39.183594 13.882813 39.175781 13.492188 C 39.164063 13.097656 38.925781 12.746094 38.5625 12.59375 C 36.253906 11.160156 33.785156 10.304688 31.53125 9.78125 C 31.59375 9.550781 31.644531 9.359375 31.71875 9.15625 C 32.859375 9.296875 37.292969 9.894531 40.3125 12.28125 C 40.507813 12.460938 41.1875 13.460938 41.8125 14.84375 C 42.4375 16.226563 43.09375 18.027344 43.71875 20.09375 C 44.9375 24.125 45.921875 29.097656 45.96875 33.65625 C 44.832031 35.496094 42.699219 36.863281 40.5 37.71875 C 38.5 38.496094 36.632813 38.84375 35.65625 38.9375 L 33.96875 36.65625 C 34.828125 36.378906 35.601563 36.078125 36.28125 35.78125 C 38.804688 34.671875 40.15625 33.5 40.15625 33.5 C 40.570313 33.128906 40.605469 32.492188 40.234375 32.078125 C 39.863281 31.664063 39.226563 31.628906 38.8125 32 C 38.8125 32 37.765625 32.957031 35.46875 33.96875 C 34.625 34.339844 33.601563 34.707031 32.4375 35.03125 C 32.167969 35 31.898438 35.078125 31.6875 35.25 C 29.824219 35.703125 27.609375 36 25 36 C 22.371094 36 20.152344 35.675781 18.28125 35.21875 C 18.070313 35.078125 17.8125 35.019531 17.5625 35.0625 C 16.394531 34.738281 15.378906 34.339844 14.53125 33.96875 C 12.234375 32.957031 11.1875 32 11.1875 32 C 10.960938 31.789063 10.648438 31.699219 10.34375 31.75 C 9.957031 31.808594 9.636719 32.085938 9.53125 32.464844 C 9.421875 32.839844 9.546875 33.246094 9.84375 33.5 C 9.84375 33.5 11.195313 34.671875 13.71875 35.78125 C 14.398438 36.078125 15.171875 36.378906 16.03125 36.65625 L 14.34375 38.9375 C 13.367188 38.84375 11.5 38.496094 9.5 37.71875 C 7.300781 36.863281 5.167969 35.496094 4.03125 33.65625 C 4.078125 29.097656 5.0625 24.125 6.28125 20.09375 C 6.90625 18.027344 7.5625 16.226563 8.1875 14.84375 C 8.8125 13.460938 9.492188 12.460938 9.6875 12.28125 C 12.707031 9.894531 17.140625 9.296875 18.28125 9.15625 Z M 18.5 21 C 15.949219 21 14 23.316406 14 26 C 14 28.683594 15.949219 31 18.5 31 C 21.050781 31 23 28.683594 23 26 C 23 23.316406 21.050781 21 18.5 21 Z M 31.5 21 C 28.949219 21 27 23.316406 27 26 C 27 28.683594 28.949219 31 31.5 31 C 34.050781 31 36 28.683594 36 26 C 36 23.316406 34.050781 21 31.5 21 Z M 18.5 23 C 19.816406 23 21 24.265625 21 26 C 21 27.734375 19.816406 29 18.5 29 C 17.183594 29 16 27.734375 16 26 C 16 24.265625 17.183594 23 18.5 23 Z M 31.5 23 C 32.816406 23 34 24.265625 34 26 C 34 27.734375 32.816406 29 31.5 29 C 30.183594 29 29 27.734375 29 26 C 29 24.265625 30.183594 23 31.5 23 Z"
      />
    </svg>
  );
}
