import { useAuthStore } from "@/lib/auth-store";
import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { ApiPlayground } from "./docs";
import { LoadingIcon } from "./loading-icon";

// Example OpenAPI spec
const exampleOpenApiSpec = {
	openapi: "3.1.0",
	info: {
		title: "ComfyDeploy API",
		description:
			"\n### Overview\n\nWelcome to the ComfyDeploy API!\n\nTo create a run thru the API, use the [queue run endpoint](#tag/run/POST/run/deployment/queue).\n\nCheck out the [get run endpoint](#tag/run/GET/run/{run_id}), for getting the status and output of a run.\n\n### Authentication\n\nTo authenticate your requests, include your API key in the `Authorization` header as a bearer token. Make sure to generate an API key in the [API Keys section of your ComfyDeploy account](https://www.comfydeploy.com/api-keys).\n\n###\n\n",
		version: "V2",
	},
	servers: [
		{
			url: "https://api.comfydeploy.com/api",
			description: "Production server",
		},
		{
			url: "https://staging.api.comfydeploy.com/api",
			description: "Staging server",
		},
		{
			url: "http://localhost:3011/api",
			description: "Local development server",
		},
	],
	paths: {
		"/run/{run_id}": {
			get: {
				tags: ["Run"],
				summary: "Get Run",
				operationId: "get_run_run__run_id__get",
				parameters: [
					{
						name: "run_id",
						in: "path",
						required: true,
						schema: {
							type: "string",
							format: "uuid",
							title: "Run Id",
						},
					},
				],
				responses: {
					"200": {
						description: "Successful Response",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/WorkflowRunModel",
								},
							},
						},
					},
					"422": {
						description: "Validation Error",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/HTTPValidationError",
								},
							},
						},
					},
				},
				"x-speakeasy-name-override": "get",
				"x-codeSamples": [
					{
						lang: "typescript",
						label: "SDK (TypeScript)",
						source:
							'import { ComfyDeploy } from "comfydeploy";\n\nconst comfyDeploy = new ComfyDeploy({\n  bearer: "<YOUR_BEARER_TOKEN_HERE>",\n});\n\nasync function run() {\n  const result = await comfyDeploy.run.get({\n    runId: "b888f774-3e7c-4135-a18c-6b985523c4bc",\n  });\n\n  // Handle the result\n  console.log(result);\n}\n\nrun();',
					},
					{
						lang: "python",
						label: "SDK (Python)",
						source:
							'from comfydeploy import ComfyDeploy\n\n\nwith ComfyDeploy(\n    bearer="<YOUR_BEARER_TOKEN_HERE>",\n) as comfy_deploy:\n\n    res = comfy_deploy.run.get(run_id="b888f774-3e7c-4135-a18c-6b985523c4bc")\n\n    assert res.workflow_run_model is not None\n\n    # Handle response\n    print(res.workflow_run_model)',
					},
				],
			},
		},
		"/run/deployment/queue": {
			post: {
				tags: ["Run"],
				summary: "Queue Run",
				description: "Create a new deployment run with the given parameters.",
				operationId: "queue_deployment_run_run_deployment_queue_post",
				requestBody: {
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/DeploymentRunRequest",
							},
						},
					},
					required: true,
				},
				responses: {
					"200": {
						description: "Successful Response",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/CreateRunResponse",
								},
							},
						},
					},
					"422": {
						description: "Validation Error",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/HTTPValidationError",
								},
							},
						},
					},
				},
				"x-speakeasy-group": "run.deployment",
				"x-speakeasy-name-override": "queue",
				"x-codeSamples": [
					{
						lang: "typescript",
						label: "SDK (TypeScript)",
						source:
							'import { ComfyDeploy } from "comfydeploy";\n\nconst comfyDeploy = new ComfyDeploy({\n  bearer: "<YOUR_BEARER_TOKEN_HERE>",\n});\n\nasync function run() {\n  const result = await comfyDeploy.run.deployment.queue({\n    inputs: {\n      "prompt": "A beautiful landscape",\n      "seed": 42,\n    },\n    webhook: "https://myapp.com/webhook",\n    deploymentId: "15e79589-12c9-453c-a41a-348fdd7de957",\n  });\n\n  // Handle the result\n  console.log(result);\n}\n\nrun();',
					},
					{
						lang: "python",
						label: "SDK (Python)",
						source:
							'from comfydeploy import ComfyDeploy\n\n\nwith ComfyDeploy(\n    bearer="<YOUR_BEARER_TOKEN_HERE>",\n) as comfy_deploy:\n\n    res = comfy_deploy.run.deployment.queue(request={\n        "inputs": {\n            "prompt": "A beautiful landscape",\n            "seed": 42,\n        },\n        "webhook": "https://myapp.com/webhook",\n        "deployment_id": "15e79589-12c9-453c-a41a-348fdd7de957",\n    })\n\n    assert res.create_run_response is not None\n\n    # Handle response\n    print(res.create_run_response)',
					},
				],
			},
		},
		"/run/{run_id}/cancel": {
			post: {
				tags: ["Run"],
				summary: "Cancel Run",
				operationId: "cancel_run_run__run_id__cancel_post",
				parameters: [
					{
						name: "run_id",
						in: "path",
						required: true,
						schema: {
							type: "string",
							title: "Run Id",
						},
					},
				],
				responses: {
					"200": {
						description: "Successful Response",
						content: {
							"application/json": {
								schema: {},
							},
						},
					},
					"422": {
						description: "Validation Error",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/HTTPValidationError",
								},
							},
						},
					},
				},
				"x-speakeasy-name-override": "cancel",
				"x-codeSamples": [
					{
						lang: "typescript",
						label: "SDK (TypeScript)",
						source:
							'import { ComfyDeploy } from "comfydeploy";\n\nconst comfyDeploy = new ComfyDeploy({\n  bearer: "<YOUR_BEARER_TOKEN_HERE>",\n});\n\nasync function run() {\n  const result = await comfyDeploy.run.cancel({\n    runId: "<id>",\n  });\n\n  // Handle the result\n  console.log(result);\n}\n\nrun();',
					},
					{
						lang: "python",
						label: "SDK (Python)",
						source:
							'from comfydeploy import ComfyDeploy\n\n\nwith ComfyDeploy(\n    bearer="<YOUR_BEARER_TOKEN_HERE>",\n) as comfy_deploy:\n\n    res = comfy_deploy.run.cancel(run_id="<id>")\n\n    assert res.any is not None\n\n    # Handle response\n    print(res.any)',
					},
				],
			},
		},
	},
	components: {
		schemas: {
			CreateRunResponse: {
				properties: {
					run_id: {
						type: "string",
						format: "uuid",
						title: "Run Id",
						description:
							"The ID of the run, use this to get the run status and outputs",
					},
				},
				type: "object",
				required: ["run_id"],
				title: "CreateRunResponse",
			},
			DeploymentRunRequest: {
				properties: {
					inputs: {
						additionalProperties: {
							anyOf: [
								{ type: "string" },
								{ type: "integer" },
								{ type: "number" },
								{ type: "boolean" },
								{ items: {}, type: "array" },
							],
						},
						type: "object",
						title: "Inputs",
						description: "The inputs to the workflow",
						default: {},
						example: {
							prompt: "A beautiful landscape",
							seed: 42,
						},
					},
					webhook: {
						type: "string",
						title: "Webhook",
					},
					webhook_intermediate_status: {
						type: "boolean",
						title: "Webhook Intermediate Status",
						default: false,
						example: true,
					},
					gpu: {
						type: "string",
						enum: ["T4", "L4", "A10G", "L40S", "A100", "A100-80GB", "H100"],
						description: "The GPU to override the machine's default GPU",
					},
					deployment_id: {
						type: "string",
						format: "uuid",
						title: "Deployment Id",
						examples: ["15e79589-12c9-453c-a41a-348fdd7de957"],
					},
				},
				type: "object",
				required: ["deployment_id"],
				title: "DeploymentRunRequest",
				examples: [
					{
						deployment_id: "12345678-1234-5678-1234-567812345678",
						inputs: {
							num_inference_steps: 30,
							prompt: "A futuristic cityscape",
							seed: 123456,
						},
						webhook: "https://myapp.com/webhook",
					},
				],
			},
			HTTPValidationError: {
				properties: {
					detail: {
						items: {
							$ref: "#/components/schemas/ValidationError",
						},
						type: "array",
						title: "Detail",
					},
				},
				type: "object",
				title: "HTTPValidationError",
			},
			ValidationError: {
				properties: {
					loc: {
						items: {
							anyOf: [{ type: "string" }, { type: "integer" }],
						},
						type: "array",
						title: "Location",
					},
					msg: {
						type: "string",
						title: "Message",
					},
					type: {
						type: "string",
						title: "Error Type",
					},
				},
				type: "object",
				required: ["loc", "msg", "type"],
				title: "ValidationError",
			},
			WorkflowRunModel: {
				properties: {
					id: {
						type: "string",
						format: "uuid",
						title: "Id",
					},
					workflow_version_id: {
						anyOf: [{ type: "string", format: "uuid" }, { type: "null" }],
						title: "Workflow Version Id",
					},
					workflow_inputs: {
						anyOf: [{}, { type: "null" }],
						title: "Workflow Inputs",
					},
					workflow_id: {
						type: "string",
						format: "uuid",
						title: "Workflow Id",
					},
					workflow_api: {
						anyOf: [{}, { type: "null" }],
						title: "Workflow Api",
					},
					machine_id: {
						anyOf: [{ type: "string", format: "uuid" }, { type: "null" }],
						title: "Machine Id",
					},
					origin: {
						type: "string",
						title: "Origin",
					},
					status: {
						type: "string",
						title: "Status",
					},
					ended_at: {
						anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
						title: "Ended At",
					},
					created_at: {
						type: "string",
						format: "date-time",
						title: "Created At",
					},
					updated_at: {
						type: "string",
						format: "date-time",
						title: "Updated At",
					},
					queued_at: {
						anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
						title: "Queued At",
					},
					started_at: {
						anyOf: [{ type: "string", format: "date-time" }, { type: "null" }],
						title: "Started At",
					},
					gpu_event_id: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Gpu Event Id",
					},
					gpu: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Gpu",
					},
					machine_version: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Machine Version",
					},
					machine_type: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Machine Type",
					},
					modal_function_call_id: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Modal Function Call Id",
					},
					user_id: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "User Id",
					},
					org_id: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Org Id",
					},
					live_status: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Live Status",
					},
					progress: {
						type: "number",
						title: "Progress",
						default: 0,
					},
					is_realtime: {
						type: "boolean",
						title: "Is Realtime",
						default: false,
					},
					webhook: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Webhook",
					},
					webhook_status: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Webhook Status",
					},
					webhook_intermediate_status: {
						type: "boolean",
						title: "Webhook Intermediate Status",
						default: false,
					},
					outputs: {
						items: {
							$ref: "#/components/schemas/WorkflowRunOutputModel",
						},
						type: "array",
						title: "Outputs",
						default: [],
					},
					number: {
						type: "integer",
						title: "Number",
					},
					duration: {
						anyOf: [{ type: "number" }, { type: "null" }],
						title: "Duration",
					},
					cold_start_duration: {
						anyOf: [{ type: "number" }, { type: "null" }],
						title: "Cold Start Duration",
					},
					cold_start_duration_total: {
						anyOf: [{ type: "number" }, { type: "null" }],
						title: "Cold Start Duration Total",
					},
					run_duration: {
						anyOf: [{ type: "number" }, { type: "null" }],
						title: "Run Duration",
					},
				},
				type: "object",
				required: [
					"id",
					"workflow_version_id",
					"workflow_inputs",
					"workflow_id",
					"workflow_api",
					"machine_id",
					"origin",
					"status",
					"created_at",
					"updated_at",
					"gpu_event_id",
					"gpu",
					"machine_version",
					"machine_type",
					"modal_function_call_id",
					"user_id",
					"org_id",
					"live_status",
					"webhook",
					"webhook_status",
					"number",
					"duration",
					"cold_start_duration",
					"cold_start_duration_total",
					"run_duration",
				],
				title: "WorkflowRunModel",
			},
			WorkflowRunOutputModel: {
				properties: {
					id: {
						type: "string",
						format: "uuid",
						title: "Id",
					},
					run_id: {
						type: "string",
						format: "uuid",
						title: "Run Id",
					},
					data: {
						additionalProperties: {
							items: {
								anyOf: [
									{
										$ref: "#/components/schemas/MediaItem",
									},
									{ type: "string" },
									{ type: "boolean" },
								],
							},
							type: "array",
						},
						type: "object",
						title: "Data",
					},
					node_meta: {
						anyOf: [{}, { type: "null" }],
						title: "Node Meta",
					},
					created_at: {
						type: "string",
						format: "date-time",
						title: "Created At",
					},
					updated_at: {
						type: "string",
						format: "date-time",
						title: "Updated At",
					},
					type: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Type",
					},
					node_id: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Node Id",
					},
				},
				type: "object",
				required: [
					"id",
					"run_id",
					"data",
					"node_meta",
					"created_at",
					"updated_at",
				],
				title: "WorkflowRunOutputModel",
			},
			MediaItem: {
				properties: {
					url: {
						type: "string",
						title: "Url",
					},
					type: {
						type: "string",
						title: "Type",
					},
					filename: {
						type: "string",
						title: "Filename",
					},
					is_public: {
						anyOf: [{ type: "boolean" }, { type: "null" }],
						title: "Is Public",
					},
					subfolder: {
						anyOf: [{ type: "string" }, { type: "null" }],
						title: "Subfolder",
					},
					upload_duration: {
						anyOf: [{ type: "number" }, { type: "null" }],
						title: "Upload Duration",
					},
				},
				type: "object",
				required: ["url", "type", "filename"],
				title: "MediaItem",
			},
		},
		securitySchemes: {
			Bearer: {
				type: "http",
				scheme: "bearer",
			},
		},
	},
	security: [
		{
			Bearer: [],
		},
	],
};

