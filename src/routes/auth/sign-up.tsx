import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SignedIn, SignIn, SignUp } from "@clerk/clerk-react";
import { SignInButton } from "@clerk/clerk-react";
import { SignedOut } from "@clerk/clerk-react";
import { UserButton } from "@clerk/clerk-react";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpComponent,
});

function SignUpComponent() {
  return (
    <div className="w-full h-full items-center flex justify-center">
      <SignUp waitlistUrl="/waitlist" />
    </div>
  );
}
