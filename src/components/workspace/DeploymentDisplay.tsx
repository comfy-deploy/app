"use client";

import { CodeBlock } from "@/components/ui/code-blocks";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInputsFromWorkflow } from "@/lib/getInputsFromWorkflow";
// import type { findAllDeployments } from "@/server/findAllRuns";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Copy,
  Droplets,
  ExternalLink,
  Gauge,
  Server,
  Settings,
} from "lucide-react";
import { DeploymentRow } from "./DeploymentRow";
// import { SharePageSettings } from "@/components/SharePageSettings";
import Steps from "./Steps";
// import { Docs } from "./Docs";

import { useSelectedDeploymentStore } from "@/components/deployment/deployment-page";
// import type { ModelListComponent } from "@/components/modelFal/ModelsList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMachine } from "@/hooks/use-machine";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MyDrawer } from "../drawer";
import { useGPUConfig } from "../machine/machine-schema";
import {
  GPUSelectBox,
  MaxAlwaysOnSlider,
  MaxParallelGPUSlider,
  WarmTime,
  WorkflowTimeOut,
} from "../machine/machine-settings";
import type { GpuTypes } from "../onboarding/workflow-machine-import";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { LoadingIcon } from "../ui/custom/loading-icon";
import { Input } from "../ui/input";
// import {
//   CreateDeploymentButton,
//   CreateDeploymentButtonV2,
// } from "./VersionSelect";
import { getEnvColor } from "./ContainersTable";
import { useWorkflowDeployments } from "./ContainersTable";
// import { useFeatureFlags } from "@/components/FeatureFlagsProvider";
import { NewStepper } from "./StaticStepper";
import { VersionDetails } from "./VersionDetails";
import ApiPlaygroundDemo from "../api-playground-demo";

const curlTemplate = `
curl --request POST \
  --url <URL> \
  --header "Content-Type: application/json" \
  --data "{
  "deployment_id": "<ID>"
}"
`;

const curlTemplate_checkStatus = `
curl --request GET \
  --url "<URL>/api/run?run_id=xxx" \
  --header "Content-Type: application/json"
`;

const jsTemplate = `
const { run_id } = await fetch("<URL>", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + process.env.COMFY_DEPLOY_API_KEY,
  },
  body: JSON.stringify({
    deployment_id: "<ID>",
    webhook: "<your-server-url>/api/webhook", // optional
    inputs: {}
  }),
}).then(response => response.json())
`;

const jsTemplate_checkStatus = `
const run_id = "<RUN_ID>";

const output = fetch("<URL>?run_id=" + run_id, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + process.env.COMFY_DEPLOY_API_KEY,
  },
}).then(response => response.json())
`;

const jsClientSetupTemplate = `
const client = new ComfyDeploy({
  serverURL: "<URLONLY>",
  bearerAuth: process.env.COMFY_DEPLOY_API_KEY!,
});
`;

const jsClientSetupTemplateHostedVersion = `
const client = new ComfyDeploy({
  bearerAuth: process.env.COMFY_DEPLOY_API_KEY!,
});
`;

const jsClientSetupTemplateV2 = `
const cd = new ComfyDeploy({
  bearer: process.env.COMFY_DEPLOY_API_KEY!,
});
`;

const jsClientSetupTemplateHostedVersionV2 = `
const cd = new ComfyDeploy({
  bearer: process.env.COMFY_DEPLOY_API_KEY!,
});
`;

const jsClientCreateRunTemplate = `
const result = await client.run.create({
  deploymentId: "<ID>",
  webhook: "<your-server-url>/api/webhook", // suggested
  inputs: {}
});

if (result) {
  const runId = result.runId
  // save runId to database
}
`;

const jsClientCreateRunTemplateModel = `
const result = await client.run.create({
  model_id: "<MODEL_ID>",
  webhook: "http://localhost:3000/api/webhook", // suggested
  inputs: {}
});

if (result) {
  const runId = result.runId
  // save runId to database
}
`;

