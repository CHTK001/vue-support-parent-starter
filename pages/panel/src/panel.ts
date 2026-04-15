export interface PanelCapabilityCard {
  code: string;
  description: string;
  enabled: boolean;
  title: string;
}

export interface PanelSection {
  code: string;
  description: string;
  title: string;
}

export interface JdbcConnectionForm {
  sourceId?: string;
  connectionId: string;
  sourceType: "JDBC" | "REDIS";
  jdbcDialectType: string;
  connectionName: string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  driverClassName: string;
  driverJarName: string;
  driverJarPath: string;
  protocol: string;
  note?: string;
  favorite?: boolean;
  updatedAt?: string;
}

export interface PanelSavedSource extends JdbcConnectionForm {
  sourceId: string;
  updatedAt: string;
}

export const PANEL_SOURCE_STORAGE_KEY = "panel:sources:v3";

export const PANEL_SECTIONS: PanelSection[] = [
  {
    code: "connection",
    title: "连接管理",
    description: "统一管理 JDBC、Redis 等客户端连接与缓存。",
  },
  {
    code: "explorer",
    title: "对象浏览",
    description: "浏览数据库、表、字段、索引与服务器基础信息。",
  },
  {
    code: "debug",
    title: "在线调试",
    description: "执行 SQL/命令并查看实时结果与历史记录。",
  },
  {
    code: "document",
    title: "文档中心",
    description: "查看结构文档、生成说明与导出结果。",
  },
  {
    code: "ai",
    title: "AI 助手",
    description: "解释结构、解释 SQL、生成文档草稿。",
  },
];

export const PANEL_CAPABILITIES: PanelCapabilityCard[] = [
  {
    code: "jdbc",
    title: "JDBC Client",
    description: "支持连接缓存、Catalog/Schema/表浏览、结构读取与 SQL 执行。",
    enabled: true,
  },
  {
    code: "redis",
    title: "Redis Client",
    description: "第二阶段扩展，支持 key 浏览、命令执行与结构查看。",
    enabled: false,
  },
  {
    code: "document",
    title: "文档查看/生成",
    description: "已支持结构文档生成，可联动表结构结果区查看。",
    enabled: true,
  },
  {
    code: "ai",
    title: "AI 增强",
    description: "已支持结构解释和 SQL 类型解释。",
    enabled: true,
  },
];

export const DEFAULT_JDBC_CONNECTION: JdbcConnectionForm = {
  sourceId: "",
  connectionId: "",
  sourceType: "JDBC",
  jdbcDialectType: "MYSQL",
  connectionName: "",
  host: "",
  port: 3306,
  databaseName: "",
  username: "",
  password: "",
  driverClassName: "com.mysql.cj.jdbc.Driver",
  driverJarName: "",
  driverJarPath: "",
  protocol: "",
  note: "",
  favorite: false,
  updatedAt: "",
};
