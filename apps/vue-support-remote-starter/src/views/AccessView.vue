<template>
  <div class="access-view">
    <div class="page-header">
      <div>
        <div class="page-title">接入码</div>
        <div class="page-sub">平台接入码管理——控制端接入被控端 / 被控端接入平台必须使用</div>
      </div>
      <ReButton type="primary" @click="openDialog" data-testid="btn-add-code">新增接入码</ReButton>
    </div>

    <ReTable :data="codes" :columns="columns" style="width: 100%">
      <template #status="{ row }">
        <ReTag :type="row.status === '启用' ? 'success' : 'info'" size="small">
          {{ row.status }}
        </ReTag>
      </template>
      <template #expiresAt="{ row }">
        <span :style="isExpired(row) ? 'color:#f56c6c' : ''">{{ row.expiresAt || "永久" }}</span>
      </template>
      <template #maxAgents="{ row }">
        <span>
          {{ row.maxAgents > 0 ? `${row.usedAgents ?? 0}/${row.maxAgents}` : "不限" }}
        </span>
      </template>
      <template #usedAgents="{ row }">
        <ReButton size="small" link type="primary" @click="showAgents(row)" data-testid="btn-show-agents">
          {{ row.usedAgents ?? 0 }} 台
        </ReButton>
      </template>
      <template #action="{ row }">
        <ReButton size="small" type="primary" link @click="copyCode(row)">复制</ReButton>
        <ReButton size="small" type="primary" link @click="openEditDialog(row)" data-testid="btn-edit-code">编辑</ReButton>
        <ReButton size="small" type="warning" link @click="toggle(row)">
          {{ row.status === "启用" ? "停用" : "启用" }}
        </ReButton>
        <ReButton size="small" type="danger" link @click="remove(row)" data-testid="btn-delete-code">删除</ReButton>
      </template>
    </ReTable>

    <el-dialog v-model="dialogVisible" :title="editingCode ? `编辑接入码——${editingCode}` : '新增接入码'" width="440" :close-on-click-modal="false">
      <el-form label-width="90px">
        <el-form-item label="接入码">
          <el-input v-model="form.code" placeholder="留空自动生成" data-testid="dlg-code" :disabled="!!editingCode" />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="form.expiresAt"
            type="datetime"
            placeholder="留空=永不过期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            data-testid="dlg-expires"
          />
        </el-form-item>
        <el-form-item label="接入上限">
          <el-input-number v-model="form.maxAgents" :min="0" :max="9999" style="width: 100%" data-testid="dlg-max" />
          <div class="field-hint">0 = 不限台数</div>
        </el-form-item>
        <el-form-item label="IP 白名单">
          <el-input
            v-model="form.ipWhitelist"
            type="textarea"
            :rows="2"
            placeholder="逗号分隔：支持指定 IP 与区间，如 192.168.1.5,192.168.1.1-192.168.1.100；留空=不限制"
            data-testid="dlg-whitelist"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="submit" data-testid="btn-submit-code">确认</ReButton>
      </template>
    </el-dialog>

    <el-dialog v-model="agentsVisible" :title="`接入详情——${currentCode}`" width="520">
      <el-table :data="currentAgents" size="small" empty-text="暂无接入记录">
        <el-table-column prop="agentId" label="被控端 ID" min-width="160" />
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column prop="time" label="接入时间" width="170" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";

interface AccessStat {
  agentId: string;
  ip: string;
  time: string;
}

interface AccessCode {
  code: string;
  type: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
  maxAgents?: number;
  usedAgents?: number;
  ipWhitelist?: string;
  agents?: AccessStat[];
}

const codes = ref<AccessCode[]>([]);
const dialogVisible = ref(false);
const form = reactive({ code: "", expiresAt: "", maxAgents: 0, ipWhitelist: "" });
const editingCode = ref("");
const agentsVisible = ref(false);
const currentAgents = ref<AccessStat[]>([]);
const currentCode = ref("");

/** 查看接入详情（被控端 ID / IP / 接入时间） */
const showAgents = (row: AccessCode) => {
  currentCode.value = row.code;
  currentAgents.value = row.agents ?? [];
  agentsVisible.value = true;
};

