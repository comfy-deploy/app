"use client";

import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { Check, Plus, Save, X } from "lucide-react";
import * as React from "react";
import type { UnknownKeysParam, ZodObject, ZodRawShape, z } from "zod";
import AutoForm, { AutoFormSubmit } from "../auto-form/index";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { Dependency, FieldConfig } from "./types";

type DataModalProps<
  K extends ZodRawShape,
  Y extends UnknownKeysParam,
  Z extends ZodObject<K, Y>,
> = {
  hideButton?: boolean;
  trigger?: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  tooltip?: string;
  disabled?: boolean;
  title: React.ReactNode;
  buttonTitle?: React.ReactNode;
  description: React.ReactNode;
  dialogClassName?: string;
  data?: z.infer<Z>;
  serverAction: (data: z.infer<Z>) => Promise<unknown>;
  mutateFn?: () => Promise<unknown>;
  formSchema: Z;
  fieldConfig?: FieldConfig<z.infer<Z>>;
  buttonVarian?: Parameters<typeof Button>[0]["variant"];
  values?: Partial<z.infer<Z>>;
  setValues?: (values: Partial<z.infer<Z>>) => void;
  extraButtons?: React.ReactNode;
  dependencies?: Dependency<z.infer<Z>>[];
  extraUI?: React.ReactNode;
  keepDialogWhenSubmit?: boolean;
  children?: React.ReactNode;
  containerClassName?: string;
};

