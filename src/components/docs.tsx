import { Info } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CodeBlock } from "./ui/code-blocks";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// Types for OpenAPI spec
interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  security?: Array<Record<string, string[]>>;
}

interface ApiPlaygroundProps {
  openApiSpec: OpenAPISpec;
  hideTitle?: boolean;
  hideDescription?: boolean;
  hideSidebar?: boolean;
  preSelectedPath?: string;
  preSelectedMethod?: string;
  defaultApiKey?: string | (() => string | Promise<string>);
  defaultServer?: string;
  defaultRequestBody?: string | object;
  defaultPathParams?: Record<string, string>;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({
  openApiSpec,
  hideTitle = false,
  hideDescription = false,
  hideSidebar = false,
  preSelectedPath,
  preSelectedMethod,
  defaultApiKey = "",
  defaultServer,
  defaultRequestBody,
  defaultPathParams = {},
}) => {
  const [selectedServer, setSelectedServer] = useState<string>(
    defaultServer || openApiSpec.servers[0]?.url || "",
  );
  const [selectedPath, setSelectedPath] = useState<string>(
    preSelectedPath || "",
  );
  const [selectedMethod, setSelectedMethod] = useState<string>(
    preSelectedMethod?.toLowerCase() || "",
  );
  const [requestBody, setRequestBody] = useState<string>(
    typeof defaultRequestBody === "string"
      ? defaultRequestBody
      : defaultRequestBody
        ? JSON.stringify(defaultRequestBody, null, 2)
        : "{}",
  );
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [paramValues, setParamValues] =
    useState<Record<string, string>>(defaultPathParams);

  // Add effect to update apiKey when defaultApiKey changes
  useEffect(() => {
    const updateApiKey = async () => {
      if (!defaultApiKey) {
        setApiKey("");
        return;
      }

      if (typeof defaultApiKey === "function") {
        try {
          const result = defaultApiKey();
          if (result instanceof Promise) {
            const resolvedKey = await result;
            setApiKey(resolvedKey);
          } else {
            setApiKey(result);
          }
        } catch (error) {
          console.error("Failed to resolve API key:", error);
          setApiKey("");
        }
      } else {
        setApiKey(defaultApiKey);
      }
    };

    updateApiKey();
  }, [defaultApiKey]);

  // Effect to handle pre-selected path and method
  useEffect(() => {
    if (preSelectedPath && preSelectedMethod) {
      handlePathSelect(preSelectedPath);
      handleMethodSelect(preSelectedMethod.toLowerCase());
    }
  }, [preSelectedPath, preSelectedMethod]);

  // Extract paths and methods from the OpenAPI spec
  const paths = Object.keys(openApiSpec.paths);
  const methods = selectedPath
    ? Object.keys(openApiSpec.paths[selectedPath])
    : [];

  // Get the selected endpoint details
  const selectedEndpoint =
    selectedPath && selectedMethod
      ? openApiSpec.paths[selectedPath][selectedMethod]
      : null;

  // Handle path selection
  const handlePathSelect = (path: string) => {
    setSelectedPath(path);
    // Automatically select the first available method if no method is pre-selected
    const availableMethods = Object.keys(openApiSpec.paths[path]);
    if (availableMethods.length > 0) {
      const methodToSelect = availableMethods[0];
      setSelectedMethod(methodToSelect);

      // Set request body based on priority: defaultRequestBody > schema example > empty
      if (defaultRequestBody) {
        setRequestBody(
          typeof defaultRequestBody === "string"
            ? defaultRequestBody
            : JSON.stringify(defaultRequestBody, null, 2),
        );
      } else {
        const pathEndpoint = openApiSpec.paths[path][methodToSelect];
        if (pathEndpoint.requestBody?.content?.["application/json"]?.schema) {
          const schema =
            pathEndpoint.requestBody.content["application/json"].schema;
          const resolvedSchema = resolveSchemaReferences(schema);
          const exampleBody = generateExampleFromSchema(resolvedSchema);
          setRequestBody(JSON.stringify(exampleBody, null, 2));
        } else {
          setRequestBody("{}");
        }
      }
    } else {
      setSelectedMethod("");
      setRequestBody("{}");
    }
    setResponse("");
  };

  // Handle method selection
  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setResponse("");

    // Set request body based on priority: defaultRequestBody > schema example > empty
    if (defaultRequestBody) {
      setRequestBody(
        typeof defaultRequestBody === "string"
          ? defaultRequestBody
          : JSON.stringify(defaultRequestBody, null, 2),
      );
    } else {
      const methodEndpoint = openApiSpec.paths[selectedPath][method];
      if (methodEndpoint.requestBody?.content?.["application/json"]?.schema) {
        const schema =
          methodEndpoint.requestBody.content["application/json"].schema;
        const resolvedSchema = resolveSchemaReferences(schema);
        const exampleBody = generateExampleFromSchema(resolvedSchema);
        setRequestBody(JSON.stringify(exampleBody, null, 2));
      } else {
        setRequestBody("{}");
      }
    }
  };

