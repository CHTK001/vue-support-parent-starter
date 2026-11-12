<!--
  OSGi 插件管理。

  能力与后端 /osgi/** 对齐：清单、上传安装、原地升级、启动/停止、卸载、下载。
  后端端点默认关闭（plugin.osgi.endpoint.enabled=true 才装配），页面顶部常驻提示，
  避免「表格空白但没有任何解释」。

  变更操作都有明确后果：卸载会让该 bundle 提供的扩展立即失效；升级按符号名原地替换，
  保留 bundle 标识。因此卸载与升级前都做二次确认。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { msgError, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReTable from "@repo/ui/re-table";
import {
  OsgiError,
  downloadBundle,
  installBundle,
  listBundles,
  startBundle,
  stopBundle,
  uninstallBundle,
  updateBundle,
} from "../api/osgiApi";
import type { OsgiBundle } from "../types/osgi";
import type { ReTableColumn } from "@repo/ui/re-table";

defineOptions({ name: "OsgiManage" });

const rows = ref<OsgiBundle[]>([]);
const loading = ref(false);
/** 正在执行变更的符号名，用于禁用整行操作，避免并发点击 */
const busy = ref("");

const installInput = ref<HTMLInputElement | null>(null);
const upgradeInput = ref<HTMLInputElement | null>(null);
const upgradeTarget = ref("");

const activeCount = computed(() => rows.value.filter(row => row.bundleId !== 0 && row.state === "ACTIVE").length);

/**
 * 是否为框架系统 bundle。系统 bundle 不可停止/卸载/升级，界面上只展示。
 *
 * @param row bundle
 * @return 系统 bundle 返回 true
 */
function isSystem(row: OsgiBundle): boolean {
  return row.bundleId === 0;
}

const columns: ReTableColumn[] = [
  { prop: "symbolicName", label: "符号名", minWidth: 220, showOverflowTooltip: true },
  { prop: "version", label: "版本", width: 130 },
  { prop: "state", label: "状态", width: 110, slot: "state" },
  { prop: "bundleId", label: "ID", width: 70, align: "center" },
  { prop: "location", label: "来源", minWidth: 260, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 320, slot: "action", fixed: "right" },
];

/**
 * 状态到标签色的映射。
 *
 * @param state OSGi bundle 状态
 * @return ReTag 类型
 */
function stateType(state: string): "success" | "warning" | "info" | "danger" {
  switch (state) {
    case "ACTIVE":
      return "success";
    case "STARTING":
    case "STOPPING":
      return "warning";
    case "UNINSTALLED":
      return "danger";
    default:
      return "info";
  }
}

/**
 * 状态中文名，未知状态原样返回。
 *
 * @param state OSGi bundle 状态
 * @return 展示文本
 */
function stateText(state: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "运行中",
    RESOLVED: "已解析",
    INSTALLED: "已安装",
    STARTING: "启动中",
    STOPPING: "停止中",
    UNINSTALLED: "已卸载",
  };
  return labels[state] ?? state;
}

/**
 * 统一错误文案：端点未开启时给出明确排查方向。
 *
 * @param error 异常
 * @return 展示文本
 */
function errText(error: unknown): string {
  if (error instanceof OsgiError && (error.status === 404 || error.status === 405)) {
    return `${error.message}；请确认后端已开启 plugin.osgi.endpoint.enabled=true`;
  }
  return error instanceof Error ? error.message : String(error);
}

async function reload(): Promise<void> {
  loading.value = true;
  try {
    rows.value = (await listBundles()) ?? [];
  } catch (error) {
    msgError(errText(error));
  } finally {
    loading.value = false;
  }
}

function pickInstall(): void {
  if (installInput.value) {
    installInput.value.value = "";
    installInput.value.click();
  }
}

function pickUpgrade(symbolicName: string): void {
  upgradeTarget.value = symbolicName;
  if (upgradeInput.value) {
    upgradeInput.value.value = "";
    upgradeInput.value.click();
  }
}

async function onInstallFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  busy.value = file.name;
  try {
    const bundle = await installBundle(file, true);
    msgSuccess(`已安装并启动 ${bundle.symbolicName}:${bundle.version}`);
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    busy.value = "";
  }
}

