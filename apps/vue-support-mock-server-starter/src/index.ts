import express from "express";
import cors from "cors";
import { createMockServer } from "@scalar/mock-server";
import { readFileSync } from "fs";
import { resolve } from "path";

const app = express();
const DEFAULT_PORT = 3100;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

// 启用 CORS
app.use(cors());
app.use(express.json());

// 配置信息
interface MockConfig {
  swaggerUrl?: string;
  openapiUrl?: string;
  specPath?: string;
}

// 从环境变量或配置文件读取配置
const config: MockConfig = {
  swaggerUrl: process.env.SWAGGER_URL,
  openapiUrl: process.env.OPENAPI_URL,
  specPath: process.env.SPEC_PATH,
};

async function startMockServer() {
  try {
    let specContent: any;

    // 优先级：本地文件 > URL
    if (config.specPath) {
      console.log(`[mock-server][加载] 从文件读取 OpenAPI 规范：${config.specPath}`);
      const specPath = resolve(process.cwd(), config.specPath);
      const fileContent = readFileSync(specPath, "utf-8");
      specContent = JSON.parse(fileContent);
    } else if (config.swaggerUrl || config.openapiUrl) {
      const url = config.swaggerUrl || config.openapiUrl;
      console.log(`[mock-server][加载] 从 URL 读取 OpenAPI 规范：${url}`);
      const response = await fetch(url!);
      specContent = await response.json();
    } else {
      // 使用示例 OpenAPI 规范
      console.log("[mock-server][提示] 未提供规范，使用示例 OpenAPI 规范");
      specContent = {
        openapi: "3.1.0",
        info: {
          title: "Example API",
          version: "1.0.0",
        },
        paths: {
          "/users": {
            get: {
              summary: "Get all users",
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "integer" },
                            name: { type: "string" },
                            email: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "/users/{id}": {
            get: {
              summary: "Get user by ID",
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: { type: "integer" },
                },
              ],
              responses: {
                "200": {
                  description: "Successful response",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          id: { type: "integer" },
                          name: { type: "string" },
                          email: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
    }

    // 创建 Mock 服务器
    const mockServer = await createMockServer({
      specification: specContent,
    });

    // 挂载 Mock 服务器到 Express
    // 说明：createMockServer 返回的是 Hono 应用（fetch handler），这里做一层适配为 Express middleware
    app.use("/api", async (req, res, next) => {
      try {
        const host = req.headers.host || `localhost:${PORT}`;
        const url = new URL(req.originalUrl, `http://${host}`);

        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
          if (value == null) {
            continue;
          }
          if (Array.isArray(value)) {
            for (const v of value) {
              headers.append(key, v);
            }
          } else {
            headers.set(key, value);
          }
        }

        const init: RequestInit = {
          method: req.method,
          headers,
        };

        // express.json() 已经解析过 body；这里按常见 JSON 场景重建请求体
        if (req.method !== "GET" && req.method !== "HEAD" && req.body != null) {
          const isEmptyObject = typeof req.body === "object" && !Array.isArray(req.body) && Object.keys(req.body).length === 0;
          if (!isEmptyObject) {
            init.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
            if (!headers.has("content-type")) {
              headers.set("content-type", "application/json");
            }
          }
        }

        const response = await mockServer.fetch(new Request(url, init));

        res.status(response.status);
        response.headers.forEach((value, key) => {
          // Express 对部分 header（如 set-cookie）有特殊处理；这里先做通用透传
          res.setHeader(key, value);
        });

        const buffer = Buffer.from(await response.arrayBuffer());
        res.send(buffer);
      } catch (error) {
        next(error);
      }
    });

    // 健康检查端点
    app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // 配置信息端点
    app.get("/config", (req, res) => {
      res.json({
        config: {
          swaggerUrl: config.swaggerUrl || null,
          openapiUrl: config.openapiUrl || null,
          specPath: config.specPath || null,
        },
        info: specContent.info || {},
      });
    });

    // 启动服务器
    app.listen(PORT, () => {
      console.log("\n[mock-server][启动] Mock Server 已启动");
      console.log(`[mock-server][地址] Server：http://localhost:${PORT}`);
      console.log(`[mock-server][地址] API：http://localhost:${PORT}/api`);
      console.log(`[mock-server][地址] Health：http://localhost:${PORT}/health`);
      console.log(`[mock-server][地址] Config：http://localhost:${PORT}/config`);
      console.log("\n[mock-server][提示] 可通过环境变量 SWAGGER_URL / OPENAPI_URL / SPEC_PATH 指定 OpenAPI 规范\n");
    });
  } catch (error) {
    console.error("[mock-server][启动] 启动失败：", error);
    process.exit(1);
  }
}

startMockServer();
