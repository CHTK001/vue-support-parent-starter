import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

type ConnectionDefinition = {
  connectionId?: string;
  connectionName?: string;
  connectionType?: string;
  protocol?: string;
  host?: string;
  port?: number;
  databaseName?: string;
  username?: string;
  password?: string;
  enabled?: boolean;
};

type ConnectionHandle = {
  connectionId: string;
  createdTime: string;
  expireTime: string;
  definition: ConnectionDefinition;
};

type ConnectionDescriptor = {
  connectionId: string;
  connectionName?: string;
  connectionType?: string;
  cached: boolean;
  enabled: boolean;
  lastAccessTime: string;
};

type JdbcCatalogNode = {
  nodeId: string;
  parentId: string | null;
  nodeType: string;
  nodeName: string;
  description?: string;
  catalogName?: string | null;
  schemaName?: string | null;
  tableName?: string | null;
  children: JdbcCatalogNode[];
};

type JdbcTableStructure = {
  catalogName?: string;
  schemaName?: string;
  tableName: string;
  tableComment?: string;
  columns: Array<{ name: string; type: string; comment: string }>;
  indexes: Array<Record<string, unknown>>;
  primaryKeys: string[];
};

const now = () => new Date().toISOString();

const catalogTree: JdbcCatalogNode[] = [
  {
    nodeId: "catalog::panel_case",
    parentId: null,
    nodeType: "catalog",
    nodeName: "panel_case",
    description: "数据库",
    catalogName: "panel_case",
    children: [
      {
        nodeId: "schema::panel_case::public",
        parentId: "catalog::panel_case",
        nodeType: "schema",
        nodeName: "public",
        description: "Schema",
        catalogName: "panel_case",
        schemaName: "public",
        children: [
          {
            nodeId: "table::panel_case::public::user_account",
            parentId: "schema::panel_case::public",
            nodeType: "table",
            nodeName: "user_account",
            description: "表 / panel_case / public",
            catalogName: "panel_case",
            schemaName: "public",
            tableName: "user_account",
            children: [],
          },
        ],
      },
      {
        nodeId: "schema::panel_case::biz",
        parentId: "catalog::panel_case",
        nodeType: "schema",
        nodeName: "biz",
        description: "Schema",
        catalogName: "panel_case",
        schemaName: "biz",
        children: [
          {
            nodeId: "table::panel_case::biz::order_record",
            parentId: "schema::panel_case::biz",
            nodeType: "table",
            nodeName: "order_record",
            description: "表 / panel_case / biz",
            catalogName: "panel_case",
            schemaName: "biz",
            tableName: "order_record",
            children: [],
          },
        ],
      },
    ],
  },
];

const structureMap: Record<string, JdbcTableStructure> = {
  user_account: {
    catalogName: "panel_case",
    schemaName: "public",
    tableName: "user_account",
    columns: [
      { name: "id", type: "bigint", comment: "用户主键" },
      { name: "user_name", type: "varchar(64)", comment: "用户名" },
      { name: "status", type: "varchar(16)", comment: "状态" },
    ],
    indexes: [{ name: "pk_user_account", column: "id", nonUnique: false }],
    primaryKeys: ["id"],
  },
  order_record: {
    catalogName: "panel_case",
    schemaName: "biz",
    tableName: "order_record",
    columns: [
      { name: "id", type: "bigint", comment: "订单主键" },
      { name: "order_name", type: "varchar(64)", comment: "订单名称" },
      { name: "amount", type: "decimal(10,2)", comment: "订单金额" },
    ],
    indexes: [{ name: "pk_order_record", column: "id", nonUnique: false }],
    primaryKeys: ["id"],
  },
};

const rowMap: Record<string, Array<Record<string, unknown>>> = {
  user_account: [
    { id: 1, user_name: "alice", status: "ACTIVE" },
    { id: 2, user_name: "bob", status: "DISABLED" },
  ],
  order_record: [
    { id: 101, order_name: "starter", amount: 12.5 },
    { id: 102, order_name: "support", amount: 25 },
  ],
};

const handles = new Map<string, ConnectionHandle>();

const ok = <T>(data: T) => ({
  code: 200,
  success: true,
  msg: "ok",
  message: "ok",
  data,
});

const findTableNodes = () =>
  catalogTree.flatMap(catalog =>
    catalog.children.flatMap(schema => schema.children.map(table => ({ ...table }))),
  );

const readBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
};

const parseSqlBody = (body: string) => {
  const trimmed = body.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("\"")) {
    return JSON.parse(trimmed) as string;
  }
  return trimmed;
};

const sendJson = (res: ServerResponse, data: unknown) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
};

const createHandle = (definition: ConnectionDefinition): ConnectionHandle => {
  const connectionId = definition.connectionId || `mock-${Date.now()}`;
  return {
    connectionId,
    createdTime: now(),
    expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    definition: {
      connectionId,
      connectionName: definition.connectionName || "Panel Playground",
      connectionType: definition.connectionType || "JDBC",
      protocol: definition.protocol || "",
      host: definition.host || "127.0.0.1",
      port: definition.port || 3306,
      databaseName: definition.databaseName || "panel_case",
      username: definition.username || "root",
      password: definition.password || "",
      enabled: definition.enabled ?? true,
    },
  };
};

