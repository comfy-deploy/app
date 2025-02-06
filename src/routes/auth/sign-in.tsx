import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SignedIn, SignIn } from "@clerk/clerk-react";
import { SignInButton } from "@clerk/clerk-react";
import { SignedOut } from "@clerk/clerk-react";
import { UserButton } from "@clerk/clerk-react";

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInComponent,
});

function SignInComponent() {
  return (
    <div className="w-full h-full items-center flex justify-center">
      <SignIn waitlistUrl="/waitlist" />
    </div>
  );
}
