import { useCurrentPlan } from "@/hooks/use-current-plan";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { InlineAutoForm } from "./auto-form/auto-form-dialog";
import { DependencyType } from "./auto-form/types";
import { updateUser } from "./user-api";

export function UserSettings() {
  const sub = useCurrentPlan();
  const DEFAULT_MAX_SPEND_LIMIT = sub?.plans ? 1000 : 5;
  const { data: userSettings } = useUserSettings();

  const enableStorage = userSettings?.enable_custom_output_bucket;

  return (
    <div className={cn("mx-auto max-w-lg py-10")}>
      {!sub?.plans?.plans && (
        <div className="mb-4 border-yellow-400 border-l-4 bg-yellow-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Settings are disabled for free tier users. Please upgrade your
                plan to access these features.
              </p>
            </div>
          </div>
        </div>
      )}
      <InlineAutoForm
        className={cn(
          !sub?.plans?.plans && "disabled pointer-events-none opacity-50",
        )}
        buttonTitle="Save"
        formSchema={z.object({
          output_visibility: z
            .enum(["public", "private"])
            .default("public")
            .describe("Output Visibility"),
          custom_output_bucket: z
            .boolean()
            .default(false)
            .optional()
            .describe("Enable Custom Output Bucket"),
          s3_access_key_id: z
            .string()
            .optional()
            .describe("S3 Access Key ID")
            .nullable(),
          s3_secret_access_key: z
            .string()
            .optional()
            .describe("S3 Secret Access Key")
            .nullable(),
          s3_bucket_name: z
            .string()
            .optional()
            .describe("S3 Bucket Name")
            .nullable(),
          s3_region: z.string().optional().describe("S3 Region").nullable(),
          spend_limit: z.coerce
            .number()
            .default(5.0)
            .describe("Workspace budget (maximum usage per billing period)"),
          hugging_face_token: z
            .string()
            .optional()
            .describe("Hugging Face Token")
            .nullable(),
        })}
        data={userSettings}
        serverAction={async (data) => {
          if (!sub?.plans) {
            toast.error("Settings are disabled for free tier users.");
            return userSettings;
          }

          if (
            data?.spend_limit &&
            Number(data.spend_limit) >
              (userSettings?.max_spend_limit || DEFAULT_MAX_SPEND_LIMIT)
          ) {
            toast.error(
              `Spend limit cannot be greater than ${
                userSettings?.max_spend_limit || DEFAULT_MAX_SPEND_LIMIT
              }. Please contact us via Email or Discord DM to raise this limit.`,
            );
            return;
          }
          await updateUser(data);
        }}
        dependencies={[
          {
            type: DependencyType.DISABLES,
            sourceField: "custom_output_bucket",
            targetField: [
              "s3_access_key_id",
              "s3_bucket_name",
              "s3_region",
              "s3_secret_access_key",
            ],
            when(sourceFieldValue, targetFieldValue) {
              return !sourceFieldValue;
            },
          },
        ]}
        fieldConfig={{
          custom_output_bucket: {
            fieldType: "switch",
            group: "Storage Settings [Business]",
            renderParent: (props) => {
              return (
                <div
                  className={
                    !enableStorage ? "pointer-events-none opacity-50" : ""
                  }
                >
                  {props.children}
                </div>
              );
            },
          },
          spend_limit: {
            fieldType: "number",
            inputProps: {
              min: 0,
              step: 0.01,
              max: userSettings?.max_spend_limit || DEFAULT_MAX_SPEND_LIMIT,
              required: true,
            },
            description: (
              <>
                {`The budget of this workspace is limited to
                  `}
                <strong>{`$${
                  userSettings?.max_spend_limit || DEFAULT_MAX_SPEND_LIMIT
                }`}</strong>
                {`. To raise this limit, please
                  contact us via Email or `}
                <a
                  href="https://discord.gg/ygb6VZwaMt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline hover:text-blue-600"
                >
                  Discord
                </a>
                {" DM. "}
                <br />
                <p className="text-gray-500 text-xs italic">
                  {`
                  Note: Only works for v2 API.
                  `}
                </p>
              </>
            ),
          },
          output_visibility: {
            group: "Storage Settings [Business]",
            renderParent: (props) => {
              return (
                <div
                  className={
                    !enableStorage ? "pointer-events-none opacity-50" : ""
                  }
                >
                  {props.children}
                </div>
              );
            },
          },
          s3_secret_access_key: {
            group: "Storage Settings [Business]",
          },
          s3_access_key_id: {
            group: "Storage Settings [Business]",
          },
          s3_bucket_name: {
            group: "Storage Settings [Business]",
          },
          s3_region: {
            group: "Storage Settings [Business]",
          },
          hugging_face_token: {
            fieldType: "fallback",
            group: "Hugging Face [Business]",
            inputProps: {
              type: "password",
            },
            description: (
              <>
                <Link
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline hover:text-blue-600"
                >
                  Hugging Face token
                </Link>
                {" is used to install private models from Hugging Face."}
              </>
            ),
          },
        }}
      />
    </div>
  );
}