const createPanelMockMiddleware = () =>
  async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    const requestUrl = req.url || "";
    if (!requestUrl.startsWith("/v1/panel/jdbc")) {
      next();
      return;
    }

    const url = new URL(requestUrl, "http://127.0.0.1:5701");
    const pathname = url.pathname;

    if (req.method === "POST" && pathname === "/v1/panel/jdbc/connection/open") {
      const body = await readBody(req);
      const definition = JSON.parse(body || "{}") as ConnectionDefinition;
      const handle = createHandle(definition);
      handles.set(handle.connectionId, handle);
      sendJson(res, ok(handle));
      return;
    }

    if (req.method === "GET" && pathname === "/v1/panel/jdbc/connection/cache") {
      const descriptors: ConnectionDescriptor[] = [...handles.values()].map(handle => ({
        connectionId: handle.connectionId,
        connectionName: handle.definition.connectionName,
        connectionType: handle.definition.connectionType,
        cached: true,
        enabled: handle.definition.enabled ?? true,
        lastAccessTime: now(),
      }));
      sendJson(res, ok(descriptors));
      return;
    }

    const deleteMatch = pathname.match(/^\/v1\/panel\/jdbc\/connection\/([^/]+)$/);
    if (req.method === "DELETE" && deleteMatch) {
      handles.delete(deleteMatch[1]);
      sendJson(res, ok(true));
      return;
    }

    const connectionMatch = pathname.match(/^\/v1\/panel\/jdbc\/([^/]+)(?:\/(.*))?$/);
    if (!connectionMatch) {
      next();
      return;
    }

    const [, connectionId, action = ""] = connectionMatch;
    if (!handles.has(connectionId) && action !== "connection") {
      sendJson(res, {
        code: 404,
        success: false,
        msg: "connection not found",
        message: "connection not found",
        data: null,
      });
      return;
    }

    if (req.method === "GET" && action === "catalog") {
      sendJson(res, ok(catalogTree));
      return;
    }

    if (req.method === "GET" && action === "search") {
      const keyword = (url.searchParams.get("keyword") || "").toLowerCase();
      const matched = findTableNodes().filter(item =>
        (item.tableName || item.nodeName).toLowerCase().includes(keyword),
      );
      sendJson(res, ok(matched));
      return;
    }

    if (req.method === "GET" && action === "structure") {
      const tableName = url.searchParams.get("tableName") || "";
      sendJson(res, ok(structureMap[tableName]));
      return;
    }

    if (req.method === "GET" && action === "document") {
      const tableName = url.searchParams.get("tableName") || "";
      const structure = structureMap[tableName];
      const lines = structure.columns
        .map(column => `| ${column.name} | ${column.type} | ${column.comment} |`)
        .join("\n");
      sendJson(
        res,
        ok(
          `# 表结构文档\n\n- 表名: ${structure.tableName}\n- Schema: ${structure.schemaName}\n\n| 字段 | 类型 | 注释 |\n| --- | --- | --- |\n${lines}`,
        ),
      );
      return;
    }

    if (req.method === "GET" && action === "ai/structure") {
      const tableName = url.searchParams.get("tableName") || "";
      const structure = structureMap[tableName];
      sendJson(
        res,
        ok(
          `表 \`${structure.tableName}\` 共 ${structure.columns.length} 个字段，主键为 ${structure.primaryKeys.join(", ")}。`,
        ),
      );
      return;
    }

    if (req.method === "POST" && action === "ai/sql") {
      const sql = parseSqlBody(await readBody(req)).toLowerCase();
      const response = sql.startsWith("select")
        ? "该 SQL 为查询语句，建议关注过滤条件和返回行数。"
        : "该 SQL 可能改写数据，请先确认影响范围。";
      sendJson(res, ok(response));
      return;
    }

    if (req.method === "POST" && action === "execute") {
      const sql = parseSqlBody(await readBody(req)).toLowerCase();
      if (sql.includes("order_record")) {
        sendJson(res, ok({
          query: true,
          affectedRows: rowMap.order_record.length,
          columns: ["id", "order_name", "amount"],
          rows: rowMap.order_record,
        }));
        return;
      }
      if (sql.includes("user_account")) {
        sendJson(res, ok({
          query: true,
          affectedRows: rowMap.user_account.length,
          columns: ["id", "user_name", "status"],
          rows: rowMap.user_account,
        }));
        return;
      }
      sendJson(res, ok({
        query: true,
        affectedRows: 1,
        columns: ["ping"],
        rows: [{ ping: 1 }],
      }));
      return;
    }

    next();
  };

export default defineConfig({
  resolve: {
    dedupe: ["vue"],
    alias: {
      "@repo/components/ScCodeEditor": fileURLToPath(
        new URL("../../packages/components-standalone/ScCodeEditor", import.meta.url),
      ),
      "@repo/utils": fileURLToPath(
        new URL("./src/shims/repo-utils.ts", import.meta.url),
      ),
    },
  },
  plugins: [
    vue(),
    {
      name: "panel-playground-mock",
      configureServer(server) {
        server.middlewares.use(createPanelMockMiddleware());
      },
      configurePreviewServer(server) {
        server.middlewares.use(createPanelMockMiddleware());
      },
    },
  ],
});