const columns = [
  { prop: "code", label: "接入码", minWidth: 160 },
  { prop: "status", label: "状态", width: 90, slot: "status" },
  { prop: "expiresAt", label: "过期时间", width: 170, slot: "expiresAt" },
  { prop: "maxAgents", label: "接入上限", width: 110, slot: "maxAgents" },
  { prop: "usedAgents", label: "已接入", width: 90, slot: "usedAgents" },
  { prop: "createdAt", label: "创建时间", width: 170 },
  { label: "操作", width: 180, fixed: "right", slot: "action" },
];

/** 是否已过期（expiresAt 早于当前时间） */
const isExpired = (row: AccessCode) => {
  if (!row.expiresAt) return false;
  return new Date(row.expiresAt.replace(" ", "T")) < new Date();
};

/** 生成随机接入码 */
const randomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

/** 加载接入码列表（GET——后端返回含过期/上限/统计） */
const load = async () => {
  try {
    const resp = await fetch("/api/remote/access-codes");
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) {
        codes.value = data;
        return;
      }
    }
  } catch {
    /* 后端不可达 */
  }
  codes.value = [];
  ElMessage.warning("后端不可达，请检查后端服务");
};

const openDialog = () => {
  editingCode.value = "";
  form.code = "";
  form.expiresAt = "";
  form.maxAgents = 0;
  form.ipWhitelist = "";
  dialogVisible.value = true;
};

/** 编辑已有接入码（可修改过期时间/接入上限/IP 白名单——接入码本身固定） */
const openEditDialog = (row: AccessCode) => {
  editingCode.value = row.code;
  form.code = row.code;
  form.expiresAt = row.expiresAt || "";
  form.maxAgents = row.maxAgents || 0;
  form.ipWhitelist = row.ipWhitelist || "";
  dialogVisible.value = true;
};

/** 新增/编辑接入码（POST /api/remote/access-codes——支持过期时间/上限；编辑时接入码固定） */
const submit = async () => {
  const code = editingCode.value || form.code.trim() || randomCode();
  const payload: Record<string, unknown> = { code };
  if (form.expiresAt) payload.expiresAt = form.expiresAt;
  else payload.expiresAt = "";
  payload.maxAgents = form.maxAgents || 0;
  payload.ipWhitelist = form.ipWhitelist || "";
  try {
    const resp = await fetch("/api/remote/access-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      ElMessage.success(editingCode.value ? `已更新 ${code}` : `已新增接入码 ${code}`);
      dialogVisible.value = false;
      await load();
    } else {
      const err = await resp.json().catch(() => ({}));
      ElMessage.error((err as { message?: string }).message || "保存失败");
    }
  } catch {
    ElMessage.error("后端不可达");
  }
};

/** 停用/启用（POST 更新状态） */
const toggle = async (row: AccessCode) => {
  try {
    const resp = await fetch("/api/remote/access-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: row.code, status: row.status === "启用" ? "停用" : "启用" }),
    });
    if (resp.ok) {
      await load();
    } else {
      ElMessage.error("更新失败");
    }
  } catch {
    ElMessage.error("后端不可达");
  }
};

/** 删除接入码（DELETE /api/remote/access-codes?code=xxx） */
const remove = async (row: AccessCode) => {
  try {
    const resp = await fetch(`/api/remote/access-codes?code=${encodeURIComponent(row.code)}`, {
      method: "DELETE",
    });
    if (resp.ok) {
      ElMessage.success(`已删除 ${row.code}`);
      await load();
    } else {
      const err = await resp.json().catch(() => ({}));
      ElMessage.error((err as { message?: string }).message || "删除失败");
    }
  } catch {
    ElMessage.error("后端不可达");
  }
};

const copyCode = (row: AccessCode) => {
  navigator.clipboard?.writeText(row.code).then(() => {
    ElMessage.success("已复制");
  });
};

onMounted(load);
</script>

<style lang="scss" scoped>
// 全部使用 element-plus 默认 CSS 变量（--el-*）——默认主题，不自定义色板

.access-view {
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--el-fill-color-lighter);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.page-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.field-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

// 表格圆角/表头（默认变量）
:deep(.el-table) {
  border-radius: 10px;
  overflow: hidden;
  --el-table-header-bg-color: var(--el-fill-color-light);
}
:deep(.el-table th.el-table__cell) {
  font-weight: 600;
}
</style>