  // Generate example from schema
  const generateExampleFromSchema = (schema: any): any => {
    if (!schema) return {};

    // If schema has examples array at top level, use the first one
    if (
      schema.examples &&
      Array.isArray(schema.examples) &&
      schema.examples.length > 0
    ) {
      return schema.examples[0];
    }

    // If schema has examples object at top level, use the first one
    if (schema.examples && typeof schema.examples === "object") {
      const firstExample = Object.values(schema.examples)[0];
      if (firstExample && typeof firstExample === "object") {
        return firstExample;
      }
    }

    // If schema has a single example, use it
    if (schema.example !== undefined) {
      return schema.example;
    }

    if (schema.type === "object") {
      const result: Record<string, any> = {};
      if (schema.properties) {
        Object.entries(schema.properties).forEach(
          ([key, value]: [string, any]) => {
            // Check for example, examples, or default in property
            if (value.example !== undefined) {
              result[key] = value.example;
            } else if (value.examples !== undefined) {
              const firstExample = Object.values(value.examples)[0];
              if (
                firstExample &&
                typeof firstExample === "object" &&
                "value" in firstExample
              ) {
                result[key] = firstExample.value;
              } else {
                result[key] =
                  value.default !== undefined
                    ? value.default
                    : generateExampleFromSchema(value);
              }
            } else if (value.default !== undefined) {
              result[key] = value.default;
            } else {
              result[key] = generateExampleFromSchema(value);
            }
          },
        );
      }
      return result;
    } else if (schema.type === "array") {
      // Check for examples in array items
      if (schema.items.example !== undefined) {
        return [schema.items.example];
      } else if (schema.items.examples !== undefined) {
        const firstExample = Object.values(schema.items.examples)[0];
        if (
          firstExample &&
          typeof firstExample === "object" &&
          "value" in firstExample
        ) {
          return [firstExample.value];
        }
      } else if (schema.items.default !== undefined) {
        return [schema.items.default];
      }
      return [generateExampleFromSchema(schema.items)];
    } else if (schema.type === "string") {
      if (schema.enum) {
        return schema.enum[0];
      }
      return schema.default !== undefined ? schema.default : "string";
    } else if (schema.type === "number" || schema.type === "integer") {
      return schema.default !== undefined ? schema.default : 0;
    } else if (schema.type === "boolean") {
      return schema.default !== undefined ? schema.default : false;
    } else {
      return null;
    }
  };

  // Get schema for request body
  const getRequestBodySchema = () => {
    if (!selectedEndpoint || !selectedEndpoint.requestBody) return null;

    const schema =
      selectedEndpoint.requestBody.content?.["application/json"]?.schema ||
      null;

    // Resolve schema references
    return resolveSchemaReferences(schema);
  };

  // Resolve schema references
  const resolveSchemaReferences = (schema: any): any => {
    if (!schema) return null;

    // If schema has a $ref, resolve it
    if (schema.$ref) {
      const refPath = schema.$ref.split("/");
      let resolvedSchema: any = openApiSpec;

      // Navigate through the reference path
      for (let i = 1; i < refPath.length; i++) {
        resolvedSchema = resolvedSchema[refPath[i]];
        if (!resolvedSchema) return schema; // Return original if path not found
      }

      return resolvedSchema;
    }

    // If schema has properties, resolve each property
    if (schema.properties) {
      const resolvedProperties: Record<string, any> = {};

      Object.entries(schema.properties).forEach(
        ([key, value]: [string, any]) => {
          resolvedProperties[key] = resolveSchemaReferences(value);
        },
      );

      return {
        ...schema,
        properties: resolvedProperties,
      };
    }

    // If schema has items (for arrays), resolve the items
    if (schema.items) {
      return {
        ...schema,
        items: resolveSchemaReferences(schema.items),
      };
    }

    return schema;
  };

  // Get example data from schema
  const getExampleData = () => {
    const schema = getRequestBodySchema();
    if (!schema) return null;

    return generateExampleFromSchema(schema);
  };

