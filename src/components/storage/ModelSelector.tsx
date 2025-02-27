"use client";

import { Button } from "@/components/ui/button";
import { LoadingIcon } from "@/components/ui/custom/loading-icon";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatFileSize, getOptimizedImage } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ExternalLink, Plus, Search } from "lucide-react";
import * as React from "react";
import { useMemo, useRef } from "react";
import type { z } from "zod";
import type { Model, ModelList, ModelListWrapper } from "./CivitalModelSchema";

export function ModelSelector({
  selected,
  modelList,
  label,
  onSearch,
  shouldFilter = true,
  isLoading,
  selectMultiple = true,
  // searchValue,
  searchId,
  onSelectedChange,
  popover = true,
}: {
  selected?: any;
  onSelectedChange?: (any: any) => void;
  searchId: string;
  modelList?: z.infer<typeof ModelListWrapper>;
  label: string;
  // searchValue?: string;
  onSearch?: (search: string) => void;
  shouldFilter?: boolean;
  isLoading?: boolean;
  selectMultiple?: boolean;
  popover?: boolean;
}) {
  const value = (selected as z.infer<typeof ModelList>) ?? [];
  const [open, setOpen] = React.useState(false);

  function toggleModel(model: z.infer<typeof Model>) {
    const prevSelectedModels = value;
    if (
      prevSelectedModels.some(
        (selectedModel) =>
          selectedModel.url + selectedModel.name === model.url + model.name,
      )
    ) {
      onSelectedChange?.(
        prevSelectedModels.filter(
          (selectedModel) =>
            selectedModel.url + selectedModel.name !== model.url + model.name,
        ),
      );
    } else {
      if (!selectMultiple) {
        onSelectedChange?.([model]);
      } else {
        onSelectedChange?.([...prevSelectedModels, model]);
      }
    }
  }

  const containerRef = useRef<HTMLDivElement>(null);

  const [searchValue, setSearchValue] = React.useState("");

  React.useEffect(() => {
    if (!searchId) return;

    const url = selected[0]?.url;

    if (url?.startsWith(`search:${searchId}:`)) {
      const values = url.split(":") as string[];
      const value = values[values.length - 1];
      const type = values[values.length - 2];
      // console.log("searching for", value, type);

      setOpen(true);
      setSearchValue(value);
    }
  }, [selected]);

  const filteredModelList = useMemo(() => {
    if (!modelList) return modelList;
    if (!searchValue) return modelList;
    if (shouldFilter === false) return modelList;

    console.log("filtering", searchValue);

    return {
      models: modelList.models.filter((model) => {
        return (
          model.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          model.filename.toLowerCase().includes(searchValue.toLowerCase()) ||
          model.type.toLowerCase().includes(searchValue.toLowerCase()) ||
          (model.base
            ? model.base.toLowerCase().includes(searchValue.toLowerCase())
            : false) ||
          (model.description
            ? model.description
                .toLowerCase()
                .includes(searchValue.toLowerCase())
            : false)
        );
      }),
    };
  }, [searchValue, modelList, shouldFilter]);

  if (!popover) {
    return (
      <>
        <div className="relative border-gray-200 border-b">
          <Input
            className="rounded-none border-none focus-visible:ring-0"
            placeholder={`Search ${label}`}
            value={searchValue}
            onChange={(c) => {
              setSearchValue(c.target.value);
              onSearch?.(c.target.value);
            }}
          />
          <div className="absolute top-0 right-4 flex h-full items-center">
            {isLoading && <LoadingIcon />}
          </div>
        </div>
        {/* <div className='w-full h-[1px] bg-gray-200'></div> */}
        {filteredModelList && (
          <Content
            toggleModel={toggleModel}
            modelList={filteredModelList}
            value={value}
          />
        )}
      </>
    );
  }

  return (
    <div className="" ref={containerRef}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex h-full w-fit justify-between"
            Icon={Search}
            iconPlacement="left"
          >
            {/* {label} */}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[375px] overflow-hidden p-0" side="bottom">
          <div className="relative shadow-md">
            <Input
              className="rounded-none border-none focus-visible:ring-0"
              placeholder={"Search " + label}
              value={searchValue}
              onChange={(c) => {
                setSearchValue(c.target.value);
                onSearch?.(c.target.value);
              }}
            />
            <div className="absolute top-0 right-4 flex h-full items-center">
              {isLoading && <LoadingIcon />}
            </div>
          </div>
          {/* <div className='w-full h-[1px] bg-gray-200'></div> */}
          {filteredModelList && (
            <Content
              toggleModel={toggleModel}
              modelList={filteredModelList}
              value={value}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

const PROVIDER_ICONS = {
  civitai: "https://civitai.com/favicon.ico",
  huggingface: "https://huggingface.co/favicon.ico",
  comfyui: "https://storage.googleapis.com/comfy-assets/favicon.ico",
  link: undefined, // No icon for generic links
} as const;

function Content({
  modelList,
  toggleModel,
  value,
}: {
  modelList: z.infer<typeof ModelListWrapper>;
  toggleModel: (model: z.infer<typeof Model>) => void;
  value: z.infer<typeof ModelList>;
}) {
  const parentRef = React.useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: modelList?.models.length === undefined ? 0 : modelList.models.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  const items = rowVirtualizer.getVirtualItems();

  return (
    <>
      <div
        ref={parentRef}
        className="scrollbar scrollbar-thumb-gray-200 scrollbar-track-transparent"
        style={{
          height: `300px`,
          width: `100%`,
          overflow: "auto",
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {modelList &&
            items.map((virtualRow) => {
              const model = modelList.models[virtualRow.index];

              // Map the provider icon based on the model's source
              const providerIcon =
                PROVIDER_ICONS[model.provider as keyof typeof PROVIDER_ICONS];

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="flex items-center overflow-hidden rounded-md pr-2 transition-colors hover:bg-gray-200"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    className="flex h-full min-w-0 flex-1 items-center gap-2 px-4 py-2 text-xs"
                    onClick={() => toggleModel(model)}
                  >
                    {providerIcon && (
                      <img
                        src={getOptimizedImage(providerIcon)}
                        alt="Provider Icon"
                        className="mr-2 h-4 w-4"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{model?.name}</div>
                      <span className="block truncate text-muted-foreground text-xs">
                        {model.size && `${formatFileSize(model.size)} | `}
                        {model?.filename}
                      </span>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value.some(
                            (selectedModel) => selectedModel.url === model.url,
                          )
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant={"ghost"} size="icon" className="h-8 w-8">
                      <a
                        href={model.reference}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}
