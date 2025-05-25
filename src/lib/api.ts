import { useAuthStore } from "./auth-store";

export async function api({
  url,
  init,
  params,
  raw,
  skipDefaultHeaders = false,
  onUploadProgress,
}: {
  url: string;
  init?: RequestInit;
  params?: Record<string, any> | string;
  raw?: boolean;
  skipDefaultHeaders?: boolean;
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
}) {
  const fetchToken = useAuthStore.getState().fetchToken;
  const auth = await fetchToken();

  let queryString;
  if (typeof params === "string") {
    queryString = `?${params}`;
  } else {
    queryString = params
      ? `?${new URLSearchParams(
          Object.entries(params)
            .filter(([_, value]) => value !== undefined)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
        ).toString()}`
      : "";
  }

  // Always include auth header, but only include Content-Type if not skipping defaults
  const defaultHeaders = {
    ...(skipDefaultHeaders ? {} : { "Content-Type": "application/json" }),
    Authorization: `Bearer ${auth}`,
  };

  const headers = {
    ...defaultHeaders,
    ...init?.headers,
  };

  const finalUrl = `${process.env.NEXT_PUBLIC_CD_API_URL}/api/${url}${queryString}`;

  // Use XMLHttpRequest for upload progress
  if (onUploadProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(init?.method || "GET", finalUrl);

      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        if (value) xhr.setRequestHeader(key, value);
      });

      // Handle progress
      xhr.upload.addEventListener("progress", onUploadProgress);

      // Handle completion
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = xhr.responseText
            ? JSON.parse(xhr.responseText)
            : null;
          resolve(convertDateFields(response));
        } else {
          reject(new Error(`HTTP error! status: ${xhr.status}`));
        }
      };

      // Handle error
      xhr.onerror = () => {
        reject(new Error("Network error occurred"));
      };

      // Send the request
      xhr.send(init?.body as FormData);
    });
  }

  // Use regular fetch for non-upload requests
  return await fetch(finalUrl, {
    ...init,
    headers,
  }).then(async (res) => {
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`HTTP error! status: ${res.status}, body: ${errorBody}`);
    }
    if (raw) {
      return res;
    }
    return res.json().then((data) => convertDateFields(data));
  });
}

export function convertDateFields(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertDateFields);
  } else if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        const customRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;

        if (isoRegex.test(value)) {
          // Handle ISO 8601 format
          const dateString = value.endsWith("Z") ? value : `${value}Z`;
          newObj[key] = new Date(dateString);
        } else if (customRegex.test(value)) {
          // Handle custom format: 2024-09-08 16:39:26.823000
          newObj[key] = new Date(value.replace(" ", "T") + "Z");
        } else {
          newObj[key] = convertDateFields(value);
        }
      } else {
        newObj[key] = convertDateFields(value);
      }
    }
    return newObj;
  }
  return obj;
}
