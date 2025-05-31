"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import "./cal-init";

import { useCurrentPlan } from "@/hooks/use-current-plan";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import Calendar from "./Cal";

async function submitOnboardingForm(prevState: any, formData: FormData) {
  try {
    const result = await api({
      url: "form/onboarding",
      init: {
        method: "POST",
        body: JSON.stringify({
          inputs: Object.fromEntries(formData),
        }),
      },
    });

    return {
      success: true,
      formSubmitted: true,
      callBooked: false,
      threadId: result.threadId || null,
    };
  } catch (error) {
    return {
      success: false,
      formSubmitted: false,
      callBooked: false,
      threadId: null,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export function OnboardingCall() {
  const posthog = usePostHog();
  const sub = useCurrentPlan();
  const route = useRouter();

  useEffect(() => {
    posthog.capture("pricing_dialog:open");
  }, []);

  return (
    <div className="inset-0 z-[1] w-full bg-white">
      <div className="flex scroll-m-6 flex-col items-center justify-start pt-10">
        <h1 className="mb-4 text-center font-bold">
          <span className="inline-flex animate-background-shine bg-[length:250%_100%] bg-[linear-gradient(110deg,#1e293b,45%,#939393,55%,#1e293b)] bg-clip-text pb-2 text-5xl text-transparent sm:text-6xl md:text-5xl">
            Book a demo with us
          </span>
        </h1>
        <p className="text-center text-gray-600 text-lg">
          We will get back to you within 1 hour.
        </p>
        <div className="mt-6 w-full">
          <BookcallForm />
        </div>
      </div>
    </div>
  );
}

export function BookcallForm() {
  const [state, formAction] = useActionState(submitOnboardingForm, {
    success: false,
    formSubmitted: false,
    callBooked: false,
    threadId: null,
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [callBooked, setCallBookedLocally] = useState(false);

  // const { data } = useSWR("call_booked", checkFormSubmission);

  const { data } = useQuery<any>({
    queryKey: ["form", "onboarding"],
  });

  useEffect(() => {
    if (data && !data?.call_booked) {
      setShowCalendar(true);
      setCallBookedLocally(true);
    }
    if (data?.call_booked) {
      setShowCalendar(false);
      setCallBookedLocally(true);
    }
  }, [data]);

  useEffect(() => {
    if (state.success) {
      setShowCalendar(true);
    }
  }, [state.success]);

  if (showCalendar) {
    return (
      <Calendar
        onBookingSuccessful={async () => {
          setShowCalendar(false);
          await api({
            url: "form/onboarding",
            init: {
              method: "PATCH",
              body: JSON.stringify({
                call_booked: true,
              }),
            },
          });
          setCallBookedLocally(true);
        }}
      />
    );
  }

  if (callBooked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center rounded-lg bg-gradient-to-r from-gray-700 to-gray-900 p-8 text-white shadow-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <svg
            className="mb-4 h-12 w-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-2 font-semibold text-2xl text-gray-100"
        >
          Thank you for booking a call
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6 text-center text-gray-300"
        >
          See you soon on the introduction call!
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant="linkHover2"
            onClick={() => setShowCalendar(true)}
            className="text-gray-300 transition-colors after:bg-white hover:text-white"
          >
            Need to book another call?
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <form action={formAction} className="mx-auto max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="block text-left">
              First name
            </Label>
            <Input id="firstName" name="firstName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="block text-left">
              Last name
            </Label>
            <Input id="lastName" name="lastName" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="workEmail" className="block text-left">
            Work email address
          </Label>
          <Input id="workEmail" name="workEmail" type="email" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="block text-left">
              Company name
            </Label>
            <Input id="companyName" name="companyName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle" className="block text-left">
              Job Title
            </Label>
            <Input id="jobTitle" name="jobTitle" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="companySize" className="block text-left">
            Company size
          </Label>
          <Select name="companySize" required>
            <SelectTrigger>
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="<10">&lt; 10</SelectItem>
              <SelectItem value="10-100">10 - 100</SelectItem>
              <SelectItem value=">100">&gt; 100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="block text-left">
            Do you have a ComfyUI workflow to run?
          </Label>
          <RadioGroup name="hasWorkflow" required>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id="hasWorkflow-yes" />
              <Label htmlFor="hasWorkflow-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id="hasWorkflow-no" />
              <Label htmlFor="hasWorkflow-no">No</Label>
            </div>
          </RadioGroup>
        </div>
        <FormButton />
      </form>
    </>
  );
}

function FormButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" isLoading={pending}>
      Submit
    </Button>
  );
}