const jsClientQueueRunTemplate = `
const result = await cd.run.deployment.queue({
  deploymentId: "<ID>",
  webhook: "<your-server-url>/api/webhook", // suggested
  inputs: {}
});

if (result) {
  const runId = result.runId
  // save runId to database
}
`;

const jsClientQueueRunTemplateModel = `
const result = await cd.run.deployment.queue({
  model_id: "<MODEL_ID>",
  webhook: "http://localhost:3000/api/webhook", // suggested
  inputs: {}
});

if (result) {
  const runId = result.runId
  // save runId to database
}
`;

const restClientQueueRunTemplateModel = `
fetch("<APIURLONLY>/api/run/deployment/queue", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + process.env.COMFY_DEPLOY_API_KEY,
  },
  body: JSON.stringify({
    deployment_id: "<ID>",
    webhook: "<your-server-url>/api/webhook", // optional
    inputs: {}
  })
})
  .then(response => response.json())
  .then(result => console.log(result))
  .catch(error => console.error(error));
`;

const jsClientQueueRunNoInputsTemplate = `
const { run_id } = await client.run.queue({
  deploymentId: "<ID>"
});
`;

const jsClientCreateRunNoInputsTemplate = `
const { run_id } = await client.run.create({
  deploymentId: "<ID>"
});
`;

const clientTemplate_checkStatus = `
const run = await client.run.get(run_id);
`;

const webhook_template = `
import { ComfyDeploy } from "comfydeploy";
import { NextResponse } from "next/server";

const cd = new ComfyDeploy();

export async function POST(request: Request) {
  const data = await cd.validateWebhook({ request });

  const { status, runId, outputs, liveStatus, progress } = data;

  // Do your things
  console.log(status, runId, outputs);

  // Return success to ComfyDeploy
  return NextResponse.json({ message: "success" }, { status: 200 });
}
`;

const polling_serverAction = `
"use server"

export async function checkStatus(run_id: string) {
  return await client.client.run.get({
    run_id: run_id,
  })
}
`;

const polling_clientEffects = `
"use client"

import { checkStatus } from "@/server/polling";

export function OutputRender() {
  // Polling in frontend to check for the result
  useEffect(() => {
    if (!runId) return;
    const interval = setInterval(() => {
      checkStatus(runId).then((res) => {
        if (res && res.status === "success") {
          console.log(res.outputs[0]?.data);
          // Depending on your workflows outputs
          setImage(res.outputs[0]?.data?.images?.[0].url ?? "");
          clearInterval(interval);
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  return <></>
}
`;

export interface Deployment {
  id: string;
  environment: string;
  workflow_id: string;
  workflow_version_id: string;
  gpu: GpuTypes;
  concurrency_limit: number;
  run_timeout: number;
  idle_timeout: number;
  keep_warm: number;
  modal_image_id?: string;
  version?: {
    version: number;
  };
  dub_link?: string;
  machine_id: string;
  share_slug?: string;
}

