<script setup lang="ts">
/**
 * 账号管理 —— 登录身份（账号密码 / SSH 私钥 / 邮箱 / Token 等）统一维护
 * 数据源：@pages/server 身份接口（getIdentities / saveIdentity / delIdentity）
 * 主机连接 / 编辑时从该列表选择身份
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";
import type { ReFilterItem } from "@repo/ui/components/ReFilter/types";
import { getIdentities, saveIdentity, delIdentity, getKeys } from "@pages/server/src/api";
import { useDialogPrerender } from "../utils/dialogPrerender";

interface Identity {
  id: number;
  msServerIdentityName: string;
  msServerIdentityAuthType: string;
  msServerIdentityUsername: string;
  msServerIdentityKeyId?: number | null;
  msServerIdentityRemark?: string;
}

interface KeyRow {
  id: number;
  msServerKeyName: string;
}

const columns = [
  { prop: "msServerIdentityName", label: "名称", minWidth: 140 },
  { prop: "auth", label: "类型", width: 110, slot: "auth" },
  { prop: "msServerIdentityUsername", label: "登录用户", minWidth: 140 },
  { prop: "key", label: "密钥", width: 130, slot: "key" },
  { prop: "msServerIdentityRemark", label: "备注", minWidth: 160 },
  { prop: "id", label: "操作", width: 130, slot: "actions" },
];

const list = ref<Identity[]>([]);
const keys = ref<KeyRow[]>([]);
const loading = ref(false);
const selection = ref<Identity[]>([]);
const page = ref(1);
const pageSize = ref(10);

async function load(): Promise<void> {
  loading.value = true;
  try {
    const [idList, keyList] = await Promise.all([getIdentities(), getKeys().catch(() => [])]);
    list.value = (idList ?? []) as Identity[];
    keys.value = (keyList ?? []) as KeyRow[];
  } catch (e) {
    ElMessage.error(`加载失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
}
onMounted(load);

/** 密钥名映射（PUBLIC_KEY 引用 msServerKeyId → 密钥库名称） */
function keyNameOf(i: Identity): string {
  if (i.msServerIdentityAuthType !== "PUBLIC_KEY" || i.msServerIdentityKeyId == null) return "";
  return keys.value.find((k) => k.id === i.msServerIdentityKeyId)?.msServerKeyName ?? `#${i.msServerIdentityKeyId}`;
}

async function remove(i: Identity): Promise<void> {
  await ElMessageBox.confirm(`删除身份「${i.msServerIdentityName}」？`, "删除确认", { type: "warning" });
  try {
    await delIdentity(i.id);
    ElMessage.success("已删除");
    await load();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  }
}

/** 批量删除（ReTable toolbar batchDelete handler） */
async function batchDelete(rows: Record<string, unknown>[]): Promise<void> {
  let ok = 0;
  for (const r of rows) {
    const id = Number(r.id);
    if (!id) continue;
    try {
      await delIdentity(id);
      ok++;
    } catch {
      /* 单条失败继续 */
    }
  }
  ElMessage.success(`删除 ${ok}/${rows.length}`);
  selection.value = [];
  await load();
}

