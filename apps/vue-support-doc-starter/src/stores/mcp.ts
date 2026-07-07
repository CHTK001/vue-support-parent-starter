import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { BUILTIN_MCP_SERVERS, type McpServerInfo } from "@/resources/mcp-list";
import { generateMcpJson, formatMcpJson } from "@/utils/mcp-config";
import { getClientConfig, saveClientConfig } from "@/api/tauri";

export const useMcpStore = defineStore("mcp", () => {
  const allServers = ref<McpServerInfo[]>([...BUILTIN_MCP_SERVERS]);
  const selectedIds = ref<Set<string>>(new Set());
  const searchQuery = ref("");
  const activeCategory = ref("all");
  const envOverrides = ref<Record<string, Record<string, string>>>({});

  const filteredServers = computed(() => {
    return allServers.value.filter((s) => {
      const matchCategory = activeCategory.value === "all" || s.category === activeCategory.value;
      const matchSearch = !searchQuery.value || s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.value.toLowerCase());
      return matchCategory && matchSearch;
    });
  });

  const selectedServers = computed(() => allServers.value.filter((s) => selectedIds.value.has(s.id)));
  const mcpJsonOutput = computed(() => formatMcpJson(generateMcpJson(selectedServers.value, envOverrides.value)));
  const totalCount = computed(() => allServers.value.length);
  const selectedCount = computed(() => selectedIds.value.size);

  function toggleServer(id: string) { if (selectedIds.value.has(id)) selectedIds.value.delete(id); else selectedIds.value.add(id); }
  function selectAll() { filteredServers.value.forEach((s) => selectedIds.value.add(s.id)); }
  function deselectAll() { filteredServers.value.forEach((s) => selectedIds.value.delete(s.id)); }
  function isSelected(id: string) { return selectedIds.value.has(id); }

  function loadPreset(preset: McpServerInfo[]) {
    selectedIds.value.clear();
    preset.forEach((s) => {
      if (!allServers.value.some((e) => e.id === s.id)) allServers.value.push(s);
      selectedIds.value.add(s.id);
    });
  }

  function clearAndLoad(preset: McpServerInfo[]) {
    allServers.value = [...preset];
    selectedIds.value.clear();
    preset.forEach((s) => selectedIds.value.add(s.id));
  }

  // Persist selected MCP to backend for a given client
  async function persistToClient(clientId: string) {
    const now = new Date().toISOString();
    const existing = await getClientConfig(clientId);
    const config = {
      id: clientId,
      name: clientId,
      mcpJson: mcpJsonOutput.value,
      skillsJson: existing?.skillsJson || "{}",
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };
    await saveClientConfig(config);
  }

  // Load MCP from backend for a given client
  async function loadFromClient(clientId: string) {
    const config = await getClientConfig(clientId);
    if (config?.mcpJson) {
      try {
        const parsed = JSON.parse(config.mcpJson);
        if (parsed.mcpServers) {
          const ids = Object.keys(parsed.mcpServers);
          selectedIds.value.clear();
          ids.forEach((id) => selectedIds.value.add(id));
        }
      } catch {}
    }
  }

  return {
    allServers, selectedIds, searchQuery, activeCategory, envOverrides,
    filteredServers, selectedServers, mcpJsonOutput, totalCount, selectedCount,
    toggleServer, selectAll, deselectAll, isSelected, loadPreset,
    persistToClient, loadFromClient
  };
});
