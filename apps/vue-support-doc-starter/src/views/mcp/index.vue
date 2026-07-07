<template>
  <div class="mcp-manager">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>MCP Manager</h2>
        <el-tag type="info" size="small">{{ store.totalCount }} servers</el-tag>
      </div>

      <el-input
        v-model="store.searchQuery"
        placeholder="Search MCP..."
        clearable
        prefix-icon="Search"
        class="search-input"
      />

      <div class="category-list">
        <div
          v-for="cat in MCP_CATEGORIES"
          :key="cat.id"
          :class="['category-item', { active: store.activeCategory === cat.id }]"
          @click="store.activeCategory = cat.id"
        >
          <el-icon><component :is="cat.icon" /></el-icon>
          <span>{{ cat.name }}</span>
        </div>
      </div>

      <div class="sidebar-actions">
        <el-button size="small" @click="store.selectAll">Select All</el-button>
        <el-button size="small" @click="store.deselectAll">Deselect All</el-button>
        <el-button size="small" type="primary" @click="importDialogVisible = true">
          Import Local
        </el-button>
      </div>
    </aside>

    <main class="content">
      <div class="content-header">
        <h3>MCP Servers</h3>
        <div class="header-info">
          <el-tag type="success" size="small">{{ store.selectedCount }} selected</el-tag>
          <el-dropdown trigger="click">
            <el-button type="primary" size="small">
              Export JSON <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleExport('claude')">
                  Claude Desktop
                </el-dropdown-item>
                <el-dropdown-item @click="handleExport('vscode')">
                  VS Code
                </el-dropdown-item>
                <el-dropdown-item @click="handleExport('generic')">
                  Generic mcp.json
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="server-grid">
        <div
          v-for="server in store.filteredServers"
          :key="server.id"
          :class="['server-card', { selected: store.isSelected(server.id) }]"
          @click="store.toggleServer(server.id)"
        >
          <div class="card-header">
            <span class="server-icon">{{ server.icon }}</span>
            <el-checkbox
              :model-value="store.isSelected(server.id)"
              @click.stop
              @change="store.toggleServer(server.id)"
            />
          </div>
          <h4 class="server-name">{{ server.name }}</h4>
          <p class="server-desc">{{ server.description }}</p>
          <div class="card-footer">
            <el-tag size="small" :type="getCategoryType(server.category)">
              {{ server.category }}
            </el-tag>
            <span v-if="server.stars" class="stars">
              ⭐ {{ formatStars(server.stars) }}
            </span>
          </div>
        </div>
      </div>
    </main>

    <aside class="preview-panel">
      <div class="preview-header">
        <h3>mcp.json</h3>
        <div class="preview-actions">
          <el-button size="small" text @click="copyJson">
            <el-icon><CopyDocument /></el-icon>
          </el-button>
          <el-button size="small" text @click="handleDownload">
            <el-icon><Download /></el-icon>
          </el-button>
        </div>
      </div>
      <div class="json-preview">
        <pre><code>{{ store.mcpJsonOutput }}</code></pre>
      </div>
    </aside>

    <!-- Import Dialog -->
    <el-dialog
      v-model="importDialogVisible"
      title="Import Local MCP Configuration"
      width="600px"
    >
      <div class="import-section">
        <p class="import-desc">
          Scan local AI client configurations to import installed MCP servers.
        </p>
        <div class="client-list">
          <div
            v-for="client in clients"
            :key="client.id"
            class="client-item"
          >
            <div class="client-info">
              <span class="client-icon">{{ client.icon }}</span>
              <span class="client-name">{{ client.name }}</span>
            </div>
            <el-button size="small" @click="scanClient(client)">
              Scan
            </el-button>
          </div>
        </div>
      </div>
      <div v-if="scanResults.length > 0" class="scan-results">
        <h4>Found MCP Servers ({{ scanResults.length }})</h4>
        <div v-for="(entry, idx) in scanResults" :key="idx" class="scan-result-item">
          <span>{{ entry.name }}</span>
          <el-tag size="small">{{ entry.source }}</el-tag>
        </div>
        <el-button type="primary" @click="importScanned" class="import-btn">
          Import Selected
        </el-button>
      </div>
    </el-dialog>

    <!-- Custom Server Dialog -->
    <el-dialog
      v-model="addServerDialogVisible"
      title="Add Custom MCP Server"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="Name">
          <el-input v-model="customServer.name" placeholder="my-mcp-server" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="customServer.description" placeholder="Server description" />
        </el-form-item>
        <el-form-item label="Command">
          <el-input v-model="customServer.command" placeholder="npx" />
        </el-form-item>
        <el-form-item label="Args">
          <el-input v-model="customServer.argsStr" placeholder="-y, @scope/server-name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addServerDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="addCustomServer">Add</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { ArrowDown, CopyDocument, Download } from "@element-plus/icons-vue";
import { useMcpStore } from "@/stores/mcp";
import { MCP_CATEGORIES, type McpServerInfo } from "@/resources/mcp-list";
import { exportToJson, downloadJson } from "@/utils/mcp-config";
import type { LocalMcpEntry } from "@/utils/mcp-config";
import { listAgentClients, scanAgentClient, type AgentClientData } from "@/services";

const store = useMcpStore();

const clients = ref<AgentClientData[]>([]);
const importDialogVisible = ref(false);
const addServerDialogVisible = ref(false);
const scanResults = ref<LocalMcpEntry[]>([]);

