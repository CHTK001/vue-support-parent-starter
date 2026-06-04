<template>
  <div class="node-page">
    <!-- 统计横幅 -->
    <div class="page-metrics">
      <div class="metric-card" style="--accent: #38bdf8">
        <div class="metric-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#38bdf8" stroke-width="1.5">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        <div class="metric-body">
          <div class="metric-value">{{ nodeList.length }}</div>
          <div class="metric-label">节点类型</div>
        </div>
      </div>
      <div class="metric-card" style="--accent: #22c55e">
        <div class="metric-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#22c55e" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div class="metric-body">
          <div class="metric-value">{{ totalSpiCount }}</div>
          <div class="metric-label">SPI 实现总数</div>
        </div>
      </div>
      <div class="metric-card" style="--accent: #f59e0b">
        <div class="metric-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f59e0b" stroke-width="1.5">
            <path d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
        </div>
        <div class="metric-body">
          <div class="metric-value">{{ selectedNode ? selectedNode.spis.length : '-' }}</div>
          <div class="metric-label">当前节点 SPI</div>
        </div>
      </div>
    </div>

    <!-- 主区域 -->
    <div class="node-layout">
      <!-- 左侧：节点类型列表 -->
      <div class="page-panel node-sidebar">
        <div class="panel-header">
          <div class="panel-title">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>节点类型</span>
            <span class="panel-badge">{{ nodeList.length }}</span>
          </div>
          <button class="btn-ghost" :class="{ loading }" :disabled="loading" @click="loadData">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            刷新
          </button>
        </div>
        <div class="node-type-list">
          <div v-for="node in nodeList" :key="node.type" class="node-type-item" :class="{ active: selectedType === node.type }" @click="selectNode(node)">
            <div class="nt-icon" :style="{ background: typeColor(node.type) }">{{ typeIcon(node.type) }}</div>
            <div class="nt-info">
              <div class="nt-name">{{ typeLabel(node.type) }}</div>
              <div class="nt-count">{{ node.spis?.length || 0 }} 个 SPI</div>
            </div>
          </div>
          <div v-if="nodeList.length === 0" class="node-empty">暂无节点类型</div>
        </div>
      </div>

      <!-- 右侧：SPI 实现列表 -->
      <div class="page-panel node-main">
        <div class="panel-header">
          <div class="panel-title">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
              <path d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7" />
              <path d="M16 3H8a3 3 0 0 0-3 3v1h14V6a3 3 0 0 0-3-3z" />
            </svg>
            <span>{{ selectedType ? typeLabel(selectedType) + ' — SPI 实现' : '请选择左侧节点类型' }}</span>
          </div>
        </div>

        <div v-if="selectedNode" class="spi-content">
          <div class="spi-desc">{{ nodeDescription(selectedType) }}</div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 200px">实现名称</th>
                <th>接口类</th>
                <th style="width: 160px">注册方式</th>
                <th style="width: 70px">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="spi in selectedNode.spis" :key="spi.name">
                <td>
                  <div class="spi-name-cell">
                    <span class="spi-icon" :style="{ background: typeColor(selectedType || '') }">{{ typeIcon(selectedType || '') }}</span>
                    <code class="spi-name">{{ spi.name }}</code>
                  </div>
                </td>
                <td><code class="spi-interface">{{ spiInterface(selectedType || '') }}</code></td>
                <td><span class="reg-tag">META-INF/extensions</span></td>
                <td><span class="state-tag success">可用</span></td>
              </tr>
              <tr v-if="!selectedNode.spis?.length">
                <td colspan="4" class="empty-row">暂无 SPI 实现</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="spi-empty">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1" style="opacity: 0.2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <p>选择左侧节点类型查看 SPI 实现详情</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { fetchNodeList, type NodeType } from "../../api/node";

defineOptions({ name: "DatalakeNodePage" });

const nodeList = ref<NodeType[]>([]);
const selectedType = ref<string | null>(null);
const loading = ref(false);

const selectedNode = computed(() => nodeList.value.find((n) => n.type === selectedType.value) || null);
const totalSpiCount = computed(() => nodeList.value.reduce((sum, n) => sum + (n.spis?.length || 0), 0));

function typeColor(type: string): string {
  const map: Record<string, string> = {
    source: "#10b981", sink: "#ef4444", filter: "#f59e0b",
    parse: "#3b82f6", clean: "#8b5cf6", standardize: "#06b6d4",
    transform: "#f59e0b", enrich: "#ec4899", aggregate: "#14b8a6",
  };
  return map[type] || "#3b82f6";
}

function typeIcon(type: string): string {
  const map: Record<string, string> = {
    source: "入", sink: "出", filter: "滤", parse: "析",
    clean: "洗", standardize: "标", transform: "转",
    enrich: "富", aggregate: "聚",
  };
  return map[type] || type.charAt(0).toUpperCase();
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    source: "数据源 (Source)", sink: "数据输出 (Sink)",
    filter: "过滤 (Filter)", parse: "解析 (Parse)",
    clean: "清洗 (Clean)", standardize: "标准化 (Standardize)",
    transform: "转换 (Transform)", enrich: "富化 (Enrich)",
    aggregate: "聚合 (Aggregate)",
  };
  return map[type] || type;
}