export function useOpenAPISpec() {
	const isLocalhost = window.location.hostname === "localhost";

	const url = isLocalhost
		? "http://localhost:3011"
		: "https://api.comfydeploy.com";

	return useQuery({
		queryKey: ["api-playground-demo"],
		queryFn: () => {
			return fetch(`${url}/openapi.json`).then((res) => res.json());
		},
	});
}

function ApiPlaygroundDemo(props: {
	defaultInputs?: Record<string, any>;
	defaultPathParams?: Record<string, string>;
}) {
	const { data } = useOpenAPISpec();

	const { token, fetchToken } = useAuthStore();

	if (!data || !token) {
		return (
			<div className="flex h-screen items-center justify-center">
				<LoadingIcon />
			</div>
		);
	}

	const isLocalhost = window.location.hostname === "localhost";

	return (
		<ApiPlayground
			openApiSpec={data}
			hideSidebar
			defaultServer={isLocalhost ? "http://localhost:3011/api" : undefined}
			hideDescription
			hideTitle
			preSelectedMethod="POST"
			defaultApiKey={async () => {
				const newToken = (await useAuthStore.getState().fetchToken()) ?? "";
				console.log("newToken", newToken);
				return newToken;
			}}
			preSelectedPath="/run/deployment/queue"
			defaultRequestBody={JSON.stringify(props.defaultInputs, null, 2)}
			defaultPathParams={props.defaultPathParams}
		/>
	);
}

export function ApiPlaygroundDemo2(props: {
	defaultInputs?: Record<string, any>;
	defaultPathParams?: Record<string, string>;
}) {
	const { data } = useOpenAPISpec();

	const { token, fetchToken } = useAuthStore();

	if (!data || !token) {
		return (
			<div className="flex h-screen items-center justify-center">
				<LoadingIcon />
			</div>
		);
	}

	const isLocalhost = window.location.hostname === "localhost";

	return (
		<ApiPlayground
			openApiSpec={data}
			hideSidebar
			defaultServer={isLocalhost ? "http://localhost:3011/api" : undefined}
			hideDescription
			hideTitle
			preSelectedMethod="GET"
			defaultApiKey={async () => {
				const newToken = (await useAuthStore.getState().fetchToken()) ?? "";
				console.log("newToken", newToken);
				return newToken;
			}}
			preSelectedPath="/run/{run_id}"
			defaultRequestBody={JSON.stringify(props.defaultInputs, null, 2)}
			defaultPathParams={props.defaultPathParams}
		/>
	);
}

export default ApiPlaygroundDemo;
