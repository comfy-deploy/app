import {
  AlertCircle,
  FileInput,
  FileOutput,
  Image,
  Plus,
  Sigma,
  SlidersHorizontal,
  Sparkles,
  Type,
  TypeOutline,
  Video,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { sendEventToCD } from "./sendEventToCD";
import { Separator } from "../ui/separator";
import { useState } from "react";
import { Input } from "../ui/input";
import { Search } from "lucide-react";

const inputs = {
  groups: [
    {
      id: "image",
      title: "Image",
      icon: "Image",
      nodes: [
        {
          title: "External Image",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_image.jpg",
          description:
            "The External Image node allows you to expose image inputs in your workflow. It supports loading images from URLs and base64 encoded data.",
          type: "ComfyUIDeployExternalImage",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description: "Default value for the input",
              required: false,
            },
            {
              name: "default_value_url",
              description: "URL for default image input",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
          alert: {
            title: "Import Assets",
            description:
              "You can import assets directly from the assets browser using the button in the playground.",
          },
        },
        {
          title: "External Image Batch",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_image_batch.jpg",
          description:
            "The External Image Batch node allows you to send multiple images as an input. It supports loading images from URLs (including ZIP files containing images) and base64 encoded data.",
          type: "ComfyUIDeployExternalImageBatch",
          widgets_values: ["input_images", "", "", ""],
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
            {
              icon: "Video",
              text: "Video",
              variant: "outline",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "images",
              description:
                'JSON array of image sources (URLs, ZIP files, or base64 data). \n Format is ["url1", "url2", "url3"]',
              required: false,
            },
            {
              name: "default_value",
              description: "The default image to use if no input is provided",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
          alert: {
            title: "Video workflows",
            description:
              "This node is usually used with video workflows. Most likely you want to use External Image.",
          },
        },
        {
          title: "External Image Alpha",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_image_alpha.jpg",
          description:
            "The External Image Alpha node is an alternative image input node that allows you to expose image inputs to use the Alpha channel. It supports loading images from URLs and base64 encoded data, with improved alpha channel handling.",
          type: "ComfyUIDeployExternalImageAlpha",
          widgets_values: ["input_image_alpha", "", "", ""],
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description: "The default image to use if no input is provided",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
        },
        {
          title: "Image Output",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/output_image.jpg",
          description:
            'The Image Output node allows you to save images, just like default "Save Image" node.',
          type: "ComfyDeployOutputImage",
          badges: [
            {
              icon: "FileOutput",
              text: "Output",
              variant: "green",
            },
          ],
          inputFields: [
            {
              name: "filename_prefix",
              description: "Prefix for the filename",
              required: true,
            },
            {
              name: "file_type",
              description: "jpg, png, or webp",
              required: true,
            },
            {
              name: "quality",
              description: "0-100. 100 is the highest quality.",
              required: true,
            },
            {
              name: "output_id",
              description: "Unique identifier for this output",
              required: true,
            },
          ],
        },
      ],
    },
    {
      id: "text",
      title: "Text",
      icon: "Type",
      nodes: [
        {
          title: "External Text",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_text.jpg",
          description:
            "The External Text Input node allows accepting text input.",
          type: "ComfyUIDeployExternalText",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description: "Default value for the input",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
        },
        {
          title: "Text Output",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/output_text.jpg",
          description:
            "The Text Output node allows you to display and save text.",
          type: "ComfyDeployOutputText",
          badges: [
            {
              icon: "FileOutput",
              text: "Output",
              variant: "green",
            },
          ],
          inputFields: [
            {
              name: "text",
              description: "Text that you want to save",
              required: true,
            },
            {
              name: "filename_prefix",
              description: "Prefix for the filename",
              required: true,
            },
            {
              name: "file_type",
              description: "txt, json, or md",
              required: true,
            },
            {
              name: "output_id",
              description: "Unique identifier for this output",
              required: true,
            },
          ],
        },
      ],
    },
    {
      id: "number",
      title: "Number",
      icon: "Sigma",
      nodes: [
        {
          title: "External Number",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_number.jpg",
          description:
            "The External Number node allows you to input numeric values.",
          type: "ComfyUIDeployExternalNumber",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description: "Default value for the input",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
        },
        {
          title: "External Number Slider",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_number_slider.jpg",
          description:
            "The External Number Slider node allows you to input numeric values with a slider (with min and max values).",
          type: "ComfyUIDeployExternalNumberSlider",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
            {
              icon: "SlidersHorizontal",
              text: "Slider",
              variant: "purple",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description: "Default value for the input",
              required: false,
            },
            {
              name: "min_value",
              description: "Minimum value for the slider",
              required: true,
            },
            {
              name: "max_value",
              description: "Maximum value for the slider",
              required: true,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
        },
        {
          title: "External Number (Integer)",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_number_int.jpg",
          description:
            "The External Number Int node allows you to input integer values.",
          type: "ComfyUIDeployExternalNumberInt",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description:
                "Default value for the input. \n Range is -2147483647 to 2147483647.",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
        },
      ],
    },
    {
      id: "media",
      title: "Media",
      icon: "Video",
      nodes: [
        {
          title: "External Audio",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_audio.jpg",
          description:
            "The External Audio node allows you to accept audio files as input.",
          type: "ComfyUIDeployExternalAudio",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description: "Default value for the input",
              required: false,
            },
            {
              name: "audio_file",
              description: "URL for default image input",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
        },
        {
          title: "External Video",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_video.jpg",
          description:
            "The External Video Input node allows accepting video files through the API or playground. It supports common video formats like MP4, WebM, MKV and GIF.",
          type: "ComfyUIDeployExternalVideo",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description: "Default value for the input",
              required: false,
            },
            {
              name: "meta_batch",
              description: "The batch processing configuration",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
          alert: {
            title: "ComfyUI-VideoHelperSuite",
            description:
              "This node is usually used with ComfyUI-VideoHelperSuite.",
          },
        },
      ],
    },
    {
      id: "generate",
      title: "Model & Generation Control",
      icon: "Sparkles",
      nodes: [
        {
          title: "External Seed",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_seed.jpg",
          description:
            "The External Seed node allows you to input seed values.",
          type: "ComfyUIDeployExternalSeed",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description:
                "Default value for the input. Check out the alert below for more details.",
              required: true,
            },
            {
              name: "min_value",
              description: "Minimum value for the seed",
              required: false,
            },
            {
              name: "max_value",
              description: "Maximum value for the seed",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
          alert: {
            title: "How it works",
            description:
              'For default value:\n"-1" (i.e. not in range): Randomize within the min and max value range.\nin range: Fixed, always the same value',
          },
        },
        {
          title: "External Lora",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_lora.jpg",
          description:
            "The External Lora node allows you to dynamically load LoRA models into your workflow.",
          type: "ComfyUIDeployExternalLora",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_lora_name",
              description:
                "The default LoRA model to use if no input is provided",
              required: false,
            },
            {
              name: "lora_save_name",
              description:
                "Name to save downloaded LoRA as (when loading from URL)",
              required: false,
            },
            {
              name: "lora_url",
              description: "URL to download LoRA from",
              required: false,
            },
            {
              name: "bearer_token",
              description: "Bearer token for private LoRA models",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
        },
        {
          title: "External Checkpoint",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_checkpoint.jpg",
          description: "Allows you to change the checkpoint model.",
          type: "ComfyUIDeployExternalCheckpoint",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description: "The default checkpoint model to use",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
        },
      ],
    },
    {
      id: "type",
      title: "Basic Types",
      icon: "TypeOutline",
      nodes: [
        {
          title: "External Boolean",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_boolean.jpg",
          description: "Let's you expose a boolean input to your workflow.",
          type: "ComfyUIDeployExternalBoolean",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description: "The default boolean value to use",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
        },
        {
          title: "External Enum",
          imageUrl:
            "https://cd-misc.s3.us-east-2.amazonaws.com/external+nodes/external_enum.jpg",
          description: "Let's you expose an enum input to your workflow.",
          type: "ComfyUIDeployExternalEnum",
          badges: [
            {
              icon: "FileInput",
              text: "Input",
              variant: "orange",
            },
          ],
          inputFields: [
            {
              name: "input_id",
              description: "Unique identifier for this input",
              required: true,
            },
            {
              name: "default_value",
              description: "The default enum value to use",
              required: false,
            },
            {
              name: "options",
              description:
                "The enum options to use. \n Format is ['option1', 'option2', 'option3']",
              required: false,
            },
            {
              name: "display_name",
              description: "Name shown in the playground",
              required: false,
            },
            {
              name: "description",
              description: "Explains the purpose of this input",
              required: false,
            },
          ],
          alert: {
            title: "Be careful of the format",
            description:
              "The options should be in the format of ['option1', 'option2', 'option3'].\nMake sure default value is in the options.",
          },
        },
      ],
    },
  ],
};

// Helper function to get icon components from string names
const getIconComponent = (iconName: string) => {
  const icons = {
    Image,
    Type,
    Sigma,
    Video,
    Sparkles,
    TypeOutline,
    FileInput,
    FileOutput,
    SlidersHorizontal,
  };
  return icons[iconName as keyof typeof icons];
};

export function ExternalNodeDocs() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter groups and nodes based on search term
  const filteredGroups = inputs.groups
    .map((group) => ({
      ...group,
      nodes: group.nodes.filter(
        (node) =>
          node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.description.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    }))
    .filter((group) => group.nodes.length > 0);

  return (
    <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent overflow-y-auto overflow-x-hidden">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 border-b bg-white px-0.5 py-3">
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-9"
          />
          {searchTerm && (
            <X
              className="-translate-y-1/2 absolute top-1/2 right-3 h-3.5 w-3.5 cursor-pointer text-muted-foreground"
              onClick={() => setSearchTerm("")}
            />
          )}
        </div>
      </div>

      {/* Results */}
      <div className="p-1">
        {filteredGroups.length === 0 && searchTerm ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              No nodes found for "{searchTerm}"
            </p>
          </div>
        ) : (
          <Accordion
            type="multiple"
            className="w-full"
            defaultValue={
              searchTerm ? filteredGroups.map((g) => g.id) : ["image"]
            }
            value={searchTerm ? filteredGroups.map((g) => g.id) : undefined}
          >
            {filteredGroups.map((group) => {
              const GroupIcon = getIconComponent(group.icon);

              return (
                <AccordionItem key={group.id} value={group.id}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      {GroupIcon && <GroupIcon className="h-3.5 w-3.5" />}
                      {group.title}
                      <span className="ml-auto text-muted-foreground text-xs">
                        {group.nodes.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col">
                    {group.nodes.map((node, nodeIndex) => (
                      <NodeDocsTooltip
                        key={`${group.id}-${nodeIndex}`}
                        title={node.title}
                        description={node.description}
                        badges={node.badges.map((badge) => ({
                          icon: getIconComponent(badge.icon),
                          text: badge.text,
                          variant: badge.variant,
                        }))}
                        imageUrl={node.imageUrl}
                        inputFields={node.inputFields}
                        alertTitle={node.alert?.title}
                        alertDescription={node.alert?.description}
                        onAddNode={() => {
                          sendEventToCD("add_node", {
                            type: node.type,
                            ...(node.widgets_values && {
                              widgets_values: node.widgets_values,
                            }),
                          });
                        }}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}

interface InputField {
  name: string;
  description: string;
  required?: boolean;
}

interface BadgeConfig {
  icon?: any;
  text: string;
  variant?: string;
}

interface NodeDocsTooltipProps {
  title: string;
  description?: string;
  badges: BadgeConfig[];
  imageUrl?: string;
  inputFields: InputField[];
  alertTitle?: string;
  alertDescription?: string | React.ReactNode;
  onAddNode?: () => void;
}

function NodeDocsTooltip({
  title,
  description,
  badges = [{ text: "Input", icon: FileInput, variant: "orange" }],
  imageUrl,
  inputFields,
  alertTitle,
  alertDescription,
  onAddNode,
}: NodeDocsTooltipProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex cursor-auto items-center justify-between rounded-[8px] p-2 transition-colors hover:bg-gray-100">
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap font-medium text-xs">
                {title}
              </span>
              <div className="flex items-center gap-1">
                {badges.map((badge, index) => {
                  const BadgeIcon = badge.icon;
                  return (
                    <Badge
                      key={`${badge.text}-${index}`}
                      variant={badge.variant as any}
                      className="flex items-center gap-1"
                    >
                      {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5" />}
                      {badge.text}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Button size="xs" className="gap-1" onClick={onAddNode}>
              Add node <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={15}
          className="flex max-w-[400px] flex-col gap-2 border-none p-0"
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="w-full rounded-t-[10px]"
            />
          )}
          {description && (
            <>
              <p className="mt-2 px-4 text-gray-600 text-xs leading-5">
                {description}
              </p>
              <Separator className="mx-auto my-2 max-w-20" />
            </>
          )}
          <div className="flex flex-col gap-2 p-3 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 w-[120px] pl-1 text-xs">
                    Input
                  </TableHead>
                  <TableHead className="h-8 pl-1 text-xs">
                    Description
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inputFields.map((field) => (
                  <TableRow key={field.name}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {field.name}
                        </span>
                        {field.required && (
                          <Badge variant="rose" className="!text-[10.5px] py-0">
                            Required
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-pre-line text-xs leading-5">
                      {field.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {alertTitle && (
              <Alert className="max-w-[400px] border-l-2 border-l-orange-500 bg-orange-50">
                <AlertCircle className="!text-orange-500 h-3.5 w-3.5" />
                <AlertTitle>{alertTitle}</AlertTitle>
                {alertDescription && (
                  <AlertDescription className="text-gray-600 text-xs leading-snug">
                    {alertDescription}
                  </AlertDescription>
                )}
              </Alert>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