function nodeDescription(type: string | null): string {
  const map: Record<string, string> = {
    source: "数据源节点 — 接入外部数据，支持 HTTP/TCP/UDP 多种协议。SPI: com.chua.datalake.support.spi.storage.DataSource",
    sink: "数据输出节点 — 将处理后的数据写入目标存储。SPI: com.chua.datalake.support.spi.storage.DataSink",
    filter: "过滤节点 — 按条件筛选数据行，丢弃不匹配的记录。SPI: com.chua.datalake.support.spi.pipeline.DataFilter",
    parse: "解析节点 — 将原始字节流解析为结构化数据。SPI: com.chua.datalake.support.spi.pipeline.DataParser",
    clean: "清洗节点 — 去重、去空值、修正异常数据。SPI: com.chua.datalake.support.spi.pipeline.DataCleaner",
    standardize: "标准化节点 — 统一日期格式、时区、编码等。SPI: com.chua.datalake.support.spi.pipeline.DataStandardizer",
    transform: "转换节点 — 字段映射、类型转换等通用转换。SPI: com.chua.datalake.support.spi.pipeline.DataParser",
    enrich: "富化节点 — 通过外部数据源补充字段信息。SPI: com.chua.datalake.support.spi.pipeline.DataParser",
    aggregate: "聚合节点 — 分组统计、汇总计算。SPI: com.chua.datalake.support.spi.pipeline.DataParser",
  };
  return map[type || ""] || "";
}

function spiInterface(type: string): string {
  const map: Record<string, string> = {
    source: "DataSource", sink: "DataSink", filter: "DataFilter",
    parse: "DataParser", clean: "DataCleaner", standardize: "DataStandardizer",
    transform: "DataParser", enrich: "DataParser", aggregate: "DataParser",
  };
  return `com.chua.datalake.support.spi.${type === 'source' || type === 'sink' ? 'storage' : 'pipeline'}.${map[type] || 'DataParser'}`;
}

function selectNode(node: NodeType) {
  selectedType.value = node.type;
}

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await fetchNodeList();
    nodeList.value = data?.data || [];
    if (nodeList.value.length > 0 && !selectedType.value) {
      selectedType.value = nodeList.value[0].type;
    }
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);
</script>

<style scoped>
.node-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.35s ease;
  font-family: "Space Mono", "Courier New", monospace;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ===== 指标卡片 ===== */
.page-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.metric-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: var(--dl-surface, rgba(12, 22, 44, 0.85));
  backdrop-filter: blur(4px);
  border: 1px solid var(--dl-border, rgba(0, 180, 255, 0.08));
  border-radius: 8px;
  border-left: 3px solid var(--accent, #38bdf8);
  transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
}
.metric-card:hover {
  border-color: var(--accent, #38bdf8);
  box-shadow: 0 0 24px color-mix(in srgb, var(--accent, #38bdf8) 15%, transparent);
  transform: translateY(-1px);
}
.metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent, #38bdf8) 12%, transparent);
  flex-shrink: 0;
}
.metric-body { flex: 1; min-width: 0; }
.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.2;
  font-family: "Space Mono", "Courier New", monospace;
}
.metric-label {
  font-size: 10px;
  color: rgba(148, 163, 184, 0.7);
  margin-top: 2px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ===== 布局 ===== */
.node-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 12px;
}

/* ===== 面板 ===== */
.page-panel {
  background: var(--dl-surface, rgba(12, 22, 44, 0.85));
  backdrop-filter: blur(4px);
  border: 1px solid var(--dl-border, rgba(0, 180, 255, 0.08));
  border-radius: 8px;
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.03em;
}
.panel-badge {
  font-size: 10px;
  color: #5a6478;
  background: rgba(0, 180, 255, 0.06);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 10px;
  padding: 0 8px;
  font-family: "Space Mono", monospace;
}

/* ===== 幽灵按钮 ===== */
.btn-ghost {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11px;
  color: #94a3b8;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
}
.btn-ghost:hover {
  border-color: rgba(0, 180, 255, 0.25);
  color: #38bdf8;
}
.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-ghost.loading svg {
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 节点类型列表 ===== */
.node-type-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.node-type-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.node-type-item:hover {
  background: rgba(0, 180, 255, 0.03);
  border-color: rgba(0, 180, 255, 0.08);
}
.node-type-item.active {
  background: rgba(56, 189, 248, 0.06);
  border-color: rgba(56, 189, 248, 0.15);
}
.nt-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  font-family: "Space Mono", monospace;
}
.nt-info { flex: 1; min-width: 0; }
.nt-name {
  font-size: 12px;
  color: #e2e8f0;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nt-count {
  font-size: 10px;
  color: #5a6478;
  margin-top: 2px;
}
.node-empty {
  text-align: center;
  padding: 32px 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.15);
}

/* ===== SPI 内容 ===== */
.spi-content {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.spi-desc {
  font-size: 11px;
  color: #5a6478;
  line-height: 1.6;
  padding: 10px 14px;
  background: rgba(56, 189, 248, 0.04);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: 6px;
}
.spi-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 64px 20px;
  color: rgba(255, 255, 255, 0.2);
  font-size: 13px;
}

/* ===== 数据表格 ===== */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 10px;
  font-weight: 600;
  color: #5a6478;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
}
.data-table td {
  padding: 10px 14px;
  font-size: 12px;
  color: #e2e8f0;
  border-bottom: 1px solid rgba(0, 180, 255, 0.03);
  vertical-align: middle;
}
.data-table tbody tr:hover { background: rgba(0, 180, 255, 0.03); }
.data-table tbody tr:last-child td { border-bottom: none; }

.spi-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.spi-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  font-family: "Space Mono", monospace;
}
.spi-name {
  font-size: 11px;
  color: #38bdf8;
  font-family: "Space Mono", monospace;
}
.spi-interface {
  font-size: 11px;
  color: #5a6478;
  font-family: "Space Mono", monospace;
  word-break: break-all;
}
.reg-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.08);
  color: #94a3b8;
}
.state-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 4px;
}
.state-tag.success { color: #22c55e; background: rgba(34, 197, 94, 0.08); }

.empty-row {
  text-align: center;
  color: rgba(255, 255, 255, 0.15);
  padding: 40px 14px !important;
  font-size: 13px;
}
</style>