const customServer = reactive({
  name: "",
  description: "",
  command: "npx",
  argsStr: ""
});

function getCategoryType(category: string) {
  const map: Record<string, string> = {
    filesystem: "",
    database: "success",
    search: "warning",
    cloud: "info",
    devtools: "danger",
    communication: "",
    ai: "success",
    productivity: "warning",
    other: "info"
  };
  return map[category] || "";
}

function formatStars(stars: number): string {
  if (stars >= 1000) return (stars / 1000).toFixed(1) + "k";
  return stars.toString();
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(store.mcpJsonOutput);
    ElMessage.success("Copied to clipboard");
  } catch {
    ElMessage.error("Failed to copy");
  }
}

function handleExport(format: "claude" | "vscode" | "generic") {
  const content = exportToJson(store.selectedServers, format);
  const filename =
    format === "vscode"
      ? "mcp.json"
      : format === "claude"
        ? "claude_desktop_config.json"
        : "mcp.json";
  downloadJson(content, filename);
  ElMessage.success(`Exported as ${filename}`);
}

function handleDownload() {
  downloadJson(store.mcpJsonOutput, "mcp.json");
  ElMessage.success("Downloaded mcp.json");
}

async function scanClient(client: AgentClientData) {
  try {
    const result = await scanAgentClient(client.id);
    scanResults.value = result.mcpServers ?? [];
    ElMessage.info(`Scanned ${client.name} - ${scanResults.value.length} servers found`);
  } catch {
    ElMessage.warning(`Scan failed for ${client.name}`);
  }
}

function importScanned() {
  store.addLocalMcps(scanResults.value);
  scanResults.value = [];
  importDialogVisible.value = false;
  ElMessage.success("Imported local MCP servers");
}

function addCustomServer() {
  if (!customServer.name) {
    ElMessage.warning("Name is required");
    return;
  }
  const server: McpServerInfo = {
    id: `custom-${customServer.name}`,
    name: customServer.name,
    description: customServer.description || "Custom MCP server",
    category: "other",
    icon: "🔧",
    command: customServer.command,
    args: customServer.argsStr
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
  };
  store.addCustomServer(server);
  addServerDialogVisible.value = false;
  customServer.name = "";
  customServer.description = "";
  customServer.argsStr = "";
  ElMessage.success("Added custom server");
}
</script>

<style lang="scss" scoped>
.mcp-manager {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ── Sidebar: Signal style ── */
.sidebar {
  width: 240px;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  padding: 16px;

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 650;
      color: var(--el-text-color-primary);
      letter-spacing: -0.01em;
    }
  }

  .search-input {
    margin-bottom: 16px;
  }

  .category-list {
    flex: 1;
    overflow-y: auto;

    .category-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
      color: var(--el-text-color-secondary);
      font-size: 13px;
      font-weight: 450;
      position: relative;

      &:hover {
        background: var(--el-fill-color);
        color: var(--el-text-color-primary);
      }

      &.active {
        background: var(--nexus-accent-glow);
        color: var(--nexus-accent);
        font-weight: 500;
        border-left: 3px solid var(--nexus-accent);
        margin-left: -3px;
        padding-left: 15px;
      }
    }
  }

  .sidebar-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color);
  }
}

/* ── Content Area ── */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--el-border-color);

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .server-grid {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
    align-content: start;
  }
}

/* ── Server Card: Signal stripe style ── */
.server-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: var(--shadow-sm);
  }

  &.selected {
    border-color: var(--el-color-success);
    background: rgba(16, 185, 129, 0.04);
  }
  &.selected::before {
    content: ""; position: absolute; left: 0; top: 8px; bottom: 8px;
    width: 3px; border-radius: 0 2px 2px 0;
    background: var(--nexus-stripe-emerald);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .server-icon {
      font-size: 24px;
    }
  }

  .server-name {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 600;
  }

  .server-desc {
    margin: 0 0 10px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: var(--el-text-color-secondary);

    .stars {
      font-size: 11px;
    }
  }
}

/* ── Preview Panel: Dark code style ── */
.preview-panel {
  width: 340px;
  background: var(--nexus-code-bg);
  border-left: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);

    h3 {
      margin: 0;
      font-size: 13px;
      font-family: var(--nexus-data-font);
      color: #94a3b8;
      font-weight: 500;
    }

    .preview-actions {
      display: flex;
      gap: 4px;
    }
  }

  .json-preview {
    flex: 1;
    overflow: auto;
    padding: 12px;

    pre {
      margin: 0;
      font-size: 11px;
      line-height: 1.6;
      color: var(--nexus-code-text);
      font-family: var(--nexus-data-font);
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

/* ── Import Section ── */
.import-section {
  .import-desc {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    margin-bottom: 16px;
  }

  .client-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .client-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: var(--el-fill-color);
      border-radius: 6px;

      .client-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .client-icon {
          font-size: 18px;
        }

        .client-name {
          font-size: 13px;
          font-weight: 500;
        }
      }
    }
  }
}

.scan-results {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color);

  h4 {
    margin: 0 0 12px;
    font-size: 14px;
  }

  .scan-result-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px;
    border-radius: 4px;

    &:hover {
      background: var(--el-fill-color);
    }
  }

  .import-btn {
    margin-top: 12px;
    width: 100%;
  }
}
</style>
