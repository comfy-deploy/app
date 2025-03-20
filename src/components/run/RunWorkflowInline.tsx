import { SDForm } from "@/components/SDInputs/SDForm";
import {
  type RGBColor,
  SDInputsRender,
} from "@/components/SDInputs/SDInputsRender";
import { Button } from "@/components/ui/button";
// import { getFileDownloadUrlV2 } from "@/db/getFileDownloadUrl";
import { useAuthStore } from "@/lib/auth-store";
import type {
  WorkflowInputsType,
  getInputsFromWorkflow,
} from "@/lib/getInputsFromWorkflow";
import { plainInputsToZod } from "@/lib/workflowVersionInputsToZod";
// import { HandleFileUpload } from "@/server/uploadFile";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { Play } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import type { z } from "zod";
import { uploadFile } from "../files-api";
import { publicRunStore } from "./VersionSelect";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 250_000_000; // 250MB

export async function parseFilesToImgURLs(
  values: Record<string, any>,
  toZip = false,
) {
  const processFile = async (file: File) => {
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const uploadFileResponse = await uploadFile(file);
      toast.success(`${file.name} uploaded successfully`, { id: toastId });
      return uploadFileResponse.file_url;
    } catch (error) {
      toast.error(`Failed to upload ${file.name}`, { id: toastId });
      throw error;
    }
  };

  const processValue = async (value: any): Promise<any> => {
    if (value instanceof File) {
      return processFile(value);
    }
    if (Array.isArray(value)) {
      if (toZip) {
        // Lazy load JSZip only when needed
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const item of value) {
          if (item instanceof File) {
            zip.file(item.name, item);
          }
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFile = new File([zipBlob], "files.zip", {
          type: "application/zip",
        });
        console.log(zipFile);
        return processFile(zipFile);
      }

      // Turn that in serialized array
      return JSON.stringify(
        await Promise.all(value.map((item) => processValue(item))),
      );
    }
    if (value && typeof value === "object") {
      const entries = Object.entries(value);
      const processedEntries = await Promise.all(
        entries.map(async ([key, val]) => {
          const processedValue = await processValue(val);
          return [key, processedValue];
        }),
      );
      return Object.fromEntries(processedEntries);
    }
    return value;
  };

  const newValues: Record<string, any> = {};
  for (const [key, value] of Object.entries(values)) {
    newValues[key] = await processValue(value);
  }
  console.log(newValues);

  return newValues;
}

export function WorkflowInputsForm({
  values,
  setValues,
  defaultValues,
  ...props
}: {
  workflow: z.infer<typeof workflowType>;
  inputs: ReturnType<typeof getInputsFromWorkflow>;
  defaultValues: Record<string, any>;
  onSubmit: (
    e: FormEvent<HTMLFormElement>,
    // values: Record<string, any>,
  ) => AsyncGenerator<
    {
      children: ReactNode;
      tooltip?: string;
    },
    void,
    unknown
  >;
  hideRunButton?: boolean;
  actionArea?: ReactNode;
  values?: Record<string, any>;
  setValues?: any;
}) {
  const { inputs, hideRunButton } = props;

  function updateInput(
    key: string,
    val: string | File | undefined | (File | string)[] | boolean | RGBColor[],
  ) {
    if (val instanceof File && val.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Cannot upload files bigger than 250MB");
      return;
    }
    setValues((prev: any) => ({ ...prev, [key]: val }));
  }

  const [_isLoading, setIsLoading] = useState(false);
  const isLoading = _isLoading;

  const [childrenOverrides, setChildrenOverrides] = useState<ReactNode>();
  const [tooltip, setTooltip] = useState<string | undefined>(undefined);

  return (
    <SDForm
      onSubmit={async (e) => {
        // e.preventDefault();
        if (isLoading) return;

        const currentChildren = "Run";
        const currentTooltip = tooltip;

        setIsLoading(true);
        if (props.onSubmit) {
          e.preventDefault();
          const generator = props.onSubmit(e);
          for await (const message of generator) {
            // setChildren(message.children);
            setChildrenOverrides(message.children);
            setTooltip(message.tooltip);
          }
        }
        setIsLoading(false);
        // setChildren(currentChildren);
        setChildrenOverrides(undefined);
        setTooltip(currentTooltip);
      }}
      actionArea={
        // props.actionArea
        !hideRunButton && (
          <div className="flex justify-end gap-2 pr-3">
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                setValues(defaultValues);
              }}
            >
              Reset default
            </Button>
            <Button
              type="submit"
              // disabled={isLoading || loading}
              isLoading={isLoading}
            >
              {childrenOverrides ?? "Run with inputs"}
              {/* {isLoading || loading ? <LoadingIcon /> : <Play size={14} />} */}
            </Button>
          </div>
        )
      }
      scrollAreaClassName="[&>[data-radix-scroll-area-viewport]]:max-h-[500px]"
    >
      {inputs?.map((item) => {
        if (!values || !item?.input_id) {
          return;
        }
        return (
          <SDInputsRender
            key={item.input_id}
            inputNode={item}
            updateInput={updateInput}
            inputValue={values[item.input_id]}
          />
        );
      })}
    </SDForm>
  );
}

