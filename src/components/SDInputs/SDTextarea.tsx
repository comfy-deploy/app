"use client";
import { EditAttention } from "@/components/SDInputs/editAttention";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import React, { type ReactNode, useEffect, useRef } from "react";

type SDTextareaProps = TextareaProps & {
  label?: string;
  header?: ReactNode;
  textareaClasses?: string;
};

export const SDTextarea = React.forwardRef<
  HTMLTextAreaElement,
  SDTextareaProps
>(({ label, header, textareaClasses, className, ...props }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Combine refs
  const combinedRef = (node: HTMLTextAreaElement) => {
    textareaRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only apply EditAttention to this specific textarea when it's focused
      if (
        textareaRef.current && 
        document.activeElement === textareaRef.current &&
        (event.key === "ArrowUp" || event.key === "ArrowDown") &&
        (event.ctrlKey || event.metaKey)
      ) {
        EditAttention(event);
      }
    };

    // Add listener only when component is mounted
    window.addEventListener("keydown", handleKeyDown);
    
    // Cleanup event listener when component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className={className}>
      {header}
      <Textarea 
        ref={combinedRef} 
        className={textareaClasses} 
        {...props} 
        id={label} 
      />
    </div>
  );
});

SDTextarea.displayName = "SDTextarea";
