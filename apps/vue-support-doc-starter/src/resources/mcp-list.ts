export interface McpServerInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  npm?: string;
  pip?: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  homepage?: string;
  stars?: number;
}

export const MCP_CATEGORIES = [
  { id: "all", name: "All", icon: "Grid" },
  { id: "filesystem", name: "File System", icon: "Folder" },
  { id: "database", name: "Database", icon: "Coin" },
  { id: "search", name: "Search", icon: "Search" },
  { id: "cloud", name: "Cloud", icon: "Cloud" },
  { id: "devtools", name: "Dev Tools", icon: "Monitor" },
  { id: "communication", name: "Communication", icon: "ChatDotRound" },
  { id: "ai", name: "AI / ML", icon: "MagicStick" },
  { id: "productivity", name: "Productivity", icon: "Calendar" },
  { id: "other", name: "Other", icon: "MoreFilled" }
] as const;

export const BUILTIN_MCP_SERVERS: McpServerInfo[] = [
  {
    id: "filesystem",
    name: "Filesystem",
    description: "Provides secure file system operations with configurable access controls",
    category: "filesystem",
    icon: "📁",
    npm: "@modelcontextprotocol/server-filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "github",
    name: "GitHub",
    description: "GitHub API integration for repository management, issues, and PRs",
    category: "devtools",
    icon: "🐙",
    npm: "@modelcontextprotocol/server-github",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: "your-token" },
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "PostgreSQL database access with read-only query support",
    category: "database",
    icon: "🐘",
    npm: "@modelcontextprotocol/server-postgres",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "sqlite",
    name: "SQLite",
    description: "SQLite database operations with schema inspection and querying",
    category: "database",
    icon: "🗃️",
    npm: "@modelcontextprotocol/server-sqlite",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "/path/to/db.sqlite"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "brave-search",
    name: "Brave Search",
    description: "Web and local search using Brave Search API",
    category: "search",
    icon: "🦁",
    npm: "@modelcontextprotocol/server-brave-search",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    env: { BRAVE_API_KEY: "your-api-key" },
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "google-maps",
    name: "Google Maps",
    description: "Google Maps API for places, directions, and geocoding",
    category: "cloud",
    icon: "🗺️",
    npm: "@modelcontextprotocol/server-google-maps",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-google-maps"],
    env: { GOOGLE_MAPS_API_KEY: "your-api-key" },
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "puppeteer",
    name: "Puppeteer",
    description: "Browser automation and web scraping with Puppeteer",
    category: "devtools",
    icon: "🎭",
    npm: "@modelcontextprotocol/server-puppeteer",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "memory",
    name: "Memory",
    description: "Knowledge graph-based persistent memory system",
    category: "ai",
    icon: "🧠",
    npm: "@modelcontextprotocol/server-memory",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "slack",
    name: "Slack",
    description: "Slack workspace integration for messaging and channels",
    category: "communication",
    icon: "💬",
    npm: "@modelcontextprotocol/server-slack",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    env: { SLACK_BOT_TOKEN: "xoxb-...", SLACK_TEAM_ID: "T00000000" },
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "fetch",
    name: "Fetch",
    description: "HTTP fetch for web content retrieval and API calls",
    category: "other",
    icon: "🌐",
    npm: "@modelcontextprotocol/server-fetch",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-fetch"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "git",
    name: "Git",
    description: "Git repository operations including status, diff, and commits",
    category: "devtools",
    icon: "📦",
    npm: "@modelcontextprotocol/server-git",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-git", "--repository", "/path/to/repo"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "sequential-thinking",
    name: "Sequential Thinking",
    description: "Structured reasoning through sequential thought steps",
    category: "ai",
    icon: "🧩",
    npm: "@modelcontextprotocol/server-sequential-thinking",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "everything",
    name: "Everything",
    description: "Reference/test server exposing all MCP primitives",
    category: "other",
    icon: "🔧",
    npm: "@modelcontextprotocol/server-everything",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-everything"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    description: "Web crawling and scraping with Firecrawl API",
    category: "search",
    icon: "🔥",
    npm: "@modelcontextprotocol/server-firecrawl",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-firecrawl"],
    env: { FIRECRAWL_API_KEY: "fc-" },
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "sentry",
    name: "Sentry",
    description: "Sentry error tracking and issue management integration",
    category: "devtools",
    icon: "🔍",
    npm: "@modelcontextprotocol/server-sentry",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sentry"],
    env: { SENTRY_AUTH_TOKEN: "your-token", SENTRY_ORG: "your-org" },
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "aws-s3",
    name: "AWS S3",
    description: "Amazon S3 bucket operations for file storage",
    category: "cloud",
    icon: "☁️",
    npm: "@modelcontextprotocol/server-aws-s3",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-aws-s3"],
    env: { AWS_ACCESS_KEY_ID: "your-key", AWS_SECRET_ACCESS_KEY: "your-secret", AWS_REGION: "us-east-1" },
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "linear",
    name: "Linear",
    description: "Linear project management for issues and projects",
    category: "productivity",
    icon: "📋",
    npm: "@modelcontextprotocol/server-linear",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-linear"],
    env: { LINEAR_API_KEY: "lin_api_" },
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "notion",
    name: "Notion",
    description: "Notion workspace integration for pages and databases",
    category: "productivity",
    icon: "📝",
    npm: "@modelcontextprotocol/server-notion",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-notion"],
    env: { NOTION_API_KEY: "secret_" },
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "postgres-full",
    name: "PostgreSQL (Full)",
    description: "Full-featured PostgreSQL with read/write support",
    category: "database",
    icon: "🐘",
    npm: "@modelcontextprotocol/server-postgres",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "redis",
    name: "Redis",
    description: "Redis key-value store operations and pub/sub",
    category: "database",
    icon: "🔴",
    npm: "@modelcontextprotocol/server-redis",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-redis", "redis://localhost:6379"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  },
  {
    id: "docker",
    name: "Docker",
    description: "Docker container management and operations",
    category: "devtools",
    icon: "🐳",
    npm: "@modelcontextprotocol/server-docker",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-docker"],
    homepage: "https://github.com/modelcontextprotocol/servers",
    stars: 5200
  }
];
