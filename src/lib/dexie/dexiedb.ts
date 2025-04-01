import Dexie, { type EntityTable } from "dexie";

interface DexieCurrentPlan {
  id: string;
  plan?: string;
}

interface WorkflowData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  pinned: boolean;
  org_id: string;
  cover_image: string | null;
  user_name: string;
  user_id: string;
  user_icon: string;
}

interface DexieWorkflows {
  id: string;
  workflows: WorkflowData[];
  timestamp: number;
}

const dexieDB = new Dexie("ComfyDeploy") as Dexie & {
  plans: EntityTable<DexieCurrentPlan, "id">;
  workflows: EntityTable<DexieWorkflows, "id">;
};

dexieDB.version(1).stores({
  plans: "id, plan",
  workflows: "id, timestamp",
});

export type { DexieCurrentPlan, DexieWorkflows, WorkflowData };
export { dexieDB };
