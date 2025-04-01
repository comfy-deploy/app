import Dexie, { type EntityTable } from "dexie";

interface DexieCurrentPlan {
  id: string;
  plan?: string;
}

const dexisDB = new Dexie("ComfyDeploy") as Dexie & {
  plans: EntityTable<DexieCurrentPlan, "id">;
};

dexisDB.version(1).stores({
  plans: "id, plan",
});

export type { DexieCurrentPlan };
export { dexisDB };
