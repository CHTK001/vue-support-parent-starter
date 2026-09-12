<script setup lang="ts">
/**
 * 账号管理 —— 登录身份（账号密码 / SSH 私钥）统一维护
 * 数据源：@pages/server 身份接口（getIdentities / saveIdentity / delIdentity）
 * 主机连接 / 编辑时从该列表选择身份
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";
import { getIdentities, saveIdentity, delIdentity } from "@pages/server/src/api";
import { useDialogPrerender } from "../utils/dialogPrerender";

interface Identity {
  id: number;
  msServerIdentityName: string;
  msServerIdentityAuthType: string;
  msServerIdentityUsername: string;
  msServerIdentityKeyId?: number | null;
  msServerIdentityRemark?: string;
}

const columns = [
  { prop: "msServerIdentityName", label: "名称", minWidth: 140 },
  { prop: "auth", label: "类型", width: 110, slot: "auth" },
  { prop: "msServerIdentityUsername", label: "登录用户", minWidth: 140 },
  { prop: "msServerIdentityRemark", label: "备注", minWidth: 160 },
  { prop: "id", label: "操作", width: 80, slot: "actions" },
];

const list = ref<Identity[]>([]);
const loading = ref(false);

async function load(): Promise<void> {
  loading.value = true;
  try {
    list.value = (await getIdentities()) ?? [];
  } catch (e) {
    ElMessage.error(`加载失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
}
onMounted(load);

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

function openAdd(): void {
  editingId.value = null;
  addForm.value = {
    msServerIdentityName: "", msServerIdentityAuthType: "PASSWORD", msServerIdentityUsername: "",
    msServerIdentityPassword: "", msServerIdentityKeyId: null, msServerIdentityRemark: "",
  };
  addVisible.value = true;
}

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
</script>

<template>
  <div class="im tel-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">账号管理</h1>
        <p class="page-desc">登录身份（账号密码 / SSH 私钥）统一维护 · 主机连接与编辑时从这里选择</p>
      </div>
    </div>

    <div class="card">
      <ReSectionHead description="身份即登录凭据：密码或私钥；主机可绑定多个身份，连接时按所选身份建连">
        <template #title>登录身份</template>
        <template #actions>
          <ReButton icon="Plus" :show-text="true" size="small" type="primary" @click="openAdd">新增身份</ReButton>
        </template>
      </ReSectionHead>

      <ReTable
        :data="list"
        :columns="columns"
        :loading="loading"
        table-id="identity-list"
        size="small"
        empty-text="暂无身份"
      >
        <template #col-auth="{ row }">
          <ReTag :type="authTypeTagType(row.msServerIdentityAuthType)" size="small">
            {{ authTypeLabel(row.msServerIdentityAuthType) }}
          </ReTag>
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton icon="EditPen" layout="square" size="small" title="编辑" @click="openEdit(row)" />
            <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" @click="remove(row)" />
          </div>
        </template>
      </ReTable>
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
</style>
