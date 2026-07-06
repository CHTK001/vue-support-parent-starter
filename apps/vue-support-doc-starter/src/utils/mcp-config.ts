import type { McpServerInfo } from "@/resources/mcp-list";

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

export interface LocalMcpEntry {
  name: string;
  source: string;
  config: McpServerConfig;
}

export type Platform = "win32" | "darwin" | "linux";

// Get current platform
export function getPlatform(): Platform {
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("win")) return "win32";
    if (ua.includes("mac")) return "darwin";
    return "linux";
  }
  return "win32";
}

// Resolve platform-specific path
export function resolvePath(paths: Record<Platform, string>): string {
  const platform = getPlatform();
  return paths[platform] || paths.linux;
}

// Client config file locations - platform specific
export const CLIENT_TYPES = ["agent", "code", "database", "search", "cloud", "devtools", "ai", "other"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const MCP_CLIENTS: Array<{
  id: string;
  name: string;
  type: ClientType;
  icon: string;
  logo: string;
  color: string;
  homeDir: Record<Platform, string>;
  configPaths: Record<Platform, string>;
}> = [
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    type: "agent",
    icon: "🟣",
    logo: "/logos/claude.png",
    color: "#7C3AED",
    homeDir: { win32: "%APPDATA%/Claude", darwin: "~/Library/Application Support/Claude", linux: "~/.config/Claude" },
    configPaths: {
      win32: "%APPDATA%/Claude/claude_desktop_config.json",
      darwin: "~/Library/Application Support/Claude/claude_desktop_config.json",
      linux: "~/.config/Claude/claude_desktop_config.json"
    }
  },
  {
    id: "vscode",
    name: "VS Code",
    type: "code",
    icon: "🔵",
    logo: "/logos/vscode.png",
    color: "#007ACC",
    homeDir: { win32: "%APPDATA%/Code/User", darwin: "~/Library/Application Support/Code/User", linux: "~/.config/Code/User" },
    configPaths: {
      win32: "%APPDATA%/Code/User/globalStorage/anthropic.claude-code/settings/cline_mcp_settings.json",
      darwin: "~/Library/Application Support/Code/User/globalStorage/anthropic.claude-code/settings/cline_mcp_settings.json",
      linux: "~/.config/Code/User/globalStorage/anthropic.claude-code/settings/cline_mcp_settings.json"
    }
  },
  {
    id: "mimocode",
    name: "MiMo Code",
    type: "code",
    icon: "🟦",
    logo: "/logos/mimocode.png",
    color: "#3B82F6",
    homeDir: { win32: "%USERPROFILE%/.config/mimocode", darwin: "~/.config/mimocode", linux: "~/.config/mimocode" },
    configPaths: {
      win32: "%USERPROFILE%/.config/mimocode/mcp.json",
      darwin: "~/.config/mimocode/mcp.json",
      linux: "~/.config/mimocode/mcp.json"
    }
  },
  {
    id: "cursor",
    name: "Cursor",
    type: "code",
    icon: "🟢",
    logo: "/logos/cursor.png",
    color: "#00D084",
    homeDir: { win32: "%APPDATA%/Cursor", darwin: "~/Library/Application Support/Cursor", linux: "~/.cursor" },
    configPaths: {
      win32: "%APPDATA%/Cursor/User/globalStorage/cursor.mcp/mcp.json",
      darwin: "~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/mcp.json",
      linux: "~/.cursor/mcp.json"
    }
  },
  {
    id: "opencode",
    name: "OpenCode",
    type: "agent",
    icon: "🟢",
    logo: "/logos/opencode.png",
    color: "#10B981",
    homeDir: { win32: "%USERPROFILE%/.config/opencode", darwin: "~/.config/opencode", linux: "~/.config/opencode" },
    configPaths: {
      win32: "%USERPROFILE%/.config/opencode/mcp.json",
      darwin: "~/.config/opencode/mcp.json",
      linux: "~/.config/opencode/mcp.json"
    }
  },
  {
    id: "codex",
    name: "Codex",
    type: "agent",
    icon: "⚫",
    logo: "/logos/codex.png",
    color: "#000000",
    homeDir: { win32: "%USERPROFILE%/.codex", darwin: "~/.codex", linux: "~/.codex" },
    configPaths: {
      win32: "%USERPROFILE%/.codex/mcp.json",
      darwin: "~/.codex/mcp.json",
      linux: "~/.codex/mcp.json"
    }
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    type: "agent",
    icon: "🔵",
    logo: "/logos/gemini.png",
    color: "#4285F4",
    homeDir: { win32: "%USERPROFILE%/.gemini", darwin: "~/.gemini", linux: "~/.gemini" },
    configPaths: {
      win32: "%USERPROFILE%/.gemini/mcp.json",
      darwin: "~/.gemini/mcp.json",
      linux: "~/.gemini/mcp.json"
    }
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    type: "agent",
    icon: "🟠",
    logo: "/logos/openclaw.png",
    color: "#F59E0B",
    homeDir: { win32: "%USERPROFILE%/.config/openclaw", darwin: "~/.config/openclaw", linux: "~/.config/openclaw" },
    configPaths: {
      win32: "%USERPROFILE%/.config/openclaw/mcp.json",
      darwin: "~/.config/openclaw/mcp.json",
      linux: "~/.config/openclaw/mcp.json"
    }
  },
  {
    id: "cline",
    name: "CLine",
    type: "code",
    icon: "🟡",
    logo: "/logos/cline.png",
    color: "#EAB308",
    homeDir: { win32: "%APPDATA%/Code/User", darwin: "~/Library/Application Support/Code/User", linux: "~/.config/Code/User" },
    configPaths: {
      win32: "%APPDATA%/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_custom_mcp_config.json",
      darwin: "~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_custom_mcp_config.json",
      linux: "~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_custom_mcp_config.json"
    }
  },
  {
    id: "zcode",
    name: "ZCode",
    type: "agent",
    icon: "⚡",
    logo: "/logos/zcode.png",
    color: "#8B5CF6",
    homeDir: { win32: "%USERPROFILE%/.zcode", darwin: "~/.zcode", linux: "~/.zcode" },
    configPaths: {
      win32: "%USERPROFILE%/.zcode/mcp.json",
      darwin: "~/.zcode/mcp.json",
      linux: "~/.zcode/mcp.json"
    }
  }
];

