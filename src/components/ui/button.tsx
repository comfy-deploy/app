"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";
import type { ReactNode, ForwardedRef, ElementType } from "react";
import { Link } from "@tanstack/react-router";
import { forwardRef, useState, useRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        expandIcon:
          "group relative text-primary-foreground bg-primary hover:bg-primary/90",
        expandIconOutline:
          "group relative border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ringHover:
          "bg-primary text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:ring-2 hover:ring-primary/90 hover:ring-offset-2",
        shine:
          "text-primary-foreground animate-shine bg-gradient-to-r from-primary via-primary/75 to-primary bg-[length:400%_100%] ",
        gooeyRight:
          "text-primary-foreground relative bg-primary z-0 overflow-hidden transition-all duration-500 before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%] before:bg-gradient-to-r from-zinc-400 before:transition-transform before:duration-1000  hover:before:translate-x-[0%] hover:before:translate-y-[0%] ",
        gooeyLeft:
          "text-primary-foreground relative bg-primary z-0 overflow-hidden transition-all duration-500 after:absolute after:inset-0 after:-z-10 after:translate-x-[-150%] after:translate-y-[150%] after:scale-[2.5] after:rounded-[100%] after:bg-gradient-to-l from-zinc-400 after:transition-transform after:duration-1000  hover:after:translate-x-[0%] hover:after:translate-y-[0%] ",
        linkHover1:
          "relative after:absolute after:bg-primary after:bottom-2 after:h-[1px] after:w-2/3 after:origin-bottom-left after:scale-x-100 hover:after:origin-bottom-right hover:after:scale-x-0 after:transition-transform after:ease-in-out after:duration-300",
        linkHover2:
          "relative after:absolute after:bg-primary after:bottom-2 after:h-[1px] after:w-2/3 after:origin-bottom-right after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:ease-in-out after:duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        xs: "h-6 rounded-md px-2 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface IconProps {
  Icon: React.ElementType;
  iconPlacement: "left" | "right";
}

interface IconRefProps {
  Icon?: never;
  iconPlacement?: undefined;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  as?: ElementType;
  onProcess?: () => AsyncGenerator<
    {
      children: ReactNode;
      tooltip?: string;
    },
    void,
    unknown
  >;
  isLoading?: boolean;
  hideLoading?: boolean;
  eventID?: string;
  href?: string;
  target?: string;
  confirm?: boolean;
}

export type ButtonIconProps = IconProps | IconRefProps;

const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps & ButtonIconProps
>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      as,
      Icon,
      iconPlacement,
      onClick,
      onProcess,
      hideLoading,
      isLoading: __isLoading,
      eventID,
      href,
      target,
      confirm,
      ...props
    },
    ref,
  ) => {
    const [_isLoading, setIsLoading] = useState(false);
    const isLoading = _isLoading || __isLoading;
    const Comp = asChild ? Slot : as || "button";
    const LinkComp = href ? Link : Comp;

    const [childrenOverrides, setChildrenOverrides] = useState<ReactNode>();
    const [tooltip, setTooltip] = useState<string | undefined>(undefined);
    const [isConfirming, setIsConfirming] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const _onClick = async (
      e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
    ) => {
      if (confirm && !isConfirming) {
        setIsConfirming(true);
        timeoutRef.current = setTimeout(() => {
          setIsConfirming(false);
        }, 3000);
        return;
      }

      if (isConfirming) {
        setIsConfirming(false);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }

      if (isLoading) return;

      const currentChildren = children;
      const currentTooltip = tooltip;

      setIsLoading(true);
      try {
        if (onProcess) {
          e.preventDefault();
          const generator = onProcess();
          for await (const message of generator) {
            // setChildren(message.children);
            setChildrenOverrides(message.children);
            setTooltip(message.tooltip);
          }
        } else {
          await onClick?.(e as React.MouseEvent<HTMLButtonElement>);
        }
      } catch (error) {
        console.error(error);
      }
      setIsLoading(false);
      // setChildren(currentChildren);
      setChildrenOverrides(undefined);
      setTooltip(currentTooltip);
    };

    let children = childrenOverrides ?? props.children;

    if (confirm && isConfirming) {
      children = <span className="">Confirm?</span>;
    }

    if (asChild) {
      return (
        <Comp
          disabled={isLoading}
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as ForwardedRef<HTMLButtonElement & HTMLAnchorElement>}
          onClick={_onClick}
          data-event-id={eventID}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <LinkComp
        disabled={isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as ForwardedRef<HTMLButtonElement & HTMLAnchorElement>}
        onClick={_onClick}
        data-event-id={eventID}
        {...(href ? { href } : {})}
        {...(target ? { target } : {})}
        {...(props as any)} // Type assertion to avoid conflicts
      >
        {!isLoading && Icon && iconPlacement === "left" && (
          <Icon
            size={16}
            className={cn(
              "w-5",
              variant === "expandIcon" || variant === "expandIconOutline"
                ? "w-0 translate-x-[0%] pr-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:translate-x-100 group-hover:pr-2 group-hover:opacity-100"
                : "",
            )}
          />
        )}
        {children}
        {!isLoading && Icon && iconPlacement === "right" && (
          <Icon
            size={16}
            className={cn(
              "w-5",
              variant === "expandIcon" || variant === "expandIconOutline"
                ? "w-0 translate-x-[100%] pl-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:translate-x-0 group-hover:pl-2 group-hover:opacity-100"
                : "",
            )}
          />
        )}
        {(__isLoading || onClick || onProcess) && !hideLoading && isLoading && (
          <div
            className={cn(
              "w-0 translate-x-[100%] pl-0 opacity-0 transition-all duration-200",
              isLoading &&
                cn("w-5 translate-x-0 opacity-100", {
                  "pl-2": children !== undefined && children !== null,
                }),
            )}
          >
            <LoaderCircle size={16} className="animate-spin" />
          </div>
        )}
      </LinkComp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
