/**
 * API 文档工具函数
 */

import type { ApiInfo, ApiGroup, CodeLanguage } from "./types";

/**
 * 获取 HTTP 状态码对应的样式类名
 */
export function getStatusClass(status: number): string {
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "warning";
  if (status >= 400 && status < 500) return "error";
  if (status >= 500) return "danger";
  return "info";
}

/**
 * 获取 HTTP 状态码对应的文本
 */
export function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    409: "Conflict",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return statusTexts[status] || "Unknown";
}

/**
 * 根据内容类型判断是否为 JSON
 */
export function isJsonContentType(contentType: string): boolean {
  return (
    contentType.includes("application/json") ||
    contentType.includes("text/json")
  );
}

/**
 * 根据内容类型判断是否为图片
 */
export function isImageContentType(contentType: string): boolean {
  return contentType.startsWith("image/");
}

/**
 * 根据内容类型判断是否为 HTML
 */
export function isHtmlContentType(contentType: string): boolean {
  return contentType.includes("text/html");
}

/**
 * 根据内容类型判断是否为 XML
 */
export function isXmlContentType(contentType: string): boolean {
  return (
    contentType.includes("application/xml") || contentType.includes("text/xml")
  );
}

/**
 * 提取主要内容类型（去除 charset 等参数）
 */
export function extractContentType(
  headers: Record<string, string>
): string {
  const contentType =
    headers["content-type"] || headers["Content-Type"] || "";
  return contentType.split(";")[0].trim();
}

/**
 * 格式化 JSON 字符串
 */
export function formatJson(data: any): string {
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return data;
    }
  }
  return JSON.stringify(data, null, 2);
}

/**
 * 简单格式化 XML
 */
export function formatXml(xml: string): string {
  return xml.replace(/></g, ">\n<");
}

/**
 * 根据 API 路径生成分组名称
 */
export function getGroupNameFromPath(path: string): string {
  const pathParts = path.split("/").filter((part) => part);
  if (pathParts.length === 0) return "默认分组";

  const firstPart = pathParts[0];

  if (firstPart === "api") {
    return pathParts[1] ? `${pathParts[1]}管理` : "API接口";
  } else if (firstPart === "actuator") {
    return "系统监控";
  } else if (firstPart.includes("user")) {
    return "用户管理";
  } else if (firstPart.includes("file")) {
    return "文件管理";
  } else if (firstPart.includes("system")) {
    return "系统管理";
  }
  return `${firstPart}接口`;
}

/**
 * 将 API 列表转换为分组格式
 */
export function convertApiListToGroups(apiList: ApiInfo[]): ApiGroup[] {
  const groups: Record<string, ApiInfo[]> = {};

  apiList.forEach((api) => {
    const groupName = getGroupNameFromPath(api.path);
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(api);
  });

  return Object.entries(groups).map(([name, apis]) => ({
    name,
    apis,
  }));
}

/**
 * 构建完整的 URL（包含路径参数和查询参数）
 */
export function buildFullUrl(
  baseUrl: string,
  path: string,
  pathParams: Record<string, string> = {},
  queryParams: Record<string, string> = {}
): string {
  let url = baseUrl + path;

  // 替换路径参数
  Object.entries(pathParams).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value || `{${key}}`);
  });

  // 构建查询参数
  const queryString = Object.entries(queryParams)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  if (queryString) {
    url += `?${queryString}`;
  }

  return url;
}

/**
 * 生成示例请求体
 */
