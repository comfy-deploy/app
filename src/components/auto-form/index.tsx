"use client";
import React, { type RefObject } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import type { z } from "zod";
import { Form } from "../ui/form";

import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";
import AutoFormObject from "./fields/object";
import type { Dependency, FieldConfig } from "./types";
import {
  type ZodObjectOrWrapped,
  getDefaultValues,
  getObjectFormSchema,
} from "./utils";
// import { AutoFormValueProvider } from "@/components/InsertModal";

export function AutoFormSubmit({
  children,
  className,
  disabled,
  isLoading,
}: {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  return (
    <Button
      type="submit"
      disabled={disabled}
      className={className}
      isLoading={isLoading}
    >
      {children ?? "Submit"}
    </Button>
  );
}

function AutoForm<SchemaType extends ZodObjectOrWrapped>({
  formSchema,
  formRef,
  values: valuesProp,
  onValuesChange: onValuesChangeProp,
  onParsedValuesChange,
  onSubmit: onSubmitProp,
  fieldConfig,
  children,
  className,
  dependencies,
  extraUI,
  containerClassName,
}: {
  formSchema: SchemaType;
  formRef?: RefObject<HTMLFormElement>;
  values?: Partial<z.infer<SchemaType>>;
  onValuesChange?: (values: Partial<z.infer<SchemaType>>) => void;
  onParsedValuesChange?: (values: Partial<z.infer<SchemaType>>) => void;
  onSubmit?: (values: z.infer<SchemaType>) => void;
  fieldConfig?: FieldConfig<z.infer<SchemaType>>;
  children?: React.ReactNode;
  className?: string;
  dependencies?: Dependency<z.infer<SchemaType>>[];
  extraUI?: React.ReactNode;
  containerClassName?: string;
}) {
  const objectFormSchema = getObjectFormSchema(formSchema);
  const defaultValues: DefaultValues<z.infer<typeof objectFormSchema>> | null =
    getDefaultValues(objectFormSchema, fieldConfig);

  const form = useForm<z.infer<typeof objectFormSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? undefined,
    values: valuesProp,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const parsedValues = formSchema.safeParse(values);
    if (parsedValues.success) {
      onSubmitProp?.(parsedValues.data);
    }
  }

  const values = form.watch();
  // valuesString is needed because form.watch() returns a new object every time
  const valuesString = JSON.stringify(values);

  React.useEffect(() => {
    onValuesChangeProp?.(values);
    const parsedValues = formSchema.safeParse(values);
    if (parsedValues.success) {
      onParsedValuesChange?.(parsedValues.data);
    }
  }, [valuesString]);

  return (
    <Form {...form}>
      <ScrollArea>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit(onSubmit)(e);
          }}
          className={cn("mb-10 space-y-5", className)}
        >
          {extraUI && (
            <div className="sticky top-0 z-10 bg-background">{extraUI}</div>
          )}
          <div className="flex w-full flex-col gap-2 p-4 px-1">
            <AutoFormObject
              className={containerClassName}
              schema={objectFormSchema}
              form={form}
              dependencies={dependencies}
              fieldConfig={fieldConfig}
            />
          </div>
          <div className="absolute right-2 bottom-2 w-full">{children}</div>
        </form>
      </ScrollArea>
    </Form>
  );
}

export default AutoForm;