  // Extract all types from schema
  const extractTypesFromSchema = (
    schema: any,
    parentKey = "",
  ): Array<{
    name: string;
    type: string;
    description?: string;
    required?: boolean;
    defaultValue?: any;
    enum?: any[];
  }> => {
    if (!schema) return [];

    const types: Array<{
      name: string;
      type: string;
      description?: string;
      required?: boolean;
      defaultValue?: any;
      enum?: any[];
    }> = [];

    if (schema.type === "object" && schema.properties) {
      Object.entries(schema.properties).forEach(
        ([key, value]: [string, any]) => {
          const fullKey = parentKey ? `${parentKey}.${key}` : key;

          if (value.type === "object" && value.properties) {
            // For nested objects, recursively extract their properties
            types.push(...extractTypesFromSchema(value, fullKey));
          } else if (value.type === "array" && value.items) {
            // For arrays, extract the item type
            const itemType = value.items.type || "object";
            const enumStr = value.items.enum
              ? `<${value.items.enum.join(" | ")}>`
              : "";
            types.push({
              name: fullKey,
              type: `Array<${itemType}${enumStr}>`,
              description: value.description,
              required: schema.required?.includes(key),
              defaultValue: value.default,
            });

            // If array items are objects, extract their properties too
            if (value.items.type === "object" && value.items.properties) {
              types.push(
                ...extractTypesFromSchema(value.items, `${fullKey}[0]`),
              );
            }
          } else {
            // For primitive types
            const enumStr = value.enum ? `<${value.enum.join(" | ")}>` : "";
            types.push({
              name: fullKey,
              type: `${value.type || "unknown"}${enumStr}`,
              description: value.description,
              required: schema.required?.includes(key),
              defaultValue: value.default,
            });
          }
        },
      );
    }

    return types;
  };

  // Get all types from the request body schema
  const getAllTypes = () => {
    const schema = getRequestBodySchema();
    if (!schema) return [];

    return extractTypesFromSchema(schema);
  };