export function generateExampleRequestBody(api: ApiInfo): string {
  const method = api.method.toUpperCase();
  const path = api.path.toLowerCase();

  if (method === "GET" || method === "DELETE") {
    return "";
  }

  // 根据 HTTP 方法和路径生成相应的示例
  if (method === "POST") {
    if (path.includes("user") || path.includes("account")) {
      return JSON.stringify(
        {
          username: "john_doe",
          email: "john@example.com",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
        },
        null,
        2
      );
    } else if (path.includes("product") || path.includes("item")) {
      return JSON.stringify(
        {
          name: "新产品",
          description: "这是一个新产品的描述",
          price: 299.99,
          category: "electronics",
        },
        null,
        2
      );
    }
  } else if (method === "PUT" || method === "PATCH") {
    if (path.includes("user") || path.includes("account")) {
      return JSON.stringify(
        {
          id: 1001,
          email: "updated@example.com",
          status: "active",
        },
        null,
        2
      );
    }
  }

  // 默认示例
  return JSON.stringify(
    {
      name: "示例名称",
      description: "示例描述",
      type: "example",
      status: "active",
    },
    null,
    2
  );
}

/**
 * 生成 Java 代码示例
 */
export function generateJavaCode(
  baseUrl: string,
  api: ApiInfo,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>,
  requestBody: string,
  headers: Record<string, string>
): string {
  const url = buildFullUrl(baseUrl, api.path, pathParams, queryParams);

  let code = `// Java - 使用 OkHttp
import okhttp3.*;
import java.io.IOException;

public class ApiClient {
    private static final OkHttpClient client = new OkHttpClient();

    public void callApi() throws IOException {
        String url = "${url}";

        // 构建请求头
        Headers.Builder headersBuilder = new Headers.Builder();`;

  Object.entries(headers).forEach(([key, value]) => {
    code += `\n        headersBuilder.add("${key}", "${value}");`;
  });

  if (api.method === "GET") {
    code += `

        // 构建GET请求
        Request request = new Request.Builder()
            .url(url)
            .headers(headersBuilder.build())
            .get()
            .build();

        // 执行请求
        try (Response response = client.newCall(request).execute()) {
            if (response.body() != null) {
                System.out.println("Response: " + response.body().string());
            }
        }
    }
}`;
  } else {
    const bodyContent = requestBody
      ? requestBody.replace(/"/g, '\\"').replace(/\n/g, "\\n")
      : "{}";
    code += `
        headersBuilder.add("Content-Type", "application/json");

        // 请求体
        String jsonBody = "${bodyContent}";
        RequestBody body = RequestBody.create(jsonBody, MediaType.get("application/json"));

        // 构建${api.method}请求
        Request request = new Request.Builder()
            .url(url)
            .headers(headersBuilder.build())
            .method("${api.method}", body)
            .build();

        // 执行请求
        try (Response response = client.newCall(request).execute()) {
            if (response.body() != null) {
                System.out.println("Response: " + response.body().string());
            }
        }
    }
}`;
  }

  return code;
}

/**
 * 生成 JavaScript 代码示例
 */
export function generateJavaScriptCode(
  baseUrl: string,
  api: ApiInfo,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>,
  requestBody: string,
  headers: Record<string, string>
): string {
  const url = buildFullUrl(baseUrl, api.path, pathParams, queryParams);

  let code = `// JavaScript - 使用 fetch API
const callApi = async () => {
    const url = '${url}';

    const options = {
        method: '${api.method}',
        headers: {`;

  Object.entries(headers).forEach(([key, value]) => {
    code += `\n            '${key}': '${value}',`;
  });

  if (api.method !== "GET" && requestBody) {
    code += `\n            'Content-Type': 'application/json',`;
    code += `
        },
        body: JSON.stringify(${requestBody || "{}"})
    };`;
  } else {
    code += `
        }
    };`;
  }

  code += `

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
};

callApi();`;

  return code;
}

/**
 * 生成 Python 代码示例
 */
export function generatePythonCode(
  baseUrl: string,
  api: ApiInfo,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>,
  requestBody: string,
  headers: Record<string, string>
): string {
  const url = buildFullUrl(baseUrl, api.path, pathParams, {});

  let code = `# Python - 使用 requests 库
import requests
import json

def call_api():
    url = "${url}"

    # 请求头
    headers = {`;

  Object.entries(headers).forEach(([key, value]) => {
    code += `\n        "${key}": "${value}",`;
  });

  code += `
    }

    # 查询参数
    params = ${JSON.stringify(queryParams, null, 8)}`;

  if (api.method === "GET") {
    code += `

    response = requests.get(url, headers=headers, params=params)

    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")`;
  } else {
    code += `

    # 请求体
    data = ${requestBody || "{}"}

    response = requests.${api.method.toLowerCase()}(
        url,
        headers=headers,
        params=params,
        json=data
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")`;
  }

  code += `

if __name__ == "__main__":
    call_api()`;

  return code;
}

/**
 * 生成 cURL 代码示例
 */
export function generateCurlCode(
  baseUrl: string,
  api: ApiInfo,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>,
  requestBody: string,
  headers: Record<string, string>
): string {
  const url = buildFullUrl(baseUrl, api.path, pathParams, queryParams);

  let code = `curl -X ${api.method} \\
  "${url}"`;

  Object.entries(headers).forEach(([key, value]) => {
    code += ` \\
  -H "${key}: ${value}"`;
  });

  if (api.method !== "GET" && requestBody) {
    code += ` \\
  -H "Content-Type: application/json" \\
  -d '${requestBody}'`;
  }

  return code;
}

/**
 * 根据语言类型生成代码
 */
export function generateCode(
  language: CodeLanguage,
  baseUrl: string,
  api: ApiInfo,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>,
  requestBody: string,
  headers: Record<string, string>
): string {
  switch (language) {
    case "java":
      return generateJavaCode(
        baseUrl,
        api,
        pathParams,
        queryParams,
        requestBody,
        headers
      );
    case "javascript":
      return generateJavaScriptCode(
        baseUrl,
        api,
        pathParams,
        queryParams,
        requestBody,
        headers
      );
    case "python":
      return generatePythonCode(
        baseUrl,
        api,
        pathParams,
        queryParams,
        requestBody,
        headers
      );
    case "curl":
      return generateCurlCode(
        baseUrl,
        api,
        pathParams,
        queryParams,
        requestBody,
        headers
      );
    default:
      return "";
  }
}

/**
 * 常用 HTTP 请求头
 */
export const COMMON_HEADERS = [
  { key: "Content-Type", value: "application/json" },
  { key: "Accept", value: "application/json" },
  { key: "Authorization", value: "Bearer " },
  { key: "X-API-Key", value: "" },
];

/**
 * CodeMirror 编辑器默认配置
 */
export const editorConfigs = {
  json: {
    mode: "application/json",
    theme: "default",
    lineNumbers: true,
    readOnly: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lineWrapping: true,
  },
  html: {
    mode: "text/html",
    theme: "default",
    lineNumbers: true,
    readOnly: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lineWrapping: true,
  },
  xml: {
    mode: "application/xml",
    theme: "default",
    lineNumbers: true,
    readOnly: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lineWrapping: true,
  },
  text: {
    mode: "text/plain",
    theme: "default",
    lineNumbers: true,
    readOnly: true,
    lineWrapping: true,
  },
  java: {
    mode: "text/x-java",
    theme: "default",
    lineNumbers: true,
    readOnly: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lineWrapping: true,
  },
  javascript: {
    mode: "text/javascript",
    theme: "default",
    lineNumbers: true,
    readOnly: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lineWrapping: true,
  },
  python: {
    mode: "text/x-python",
    theme: "default",
    lineNumbers: true,
    readOnly: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lineWrapping: true,
  },
  shell: {
    mode: "shell",
    theme: "default",
    lineNumbers: true,
    readOnly: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lineWrapping: true,
  },
  requestBody: {
    mode: "application/json",
    theme: "default",
    lineNumbers: true,
    readOnly: false,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lineWrapping: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 2,
    tabSize: 2,
  },
};
