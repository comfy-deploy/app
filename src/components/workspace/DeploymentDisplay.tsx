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
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  Info,
  Settings,
} from "lucide-react";
import { DeploymentRow } from "./DeploymentRow";
// import { SharePageSettings } from "@/components/SharePageSettings";
import Steps from "./Steps";
// import { Docs } from "./Docs";

// import type { ModelListComponent } from "@/components/modelFal/ModelsList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
// import {
//   CreateDeploymentButton,
//   CreateDeploymentButtonV2,
// } from "./VersionSelect";
import { getEnvColor } from "./ContainersTable";
// import { useFeatureFlags } from "@/components/FeatureFlagsProvider";
import { NewStepper } from "./StaticStepper";
import { VersionDetails } from "./VersionDetails";
import { useWorkflowDeployments } from "./ContainersTable";
import { LoadingIcon } from "../ui/custom/loading-icon";
import { Settings as SettingsIcon } from "lucide-react";
import {
  GPUSelectBox,
  MaxAlwaysOnSlider,
  MaxParallelGPUSlider,
  WarmTime,
  WorkflowTimeOut,
} from "../machine/machine-settings";
import { useSelectedDeploymentStore } from "@/routes/workflows/$workflowId/$view.lazy";
import { MyDrawer } from "../drawer";
import type { GpuTypes } from "../onboarding/workflow-machine-import";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Input } from "../ui/input";

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

      {!model && (
        <VersionDetails
          workflow_version_id={selectedDeployment?.workflow_version_id}
        />
      )}

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
                content: <CodeBlock lang="bash" code={"npm i comfydeploy"} />,
              },
              {
                title: "Initialize your client",
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
                        className="max-w-[500px]"
                      />
                    ) : (
                      <CodeBlock
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
                        className="max-w-[500px]"
                      />
                    ) : (
                      <CodeBlock
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
              href="https://api.comfydeploy.com"
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
  const [view, setView] = useState<"api" | "settings">("api");
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: deployments } = useWorkflowDeployments(deployment.workflow_id);
  const [formData, setFormData] = useState<Partial<Deployment>>({
    gpu: deployment.gpu || "A10G",
    concurrency_limit: deployment.concurrency_limit || 2,
    keep_warm: deployment.keep_warm || 0,
    run_timeout: deployment.run_timeout || 300,
    idle_timeout: deployment.idle_timeout || 60,
  });
  const [isDirty, setIsDirty] = useState(false);
  const { setSelectedDeployment } = useSelectedDeploymentStore();

  const handleChange = <K extends keyof Deployment>(
    key: K,
    value: Deployment[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleReset = () => {
    setFormData({
      gpu: deployment.gpu || "A10G",
      concurrency_limit: deployment.concurrency_limit || 2,
      keep_warm: deployment.keep_warm || 0,
      run_timeout: deployment.run_timeout || 300,
      idle_timeout: deployment.idle_timeout || 60,
    });
    setIsDirty(false);
  };

  const handleSave = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await callServerPromise(
        api({
          url: `deployment/${deployment.id}`,
          init: {
            method: "PATCH",
            body: JSON.stringify({
              gpu: formData.gpu,
              concurrency_limit: formData.concurrency_limit,
              keep_warm: formData.keep_warm,
              run_timeout: formData.run_timeout,
              idle_timeout: formData.idle_timeout,
            }),
          },
        }),
      );

      toast.success("Settings saved successfully");
      setIsDirty(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col ">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-zinc-50 pt-1 pb-4">
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
                <Badge
                  variant="outline"
                  className={cn(getEnvColor(deployment.environment), "text-sm")}
                >
                  {deployment.environment}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {deployments?.map((d) => (
                <SelectItem
                  key={d.id}
                  value={d.id}
                  className="flex items-center justify-between"
                >
                  <Badge
                    variant="outline"
                    className={cn(getEnvColor(d.environment), "text-sm")}
                  >
                    {d.environment}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {deployment.environment !== "public-share" && (
          <div className="flex items-center gap-2">
            <Button
              variant={view === "api" ? "default" : "ghost"}
              onClick={() => setView("api")}
              size="sm"
            >
              API
            </Button>
            {deployment.modal_image_id && (
              <Button
                variant={view === "settings" ? "default" : "ghost"}
                onClick={() => setView("settings")}
                size="sm"
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Button>
            )}
          </div>
        )}
      </div>

      {((view === "settings" && deployment.modal_image_id) ||
        deployment.environment === "public-share") && (
        <form ref={formRef} className="flex flex-col gap-6 p-6">
          {deployment.environment === "public-share" && (
            <div className="mb-4">
              <ShareLinkDisplay deployment={deployment} />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Badge className="w-fit font-medium text-sm">GPU</Badge>
            <GPUSelectBox
              value={formData.gpu}
              onChange={(value) => handleChange("gpu", value)}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Badge className="w-fit font-medium text-sm">
              Max Parallel GPU
            </Badge>
            <MaxParallelGPUSlider
              value={formData.concurrency_limit || deployment.concurrency_limit}
              onChange={(value) => handleChange("concurrency_limit", value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Badge className="w-fit font-medium text-sm">Keep Always On</Badge>
            {deployment.environment === "production" ? (
              <MaxAlwaysOnSlider
                value={formData.keep_warm || deployment.keep_warm}
                onChange={(value) => handleChange("keep_warm", value)}
              />
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-700 text-sm">
                <Info className="h-4 w-4" />
                <Badge className={getEnvColor(deployment.environment)}>
                  {deployment.environment}
                </Badge>{" "}
                environment is not supported for this feature.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Badge className="w-fit font-medium text-sm">
              Workflow Timeout
            </Badge>
            <WorkflowTimeOut
              value={formData.run_timeout || deployment.run_timeout}
              onChange={(value) => handleChange("run_timeout", value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Badge className="w-fit font-medium text-sm">Warm Time</Badge>
            <WarmTime
              value={formData.idle_timeout || deployment.idle_timeout}
              onChange={(value) => handleChange("idle_timeout", value)}
            />
          </div>

          {isDirty && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <LoadingIcon className="mr-2 h-4 w-4" />
                ) : (
                  <SettingsIcon className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </form>
      )}

      {view === "api" && deployment.environment !== "public-share" && (
        <APIDocs
          domain={process.env.NEXT_PUBLIC_CD_API_URL ?? ""}
          workflow_id={deployment.workflow_id}
          deployment_id={deployment.id}
          header={null}
        />
      )}
    </div>
  );
}

export function VersionDrawer({ workflowId }: { workflowId: string }) {
  const { selectedDeployment, setSelectedDeployment } =
    useSelectedDeploymentStore();
  const { data: deployments } = useWorkflowDeployments(workflowId);
  const deployment = deployments?.find(
    (d: Deployment) => d.id === selectedDeployment,
  );

  return (
    <MyDrawer
      desktopClassName="w-[600px]"
      open={!!selectedDeployment}
      onClose={() => {
        setSelectedDeployment(null);
      }}
    >
      <ScrollArea className="h-full">
        {deployment && (
          <DeploymentSettings
            key={deployment.id}
            deployment={deployment}
            onClose={() => setSelectedDeployment(null)}
          />
        )}
      </ScrollArea>
    </MyDrawer>
  );
}

function ShareLinkDisplay({ deployment }: { deployment: Deployment }) {
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    if (!deployment.dub_link) return;
    setCopying(true);
    await navigator.clipboard.writeText(deployment.dub_link);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopying(false), 1000);
  };

  return (
    <div className="-m-4 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">Sharing Link</h3>
          <Badge variant="secondary" className="bg-zinc-100 text-zinc-700">
            Public
          </Badge>
        </div>
      </div>
      {deployment.dub_link ? (
        <div className="flex gap-2">
          <Input
            readOnly
            value={deployment.dub_link}
            className="border-zinc-200 bg-zinc-50 font-mono text-xs"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0 transition-all duration-200 hover:bg-zinc-50"
          >
            {copying ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-md bg-amber-50 p-3 text-amber-700">
          <span className="text-sm">
            No sharing link available. Please reshare again.
          </span>
        </div>
      )}
    </div>
  );
}