export function parseInputValues(valuesParsed: Record<string, any>) {
  return Object.entries(valuesParsed)
    .filter(([_, value]) => value != null)
    .reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]:
          typeof value === "string"
            ? // Try to parse JSON strings, fall back to original value if parsing fails
              (() => {
                try {
                  return JSON.parse(value);
                } catch {
                  return value;
                }
              })()
            : value,
      }),
      {},
    );
}

// For share page
export function RunWorkflowInline({
  inputs,
  deployment_id,
  default_values = {},
  hideRunButton = false,
  hideInputs = false,
  runOrigin = "public-share",
  blocking = true,
  model_id,
  scrollAreaClassName,
}: {
  inputs: z.infer<typeof WorkflowInputsType>;
  deployment_id: string;
  default_values?: Record<string, any>;
  hideRunButton?: boolean;
  hideInputs?: boolean;
  runOrigin?: any;
  blocking?: boolean;
  model_id?: string;
  scrollAreaClassName?: string;
}) {
  const [values, setValues] =
    useState<
      Record<
        string,
        string | File | undefined | (File | string)[] | boolean | RGBColor[]
      >
    >(default_values);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRunId, setCurrentRunId] = useQueryState("run-id");

  const user = useAuth();
  const clerk = useClerk();

  const schema = useMemo(() => {
    return plainInputsToZod(inputs);
  }, [inputs]);

  const fetchToken = useAuthStore((state) => state.fetchToken);

  const {
    setRunId,
    loading,
    setLoading: setLoading2,
    setStatus,
    setImage,
  } = publicRunStore();

  const runWorkflow = async () => {
    if (!user.isSignedIn) {
      clerk.openSignIn({
        redirectUrl: window.location.href,
      });
      return;
    }

    setLoading2(true);
    setIsLoading(true);
    const valuesParsed = await parseFilesToImgURLs({ ...values });
    const val = parseInputValues(valuesParsed);
    console.log(val);
    setStatus({ state: "preparing", live_status: "", progress: 0 });
    try {
      const origin = window.location.origin;
      // if (v2RunApi || model_id) {
      const auth = await fetchToken();
      const body = model_id
        ? { model_id: model_id, inputs: val }
        : {
            deployment_id: deployment_id,
            inputs: val,
            origin: runOrigin,
            batch_number: 1,
          };

      if (model_id) {
        setLoading2(true);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CD_API_URL}/api/run${model_id ? "/sync" : ""}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth}`,
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      if (runOrigin === "public-share") {
        setRunId(data.run_id);
      } else {
        setCurrentRunId(data.run_id);
      }

      if (model_id) {
        const data = await response.json();
        setLoading2(false);
        const mediaData = data[0]?.data;
        if (mediaData?.images?.[0]?.url) {
          setImage([{ url: mediaData.images[0].url }]);
        } else if (mediaData?.video?.[0]?.url) {
          setImage([{ url: mediaData.video[0].url }]);
        }
      }
      // } else {
      // const a = await callServerPromise(
      //   createRun({
      //     origin,
      //     workflow_version_id: workflow_version_id,
      //     machine_id: machine_id,
      //     inputs: val,
      //     runOrigin: runOrigin,
      //   }),
      // );
      // if (a && !("error" in a) && "workflow_run_id" in a) {
      //   setRunId(a.workflow_run_id as string);
      // } else {
      //   setLoading2(false);
      // }
      // console.log(a);
      // }
      setIsLoading(false);
      if (!blocking) {
        setLoading2(false);
      }
    } catch (error) {
      setIsLoading(false);
      setLoading2(false);
      toast.error(
        `Failed to run workflow: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  };

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    runWorkflow();
  }

  function updateInput(
    key: string,
    val: string | File | undefined | (File | string)[] | boolean | RGBColor[],
  ) {
    if (val instanceof File && val.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Cannot upload files bigger than 250MB");
      return;
    }
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  useHotkeys(
    "meta+enter",
    (e) => {
      e.preventDefault();
      runWorkflow();
      // console.log("meta+enter");
    },
    {
      enableOnFormTags: ["input", "select", "textarea"],
    },
  );

  // if default value changes, update the values
  useEffect(() => {
    setValues(default_values);
  }, [default_values]);

  return (
    <>
      <SDForm
        onSubmit={onSubmit}
        hideChildren={hideInputs}
        actionArea={
          !hideRunButton && (
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading || loading}
              variant="expandIcon"
              iconPlacement="right"
              Icon={Play}
            >
              Run
            </Button>
          )
        }
        scrollAreaClassName={cn("h-full", scrollAreaClassName)}
        // scrollAreaClassName="[&>[data-radix-scroll-area-viewport]]:max-h-[calc(60%-100px)]"
      >
        {!hideInputs &&
          inputs?.map((item) => {
            if (!item?.input_id) {
              return;
            }
            return (
              <SDInputsRender
                key={item.input_id}
                inputNode={item}
                updateInput={updateInput}
                inputValue={values[item.input_id]}
              />
            );
          })}
      </SDForm>
      {/* {!inputs && !hideRunButton && (
        <Button
          onClick={runWorkflow}
          isLoading={isLoading || loading}
          eventID="workflow_share_button:click"
        >
          Confirm
        </Button>
      )} */}
    </>
  );
}
