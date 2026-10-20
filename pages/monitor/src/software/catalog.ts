/**
 * 软件指标注册表（前端展示口径）
 *
 * <p>与后端 {@code SoftwareCatalog}（spring-support-server-starter）的 {@code type} 一一对齐：
 * 后端负责「这台机器上识别到了哪些软件」，前端只负责「怎么展示」——名称、分组、图标、配色。
 * 所以「没安装」是确定性的：识别结果里没有该 type，就是没装，前端不做猜测。</p>
 */
export type SoftwareGroupKey =
  | "cache"
  | "database"
  | "middleware"
  | "message"
  | "search"
  | "runtime";

export const SOFTWARE_GROUP_LABEL: Record<SoftwareGroupKey, string> = {
  cache: "缓存",
  database: "数据库",
  middleware: "中间件",
  message: "消息队列",
  search: "搜索",
  runtime: "运行时",
};

export interface SoftwareDef {
  type: string;
  label: string;
  group: SoftwareGroupKey;
  icon: string;
  role: "primary" | "success" | "warning" | "danger" | "info";
}

export const SOFTWARE_CATALOG: SoftwareDef[] = [
  // 缓存
  { type: "redis", label: "Redis", group: "cache", icon: "Coin", role: "danger" },
  { type: "redis-sentinel", label: "Redis Sentinel", group: "cache", icon: "Coin", role: "danger" },
  { type: "memcached", label: "Memcached", group: "cache", icon: "Box", role: "warning" },
  // 数据库
  { type: "mysql", label: "MySQL", group: "database", icon: "Collection", role: "primary" },
  { type: "mariadb", label: "MariaDB", group: "database", icon: "Collection", role: "primary" },
  { type: "postgres", label: "PostgreSQL", group: "database", icon: "Collection", role: "success" },
  { type: "mongodb", label: "MongoDB", group: "database", icon: "Collection", role: "success" },
  { type: "minio", label: "MinIO", group: "database", icon: "Box", role: "danger" },
  // 中间件
  { type: "nginx", label: "Nginx", group: "middleware", icon: "DataLine", role: "success" },
  { type: "tomcat", label: "Apache Tomcat", group: "middleware", icon: "Grid", role: "warning" },
  { type: "etcd", label: "etcd", group: "middleware", icon: "Grid", role: "primary" },
  { type: "zookeeper", label: "Apache ZooKeeper", group: "middleware", icon: "Grid", role: "warning" },
  { type: "skywalking", label: "SkyWalking OAP", group: "middleware", icon: "DataLine", role: "success" },
  { type: "arthas", label: "Arthas", group: "middleware", icon: "Cpu", role: "info" },
  // 消息队列
  { type: "kafka", label: "Apache Kafka", group: "message", icon: "Message", role: "primary" },
  { type: "rabbitmq", label: "RabbitMQ", group: "message", icon: "Message", role: "warning" },
  // 搜索
  { type: "elasticsearch", label: "Elasticsearch", group: "search", icon: "Search", role: "success" },
  // 运行时 / 容器 / 采集器
  { type: "java", label: "Java 应用", group: "runtime", icon: "Cpu", role: "info" },
  { type: "node", label: "Node.js", group: "runtime", icon: "Cpu", role: "success" },
  { type: "docker", label: "Docker", group: "runtime", icon: "Box", role: "primary" },
  { type: "containerd", label: "containerd", group: "runtime", icon: "Box", role: "info" },
  { type: "redis-exporter", label: "Redis Exporter", group: "runtime", icon: "Monitor", role: "info" },
  { type: "node-exporter", label: "Node Exporter", group: "runtime", icon: "Monitor", role: "info" },
];

const BY_TYPE: Map<string, SoftwareDef> = new Map(
  SOFTWARE_CATALOG.map((d) => [d.type, d]),
);

export function softwareDef(type: string, displayName?: string): SoftwareDef {
  const hit = BY_TYPE.get(type);
  if (hit) return displayName ? { ...hit, label: displayName } : hit;
  return { type, label: displayName || type, group: "runtime", icon: "Monitor", role: "info" };
}

export function catalogOrder(type: string): number {
  const i = SOFTWARE_CATALOG.findIndex((d) => d.type === type);
  return i < 0 ? Number.MAX_SAFE_INTEGER : i;
}
