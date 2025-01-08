import type { DataTableFilterField } from "@/components/data-table/types";
import { GPU, ORIGIN, STATUS } from "@/constants/run-data-enum";
import type { ColumnSchema } from "./schema";

export const filterFields = [
  {
    label: "Time Range",
    value: "created_at",
    type: "timerange",
    defaultOpen: true,
    commandDisabled: true,
  },
  {
    label: "GPU",
    value: "gpu",
    type: "checkbox",
    options: GPU.map((gpu) => ({ label: gpu, value: gpu })),
  },
  {
    label: "Status",
    value: "status",
    type: "checkbox",
    options: STATUS.map((status) => ({ label: status, value: status })),
  },
  {
    label: "Origin",
    value: "origin",
    type: "checkbox",
    options: ORIGIN.map((origin) => ({ label: origin, value: origin })),
  },
  {
    label: "Workflow",
    value: "workflow_id",
    type: "input",
    options: [{ label: "", value: "" }], // REMINDER: this is a placeholder to set the type in the client.tsx
  },
  {
    label: "Run Duration",
    value: "duration",
    type: "slider",
    min: 0,
    max: 300,
    options: [{ label: "10", value: 10 }], // REMINDER: this is a placeholder to set the type in the client.tsx
  },
] satisfies DataTableFilterField<ColumnSchema>[];