export function useConfirmServerActionDialog<T>(props: {
  title: React.ReactNode;
  description: React.ReactNode;
  action: (data: T) => Promise<unknown>;
  mutateFn?: () => Promise<unknown>;
  ui?: React.ReactNode;
}) {
  const [data, setData] = React.useState<T>();
  const [inProgress, setInProgress] = React.useState(false);
  const dialog = (
    <Dialog open={!!data} onOpenChange={() => setData(undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        {props.ui}
        <div className="flex justify-end gap-2">
          <Button
            disabled={inProgress}
            variant={"expandIconOutline"}
            Icon={X}
            iconPlacement="right"
            onClick={async () => {
              setData(undefined);
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={"expandIcon"}
            Icon={Check}
            onClick={async () => {
              if (!data) return;
              setInProgress(true);
              await callServerPromise(props.action(data));
              if (props.mutateFn) {
                await props.mutateFn();
              }
              setInProgress(false);
              setData(undefined);
            }}
            iconPlacement="right"
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
  return { open: !!data, setOpen: setData, dialog };
}

export function useUpdateServerActionDialog<
  K extends ZodRawShape,
  Y extends UnknownKeysParam,
  Z extends ZodObject<K, Y>,
>(props: DataModalProps<K, Y, Z>) {
  const [data, setData] = React.useState<z.infer<Z>>();

  const ui = (
    <UpdateModal
      {...props}
      values={data}
      data={data}
      setValues={(values) => setData(values as z.infer<Z>)}
      open={!!data}
      setOpen={(open) => {
        if (!open) {
          setData(undefined);
        }
      }}
    />
  );

  return { open: !!data, setOpen: setData, ui };
}

export function InlineAutoForm<
  K extends ZodRawShape,
  Y extends UnknownKeysParam,
  Z extends ZodObject<K, Y>,
>(
  props: Omit<DataModalProps<K, Y, Z>, "title" | "description"> & {
    className?: string;
  },
) {
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <AutoForm
      className={props.className}
      dependencies={props.dependencies}
      values={props.data}
      fieldConfig={props.fieldConfig}
      formSchema={props.formSchema}
      onSubmit={async (data) => {
        // console.log(data);
        setIsLoading(true);
        await props.serverAction(data);
        if (props.mutateFn) {
          await props.mutateFn();
        }
        setIsLoading(false);
      }}
      onValuesChange={props.setValues}
    >
      <div className="flex justify-end">
        <Button
          type="submit"
          variant={"expandIcon"}
          isLoading={isLoading}
          Icon={Plus}
          iconPlacement="right"
        >
          {props.buttonTitle ?? "Create"}
        </Button>
      </div>
    </AutoForm>
  );
}

export function Modal(props: {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  title: string;
  description: string;
  dialogClassName?: string;
  trigger?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [_open, _setOpen] = React.useState(false);
  const open = props.open ?? _open;
  const setOpen = props.setOpen ?? _setOpen;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {props.trigger ? (
        <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      ) : undefined}
      <DialogContent className={cn("sm:max-w-[425px]", props.dialogClassName)}>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        {props.children}
      </DialogContent>
    </Dialog>
  );
}

export function InsertModal<
  K extends ZodRawShape,
  Y extends UnknownKeysParam,
  Z extends ZodObject<K, Y>,
>(props: DataModalProps<K, Y, Z>) {
  const [_open, _setOpen] = React.useState(false);
  const open = props.open ?? _open;
  const setOpen = props.setOpen ?? _setOpen;

  const [isLoading, setIsLoading] = React.useState(false);

  const trigger = props.trigger ?? (
    <Button
      variant={props.buttonVarian ?? "default"}
      className={props.disabled ? "opacity-50" : ""}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (props.disabled) return;
        setOpen(true);
      }}
    >
      {props.buttonTitle ?? props.title}
    </Button>
  );

  const ui = !props.hideButton ? (
    <>
      {props.tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>
            <p>{props.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
    </>
  ) : (
    <></>
  );

  // const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {ui}
      <DialogContent
        className={cn(
          "grid max-h-[calc(100vh-10rem)] grid-rows-[auto,1fr] sm:max-w-[600x]",
          props.dialogClassName,
        )}
      >
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <AutoForm
          containerClassName={props.containerClassName}
          dependencies={props.dependencies}
          values={props.data}
          fieldConfig={props.fieldConfig}
          formSchema={props.formSchema}
          extraUI={props.extraUI}
          onSubmit={async (data) => {
            setIsLoading(true);
            await props.serverAction(data);
            // await callServerPromise(props.serverAction(data), {
            //     router: router,
            // });
            if (props.mutateFn) {
              await props.mutateFn();
            }
            setIsLoading(false);
            if (!props.keepDialogWhenSubmit) {
              setOpen(false);
            }
          }}
          onValuesChange={props.setValues}
        >
          <div className="flex justify-end">
            <Button
              type="submit"
              variant={"expandIcon"}
              isLoading={isLoading}
              Icon={Plus}
              iconPlacement="right"
            >
              Create
            </Button>
          </div>
        </AutoForm>
        {/* </ScrollArea> */}
      </DialogContent>
    </Dialog>
  );
}

export function UpdateModal<
  K extends ZodRawShape,
  Y extends UnknownKeysParam,
  Z extends ZodObject<K, Y>,
>(props: DataModalProps<K, Y, Z>) {
  const [_open, _setOpen] = React.useState(false);
  const open = props.open ?? _open;
  const setOpen = props.setOpen ?? _setOpen;

  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {props.trigger ?? (
        <DialogTrigger
          className="appearance-none hover:cursor-pointer"
          asChild
          onClick={() => {
            setOpen(true);
          }}
        >
          {props.trigger}
        </DialogTrigger>
      )}
      <DialogContent
        className={cn(
          "grid max-h-[calc(100vh-10rem)] grid-rows-[auto,1fr] sm:max-w-[600x]",
          props.dialogClassName,
        )}
      >
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <AutoForm
          // onValuesChange={(values) => {
          //   console.log("changed", values);
          // }}
          dependencies={props.dependencies}
          values={props.data}
          fieldConfig={props.fieldConfig}
          formSchema={props.formSchema}
          onSubmit={async (data) => {
            setIsLoading(true);
            // await callServerPromise(
            await props.serverAction({
              ...data,
              id: props.data?.id,
            });
            // router: router,
            // }
            // );
            if (props.mutateFn) {
              await props.mutateFn();
            }
            setIsLoading(false);
            if (!props.keepDialogWhenSubmit) {
              setOpen(false);
            }
          }}
        >
          {props.extraUI}
          {props.children}
          <div className="flex flex-wrap justify-end gap-2">
            {props.extraButtons}
            <Button
              type="submit"
              variant={"expandIcon"}
              isLoading={isLoading}
              Icon={Save}
              iconPlacement="right"
            >
              {props.buttonTitle ?? "Save Changes"}
            </Button>
          </div>
        </AutoForm>
      </DialogContent>
    </Dialog>
  );
}

export function UpdateForm<
  K extends ZodRawShape,
  Y extends UnknownKeysParam,
  Z extends ZodObject<K, Y>,
>(props: {
  data: z.infer<Z> & {
    id: string;
  };
  serverAction: (
    data: z.infer<Z> & {
      id: string;
    },
  ) => Promise<unknown>;
  mutateFn?: () => Promise<unknown>;
  formSchema: Z;
  fieldConfig?: FieldConfig<z.infer<Z>>;
  trigger?: React.ReactNode;
  extraButtons?: React.ReactNode;
  dependencies?: Dependency<z.infer<Z>>[];
}) {
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <AutoForm
      dependencies={props.dependencies}
      values={props.data}
      fieldConfig={props.fieldConfig}
      formSchema={props.formSchema}
      onSubmit={async (data) => {
        setIsLoading(true);
        // await callServerPromise(
        await props.serverAction({
          ...data,
          id: props.data.id,
        });
        if (props.mutateFn) {
          await props.mutateFn();
        }
        setIsLoading(false);
        // setOpen(false);
      }}
    >
      <div className="flex flex-wrap justify-end gap-2">
        {props.extraButtons}
        <Button type="submit" isLoading={isLoading}>
          Save Changes
        </Button>
      </div>
    </AutoForm>
  );
}
