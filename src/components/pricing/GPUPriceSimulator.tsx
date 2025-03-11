import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDuration } from "@/lib/get-relative-time";
import { useState } from "react";
import { LoadingIcon } from "../loading-icon";
import { useCachedQuery } from "@/lib/use-cached-query";

export function useGPUPricing() {
  return useCachedQuery({
    queryKey: ["platform", "gpu-pricing"],
    enabled: true,
    cacheTime: 1000 * 60 * 30,
  });
}

export function GPUPriceSimulator() {
  const [gpu, setGPU] = useState<string>("T4");
  const [duration, setDuration] = useState(30);
  const [idleTime, setIdleTime] = useState(60);
  const [coldStart, setColdStart] = useState(30);

  const { data, isLoading } = useGPUPricing();

  const final = (coldStart + duration + idleTime) * data[gpu];
  const finalWarm = (times: number) =>
    (coldStart + duration * times + idleTime) * data[gpu];

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingIcon />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        My workflow running approximately (warm)
        <Slider
          defaultValue={[duration]}
          onValueChange={(a) => {
            setDuration(a[0]);
          }}
          // className="md:max-w-[200px]"
          min={1}
          max={600}
          step={1}
        />
        <div className="text-gray-500 text-sm">{getDuration(duration)}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        with
        <Select
          value={gpu}
          onValueChange={(value) => {
            setGPU(value);
          }}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="GPU" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(data).map(([gpu, price]) => (
              <SelectItem value={gpu}>{gpu}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant={"fuchsia"}>${data[gpu]} / sec</Badge>
      </div>
      <div className="flex items-center gap-2">
        approx comfyui cold start = <Badge variant={"rose"}>30 secs</Badge>
      </div>
      <div className="flex items-center gap-2">
        idle timeout =
        <Select
          value={idleTime.toString()}
          onValueChange={(value) => {
            setIdleTime(Number(value));
          }}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Idle Timeout" />
          </SelectTrigger>
          <SelectContent>
            {["0", "15", "30", "60", "120", "240"].map((value) => (
              <SelectItem value={value}>{value} sec</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <div className="text-gray-500 text-sm">
          Formula = (cold start + warm run time + idle timeout) * gpu per sec
        </div>
        <div className="text-sm">
          1 workflow run ={" "}
          <Badge variant={"blue"} className="text-sm">
            ${final.toFixed(2)}
          </Badge>
        </div>
        <Tabs defaultValue="all_warm" className="w-full text-sm">
          <div className="flex items-center gap-2">
            All
            <TabsList className="grid max-w-[100px] grid-cols-2">
              <TabsTrigger value="all_warm">warm</TabsTrigger>
              <TabsTrigger value="all_cold">cold</TabsTrigger>
            </TabsList>
            runs
          </div>
          <TabsContent value="all_cold">
            <div>
              10 workflow run ={" "}
              <Badge variant={"blue"} className="text-sm">
                ${(final * 10).toFixed(2)}
              </Badge>
            </div>
            <div>
              100 workflow run ={" "}
              <Badge variant={"blue"} className="text-sm">
                ${(final * 100).toFixed(2)}
              </Badge>
            </div>
          </TabsContent>
          <TabsContent value="all_warm" className="">
            <div>
              10 workflow run ={" "}
              <Badge variant={"blue"} className="text-sm">
                ${finalWarm(10).toFixed(2)}
              </Badge>
            </div>
            <div>
              100 workflow run ={" "}
              <Badge variant={"blue"} className="text-sm">
                ${finalWarm(100).toFixed(2)}
              </Badge>
            </div>
          </TabsContent>
          <Alert className="mt-6 max-w-[400px] text-gray-500 text-sm">
            {/* <AlertTitle>Notice</AlertTitle> */}
            <AlertDescription>
              Warm meaning all the runs is running in the same warm instance,
              with only the first cold start. Cold meaning all the runs are
              running with cold start, and full idle time. The actual cost will
              vary between all warm and all cold cost.
            </AlertDescription>
          </Alert>
        </Tabs>
      </div>
    </div>
  );
}
