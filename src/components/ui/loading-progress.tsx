import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface LoadingProgressProps {
  className?: string;
  message?: string;
}

export function LoadingProgress({
  className,
  message = "Loading your account",
}: LoadingProgressProps) {
  const [dots, setDots] = useState("");
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Animate progress
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90; // Cap at 90% to avoid completing before actual loading
        return prev + Math.random() * 20;
      });
    }, 150);

    return () => clearInterval(progressInterval);
  }, []);

  //   // Animate dots
  //   useEffect(() => {
  //     const dotsInterval = setInterval(() => {
  //       setDots((prev) => {
  //         if (prev === "...") return "";
  //         return `${prev}.`;
  //       });
  //     }, 300);

  //     return () => clearInterval(dotsInterval);
  //   }, []);

  return (
    <motion.div
      className={cn(
        "flex h-screen w-full flex-1 items-center justify-center bg-transparent inset-0 z-50",
        className,
      )}
      initial={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.7 }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Text fades out first */}
        <motion.div
          className="flex items-center gap-3"
          exit={{ opacity: 0, y: 10 }}
          transition={{
            duration: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.2,
          }}
        >
          {/* <Loader2 className="h-5 w-5 animate-spin text-primary" /> */}
          <p className="text-muted-foreground">
            {message}
            {/* <span className="inline-block text-left w-6">{dots}</span> */}
          </p>
        </motion.div>

        {/* Progress bar fades out second */}
        <motion.div
          className="w-80 max-w-sm"
          exit={{ opacity: 0, y: 15 }}
          transition={{
            duration: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.3,
          }}
        >
          <div
            className="relative h-3 w-full overflow-hidden bg-gray-100"
            style={{
              backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 6px,
                  rgba(0,0,0,0.05) 6px,
                  rgba(0,0,0,0.05) 12px
                )`,
            }}
          >
            <div
              className="h-full bg-blue-400 transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 6px,
                    rgba(255,255,255,0.3) 6px,
                    rgba(255,255,255,0.3) 12px
                  )`,
              }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
