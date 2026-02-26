import express from "express";
import cors from "cors";
import { createMockServer } from "@scalar/mock-server";
import { readFileSync } from "fs";
import { resolve } from "path";

const app = express();
const PORT = process.env.PORT || 3100;

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
      console.log(`📄 Loading OpenAPI spec from file: ${config.specPath}`);
      const specPath = resolve(process.cwd(), config.specPath);
      const fileContent = readFileSync(specPath, "utf-8");
      specContent = JSON.parse(fileContent);
    } else if (config.swaggerUrl || config.openapiUrl) {
      const url = config.swaggerUrl || config.openapiUrl;
      console.log(`🌐 Loading OpenAPI spec from URL: ${url}`);
      const response = await fetch(url!);
      specContent = await response.json();
    } else {
      // 使用示例 OpenAPI 规范
      console.log("⚠️  No spec provided, using example OpenAPI spec");
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
    const mockServer = createMockServer({
      specification: specContent,
    });

    // 挂载 Mock 服务器到 Express
    app.use("/api", mockServer);

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
      console.log(`\n🚀 Mock Server is running!`);
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}/api`);
      console.log(`📍 Health: http://localhost:${PORT}/health`);
      console.log(`📍 Config: http://localhost:${PORT}/config`);
      console.log(
        `\n💡 Tip: Set SWAGGER_URL, OPENAPI_URL, or SPEC_PATH environment variable to use your own spec\n`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to start mock server:", error);
    process.exit(1);
  }
}

startMockServer();
