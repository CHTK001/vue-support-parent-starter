<!--
  GatewayManage —— 网关管理页面
  设计风格：Vercel / Linear · 低饱和度 · 卡片栅格 · 极简
  样式约定：UnoCSS 主题别名 (bg-el-bg / text-el-text-primary 等) → Element Plus CSS 变量
-->
<template>
  <div class="gateway-manage mx-auto w-full max-w-[1200px] px-6 py-6">
    <div class="page-header">
      <div class="page-header-left">
        <h3 class="page-title text-el-text-primary">网关管理</h3>
        <span class="page-subtitle text-el-text-secondary">当前在线的网关连接与会话</span>
      </div>
      <div class="page-header-right">
        <el-button size="small" :icon="Refresh" :loading="loading" @click="fetchInfo">刷新</el-button>
        <el-button size="small" circle title="设置" @click="settingsVisible = true">
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <el-dialog v-model="settingsVisible" title="网关设置" width="360px" append-to-body>
      <el-form label-position="top" size="default">
        <el-form-item label="API 地址">
          <el-input v-model="gatewayHost" placeholder="127.0.0.1">
            <template #prefix>IP</template>
          </el-input>
        </el-form-item>
        <el-form-item label="API 端口">
          <el-input-number v-model="gatewayPort" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>
        <el-form-item label="管理端口">
          <el-input-number v-model="managementPort" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存并查询</el-button>
      </template>
    </el-dialog>

    <div class="gm-body">
      <el-empty v-if="error" :description="error" :image-size="60" />

      <template v-if="info?.health">
        <!-- 概览统计 -->
        <section class="gm-section" aria-label="网关统计概览">
          <div class="stat-grid">
            <div class="stat-card card-modern">
              <div class="stat-card__head">
                <span class="stat-card__title text-el-text-secondary">健康状态</span>
                <el-icon :size="16" :color="healthIconColor"><CircleCheck /></el-icon>
              </div>
              <div class="stat-card__value">
                <ReTag :type="info.health.status === 'UP' ? 'success' : 'danger'" size="small">
                  {{ info.health.status }}
                </ReTag>
              </div>
              <div class="stat-card__desc text-el-text-secondary">网关整体可用性</div>
            </div>
            <div class="stat-card card-modern">
              <div class="stat-card__head">
                <span class="stat-card__title text-el-text-secondary">被控端点</span>
                <el-icon :size="16" class="text-el-text-secondary"><Monitor /></el-icon>
              </div>
              <div class="stat-card__value text-el-text-primary">{{ info.agents.length }}</div>
              <div class="stat-card__desc text-el-text-secondary">当前已注册的 Agent 数</div>
            </div>
            <div class="stat-card card-modern">
              <div class="stat-card__head">
                <span class="stat-card__title text-el-text-secondary">可用 Target</span>
                <el-icon :size="16" class="text-el-text-secondary"><Link /></el-icon>
              </div>
              <div class="stat-card__value text-el-text-primary">{{ info.health.targets }}</div>
              <div class="stat-card__desc text-el-text-secondary">对外暴露的可连接会话</div>
            </div>
            <div class="stat-card card-modern">
              <div class="stat-card__head">
                <span class="stat-card__title text-el-text-secondary">在线控制端</span>
                <el-icon :size="16" class="text-el-text-secondary"><Connection /></el-icon>
              </div>
              <div class="stat-card__value text-el-text-primary">{{ info.controllers.length }}</div>
              <div class="stat-card__desc text-el-text-secondary">WebSocket 连接数</div>
            </div>
          </div>
        </section>

        <!-- 控制端列表 -->
        <section class="gm-section" aria-label="控制端连接列表">
          <ReCard class="section-card">
            <div class="section-head">
              <div class="section-title text-el-text-primary">控制端</div>
              <div class="section-desc text-el-text-secondary">
                当前在线的控制端连接（{{ info.controllers.length }}）
              </div>
            </div>
            <ReTable
              :data="info.controllers"
              :columns="controllerColumns"
              row-key="id"
              :pagination="false"
              :loading="loading"
              table-id="gateway-controllers"
            >
              <template #action="{ row }">
                <el-button size="small" text type="danger" @click="onKick(row)">踢出</el-button>
              </template>
            </ReTable>
          </ReCard>
        </section>

        <!-- 被控端点列表 -->
        <section class="gm-section" aria-label="被控端点列表">
          <ReCard class="section-card">
            <div class="section-head">
              <div>
                <div class="section-title text-el-text-primary">被控端点</div>
                <div class="section-desc text-el-text-secondary">点击查看详情</div>
              </div>
            </div>
            <el-empty v-if="info.agents.length === 0" description="无在线被控端点" :image-size="60" />
            <ReTable
              v-else
              :data="info.agents"
              :columns="agentColumns"
              row-key="agentId"
              :pagination="true"
              :page-size="10"
              :loading="loading"
              table-id="gateway-agents"
            >
              <template #agentType="{ row }">
                <ReTag size="small" :type="agentTagType(row.agentType)">{{ row.agentType || "unknown" }}</ReTag>
              </template>
              <template #verifyCode="{ row }">
                <code v-if="row.verifyCode" class="verify-code" @click="copyVerifyCode(row.verifyCode)">{{ row.verifyCode }}</code>
                <span v-else class="muted">-</span>
              </template>
              <template #ipAddress="{ row }">
                <code class="ip-code">{{ row.ipAddress || "-" }}</code>
              </template>
              <template #os="{ row }">
                <span class="muted">{{ row.capabilities?.["os.name"] || "-" }}</span>
              </template>
              <template #targets="{ row }">
                <div class="target-chips">
                  <span v-for="t in row.targets || []" :key="t.targetId" class="target-chip">
                    <ReTag size="small" :type="t.online ? 'success' : 'info'">{{ t.protocol }}</ReTag>
                    <code class="target-id">{{ t.targetId }}</code>
                  </span>
                </div>
              </template>
              <template #action="{ row }">
                <el-button size="small" text @click="onAgentInfo(row)">详情</el-button>
              </template>
            </ReTable>
          </ReCard>
        </section>
      </template>

      <div
        v-else-if="!loading && !error"
        class="gm-empty flex flex-col items-center justify-center gap-3 py-16 text-el-text-secondary"
      >
        <el-icon :size="48"><Connection /></el-icon>
        <p>点击"刷新"查询网关状态</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Refresh, Setting, Connection, Monitor, Link, CircleCheck } from "@element-plus/icons-vue";
