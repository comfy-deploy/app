"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Download, MoreHorizontal } from "lucide-react";

import BlurIn from "@/components/magicui/blur-in";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { sendEventToCD } from "@/components/workspace/sendEventToCD";
interface CurrentRun {
  id?: string;
  modal_function_call_id?: string;
}

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.round(time % 60)
    .toString()
    .padStart(2, "0"); // Round the seconds to the nearest whole number
  return `${minutes}:${seconds}`;
};

export function App({
  endpoint,
  children,
}: {
  endpoint: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <BlurIn
        duration={0.2}
        variant={{
          hidden: { filter: "blur(10px)", opacity: 0, x: 0, y: 10 },
          visible: { filter: "blur(0px)", opacity: 1, x: 0, y: 0 },
        }}
        className="pointer-events-none absolute bottom-0 z-50 mx-auto mb-2 flex w-full flex-col items-center gap-2 md:bottom-2"
      >
        <Card className="pointer-events-auto w-fit rounded-2xl p-1 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            {children}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={async () => {
                    const getPrompt_ = new Promise<any>((resolve) => {
                      const eventListener = (event: any) => {
                        if (event.origin !== endpoint) return;

                        try {
                          const data = JSON.parse(event.data);
                          if (data.type === "cd_plugin_onGetPrompt") {
                            window.removeEventListener(
                              "message",
                              eventListener,
                              {
                                capture: true,
                              },
                            );
                            resolve(data.data);
                          }
                        } catch (error) {}
                      };
                      window.addEventListener("message", eventListener, {
                        capture: true,
                      });
                      sendEventToCD("get_prompt");
                    });
                    const prompt = await getPrompt_;
                    navigator.clipboard.writeText(
                      JSON.stringify(prompt.workflow),
                    );
                  }}
                >
                  <Copy size={14} />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={async () => {
                    const getPrompt_ = new Promise<any>((resolve) => {
                      const eventListener = (event: any) => {
                        if (event.origin !== endpoint) return;

                        try {
                          const data = JSON.parse(event.data);
                          if (data.type === "cd_plugin_onGetPrompt") {
                            window.removeEventListener(
                              "message",
                              eventListener,
                              {
                                capture: true,
                              },
                            );
                            resolve(data.data);
                          }
                        } catch (error) {}
                      };
                      window.addEventListener("message", eventListener, {
                        capture: true,
                      });
                      sendEventToCD("get_prompt");
                    });
                    const prompt = await getPrompt_;

                    const blob = new Blob([JSON.stringify(prompt.workflow)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "workflow.json";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download size={14} />
                  Download .json
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      </BlurIn>
    </>
  );
}
