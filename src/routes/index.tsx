import { RedirectToSignIn, SignedIn, useAuth } from "@clerk/clerk-react";
import { SignInButton } from "@clerk/clerk-react";
import { SignedOut } from "@clerk/clerk-react";
import { UserButton } from "@clerk/clerk-react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import * as React from "react";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isLoaded) {
      router.navigate({
        to: "/workflows",
      });
    }
  }, [auth.isLoaded, router]);

  return (
    <div className="p-2">
      <SignedOut>
        <RedirectToSignIn redirectUrl={"/"} />
      </SignedOut>
    </div>
  );
}
