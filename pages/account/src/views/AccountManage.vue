<script setup lang="ts">
/**
 * 账号管理 —— 主机资产登录身份（账号密码 / 私钥）统一管理。
 *
 * 数据源：spring-support-server-starter `/ms/server/identity`（MsServerIdentity），
 * 即主机资产连接时可选的登录凭据，与 AssetsView「账号/密钥」同一数据。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ReCard from "@repo/ui/re-card";
import ReForm from "@repo/ui/re-form";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReTag from "@repo/ui/re-tag";
import ReTable from "@repo/ui/re-table";
import ReDialog from "@repo/ui/re-dialog";
import { ReFormItem } from "@repo/ui/re-kit";
import { getIdentities, saveIdentity, delIdentity } from "@pages/server/src/api";

interface Identity {
  id: number;
  msServerIdentityName: string;
  msServerIdentityAuthType: string;
  msServerIdentityUsername: string;
  msServerIdentityPassword?: string;
  msServerIdentityKeyId?: number | null;
  msServerIdentityRemark?: string;
}

const loading = ref(false);
const identities = ref<Identity[]>([]);
const keyword = ref("");

/** 认证方式选项 */
const authTypeOptions = [
  { label: "密码登录 (PASSWORD)", value: "PASSWORD" },
  { label: "私钥登录 (PUBLIC_KEY)", value: "PUBLIC_KEY" },
];

const filtered = () => {
  const k = keyword.value.trim().toLowerCase();
  if (!k) return identities.value;
  return identities.value.filter(i =>
    i.msServerIdentityName.toLowerCase().includes(k) ||
    (i.msServerIdentityUsername ?? "").toLowerCase().includes(k) ||
    (i.msServerIdentityRemark ?? "").toLowerCase().includes(k),
  );
};

async function fetchAll(): Promise<void> {
  loading.value = true;
  try {
    const list = await getIdentities();
    identities.value = (list ?? []) as Identity[];
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    loading.value = false;
  }
}

// ---- 新增/编辑弹窗 ----
const visible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<Partial<Identity>>({});

function openAdd(): void {
  isEdit.value = false;
  form.value = { msServerIdentityName: "", msServerIdentityAuthType: "PASSWORD", msServerIdentityUsername: "", msServerIdentityPassword: "", msServerIdentityRemark: "" };
  visible.value = true;
}
function openEdit(row: Identity): void {
  isEdit.value = true;
  // 密码不回显（后端不下发明文），编辑时留空表示不修改
  form.value = { ...row, msServerIdentityPassword: "" };
  visible.value = true;
}
async function submit(): Promise<void> {
  if (!form.value.msServerIdentityName?.trim()) { ElMessage.warning("请输入身份名称"); return; }
  if (!form.value.msServerIdentityUsername?.trim()) { ElMessage.warning("请输入登录用户名"); return; }
  saving.value = true;
  try {
    const body = { ...form.value, msServerIdentityPassword: form.value.msServerIdentityPassword || undefined };
    await saveIdentity(isEdit.value ? (form.value.id ?? null) : null, body);
    ElMessage.success(isEdit.value ? "已更新" : "已创建");
    visible.value = false;
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    saving.value = false;
  }
}
async function remove(row: Identity): Promise<void> {
  await ElMessageBox.confirm(`删除身份「${row.msServerIdentityName}」？绑定该身份的主机将回退默认凭据`, "删除确认", { type: "warning" });
  try {
    await delIdentity(row.id);
    ElMessage.success("已删除");
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  }
}

/** 表格列定义 */
const tableColumns = [
  { prop: "msServerIdentityName", label: "名称", minWidth: 140, showOverflowTooltip: true },
  { prop: "msServerIdentityAuthType", label: "类型", width: 120, slot: "type" },
  { prop: "msServerIdentityUsername", label: "登录用户", minWidth: 120, showOverflowTooltip: true },
  { prop: "msServerIdentityRemark", label: "备注", minWidth: 140, showOverflowTooltip: true },
  { prop: "actions", label: "操作", width: 140, fixed: "right", slot: "actions" },
];

onMounted(fetchAll);
</script>

<template>
  <div class="acct">
    <div class="page-header">
      <div>
        <h1 class="page-title">账号管理</h1>
        <p class="page-desc">主机资产登录身份（账号密码 / 私钥）· 共 {{ identities.length }} 条</p>
      </div>
      <div class="page-actions">
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="fetchAll">刷新</ReButton>
        <ReButton icon="Plus" :show-text="true" type="primary" size="small" @click="openAdd">新增身份</ReButton>
      </div>
    </div>

    <ReCard :radius="12" shadow="never">
      <template #header>
        <div class="filter-bar">
          <ReInput v-model="keyword" placeholder="搜索名称 / 用户 / 备注" clearable size="small" class="f-kw" />
          <span class="f-count">{{ filtered().length }} / {{ identities.length }}</span>
        </div>
      </template>
      <ReTable
        :data="filtered().map(i => ({ ...i }))"
        :columns="tableColumns"
        :loading="loading"
        size="small"
        :border="false"
        table-id="account-identity-list"
        empty-text="暂无登录身份"
      >
        <template #col-type="{ row }">
          <ReTag :type="row.msServerIdentityAuthType === 'PUBLIC_KEY' ? 'warning' : 'info'" size="small" effect="plain">
            {{ row.msServerIdentityAuthType === 'PUBLIC_KEY' ? '私钥' : '密码' }}
          </ReTag>
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton icon="EditPen" layout="square" size="small" title="编辑" @click="openEdit(row)" />
            <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" @click="remove(row)" />
          </div>
        </template>
      </ReTable>
    </ReCard>

    <!-- 新增/编辑弹窗 -->
    <ReDialog v-model="visible" :title="isEdit ? '编辑身份' : '新增身份'" width="520px" :close-on-click-modal="false">
      <ReForm label-width="auto">
        <ReFormItem label="名称"><ReInput v-model="form.msServerIdentityName" placeholder="如 root-prod" style="width:100%" /></ReFormItem>
        <ReFormItem label="类型">
          <ReSelect v-model="form.msServerIdentityAuthType" size="small" style="width:100%" :options="authTypeOptions" />
        </ReFormItem>
        <ReFormItem label="用户名"><ReInput v-model="form.msServerIdentityUsername" placeholder="如 root / ubuntu" style="width:100%" /></ReFormItem>
        <ReFormItem v-if="form.msServerIdentityAuthType === 'PASSWORD'" label="密码">
          <ReInput v-model="form.msServerIdentityPassword" type="password" show-password :placeholder="isEdit ? '留空表示不修改' : '登录口令'" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="备注"><ReInput v-model="form.msServerIdentityRemark" placeholder="用途 / 备注（可选）" style="width:100%" /></ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="visible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="submit" icon="Check" :show-text="true">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; }
.page-title { margin: 0; font-size: 20px; font-weight: 700; }
.page-desc { margin: 4px 0 0; font-size: 13px; color: var(--text-tertiary); }
.page-actions { display: flex; gap: 8px; }
.filter-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.f-kw { width: 220px; }
.f-count { margin-left: auto; font-size: 12px; color: var(--text-tertiary); }
.op-cell { display: flex; gap: 6px; }
</style>
