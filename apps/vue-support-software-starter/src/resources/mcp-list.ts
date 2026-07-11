export interface McpServerInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  npm?: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  homepage?: string;
}

export const BUILTIN_MCP_SERVERS: McpServerInfo[] = [
  { id: "filesystem", name: "Filesystem", description: "安全文件系统操作，可配置访问控制", category: "filesystem", icon: "📁", npm: "@modelcontextprotocol/server-filesystem", command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem"] },
  { id: "github", name: "GitHub", description: "GitHub API 集成，仓库管理、Issues 和 PR", category: "devtools", icon: "🐙", npm: "@modelcontextprotocol/server-github", command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], env: { GITHUB_PERSONAL_ACCESS_TOKEN: "" } },
  { id: "postgres", name: "PostgreSQL", description: "PostgreSQL 数据库只读查询", category: "database", icon: "🐘", npm: "@modelcontextprotocol/server-postgres", command: "npx", args: ["-y", "@modelcontextprotocol/server-postgres"] },
  { id: "sqlite", name: "SQLite", description: "SQLite 数据库操作，表结构检查和查询", category: "database", icon: "🗃️", npm: "@modelcontextprotocol/server-sqlite", command: "npx", args: ["-y", "@modelcontextprotocol/server-sqlite"] },
  { id: "brave-search", name: "Brave Search", description: "使用 Brave Search API 进行网页和本地搜索", category: "search", icon: "🦁", npm: "@modelcontextprotocol/server-brave-search", command: "npx", args: ["-y", "@modelcontextprotocol/server-brave-search"], env: { BRAVE_API_KEY: "" } },
  { id: "google-maps", name: "Google Maps", description: "Google Maps API 地点查询和导航", category: "cloud", icon: "🗺️", npm: "@modelcontextprotocol/server-google-maps", command: "npx", args: ["-y", "@modelcontextprotocol/server-google-maps"], env: { GOOGLE_MAPS_API_KEY: "" } },
  { id: "puppeteer", name: "Puppeteer", description: "浏览器自动化和网页抓取", category: "devtools", icon: "🎭", npm: "@modelcontextprotocol/server-puppeteer", command: "npx", args: ["-y", "@modelcontextprotocol/server-puppeteer"] },
  { id: "memory", name: "Memory", description: "基于知识图谱的持久化记忆系统", category: "ai", icon: "🧠", npm: "@modelcontextprotocol/server-memory", command: "npx", args: ["-y", "@modelcontextprotocol/server-memory"] },
  { id: "slack", name: "Slack", description: "Slack 工作区集成", category: "communication", icon: "💬", npm: "@modelcontextprotocol/server-slack", command: "npx", args: ["-y", "@modelcontextprotocol/server-slack"], env: { SLACK_BOT_TOKEN: "", SLACK_TEAM_ID: "" } },
  { id: "fetch", name: "Fetch", description: "HTTP 请求获取网页内容和 API 调用", category: "utility", icon: "🌐", npm: "@modelcontextprotocol/server-fetch", command: "npx", args: ["-y", "@modelcontextprotocol/server-fetch"] },
  { id: "git", name: "Git", description: "Git 仓库操作：状态、差异、提交", category: "devtools", icon: "📦", npm: "@modelcontextprotocol/server-git", command: "npx", args: ["-y", "@modelcontextprotocol/server-git"] },
  { id: "sequential-thinking", name: "Sequential Thinking", description: "通过顺序思考步骤进行结构化推理", category: "ai", icon: "🧩", npm: "@modelcontextprotocol/server-sequential-thinking", command: "npx", args: ["-y", "@modelcontextprotocol/server-sequential-thinking"] },
  { id: "everything", name: "Everything", description: "展示所有 MCP 原语的参考/测试服务器", category: "utility", icon: "🔧", npm: "@modelcontextprotocol/server-everything", command: "npx", args: ["-y", "@modelcontextprotocol/server-everything"] },
  { id: "firecrawl", name: "Firecrawl", description: "使用 Firecrawl API 进行网页爬取", category: "search", icon: "🔥", npm: "@modelcontextprotocol/server-firecrawl", command: "npx", args: ["-y", "@modelcontextprotocol/server-firecrawl"], env: { FIRECRAWL_API_KEY: "" } },
  { id: "sentry", name: "Sentry", description: "Sentry 错误追踪和问题管理", category: "devtools", icon: "🔍", npm: "@modelcontextprotocol/server-sentry", command: "npx", args: ["-y", "@modelcontextprotocol/server-sentry"], env: { SENTRY_AUTH_TOKEN: "", SENTRY_ORG: "" } },
  { id: "notion", name: "Notion", description: "Notion 工作区集成", category: "productivity", icon: "📝", npm: "@modelcontextprotocol/server-notion", command: "npx", args: ["-y", "@modelcontextprotocol/server-notion"], env: { NOTION_API_KEY: "" } },
  { id: "playwright", name: "Playwright", description: "跨浏览器自动化测试和网页交互", category: "devtools", icon: "🎭", npm: "@modelcontextprotocol/server-playwright", command: "npx", args: ["-y", "@modelcontextprotocol/server-playwright"] },
  { id: "redis", name: "Redis", description: "Redis 键值存储操作和缓存管理", category: "database", icon: "🔴", npm: "@modelcontextprotocol/server-redis", command: "npx", args: ["-y", "@modelcontextprotocol/server-redis"] },
]