// Get resolved config path for a client
export function getClientConfigPath(client: (typeof MCP_CLIENTS)[0]): string {
  return resolvePath(client.configPaths);
}

// Get resolved home directory for a client
export function getClientHomeDir(client: (typeof MCP_CLIENTS)[0]): string {
  return resolvePath(client.homeDir);
}

/**
 * Generate mcp.json content from selected servers
 */
export function generateMcpJson(servers: McpServerInfo[], envOverrides?: Record<string, Record<string, string>>): McpConfig {
  const mcpServers: Record<string, McpServerConfig> = {};

  for (const server of servers) {
    const env = { ...server.env };
    if (envOverrides?.[server.id]) {
      Object.assign(env, envOverrides[server.id]);
    }

    mcpServers[server.id] = {
      command: server.command,
      args: [...server.args],
      ...(Object.keys(env).length > 0 ? { env } : {})
    };
  }

  return { mcpServers };
}

/**
 * Format mcp.json for display
 */
export function formatMcpJson(config: McpConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Generate Claude Desktop format
 */
export function generateClaudeDesktopJson(servers: McpServerInfo[]): McpConfig {
  return generateMcpJson(servers);
}

/**
 * Generate VS Code format (servers nested under "servers" key)
 */
export function generateVSCodeMcpJson(servers: McpServerInfo[]): Record<string, any> {
  const config = generateMcpJson(servers);
  return {
    servers: Object.fromEntries(
      Object.entries(config.mcpServers).map(([key, val]) => [key, val])
    )
  };
}

/**
 * Export mcp.json content to string
 */
export function exportToJson(servers: McpServerInfo[], format: "claude" | "vscode" | "generic" = "claude"): string {
  if (format === "vscode") {
    return JSON.stringify(generateVSCodeMcpJson(servers), null, 2);
  }
  return formatMcpJson(generateMcpJson(servers));
}

/**
 * Download json file
 */
export function downloadJson(content: string, filename: string = "mcp.json"): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