/** 导出当前过滤结果为 CSV */
function exportCsv(): void {
  const rows = filteredList.value;
  if (!rows.length) {
    ElMessage.warning("没有可导出的数据");
    return;
  }
  const head = ["名称", "类型", "登录用户", "密钥", "备注"];
  const lines = rows.map((i) => [
    i.msServerIdentityName,
    authTypeLabel(i.msServerIdentityAuthType),
    i.msServerIdentityUsername,
    keyNameOf(i),
    i.msServerIdentityRemark ?? "",
  ]);
  const csv = [head, ...lines]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `账号身份-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  ElMessage.success(`已导出 ${rows.length} 条`);
}

const authTypeOptions = [
  { value: "PASSWORD", label: "密码登录", group: "主机" },
  { value: "PUBLIC_KEY", label: "公钥登录", group: "主机" },
  { value: "MAILBOX", label: "邮箱账号", group: "通用" },
  { value: "TOKEN", label: "Token", group: "通用" },
  { value: "API_KEY", label: "API Key", group: "通用" },
  { value: "OAUTH2", label: "OAuth 2.0", group: "通用" },
  { value: "COOKIE", label: "Cookie", group: "通用" },
  { value: "ACCOUNT", label: "账号密码", group: "通用" },
];

/** 认证类型展示名（未知类型显示原值） */
const authTypeLabel = (t?: string | null): string => {
  if (!t) return "-";
  const hit = authTypeOptions.find((o) => o.value === t);
  return hit ? hit.label : t;
};

/** 认证类型标签色 */
const authTypeTagType = (t?: string | null): "success" | "info" | "warning" | "primary" => {
  if (t === "PUBLIC_KEY") return "warning";
  if (t === "MAILBOX") return "success";
  if (t === "PASSWORD") return "info";
  return "primary";
};

// ---- 过滤（ReFilter 统一驱动） ----
const filterState = ref<Record<string, unknown>>({ keyword: "", type: "" });
function onFilterChange(prop: string, value: unknown): void {
  filterState.value[prop] = value;
}
function onFilterReset(): void {
  filterState.value = { keyword: "", type: "" };
}

/** 类型统计：主机 / 通用 / 未知 */
const hostCount = computed(() => list.value.filter((i) => i.msServerIdentityAuthType === "PASSWORD" || i.msServerIdentityAuthType === "PUBLIC_KEY").length);
const genericCount = computed(() => list.value.length - hostCount.value);
const keyCount = computed(() => list.value.filter((i) => i.msServerIdentityAuthType === "PUBLIC_KEY").length);

const filterItems = computed<ReFilterItem[]>(() => [
  { prop: "keyword", label: "名称/用户", type: "input", placeholder: "搜索名称 / 登录用户 / 备注", clearable: true, always: true },
  { prop: "type", label: "类型", type: "select", placeholder: "全部类型", clearable: true, options: authTypeOptions.map((o) => ({ label: o.label, value: o.value })), always: true },
]);

/** 过滤后的列表 */
const filteredList = computed(() => {
  let items = list.value;
  const kw = String(filterState.value.keyword ?? "").toLowerCase().trim();
  if (kw) {
    items = items.filter(
      (i) =>
        i.msServerIdentityName.toLowerCase().includes(kw) ||
        (i.msServerIdentityUsername ?? "").toLowerCase().includes(kw) ||
        (i.msServerIdentityRemark ?? "").toLowerCase().includes(kw),
    );
  }
  const type = String(filterState.value.type ?? "");
  if (type) items = items.filter((i) => i.msServerIdentityAuthType === type);
  return items;
});

/** 复制用户名到剪贴板 */
async function copyUsername(i: Identity): Promise<void> {
  try {
    await navigator.clipboard.writeText(i.msServerIdentityUsername || "");
    ElMessage.success("用户名已复制");
  } catch {
    ElMessage.info(i.msServerIdentityUsername || "");
  }
}

// ---- 新增 / 编辑身份 ----
// ---- 弹窗（空闲时预渲染，首次打开毫秒级——dialogPrerender.ts） ----
const addVisible = ref(false);
useDialogPrerender(addVisible);
const addSaving = ref(false);
const editingId = ref<number | null>(null);
const addForm = ref<{
  msServerIdentityName: string;
  msServerIdentityAuthType: string;
  msServerIdentityUsername: string;
  msServerIdentityPassword: string;
  msServerIdentityKeyId: number | null;
  msServerIdentityRemark: string;
}>({
  msServerIdentityName: "", msServerIdentityAuthType: "PASSWORD", msServerIdentityUsername: "",
  msServerIdentityPassword: "", msServerIdentityKeyId: null, msServerIdentityRemark: "",
});

/**
 * 打开新建身份弹窗
 */
function openAdd(): void {
  editingId.value = null;
  addForm.value = {
    msServerIdentityName: "", msServerIdentityAuthType: "PASSWORD", msServerIdentityUsername: "",
    msServerIdentityPassword: "", msServerIdentityKeyId: null, msServerIdentityRemark: "",
  };
  addVisible.value = true;
}

/**
 * 打开编辑身份弹窗
 * @param row 身份行
 */
function openEdit(row: Identity): void {
  editingId.value = row.id;
  addForm.value = {
    msServerIdentityName: row.msServerIdentityName,
    msServerIdentityAuthType: row.msServerIdentityAuthType,
    msServerIdentityUsername: row.msServerIdentityUsername,
    // 密码不回显，留空表示不修改
    msServerIdentityPassword: "",
    msServerIdentityKeyId: row.msServerIdentityKeyId ?? null,
    msServerIdentityRemark: row.msServerIdentityRemark ?? "",
  };
  addVisible.value = true;
}

async function submitAdd(): Promise<void> {
  if (!addForm.value.msServerIdentityName?.trim()) { ElMessage.warning("请输入身份名称"); return; }
  if (!addForm.value.msServerIdentityUsername?.trim()) { ElMessage.warning("请输入登录用户名"); return; }
  addSaving.value = true;
  try {
    await saveIdentity(editingId.value, {
      ...addForm.value,
      msServerIdentityPassword: addForm.value.msServerIdentityPassword || undefined,
    });
    ElMessage.success(editingId.value != null ? "身份已更新" : "身份已创建");
    addVisible.value = false;
    await load();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    addSaving.value = false;
  }
}
</script>

<template>
  <div class="im tel-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">账号管理</h1>
        <p class="page-desc">登录身份（账号密码 / SSH 私钥 / 邮箱 / Token 等）统一维护 · 共 {{ list.length }} 条</p>
      </div>
      <div class="page-actions">
        <ReButton icon="Download" :show-text="true" size="small" @click="exportCsv">导出</ReButton>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <!-- KPI 统计 -->
    <section class="kpi-row cols-4">
      <div class="kpi c-brand">
        <div class="kpi-top"><span class="kpi-label">身份总数</span></div>
        <div class="kpi-value">{{ list.length }}</div>
        <div class="kpi-sub">全部登录身份</div>
      </div>
      <div class="kpi c-green">
        <div class="kpi-top"><span class="kpi-label">主机身份</span></div>
        <div class="kpi-value">{{ hostCount }}</div>
        <div class="kpi-sub">密码 / 公钥</div>
      </div>
      <div class="kpi c-blue">
        <div class="kpi-top"><span class="kpi-label">通用账号</span></div>
        <div class="kpi-value">{{ genericCount }}</div>
        <div class="kpi-sub">邮箱 / Token / API Key 等</div>
      </div>
      <div class="kpi c-amber">
        <div class="kpi-top"><span class="kpi-label">密钥引用</span></div>
        <div class="kpi-value">{{ keyCount }}</div>
        <div class="kpi-sub">SSH 私钥登录</div>
      </div>
    </section>

    <div class="card">
      <ReSectionHead description="身份即登录凭据；主机可绑定多个身份，连接时按所选身份建连">
        <template #title>登录身份</template>
        <template #actions>
          <ReButton icon="Plus" :show-text="true" size="small" type="primary" @click="openAdd">新增身份</ReButton>
        </template>
      </ReSectionHead>

      <div class="filter">
        <ReFilter
          :items="filterItems"
          :columns="2"
          :collapsible="false"
          :show-actions="false"
          @change="onFilterChange"
          @reset="onFilterReset"
          style="width:100%"
        />
        <span class="muted" style="margin-left:auto">{{ filteredList.length }} / {{ list.length }}</span>
      </div>

      <ReTable
        :data="filteredList"
        :columns="columns"
        :loading="loading"
        table-id="identity-list"
        size="small"
        :pagination="true"
        :page-size="pageSize"
        empty-text="暂无身份"
        :toolbar="true"
        :toolbar-config="{
          position: 'bottom',
          refresh: true,
          columnSettings: true,
          tableSettings: true,
          batchSelect: { enabled: true, tip: '批量选择' },
          batchDelete: { enabled: true, confirmMessage: '确认批量删除选中的身份？', handler: batchDelete },
        }"
        @selection-change="selection = $event"
      >
        <template #col-auth="{ row }">
          <ReTag :type="authTypeTagType(row.msServerIdentityAuthType)" size="small">
            {{ authTypeLabel(row.msServerIdentityAuthType) }}
          </ReTag>
        </template>
        <template #col-key="{ row }">
          <span v-if="keyNameOf(row)" class="mono dim">{{ keyNameOf(row) }}</span>
          <span v-else class="dim">—</span>
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton icon="CopyDocument" layout="square" size="small" title="复制用户名" @click="copyUsername(row)" />
            <ReButton icon="EditPen" layout="square" size="small" title="编辑" @click="openEdit(row)" />
            <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" @click="remove(row)" />
          </div>
        </template>
      </ReTable>
      <div v-if="selection.length" class="sel-bar">
        <ReTag type="primary" effect="plain">已选 {{ selection.length }} 项</ReTag>
        <ReButton icon="Delete" size="small" type="danger" :show-text="true" @click="batchDelete(selection as unknown as Record<string, unknown>[])">批量删除</ReButton>
      </div>
    </div>

    <!-- 新增身份 -->
    <ReDialog v-model="addVisible" :title="editingId != null ? '编辑身份' : '新增身份'" width="520px" :close-on-click-modal="false">
      <ReForm :model="addForm" label-position="top">
        <ReFormItem label="名称">
          <ReInput v-model="addForm.msServerIdentityName" placeholder="如 root-prod" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="类型">
          <ReSelect v-model="addForm.msServerIdentityAuthType" size="small" style="width:100%" filterable allow-create default-first-option placeholder="选择或输入类型" :options="authTypeOptions" />
        </ReFormItem>
        <ReFormItem label="登录用户名">
          <ReInput v-model="addForm.msServerIdentityUsername" placeholder="如 root / ubuntu" style="width:100%" />
        </ReFormItem>
        <ReFormItem v-if="addForm.msServerIdentityAuthType === 'PASSWORD'" label="登录密码">
          <ReInput v-model="addForm.msServerIdentityPassword" type="password" show-password placeholder="SSH 口令" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="addForm.msServerIdentityRemark" placeholder="用途说明（可选）" style="width:100%" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="addVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="addSaving" icon="Check" :show-text="true" @click="submitAdd">{{ editingId != null ? '保存' : '创建' }}</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.im { display: flex; flex-direction: column; gap: 14px; }
.op-cell { display: flex; gap: 6px; }
.sel-bar { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 8px 12px; background: var(--bg-container); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
.mono { font-family: ui-monospace, SFMono-Regular, monospace; }
.dim { color: var(--text-tertiary); }
</style>
