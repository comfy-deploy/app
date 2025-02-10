"use client";

import { cn } from "@/lib/utils";
import { motion, type MotionProps, type AnimationProps } from "framer-motion";
import React from "react";

const animationProps = {
  initial: { "--x": "100%" },
  animate: { "--x": "-100%" },
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.99 },
  transition: {
    repeat: Number.POSITIVE_INFINITY,
    repeatType: "loop",
    repeatDelay: 1,
    type: "spring",
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring",
      stiffness: 200,
      damping: 5,
      mass: 0.5,
    },
  },
} as AnimationProps;

interface ShinyButtonProps
  extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps>,
    MotionProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const ShinyButton = React.forwardRef<
  HTMLButtonElement,
  ShinyButtonProps
>(({ children, className, disabled, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      className={cn(
        "relative rounded-lg px-6 py-2 font-medium backdrop-blur-xl transition-shadow duration-300 ease-in-out hover:shadow dark:bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/10%)_0%,transparent_60%)] dark:bg-black dark:hover:shadow-[0_0_20px_hsl(var(--primary)/10%)]",
        className,
      )}
      {...animationProps}
      {...props}
    >
      <span
        className="relative block size-full text-[rgb(0,0,0,65%)] text-sm uppercase tracking-wide dark:font-light dark:text-[rgb(255,255,255,90%)]"
        style={{
          maskImage:
            "linear-gradient(-75deg,hsl(var(--primary)) calc(var(--x) + 20%),transparent calc(var(--x) + 30%),hsl(var(--primary)) calc(var(--x) + 100%))",
        }}
      >
        {children}
      </span>
      <span
        style={{
          mask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
          maskComposite: "exclude",
        }}
        className="absolute inset-0 z-10 block rounded-[inherit] bg-[linear-gradient(-75deg,hsl(var(--primary)/10%)_calc(var(--x)+20%),hsl(var(--primary)/50%)_calc(var(--x)+25%),hsl(var(--primary)/10%)_calc(var(--x)+100%))] p-px"
      />
    </motion.button>
  );
});

ShinyButton.displayName = "ShinyButton";
