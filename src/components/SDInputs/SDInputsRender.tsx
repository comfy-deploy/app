import { SDImageInput } from "@/components/SDInputs/SDImageInput";
import { SDInput } from "@/components/SDInputs/SDInput";
import { SDTextarea } from "@/components/SDInputs/SDTextarea";
import { SDVideoInput } from "@/components/SDInputs/SDVideoInput";
import { SDAudioInput } from "@/components/SDInputs/SDAudioInput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { customInputNodes } from "@/lib/customInputNodes";
import { CircleAlert, Dice6, Plus, Trash, HelpCircle } from "lucide-react";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type RGBColor = {
  r: number;
  g: number;
  b: number;
};

type SDInputsRenderProps = {
  inputNode:
    | {
        class_type: keyof typeof customInputNodes | string;
        input_id: string;
        min_value?: number | undefined;
        max_value?: number | undefined;
        default_value: string | boolean | number;
        display_name?: string;
        description?: string;
        enum_values?: string[];
      }
    | undefined;
  updateInput: (
    inputID: string,
    value: string | File | undefined | (string | File)[] | boolean | RGBColor[],
  ) => void;
  inputValue: string | any;
};
export function SDInputsRender({
  inputNode,
  updateInput,
  inputValue,
}: SDInputsRenderProps) {
  if (!inputNode) {
    return;
  }
  const genericProps = {
    label: inputNode.input_id,
    display_name: inputNode.display_name,
    description: inputNode.description,
  };

  // for all input title, as they all have the same structure
  const header = ({
    display_name,
    label,
    description,
  }: typeof genericProps) => {
    const [isHovering, setIsHovering] = React.useState(false);
    const [isLocked, setIsLocked] = React.useState(false);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    const showDescription = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsHovering(true);
    };

    const hideDescription = () => {
      if (!isLocked) {
        timerRef.current = setTimeout(() => {
          setIsHovering(false);
        }, 300);
      }
    };

    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <div className="ml-2 flex items-center gap-2">
            {display_name && (
              <Label htmlFor={display_name} className="font-normal text-sm">
                {display_name}
              </Label>
            )}
            {!display_name && label && (
              <Label
                htmlFor={label}
                className="font-mono text-2xs text-muted-foreground"
              >
                {label}
              </Label>
            )}
            {label && display_name && (
              <Badge
                variant="outline"
                className="!text-[9px] h-4 overflow-hidden text-ellipsis whitespace-nowrap px-1 font-mono text-muted-foreground"
                title={label}
              >
                {label}
              </Badge>
            )}
            {description && (
              // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
              <div
                onMouseEnter={showDescription}
                onMouseLeave={hideDescription}
                onClick={() => setIsLocked(!isLocked)}
                className="cursor-help"
              >
                <HelpCircle
                  size={16}
                  className={`${
                    isHovering || isLocked
                      ? "text-foreground"
                      : "text-muted-foreground"
                  } transition-colors`}
                />
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {description && (isHovering || isLocked) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden rounded-md bg-muted/30 text-muted-foreground text-xs"
              onMouseEnter={showDescription}
              onMouseLeave={hideDescription}
            >
              <div className="p-2 leading-snug">{description}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  switch (inputNode.class_type) {
    case "ComfyUIDeployExternalText":
    case "ComfyUIDeployExternalTextAny":
      return (
        <SDTextarea
          key={inputNode.input_id}
          value={inputValue || ""}
          textareaClasses="mt-1 bg-gray-50 rounded-[8px]"
          rows={3}
          placeholder={inputNode.input_id}
          header={header(genericProps)}
          {...genericProps}
          onChange={(e: any) => updateInput(inputNode.input_id, e.target.value)}
        />
      );

    case "ComfyUIDeployExternalTextSingleLine":
      return (
        <SDInput
          key={inputNode.input_id}
          value={inputValue || ""}
          inputClasses="mt-1 bg-gray-50 rounded-[8px]"
          header={header(genericProps)}
          {...genericProps}
          type="text"
          onChange={(e: any) => updateInput(inputNode.input_id, e.target.value)}
        />
      );

    case "ComfyUIDeployExternalNumberInt":
      return (
        <SDInput
          key={inputNode.input_id}
          value={
            inputValue !== undefined && inputValue !== null ? inputValue : ""
          }
          inputClasses="mt-1 bg-gray-50 rounded-[8px]"
          header={header(genericProps)}
          {...genericProps}
          type="number"
          pattern="\d+"
          onChange={(e: any) => updateInput(inputNode.input_id, e.target.value)}
        />
      );

    case "ComfyUIDeployExternalNumber":
      return (
        <SDInput
          key={inputNode.input_id}
          value={
            inputValue !== undefined && inputValue !== null ? inputValue : ""
          }
          inputClasses="mt-1 bg-gray-50 rounded-[8px]"
          header={header(genericProps)}
          {...genericProps}
          type="number"
          step="0.1"
          onChange={(e: any) => updateInput(inputNode.input_id, e.target.value)}
        />
      );

    case "ComfyUIDeployExternalNumberSlider":
      return (
        <div className="flex flex-col gap-1">
          <div>{header(genericProps)}</div>
          <div className="flex w-full items-center space-x-2">
            <Slider
              max={inputNode.max_value}
              min={inputNode.min_value}
              step={0.01}
              value={[Number(inputValue)] || [inputNode.min_value]}
              onValueChange={(value) => {
                updateInput(inputNode.input_id, value[0].toString());
              }}
            />
            <Input
              className="w-20 bg-gray-50"
              type="number"
              step="0.01"
              min={inputNode.min_value}
              max={inputNode.max_value}
              value={
                inputValue !== undefined && inputValue !== null
                  ? inputValue
                  : ""
              }
              onChange={(e: any) => {
                const newValue = e.target.value;
                updateInput(inputNode.input_id, newValue);
              }}
            />
          </div>
        </div>
      );

    case "ComfyUIDeployExternalNumberSliderInt":
      return (
        <div className="flex flex-col gap-1">
          <div>{header(genericProps)}</div>
          <div className="flex w-full items-center space-x-2">
            <Slider
              max={inputNode.max_value}
              min={inputNode.min_value}
              step={1}
              value={[Number(inputValue)] || [inputNode.min_value]}
              onValueChange={(value) => {
                updateInput(inputNode.input_id, value[0].toString());
              }}
            />
            <Input
              className="w-20 bg-gray-50"
              type="number"
              step="1"
              min={inputNode.min_value}
              max={inputNode.max_value}
              value={
                inputValue !== undefined && inputValue !== null
                  ? inputValue
                  : ""
              }
              onChange={(e: any) => {
                const newValue = e.target.value;
                updateInput(inputNode.input_id, newValue);
              }}
            />
          </div>
        </div>
      );

    case "ComfyUIDeployExternalImage":
    case "ComfyUIDeployExternalImageAlpha":
      if (!open) {
        return;
      }
      return (
        <SDImageInput
          isDisplayAssetInput
          key={inputNode.input_id}
          file={inputValue}
          inputClasses="mt-1"
          header={header(genericProps)}
          {...genericProps}
          onChange={(file: File | string | undefined | FileList) => {
            if (file instanceof FileList) {
              updateInput(inputNode.input_id, file[0]);
              return;
            }
            updateInput(inputNode.input_id, file);
          }}
        />
      );
    case "ComfyUIDeployExternalVideo":
      return (
        <SDVideoInput
          key={inputNode.input_id}
          file={inputValue}
          inputClasses="mt-1"
          header={header(genericProps)}
          {...genericProps}
          onChange={(file: File | string | undefined) => {
            updateInput(inputNode.input_id, file);
          }}
        />
      );
    case "ComfyUIDeployExternalEXR":
      return (
        <SDImageInput
          key={inputNode.input_id}
          file={inputValue}
          inputClasses="mt-1"
          header={header(genericProps)}
          accept=".exr"
          {...genericProps}
          onChange={(file: File | string | undefined | FileList) => {
            if (file instanceof FileList) {
              updateInput(inputNode.input_id, file[0]);
              return;
            }
            updateInput(inputNode.input_id, file);
          }}
        />
      );
    case "ComfyUIDeployExternalAudio":
      return (
        <SDAudioInput
          key={inputNode.input_id}
          file={inputValue}
          inputClasses="mt-1 bg-gray-50"
          header={header(genericProps)}
          {...genericProps}
          onChange={(file: File | string | undefined) => {
            updateInput(inputNode.input_id, file);
          }}
        />
      );
    case "ComfyUIDeployExternalCheckpoint":
      return (
        <div className="flex flex-col">
          <div>{header(genericProps)}</div>
          <FileDropdown
            value={inputValue as string}
            setValue={(value: string) => updateInput(inputNode.input_id, value)}
            category={"checkpoints"}
          />
        </div>
      );
    case "ComfyUIDeployExternalLora":
      return (
        <div className="flex flex-col">
          <div>{header(genericProps)}</div>
          <FileDropdown
            value={inputValue as string}
            setValue={(value: string) => updateInput(inputNode.input_id, value)}
            category={"loras"}
          />
        </div>
      );
    case "ComfyDeployWebscoketImageInput":
      return (
        <SDInput
          className=""
          key={inputNode.input_id}
          inputClasses="mt-1 bg-gray-50"
          header={header(genericProps)}
          value={inputValue || ""}
          onChange={(e: any) => updateInput(inputNode.input_id, e.target.value)}
          {...genericProps}
        />
      );
    case "ComfyUIDeployExternalImageBatch":
      let images = [] as any[];
      if (typeof inputValue === "string") {
        images = JSON.parse(inputValue);
      } else if (inputValue) {
        images = inputValue;
      }
      return (
        <>
          <div className="flex items-center justify-between">
            <div>{header(genericProps)}</div>
            <Button
              variant={"outline"}
              onClick={(e) => {
                e.preventDefault();
                updateInput(inputNode.input_id, [...images, ""]);
              }}
            >
              <Plus size={16} />
            </Button>
          </div>
          {images.map((x, i) => {
            return (
              <div className="flex items-center gap-2">
                <SDImageInput
                  key={`${inputNode.input_id} ${i}`}
                  file={x}
                  className="w-full flex-1"
                  inputClasses="bg-gray-50"
                  multiple={true}
                  // {...genericProps}
                  onChange={(file: File | string | undefined | FileList) => {
                    if (file instanceof FileList) {
                      updateInput(
                        inputNode.input_id,
                        Array.from(file).map((f) => f),
                      );
                      return;
                    }

                    updateInput(
                      inputNode.input_id,
                      images.map((currentFile, index) => {
                        return i === index ? file : currentFile;
                      }),
                    );
                  }}
                />
                <Button
                  variant={"outline"}
                  onClick={(e) => {
                    e.preventDefault();
                    const newImages = images.filter((_, index) => index !== i);
                    updateInput(inputNode.input_id, newImages);
                  }}
                >
                  <Trash size={16} />
                </Button>
              </div>
            );
          })}
        </>
      );

    case "ComfyUIDeployExternalBoolean":
      return (
        <div className="flex flex-col">
          <div>{header(genericProps)}</div>
          <Switch
            className="mt-1 bg-gray-50"
            key={inputNode.input_id}
            defaultChecked={inputNode.default_value as boolean}
            checked={inputValue as boolean}
            onCheckedChange={(newChecked) => {
              console.log("inputNode details:", inputNode);
              updateInput(inputNode.input_id, newChecked);
            }}
          />
        </div>
      );

    case "ComfyUIDeployExternalEnum":
      return (
        <div className="flex flex-col">
          <div>{header(genericProps)}</div>
          <Select
            defaultValue={inputValue as string}
            onValueChange={(value) => updateInput(inputNode.input_id, value)}
            value={inputValue as string}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select one..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {inputNode.enum_values?.map((x) => {
                  return (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      );

    case "ComfyUIDeployExternalColor":
      // Convert RGB array to hex for display
      const displayValue =
        Array.isArray(inputValue) && inputValue[0]
          ? `#${inputValue[0].r.toString(16).padStart(2, "0")}${inputValue[0].g.toString(16).padStart(2, "0")}${inputValue[0].b.toString(16).padStart(2, "0")}`
          : "#000000";

      return (
        <div className="flex flex-col">
          <div>{header(genericProps)}</div>
          <Input
            type="color"
            className="h-11 w-16"
            value={displayValue}
            onChange={(e: any) => {
              const hex = e.target.value;
              // Convert hex to rgb
              const r = Number.parseInt(hex.slice(1, 3), 16);
              const g = Number.parseInt(hex.slice(3, 5), 16);
              const b = Number.parseInt(hex.slice(5, 7), 16);

              updateInput(inputNode.input_id, [{ r, g, b }] as RGBColor[]);
            }}
          />
        </div>
      );

    case "ComfyUIDeployExternalSeed":
      const minValue = inputNode.min_value || 0;
      const maxValue = inputNode.max_value || 2147483647;

      return (
        <div className="flex gap-2">
          <div className="flex-1">
            <SDInput
              key={inputNode.input_id}
              value={inputValue || ""}
              inputClasses="mt-1 bg-gray-50"
              header={header(genericProps)}
              {...genericProps}
              type="number"
              pattern="\d+"
              onChange={(e: any) =>
                updateInput(inputNode.input_id, e.target.value)
              }
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Generate random integer between min and max value
                const randomSeed =
                  Math.floor(Math.random() * (maxValue - minValue + 1)) +
                  minValue;
                updateInput(inputNode.input_id, randomSeed.toString());
              }}
            >
              <Dice6 size={16} />
            </Button>
          </div>
        </div>
      );

    default:
      return (
        <Alert>
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>
            <p>
              Unable to render node: <Badge>{inputNode.class_type}</Badge>.
            </p>
          </AlertTitle>
          <AlertDescription>
            <SDInput
              className="center w-full "
              key={inputNode.input_id}
              inputClasses="mt-1"
              value={inputValue || ""}
              onChange={(e: any) =>
                updateInput(inputNode.input_id, e.target.value)
              }
              {...genericProps}
            />
          </AlertDescription>
        </Alert>
      );
  }
}

import { Check, ChevronsUpDown, Pencil, X } from "lucide-react";

import { useModels } from "@/hooks/use-model";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SDAssetInput } from "./sd-asset-input";

export function FileDropdown(props: {
  value: string;
  setValue: (value: string) => void;
  category: string;
}) {
  const { flattenedModels } = useModels();

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(props.value);
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    props.setValue(selectedValue);
    setOpen(false);
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    props.setValue(newValue);
  };

  const toggleEditing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(!isEditing);
  };

  return (
    <div className="flex items-center space-x-2 overflow-hidden p-1">
      {isEditing ? (
        <Input
          value={value}
          onChange={handleCustomInput}
          className="min-w-0 flex-grow"
          autoFocus
        />
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="min-w-0 flex-grow justify-between"
            >
              <div className="w-full flex-1 truncate text-left">
                {value || "Select model..."}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search model..." />
              <CommandList>
                <CommandEmpty>No model found.</CommandEmpty>
                <CommandGroup>
                  {flattenedModels
                    .filter((x) => x.category === props.category)
                    .map((framework) => (
                      <CommandItem
                        key={framework.name}
                        value={framework.name}
                        onSelect={() => handleSelect(framework.name)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === framework.name
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {framework.name}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      <Button
        variant="outline"
        className="h-10 w-10 flex-shrink-0"
        size="icon"
        onClick={toggleEditing}
      >
        {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
      </Button>
    </div>
  );
}