export function DeploymentDisplay({
  deployment,
  domain,
}: {
  deployment: any;
  domain: string;
}) {
  const workflowInput = getInputsFromWorkflow(deployment.version);

  // if (deployment.environment === "public-share") {
  //   return <SharePageDeploymentRow deployment={deployment} />;
  // }

  return (
    <Dialog>
      <DialogTrigger asChild className="appearance-none hover:cursor-pointer">
        <TableRow>
          <DeploymentRow deployment={deployment} />
        </TableRow>
      </DialogTrigger>
      <DialogContent className="flex h-fit max-h-[calc(100vh-10rem)] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {deployment.environment} Deployment
          </DialogTitle>
          <DialogDescription>Code for your deployment client</DialogDescription>
        </DialogHeader>

        {deployment.environment === "public-share" ? (
          <>
            <Card className="mx-auto mb-4 flex w-fit flex-col items-center justify-center gap-4 px-4 py-4 font-semibold text-sm md:flex-row md:py-2">
              <span>
                {" "}
                All new public shares will be visible in Explore Page!
              </span>
              <Button asChild>
                <Link href="/explore" target="_blank">
                  Explore
                </Link>
              </Button>
            </Card>
            {/* <SharePageSettings deployment={deployment} /> */}
          </>
        ) : (
          <ScrollArea className="flex w-full flex-col pr-4">
            <span className="mb-2 flex w-full flex-col justify-between gap-2">
              <div className="whitespace-nowrap text-sm">Deployment ID</div>
              <CodeBlock lang="bash" code={deployment.id} />
            </span>
            <Tabs defaultValue="client" className="w-full gap-2 text-sm">
              <TabsList className="mb-2 grid w-fit grid-cols-3">
                <TabsTrigger value="client">Server Client</TabsTrigger>
                <TabsTrigger value="js">NodeJS Fetch</TabsTrigger>
                <TabsTrigger value="curl">CURL</TabsTrigger>
              </TabsList>
              <TabsContent
                className="!mt-0 flex w-full flex-col gap-2"
                value="client"
              >
                <Steps
                  steps={[
                    {
                      title: "Install the typescript comfydeploy SDK",
                      content: (
                        <CodeBlock lang="bash" code={`npm i comfydeploy`} />
                      ),
                    },
                    {
                      title: "Initialize your client ",
                      content: (
                        <>
                          <span className="flex items-center gap-2">
                            You can get the api key here
                            <Button href={"/api-keys"} variant={"secondary"}>
                              Get API Keys <ArrowRight size={14} />
                            </Button>
                          </span>
                          <CodeBlock
                            lang="js"
                            code={formatCode({
                              codeTemplate:
                                domain === "https://www.comfydeploy.com"
                                  ? jsClientSetupTemplateHostedVersion
                                  : jsClientSetupTemplate,
                              deployment,
                              domain,
                              inputs: workflowInput,
                            })}
                          />
                        </>
                      ),
                    },
                    {
                      title: "Create a run via deployment id",
                      content: (
                        <CodeBlock
                          lang="js"
                          code={formatCode({
                            codeTemplate:
                              workflowInput && workflowInput.length > 0
                                ? jsClientCreateRunTemplate
                                : jsClientCreateRunNoInputsTemplate,
                            deployment,
                            domain,
                            inputs: workflowInput,
                          })}
                        />
                      ),
                    },
                    {
                      title: "Getting the run outputs",
                      content: (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="item-1">
                            <AccordionTrigger>
                              {" "}
                              <div className="flex gap-2">
                                Webhook{" "}
                                <Badge variant={"amber"}>Suggested</Badge>
                              </div>{" "}
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2">
                              <span>
                                Create a custom webhook endpoint, create a file
                                at <Badge>src/app/api/webhook/route.tx</Badge>
                              </span>
                              <CodeBlock
                                lang="js"
                                code={formatCode({
                                  codeTemplate: webhook_template,
                                  deployment,
                                  domain,
                                })}
                              />
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="item-2">
                            <AccordionTrigger>Polling Method</AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2">
                              <span>
                                Check the status of the run, and retrieve the
                                outputs, most of the case you will trigger it
                                from your front end to your backend every 5
                                seconds.
                              </span>
                              <span>
                                Create a file at{" "}
                                <Badge>src/app/server/polling.ts</Badge>
                              </span>
                              <CodeBlock
                                lang="js"
                                code={formatCode({
                                  codeTemplate: polling_serverAction,
                                  deployment,
                                  domain,
                                })}
                              />
                              <span>In your frontend component</span>
                              <CodeBlock
                                lang="js"
                                code={formatCode({
                                  codeTemplate: polling_clientEffects,
                                  deployment,
                                  domain,
                                })}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ),
                    },
                  ]}
                />

                {/* </Steps> */}
              </TabsContent>
              <TabsContent className="!mt-0 flex flex-col gap-2" value="js">
                Trigger the workflow
                <CodeBlock
                  lang="js"
                  code={formatCode({
                    codeTemplate: jsTemplate,
                    deployment,
                    domain,
                    inputs: workflowInput,
                  })}
                />
                Check the status of the run, and retrieve the outputs
                <CodeBlock
                  lang="js"
                  code={formatCode({
                    codeTemplate: jsTemplate_checkStatus,
                    deployment,
                    domain,
                  })}
                />
              </TabsContent>
              <TabsContent className="!mt-2 flex flex-col gap-2" value="curl">
                <CodeBlock
                  lang="bash"
                  code={formatCode({
                    codeTemplate: curlTemplate,
                    deployment,
                    domain,
                  })}
                />
                <CodeBlock
                  lang="bash"
                  code={formatCode({
                    codeTemplate: curlTemplate_checkStatus,
                    deployment,
                    domain,
                  })}
                />
              </TabsContent>
            </Tabs>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

export interface APIDocsProps {
  workflow_id: string;
  domain: string;
  model?: any;
  deployment_id?: string;
  header?: React.ReactNode;
}

export function APIDocs({
  workflow_id,
  domain,
  model,
  deployment_id,
  header,
}: APIDocsProps) {
  const { data: deployments } = useWorkflowDeployments(workflow_id);
  const [selectedDeployment, setSelectedDeployment] = useState<any>(null);

  useEffect(() => {
    if (deployments && deployments.length > 0) {
      const NonShareDeployment = deployments.filter(
        (deployment) => !deployment.environment.endsWith("share"),
      );

      setSelectedDeployment(
        NonShareDeployment.find((d) => d.id === deployment_id),
      );
    }
  }, [deployments, deployment_id]);

  if (!selectedDeployment) {
    return (
      <div className="flex items-center justify-center">
        <LoadingIcon />
      </div>
    );
  }

  const workflowInput = selectedDeployment
    ? getInputsFromWorkflow(selectedDeployment.version)
    : [];

  return (
    <div className="flex flex-col gap-4">
      {header}

      {/* {!model && (
        <VersionDetails
          workflow_version_id={selectedDeployment?.workflow_version_id}
        />
      )} */}

      {!(!model && deployments && deployments.length > 0) && (
        <Card className="p-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-muted-foreground text-xs">
              No deployments found
            </h2>
          </div>
        </Card>
      )}

      <Tabs defaultValue={"client2"} className="w-full gap-2 text-sm">
        <TabsList className="mb-2">
          <TabsTrigger value="client2">TypeScript</TabsTrigger>
          <TabsTrigger value="client3">REST</TabsTrigger>
          <TabsTrigger value="js">Other SDKs</TabsTrigger>
        </TabsList>
        <TabsContent
          className="!mt-0 flex w-full flex-col gap-2"
          value="client"
        >
          <NewStepper
            steps={[
              {
                title: "Install the typescript comfydeploy SDK",
                content: <CodeBlock lang="bash" code={"npm i comfydeploy"} />,
              },
              {
                title: "Initialize your client ",
                content: (
                  <>
                    <span className="flex w-full items-center justify-between gap-2">
                      You can get the api key here
                      <Button href={"/api-keys"} variant={"secondary"}>
                        Get API Keys <ArrowRight size={14} />
                      </Button>
                    </span>
                    <CodeBlock
                      lang="js"
                      code={formatCode({
                        codeTemplate:
                          domain === "https://www.comfydeploy.com"
                            ? jsClientSetupTemplateHostedVersion
                            : jsClientSetupTemplate,
                        deployment: selectedDeployment,
                        domain,
                        inputs: workflowInput,
                      })}
                    />
                  </>
                ),
              },
              {
                title: (
                  <div className="flex w-full items-center justify-between gap-2">
                    Create a run via deployment id{" "}
                    <Badge
                      className={cn(
                        getEnvColor(selectedDeployment?.environment),
                      )}
                    >
                      {selectedDeployment?.environment}
                    </Badge>
                  </div>
                ),
                content: (
                  <>
                    {model ? (
                      <CodeBlock
                        lang="js"
                        code={formatCode({
                          codeTemplate: jsClientCreateRunTemplateModel,
                          deployment: selectedDeployment,
                          domain,
                          inputs: model.inputs,
                          model_id: model.id,
                        })}
                        className="max-w-[500px]"
                      />
                    ) : (
                      <CodeBlock
                        lang="js"
                        code={formatCode({
                          codeTemplate:
                            workflowInput && workflowInput.length > 0
                              ? jsClientCreateRunTemplate
                              : jsClientCreateRunNoInputsTemplate,
                          deployment: selectedDeployment,
                          domain,
                          inputs: workflowInput,
                        })}
                      />
                    )}
                  </>
                ),
              },
              {
                title: "Getting the run outputs",
                content: (
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    defaultValue="item-1"
                  >
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        {" "}
                        <div className="flex gap-2">
                          Webhook <Badge variant={"amber"}>Suggested</Badge>
                        </div>{" "}
                      </AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-2">
                        <span>
                          Create a custom webhook endpoint, create a file at{" "}
                          <Badge>src/app/api/webhook/route.tsx</Badge>
                        </span>
                        <CodeBlock
                          lang="js"
                          code={formatCode({
                            codeTemplate: webhook_template,
                            deployment: selectedDeployment,
                            domain,
                          })}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Polling Method</AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-2">
                        <span>
                          Check the status of the run, and retrieve the outputs,
                          most of the case you will trigger it from your front
                          end to your backend every 5 seconds.
                        </span>
                        <span>
                          Create a file at{" "}
                          <Badge>src/app/server/polling.ts</Badge>
                        </span>
                        <CodeBlock
                          lang="js"
                          code={formatCode({
                            codeTemplate: polling_serverAction,
                            deployment: selectedDeployment,
                            domain,
                          })}
                        />
                        <span>In your frontend component</span>
                        <CodeBlock
                          lang="js"
                          code={formatCode({
                            codeTemplate: polling_clientEffects,
                            deployment: selectedDeployment,
                            domain,
                          })}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              },
            ]}
          />
        </TabsContent>
        <TabsContent
          className="!mt-0 flex w-full flex-col gap-2"
          value="client2"
        >
          <NewStepper
            steps={[
              {
                title: "Install the typescript comfydeploy SDK",
                content: (
                  <CodeBlock
                    className="text-xs"
                    lang="bash"
                    code={"npm i comfydeploy"}
                  />
                ),
              },
              {
                title: "Initialize your client",
                content: (
                  <>
                    <span className="flex w-full items-center justify-between gap-2">
                      You can get the api key here
                      <Button href={"/api-keys"} variant={"secondary"}>
                        Get API Keys <ArrowRight size={14} className="ml-1.5" />
                      </Button>
                    </span>
                    <CodeBlock
                      className="text-xs"
                      lang="js"
                      code={formatCode({
                        codeTemplate:
                          domain === "https://www.comfydeploy.com"
                            ? jsClientSetupTemplateHostedVersionV2
                            : jsClientSetupTemplateV2,
                        deployment: selectedDeployment,
                        domain,
                        inputs: workflowInput,
                      })}
                    />
                  </>
                ),
              },
              {
                title: (
                  <div className="flex w-full items-center justify-between gap-2">
                    Create a run via deployment id{" "}
                  </div>
                ),
                content: (
                  <>
                    {model ? (
                      <CodeBlock
                        lang="js"
                        code={formatCode({
                          codeTemplate: jsClientQueueRunTemplateModel,
                          deployment: selectedDeployment,
                          domain,
                          inputs: model.inputs,
                          model_id: model.id,
                        })}
                        className="max-w-[500px] text-xs"
                      />
                    ) : (
                      <CodeBlock
                        className="text-xs"
                        lang="js"
                        code={formatCode({
                          codeTemplate: jsClientQueueRunTemplate,
                          deployment: selectedDeployment,
                          domain,
                          inputs: workflowInput,
                        })}
                      />
                    )}
                  </>
                ),
              },
              {
                title: "Getting the run outputs",
                content: (
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    defaultValue="item-1"
                  >
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        {" "}
                        <div className="flex gap-2">
                          Webhook <Badge variant={"amber"}>Suggested</Badge>
                        </div>{" "}
                      </AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-2">
                        <span>
                          Create a custom webhook endpoint, create a file at{" "}
                          <Badge>src/app/api/webhook/route.tsx</Badge>
                        </span>
                        <CodeBlock
                          className="text-xs"
                          lang="js"
                          code={formatCode({
                            codeTemplate: webhook_template,
                            deployment: selectedDeployment,
                            domain,
                          })}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              },
            ]}
          />
        </TabsContent>
        <TabsContent
          className="!mt-0 flex w-full flex-col gap-2"
          value="client3"
        >
          <NewStepper
            steps={[
              {
                title: (
                  <div className="flex w-full items-center justify-between gap-2">
                    Create a run via deployment id{" "}
                    <Badge
                      variant="outline"
                      className={cn(
                        getEnvColor(selectedDeployment?.environment),
                      )}
                    >
                      {selectedDeployment?.environment}
                    </Badge>
                  </div>
                ),
                content: (
                  <>
                    {model ? (
                      <CodeBlock
                        lang="js"
                        code={formatCode({
                          codeTemplate: restClientQueueRunTemplateModel,
                          deployment: selectedDeployment,
                          domain,
                          inputs: model.inputs,
                          model_id: model.id,
                        })}
                        className="max-w-[500px] text-xs"
                      />
                    ) : (
                      <CodeBlock
                        className="text-xs"
                        lang="js"
                        code={formatCode({
                          codeTemplate: restClientQueueRunTemplateModel,
                          deployment: selectedDeployment,
                          domain,
                          inputs: workflowInput,
                        })}
                      />
                    )}
                  </>
                ),
              },
              {
                title: "Getting the run outputs",
                content: (
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full"
                    defaultValue="item-1"
                  >
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        {" "}
                        <div className="flex gap-2">
                          Webhook <Badge variant={"amber"}>Suggested</Badge>
                        </div>{" "}
                      </AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-2">
                        <span>
                          Create a custom webhook endpoint, create a file at{" "}
                          <Badge>src/app/api/webhook/route.tsx</Badge>
                        </span>
                        <CodeBlock
                          className="text-xs"
                          lang="js"
                          code={formatCode({
                            codeTemplate: webhook_template,
                            deployment: selectedDeployment,
                            domain,
                          })}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ),
              },
            ]}
          />
        </TabsContent>
        <TabsContent className="!mt-0 flex flex-col gap-2" value="js">
          <div className="mb-4 border-blue-500 border-l-4 bg-blue-100 p-4 text-blue-700">
            <p className="font-semibold">
              Looking for more detailed information?
            </p>
            <p>
              Check out our comprehensive documentation for in-depth guides and
              examples.
            </p>
            <a
              href="https://comfydeploy.com/docs"
              target="_blank"
              className="mt-2 inline-flex items-center text-blue-600 hover:underline"
              rel="noreferrer"
            >
              Visit our docs
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </div>
        </TabsContent>
        <TabsContent className="!mt-2 flex flex-col gap-2" value="curl">
          <CodeBlock
            lang="bash"
            code={formatCode({
              codeTemplate: curlTemplate,
              deployment: selectedDeployment,
              domain,
            })}
          />
          <CodeBlock
            lang="bash"
            code={formatCode({
              codeTemplate: curlTemplate_checkStatus,
              deployment: selectedDeployment,
              domain,
            })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function formatCode({
  codeTemplate,
  deployment,
  domain,
  inputs,
  inputsTabs,
  model_id,
}: {
  codeTemplate: string;
  domain: string;
  deployment?: any;
  inputs?: ReturnType<typeof getInputsFromWorkflow>;
  inputsTabs?: number;
  model_id?: string;
}) {
  if (inputs && inputs.length > 0) {
    codeTemplate = codeTemplate.replace(
      "inputs: {}",
      `inputs: ${JSON.stringify(
        Object.fromEntries(
          inputs.map((x) => {
            if (!x) return [""];
            // Check for specific class types that require a custom URL
            if (
              [
                "ComfyUIDeployExternalImage",
                "ComfyUIDeployExternalImageAlpha",
              ].includes(x.class_type)
            ) {
              return [x.input_id, "/* replace with your image url */"];
            }
            return [x.input_id, x.default_value ?? ""];
          }),
        ),
        null,
        2,
      )
        .split("\n")
        .map((line, index, array) => {
          if (index === 0) return line; // First line: no indentation
          if (index === array.length - 1) return `  ${line}`; // Last line: two spaces
          return `    ${line}`; // Middle lines: four spaces
        })
        .join("\n")}`,
    );
  } else {
    codeTemplate = codeTemplate.replace(
      `
    inputs: {}`,
      "",
    );
  }
  return codeTemplate
    .replace("<URL>", `${domain ?? "http://localhost:3000"}/api/run`)
    .replace("<ID>", deployment?.id ?? "<ID>")
    .replace("<URLONLY>", domain ?? "http://localhost:3000")
    .replace(
      "<APIURLONLY>",
      process.env.NEXT_PUBLIC_CD_API_URL ?? "http://localhost:3011",
    )
    .replace("<MODEL_ID>", model_id ?? "<MODEL_ID>");
}

export function DeploymentSettings({
  deployment,
  onClose,
}: {
  deployment: Deployment;
  onClose?: () => void;
}) {
  const { data: deployments } = useWorkflowDeployments(deployment.workflow_id);
  const { setSelectedDeployment } = useSelectedDeploymentStore();

  const workflowInput = useMemo(() => {
    return deployment ? getInputsFromWorkflow(deployment.version) : [];
  }, [deployment]);

  return (
    <div className="flex flex-col px-2">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-[8px] bg-zinc-50 px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="font-medium text-md">Deployment</div>
          <Select
            value={deployment.id}
            onValueChange={(value) => {
              const newDeployment = deployments?.find((d) => d.id === value);
              if (newDeployment) {
                setSelectedDeployment(newDeployment.id);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      getEnvColor(deployment.environment),
                      "whitespace-nowrap text-sm",
                    )}
                  >
                    {deployment.environment}
                  </Badge>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {deployments
                ?.filter(
                  (d) =>
                    d.environment === "production" ||
                    d.environment === "staging",
                )
                .map((d) => (
                  <SelectItem
                    key={d.id}
                    value={d.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          getEnvColor(d.environment),
                          "whitespace-nowrap text-sm",
                        )}
                      >
                        {d.environment}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ApiPlaygroundDemo
        key={deployment.id}
        defaultInputs={
          workflowInput
            ? Object.fromEntries([
                ["deployment_id", deployment.id],
                [
                  "inputs",
                  Object.fromEntries(
                    workflowInput.map((x) => {
                      if (!x) return [""];
                      // Check for specific class types that require a custom URL
                      if (
                        [
                          "ComfyUIDeployExternalImage",
                          "ComfyUIDeployExternalImageAlpha",
                        ].includes(x.class_type)
                      ) {
                        return [x.input_id, "/* put your image url here */"];
                      }
                      // Special case for batch images
                      if (x.class_type === "ComfyUIDeployExternalImageBatch") {
                        return [x.input_id, ["/* put your image url here */"]];
                      }
                      return [x.input_id, x.default_value ?? ""];
                    }),
                  ),
                ],
              ])
            : {}
        }
      />
    </div>
  );
}

export function DeploymentDrawer(props: {
  children?: React.ReactNode;
}) {
  const { selectedDeployment, setSelectedDeployment } =
    useSelectedDeploymentStore();
  const { data: deployment, isLoading } = useQuery<any>({
    enabled: !!selectedDeployment,
    queryKey: ["deployment", selectedDeployment],
  });

  return (
    <Dialog
      open={!!selectedDeployment}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedDeployment(null);
        }
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-screen-2xl flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Deployment Settings</DialogTitle>
        </DialogHeader>

        {isLoading || (!deployment && selectedDeployment) ? (
          <div className="flex flex-col px-2">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-zinc-50 pt-1 pb-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-9 w-[180px]" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <Skeleton className="h-24 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        ) : deployment ? (
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <DeploymentSettings
              key={deployment.id}
              deployment={deployment}
              onClose={() => setSelectedDeployment(null)}
            />
            {props.children}
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
