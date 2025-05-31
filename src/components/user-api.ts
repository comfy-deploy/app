import { api } from "@/lib/api";

type updateUserSettings = {
  api_version: "v1" | "v2";
  custom_output_bucket: boolean;
  hugging_face_token: string | null;
  output_visibility: "public" | "private";
  s3_access_key_id: string | null;
  s3_secret_access_key: string | null;
  s3_bucket_name: string | null;
  s3_region: string | null;
  spend_limit: number;
  assumed_role_arn: string | null;
};
export async function updateUser(body: Partial<updateUserSettings>) {
  if (!body) {
    throw new Error("Body is required");
  }
  await api({
    url: "platform/user-settings",
    init: {
      method: "PUT",
      body: JSON.stringify(body),
    },
  });
}
