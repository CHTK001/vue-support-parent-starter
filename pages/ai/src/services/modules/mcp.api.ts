import type { ApiContext } from "./api-context";
import type { McpServer } from "@/types/api";
import type { PaginatedResponse } from "@/types/common";
// 本文件已经有一个 `interface McpApi` 和一个导出的 `mcpApi`，
// 所以 javaApi 里那个必须换个别名导入，否则同名声明直接冲突。
import { mcpApi as mcpHttp } from "@/services/javaApi";

export interface McpApi {
  fetchMcpServers(): Promise<PaginatedResponse<McpServer>>;
  fetchMcpServer(serverId: string): Promise<McpServer>;
  fetchMcpServerById(serverId: string): Promise<McpServer>;
  createMcpServer(data: any): Promise<McpServer>;
  updateMcpServer(serverId: string, data: any): Promise<McpServer>;
  deleteMcpServer(serverId: string): Promise<boolean>;
  toggleMcpServer(serverId: string, enabled: boolean): Promise<McpServer>;
  refreshMcpTools(serverId: string): Promise<McpServer>;
  getMcpServers(): Promise<PaginatedResponse<McpServer>>;
}

/**
 * 后端返回 `{ success, data }`，而本模块的调用方（CharacterSettingPanel、
 * SessionStatusPanel）按分页结构读 `items` / `total`。
 * 不做这层归一化的话 `response.items.filter(...)` 会直接抛 undefined.filter。
 */
function toPage(body: any): PaginatedResponse<McpServer> {
  const items: McpServer[] = Array.isArray(body?.data)
    ? body.data
    : Array.isArray(body?.items)
      ? body.items
      : Array.isArray(body)
        ? body
        : [];
  return { items, total: items.length } as PaginatedResponse<McpServer>;
}

/** 取单个实体：同样兼容 {data:{...}} / {...} 两种形态 */
function toEntity(body: any): McpServer {
  return (body?.data ?? body) as McpServer;
}

export const mcpApiModule: McpApi = {
  /**
   * 这些方法原先打的是 `/v2/mcp-servers` —— 后端从来没有这个路径，
   * 实测一律 404（角色设置面板一打开就报「API 请求失败：mcp-servers」）。
   * 现在统一委托给 javaApi.ts 的 mcpApi（走根路径客户端 + `/api/mcp/servers`，
   * 与 MCP 管理页用的是同一套，已验证可用），不再重复维护一份端点表。
   */
  async fetchMcpServers(this: ApiContext & McpApi) {
    return toPage(await mcpHttp.list());
  },

  async fetchMcpServer(this: ApiContext & McpApi, serverId: string) {
    // 后端只有列表接口，没有 GET /api/mcp/servers/{id}，
    // 所以按 id 从列表里取，不要去打那个不存在的路径。
    const page = await this.fetchMcpServers();
    const hit = page.items.find((s: any) => String(s?.id ?? s?.server_id) === String(serverId));
    if (!hit) {
      throw new Error(`MCP 服务器不存在: ${serverId}`);
    }
    return hit;
  },

  fetchMcpServerById(this: ApiContext & McpApi, serverId: string) {
    return this.fetchMcpServer(serverId);
  },

  async createMcpServer(this: ApiContext, data: any) {
    return toEntity(await mcpHttp.create(data));
  },

  async updateMcpServer(this: ApiContext, serverId: string, data: any) {
    return toEntity(await mcpHttp.update(serverId, data));
  },

  async deleteMcpServer(this: ApiContext, serverId: string) {
    const r: any = await mcpHttp.delete(serverId);
    return r?.success !== false;
  },

  async toggleMcpServer(this: ApiContext, serverId: string, enabled: boolean) {
    return toEntity(await mcpHttp.toggle(serverId, enabled));
  },

  /**
   * 后端没有「刷新工具列表」这个端点（只有 list/create/import/update/delete/
   * toggle/test-connection）。原先这里打 `/v2/mcp-servers/{id}/refresh-tools`
   * 必然 404。工具列表随 toggle / 连接测试一起更新，没有独立入口 ——
   * 明确报错好过静默 404。
   */
  async refreshMcpTools(this: ApiContext, serverId: string): Promise<McpServer> {
    throw new Error(
      `后端未提供「刷新 MCP 工具列表」接口（${serverId}）：` +
      "工具列表在 toggle / 测试连接时一并更新，没有独立端点",
    );
  },

  getMcpServers(this: ApiContext & McpApi) {
    return this.fetchMcpServers();
  },
};

export const mcpApi = mcpApiModule;
export default mcpApiModule;