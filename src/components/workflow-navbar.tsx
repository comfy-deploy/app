import { Link } from "@tanstack/react-router";

export function WorkflowNavbar() {
  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between px-4">
      <div className="flex items-center">
        <Link href="/" className="drop-shadow-md">
          <img
            src="/icon-light.svg"
            alt="comfydeploy"
            className="h-8 w-8 dark:hidden"
          />
          <img
            src="/icon.svg"
            alt="comfydeploy"
            className="hidden h-8 w-8 dark:block"
          />
        </Link>
      </div>

      <div className="flex items-center">
        {/* Center content */}
        Center Section
      </div>

      <div className="flex items-center">
        {/* Right content */}
        Right Section
      </div>
    </div>
  );
}