async function onUpgradeFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  const target = upgradeTarget.value;
  if (!file || !target) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `用 ${file.name} 原地升级 ${target}？升级期间该插件会短暂停止。`,
      "升级插件",
      { type: "warning", confirmButtonText: "升级", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  busy.value = target;
  try {
    const bundle = await updateBundle(target, file);
    msgSuccess(`已升级 ${bundle.symbolicName} 到 ${bundle.version}`);
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    busy.value = "";
    upgradeTarget.value = "";
  }
}

async function toggle(row: OsgiBundle): Promise<void> {
  if (isSystem(row)) {
    return;
  }
  busy.value = row.symbolicName;
  try {
    if (row.state === "ACTIVE") {
      await stopBundle(row.symbolicName);
      msgSuccess(`已停止 ${row.symbolicName}`);
    } else {
      await startBundle(row.symbolicName);
      msgSuccess(`已启动 ${row.symbolicName}`);
    }
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    busy.value = "";
  }
}

async function remove(row: OsgiBundle): Promise<void> {
  if (isSystem(row)) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认卸载 ${row.symbolicName}？该插件提供的扩展会立即失效，jar 文件仍保留在部署目录。`,
      "卸载插件",
      { type: "warning", confirmButtonText: "卸载", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  busy.value = row.symbolicName;
  try {
    await uninstallBundle(row.symbolicName);
    msgSuccess(`已卸载 ${row.symbolicName}`);
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    busy.value = "";
  }
}

async function download(row: OsgiBundle): Promise<void> {
  try {
    await downloadBundle(row.symbolicName);
  } catch (error) {
    msgError(errText(error));
  }
}

onMounted(reload);
</script>

<template>
  <div class="osgi-page">
    <header class="osgi-page__head">
      <div>
        <h2>OSGi 插件管理</h2>
        <p>
          上传 jar 即安装，按符号名原地升级，卸载后插件提供的扩展立即失效。
          共 {{ rows.length }} 个 bundle，其中 {{ activeCount }} 个运行中。
        </p>
      </div>
      <span class="osgi-page__hint">
        端点需开启 <code>plugin.osgi.endpoint.enabled=true</code>
      </span>
    </header>

    <ReTable
      :loading="loading"
      :data="rows"
      :columns="columns"
      :pagination="false"
      row-key="symbolicName"
      @refresh="reload"
    >
      <template #toolbar>
        <ReButton type="primary" icon="Upload" :disabled="!!busy" @click="pickInstall">上传安装</ReButton>
        <ReButton icon="RefreshRight" :loading="loading" @click="reload">刷新</ReButton>
        <span v-if="busy" class="osgi-page__busy">正在处理 {{ busy }}…</span>
      </template>

      <template #state="{ row }">
        <ReTag :type="stateType((row as OsgiBundle).state)" effect="plain">
          {{ stateText((row as OsgiBundle).state) }}
        </ReTag>
      </template>

      <template #action="{ row }">
        <span v-if="isSystem(row as OsgiBundle)" class="osgi-page__system">系统内置</span>
        <div v-else class="osgi-page__actions">
          <ReButton
            size="small"
            :type="(row as OsgiBundle).state === 'ACTIVE' ? 'warning' : 'success'"
            :disabled="!!busy"
            @click="toggle(row as OsgiBundle)"
          >
            {{ (row as OsgiBundle).state === "ACTIVE" ? "停止" : "启动" }}
          </ReButton>
          <ReButton size="small" :disabled="!!busy" @click="pickUpgrade((row as OsgiBundle).symbolicName)">
            升级
          </ReButton>
          <ReButton size="small" :disabled="!!busy" @click="download(row as OsgiBundle)">下载</ReButton>
          <ReButton size="small" type="danger" :disabled="!!busy" @click="remove(row as OsgiBundle)">
            卸载
          </ReButton>
        </div>
      </template>
    </ReTable>

    <input ref="installInput" type="file" accept=".jar" class="osgi-page__file" @change="onInstallFile" />
    <input ref="upgradeInput" type="file" accept=".jar" class="osgi-page__file" @change="onUpgradeFile" />
  </div>
</template>

<style scoped>
.osgi-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.osgi-page__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.osgi-page__head h2 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 600;
}

.osgi-page__head p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.osgi-page__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.osgi-page__hint code {
  padding: 0 4px;
  border-radius: 3px;
  background: var(--el-fill-color-light);
}

.osgi-page__busy {
  font-size: 12px;
  color: var(--el-color-primary);
}

.osgi-page__system {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.osgi-page__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.osgi-page__file {
  display: none;
}
</style>
