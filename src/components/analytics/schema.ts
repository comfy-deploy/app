import { GPU, ORIGIN, STATUS } from "@/constants/run-data-enum";
import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
} from "@/lib/delimiters";
import { z } from "zod";

export const columnSchema = z.object({
  id: z.string(),
  created_at: z.date(),
  gpu: z.enum(GPU),
  status: z.enum(STATUS),
  origin: z.enum(ORIGIN),
  workflow_id: z.string(),
  workflow: z.object({
    id: z.string(),
    name: z.string(),
  }),
  machine: z.object({
    name: z.string(),
  }),
  workflow_version: z.string(),
  duration: z.number(),
});

export type ColumnSchema = z.infer<typeof columnSchema>;

export const columnFilterSchema = z.object({
  status: z
    .string()
    .transform((val) => val.split(ARRAY_DELIMITER))
    .pipe(z.enum(STATUS).array())
    .optional(),
  date: z
    .string()
    .transform((val) => val.split(RANGE_DELIMITER).map(Number))
    .pipe(z.coerce.date().array())
    .optional(),
  gpu: z
    .string()
    .transform((val) => val.split(ARRAY_DELIMITER))
    .pipe(z.enum(GPU).array())
    .optional(),
  origin: z
    .string()
    .transform((val) => val.split(ARRAY_DELIMITER))
    .pipe(z.enum(ORIGIN).array())
    .optional(),
  workflow_id: z.string().optional(),
  duration: z
    .string()
    .transform((val) => val.split(SLIDER_DELIMITER))
    .pipe(z.coerce.number().array().max(2))
    .optional(),
});

export type ColumnFilterSchema = z.infer<typeof columnFilterSchema>;