  // Handle API request
  const handleSendRequest = async () => {
    setIsLoading(true);
    setResponse("");

    try {
      // Build URL with parameters if they exist
      let urlWithParams = `${selectedServer}${selectedPath}`;
      const queryParams: string[] = [];

      if (selectedEndpoint?.parameters) {
        selectedEndpoint.parameters.forEach((param: any) => {
          if (param.in === "path" && paramValues[param.name]) {
            urlWithParams = urlWithParams.replace(
              `{${param.name}}`,
              paramValues[param.name],
            );
          } else if (param.in === "query" && paramValues[param.name]) {
            queryParams.push(
              `${param.name}=${encodeURIComponent(paramValues[param.name])}`,
            );
          }
        });
      }

      if (queryParams.length > 0) {
        urlWithParams += `?${queryParams.join("&")}`;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Get the latest API key value
      let currentApiKey = apiKey;

      if (typeof defaultApiKey === "function") {
        try {
          const result = defaultApiKey();
          if (result instanceof Promise) {
            currentApiKey = await result;
          } else {
            currentApiKey = result;
          }
        } catch (error) {
          console.error("Failed to resolve API key:", error);
        }
      }

      // Add API key if provided
      if (currentApiKey) {
        headers["Authorization"] = `Bearer ${currentApiKey}`;
      }

      const response = await fetch(urlWithParams, {
        method: selectedMethod.toUpperCase(),
        headers,
        body: ["POST", "PUT", "PATCH"].includes(selectedMethod.toUpperCase())
          ? requestBody
          : undefined,
      });

      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setResponse(
        JSON.stringify({ error: error.message || "Unknown error" }, null, 2),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add this helper function near the top with other utility functions
  const generateCodeExamples = (
    selectedPath: string,
    selectedMethod: string,
    selectedEndpoint: any,
    selectedServer: string,
    currentRequestBody: string,
    parameters?: any[],
  ) => {
    const url = `${selectedServer}${selectedPath}`;
    const hasBody = ["POST", "PUT", "PATCH"].includes(
      selectedMethod.toUpperCase(),
    );

    // Build URL with parameters if they exist
    let urlWithParams = url;
    const queryParams: string[] = [];
    if (parameters) {
      parameters.forEach((param) => {
        if (param.in === "path" && param.value) {
          urlWithParams = urlWithParams.replace(`{${param.name}}`, param.value);
        } else if (param.in === "query" && param.value) {
          queryParams.push(`${param.name}=${encodeURIComponent(param.value)}`);
        }
      });
    }
    if (queryParams.length > 0) {
      urlWithParams += `?${queryParams.join("&")}`;
    }

    // Parse current request body
    let parsedBody = "{}";
    try {
      if (currentRequestBody) {
        const parsed = JSON.parse(currentRequestBody);
        parsedBody = JSON.stringify(parsed, null, 2)
          .split("\n")
          .map((line, index) => (index === 0 ? line : `    ${line}`)) // 4 spaces for body content
          .join("\n");
      }
    } catch (e) {
      console.warn("Invalid JSON in request body");
    }

    // TypeScript example using fetch
    const tsCode = `const response = await fetch("${urlWithParams}", {
    method: "${selectedMethod.toUpperCase()}",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_API_KEY"
    }${
      hasBody
        ? `,
    body: JSON.stringify(${parsedBody})`
        : ""
    }
});

const data = await response.json();
console.log(data);`;

    // Python example using requests (no special indentation needed)
    const pythonCode = `import requests

url = "${urlWithParams}"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}${hasBody ? `\n\npayload = ${currentRequestBody}` : ""}

response = requests.${selectedMethod.toLowerCase()}(
    url,
    headers=headers${hasBody ? ",\n    json=payload" : ""}
)

data = response.json()
print(data)`;

    // Generate curl example
    const curlCode = `curl -X ${selectedMethod.toUpperCase()} "${urlWithParams}" \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer YOUR_API_KEY"${
      hasBody
        ? ` \\
    -d '${currentRequestBody}'`
        : ""
    }`;

    return { tsCode, pythonCode, curlCode };
  };

  // Update the code where we call generateCodeExamples to include the current request body and parameters
  const { tsCode, pythonCode, curlCode } = selectedEndpoint
    ? generateCodeExamples(
        selectedPath,
        selectedMethod,
        selectedEndpoint,
        selectedServer,
        requestBody,
        selectedEndpoint.parameters?.map((param: any) => ({
          ...param,
          value: paramValues[param.name] || "",
        })),
      )
    : { tsCode: "", pythonCode: "", curlCode: "" };

  return (
    <div className="flex flex-col h-full">
      {(!hideTitle || !hideDescription) && (
        <div className="p-4 border-b">
          {!hideTitle && (
            <h1 className="text-2xl font-bold">{openApiSpec.info.title}</h1>
          )}
          {!hideDescription && (
            <p className="text-sm text-gray-500">
              {openApiSpec.info.description}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with endpoints */}
        {!hideSidebar && (
          <div className="w-1/4 border-r overflow-y-auto">
            <div className="p-3">
              <h2 className="text-lg font-semibold mb-2">Endpoints</h2>

              {/* Server and API Key inputs moved to sidebar */}
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1">Server</label>
                <Select
                  value={selectedServer}
                  onValueChange={setSelectedServer}
                >
                  <SelectTrigger className="h-8 text-xs rounded-sm">
                    <SelectValue placeholder="Select a server" />
                  </SelectTrigger>
                  <SelectContent>
                    {openApiSpec.servers.map((server) => (
                      <SelectItem key={server.url} value={server.url}>
                        {server.description || server.url}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium mb-1">
                  API Key (Bearer Token)
                </label>
                <Input
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-8 text-xs rounded-sm"
                />
              </div>

              <ScrollArea className="h-[calc(100vh-300px)]">
                {paths.map((path) => (
                  <div
                    key={path}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${
                      selectedPath === path ? "bg-gray-200" : ""
                    }`}
                    onClick={() => handlePathSelect(path)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm">{path}</div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {Object.keys(openApiSpec.paths[path]).map((method) => (
                          <Badge
                            key={method}
                            variant={
                              method === "get"
                                ? "blue"
                                : method === "post"
                                  ? "success"
                                  : method === "put"
                                    ? "outline"
                                    : method === "delete"
                                      ? "destructive"
                                      : "default"
                            }
                            className="text-[10px] px-1.5 py-0 rounded-sm font-medium"
                          >
                            {method.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Main content area - adjust width based on sidebar visibility */}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${hideSidebar ? "w-full" : "w-3/4"}`}
        >
          {selectedPath && selectedMethod ? (
            <>
              <div className="p-3 border-b">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-sm truncate">
                    {selectedPath}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant={
                        selectedMethod === "get"
                          ? "blue"
                          : selectedMethod === "post"
                            ? "success"
                            : selectedMethod === "put"
                              ? "outline"
                              : selectedMethod === "delete"
                                ? "destructive"
                                : "default"
                      }
                      className="text-[10px] px-1.5 py-0 rounded-sm font-medium"
                    >
                      {selectedMethod.toUpperCase()}
                    </Badge>
                    <Button
                      onClick={handleSendRequest}
                      disabled={isLoading}
                      className="h-7 text-xs rounded-sm"
                    >
                      {isLoading ? "Sending..." : "Send Request"}
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  {selectedEndpoint?.summary}
                </div>
                {selectedEndpoint?.description && (
                  <p className="text-xs mt-1">{selectedEndpoint.description}</p>
                )}
              </div>

              <div className="flex-1 flex flex-col p-3 overflow-y-auto">
                {selectedEndpoint?.parameters &&
                  selectedEndpoint.parameters.length > 0 && (
                    <div className="mb-3">
                      <h3 className="text-xs font-medium mb-1">Parameters</h3>
                      <div className="space-y-1">
                        {selectedEndpoint.parameters.map((param: any) => (
                          <div
                            key={param.name}
                            className="flex items-center gap-2"
                          >
                            <Input
                              placeholder={param.name}
                              className="flex-1 h-7 text-xs rounded-sm"
                              disabled={isLoading}
                              value={paramValues[param.name] || ""}
                              onChange={(e) => {
                                setParamValues((prev) => ({
                                  ...prev,
                                  [param.name]: e.target.value,
                                }));
                              }}
                            />
                            <Badge
                              variant="outline"
                              className="text-xs rounded-sm"
                            >
                              {param.in}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {selectedEndpoint?.requestBody && (
                  <div className="mb-3">
                    <h3 className="text-xs font-medium mb-1">Request Body</h3>
                    <Textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      className="font-mono h-64 text-xs rounded-sm"
                      disabled={isLoading}
                    />

                    {/* Types table */}
                    <div className="mt-2">
                      <h4 className="text-xs font-medium mb-1">Schema Types</h4>
                      <div className="border rounded-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs font-mono min-w-[800px]">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-2 py-1 text-left font-medium w-[200px]">
                                  Name
                                </th>
                                <th className="px-2 py-1 text-left font-medium w-[250px]">
                                  Type
                                </th>
                                <th className="px-2 py-1 text-left font-medium w-[100px]">
                                  Default
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {getAllTypes().map((type, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-2 py-1">
                                    <div className="flex items-center gap-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="truncate max-w-[170px]">
                                              {type.name}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs font-mono">
                                              {type.name}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      {type.description && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Info className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="text-xs">
                                                {type.description}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-1">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="truncate max-w-[250px]">
                                            {type.type}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs font-mono">
                                            {type.type}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </td>
                                  <td className="px-2 py-1 text-gray-500">
                                    {type.defaultValue !== undefined && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="truncate">
                                              {JSON.stringify(
                                                type.defaultValue,
                                              )}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs font-mono">
                                              {JSON.stringify(
                                                type.defaultValue,
                                              )}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add the new code examples section */}
                <div className="mb-3">
                  <h3 className="text-xs font-medium mb-1">Code Examples</h3>
                  <Tabs defaultValue="typescript" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="typescript" className="flex-1">
                        TypeScript
                      </TabsTrigger>
                      <TabsTrigger value="python" className="flex-1">
                        Python
                      </TabsTrigger>
                      <TabsTrigger value="curl" className="flex-1">
                        cURL
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="typescript">
                      <CodeBlock
                        code={tsCode}
                        lang="typescript"
                        className="text-xs"
                      />
                    </TabsContent>
                    <TabsContent value="python">
                      <CodeBlock
                        code={pythonCode}
                        lang="python"
                        className="text-xs"
                      />
                    </TabsContent>
                    <TabsContent value="curl">
                      <CodeBlock
                        code={curlCode}
                        lang="bash"
                        className="text-xs"
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className="text-sm">Select an endpoint to view details</p>
            </div>
          )}
        </div>

        {/* Response panel */}
        {selectedPath && selectedMethod && (
          <div className="w-1/3 border-l overflow-hidden flex flex-col">
            <div className="p-3 border-b">
              <h2 className="text-sm font-semibold">Response</h2>
            </div>
            <div className="flex-1 p-3 overflow-auto">
              {response ? (
                <CodeBlock code={response} lang="json" className="text-xs" />
              ) : (
                <div className="text-gray-500 text-center mt-8">
                  <p className="text-xs">Send a request to see the response</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiPlayground;