import { message } from "@repo/core";
import { useGateway } from "../composables/useGateway";
import type { AgentInfo, ControllerInfo } from "../api/types";
import type { ReTableColumn } from "@repo/ui/re-table";

const { info, loading, error, fetchInfo, kickController } = useGateway();

const settingsVisible = ref(false);
const gatewayHost = ref(localStorage.getItem("gateway-host") || "127.0.0.1");
const gatewayPort = ref(Number(localStorage.getItem("gateway-port") || 8083));
const managementPort = ref(Number(localStorage.getItem("gateway-management-port") || 3000));

function saveSettings() {
  localStorage.setItem("gateway-host", gatewayHost.value);
  localStorage.setItem("gateway-port", String(gatewayPort.value));
  localStorage.setItem("gateway-management-port", String(managementPort.value));
  settingsVisible.value = false;
  message.success("设置已保存");
  fetchInfo();
}

function onKick(row: ControllerInfo) {
  message.confirm(`确认踢出控制端 ${row.ipAddress}?`, "操作确认")
    .then(() => kickController(row.id))
    .catch(() => {});
}

function copyVerifyCode(code: string) {
  navigator.clipboard?.writeText(code);
  message.success("已复制验证码");
}

function onAgentInfo(row: AgentInfo) {
  message.info(`Agent ${row.agentId}：${row.agentType || "unknown"} · ${row.protocols?.join(", ") || "-"}`);
}

const healthIconColor = computed(() =>
  info.value?.health.status === "UP" ? "var(--el-color-success)" : "var(--el-color-danger)",
);

function agentTagType(t?: string): "primary" | "info" | "warning" {
  if (t === "java") return "primary";
  if (t === "rust") return "warning";
  return "info";
}

const controllerColumns: ReTableColumn[] = [
  { prop: "ipAddress", label: "IP 地址", minWidth: 140 },
  { prop: "type", label: "类型", width: 100 },
  {
    prop: "connectedAt",
    label: "接入时间",
    minWidth: 180,
    formatter: (_row: Record<string, unknown>, _col: ReTableColumn, v: unknown) =>
      v ? new Date(Number(v)).toLocaleString() : "-",
  },
  { prop: "action", label: "操作", width: 80, slot: "action", align: "center" },
];

const agentColumns: ReTableColumn[] = [
  { prop: "agentId", label: "端点 ID", minWidth: 160 },
  { prop: "agentType", label: "类型", width: 100, slot: "agentType", align: "center" },
  { prop: "verifyCode", label: "验证码", width: 120, slot: "verifyCode", align: "center" },
  { prop: "ipAddress", label: "IP 地址", width: 140, slot: "ipAddress" },
  { prop: "os", label: "操作系统", width: 120, slot: "os" },
  { prop: "targets", label: "Targets", minWidth: 240, slot: "targets" },
  { prop: "action", label: "操作", width: 80, slot: "action", align: "center" },
];
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-header-right {
  display: flex;
  gap: 8px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
}

.gm-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gm-section {
  display: flex;
  flex-direction: column;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

/* card-modern 已在 app.scss 中定义 */

.stat-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-card__title {
  font-size: 14px;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 8px;
  min-height: 34px;
  display: flex;
  align-items: center;
}

.stat-card__desc {
  font-size: 12px;
}

.section-card {
  padding: 4px;
}

.section-head {
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
}

.section-desc {
  font-size: 12px;
  margin-top: 2px;
}

.verify-code,
.ip-code,
.target-id {
  font-family: var(--el-font-family-monospace, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.verify-code:hover,
.ip-code:hover,
.target-id:hover {
  background: var(--el-fill-color);
}

.muted {
  color: var(--el-text-color-placeholder);
}

.target-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.target-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
