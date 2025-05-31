import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type DialogTemplateProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  onCancel: () => void;
  cancelText?: string;
  onConfirm: () => void;
  confirmText?: string;
  onConfirmBtnProps?: ButtonProps;
  children?: ReactNode;
  workflowName: string;
};

export function DialogTemplate(props: DialogTemplateProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className={cn("sm:max-w-[425px]")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {props.title}{" "}
            <Badge variant={"secondary"}>{props.workflowName}</Badge>
          </DialogTitle>
          {props.description && (
            <DialogDescription className="text-primary">
              {props.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            props.onConfirm();
          }}
        >
          {props.children && <div className="pb-2">{props.children}</div>}
          <div className="flex w-full justify-end gap-2">
            <Button
              className="w-fit"
              variant={"outline"}
              onClick={() => props.onCancel}
            >
              {props.cancelText || "Cancel"}
            </Button>
            <Button
              type="submit"
              {...props.onConfirmBtnProps}
              className={cn("w-fit", props.onConfirmBtnProps?.className)}
            >
              {props.confirmText || "Confirm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
