<template>
  <ScDialog
    :model-value="modelValue"
    title="防火墙管理"
    width="900px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="server-firewall-dialog">
      <div class="server-firewall-dialog__header">
        <span class="server-firewall-dialog__host-label">
          服务器：{{ hostName || hostId }}
        </span>
      </div>

      <el-tabs v-model="activeTab" class="server-firewall-dialog__tabs">
        <!-- Tab 1：规则列表 -->
        <el-tab-pane label="规则列表" name="rules">
          <div class="server-firewall-dialog__toolbar">
            <el-button type="primary" size="small" @click="handleAddRule">
              添加规则
            </el-button>
          </div>
          <el-table
            :data="rules"
            stripe
            size="small"
            empty-text="暂无防火墙规则"
            v-loading="loading"
          >
            <el-table-column prop="name" label="名称" min-width="120" />
            <el-table-column label="方向" width="70">
              <template #default="{ row }">
                <el-tag
                  :type="row.direction === 'in' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ row.direction === "in" ? "入站" : "出站" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="动作" width="70">
              <template #default="{ row }">
                <el-tag
                  :type="row.action === 'allow' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.action === "allow" ? "允许" : "拒绝" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="protocol" label="协议" width="70" />
            <el-table-column prop="port" label="端口" width="80" />
            <el-table-column prop="sourceIp" label="来源IP" min-width="120" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.enabled"
                  size="small"
                  @change="(val: boolean) => handleToggle(row, val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="handleEditRule(row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  link
                  size="small"
                  @click="handleDeleteRule(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Tab 2：添加/编辑规则 -->
        <el-tab-pane label="添加/编辑规则" name="form">
          <el-form
            ref="formRef"
            :model="form"
            label-width="100px"
            class="server-firewall-dialog__form"
          >
            <el-form-item label="规则名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入规则名称" />
            </el-form-item>
            <el-form-item label="方向" prop="direction">
              <el-select v-model="form.direction" placeholder="请选择方向">
                <el-option label="入站" value="in" />
                <el-option label="出站" value="out" />
              </el-select>
            </el-form-item>
            <el-form-item label="动作" prop="action">
              <el-select v-model="form.action" placeholder="请选择动作">
                <el-option label="允许" value="allow" />
                <el-option label="拒绝" value="deny" />
              </el-select>
            </el-form-item>
            <el-form-item label="协议" prop="protocol">
              <el-select v-model="form.protocol" placeholder="请选择协议">
                <el-option label="TCP" value="tcp" />
                <el-option label="UDP" value="udp" />
                <el-option label="ICMP" value="icmp" />
                <el-option label="任意" value="any" />
              </el-select>
            </el-form-item>
            <el-form-item label="端口" prop="port">
              <el-input
                v-model="form.port"
                placeholder="如 80, 443 或 1-65535"
              />
            </el-form-item>
            <el-form-item label="来源IP" prop="sourceIp">
              <el-input
                v-model="form.sourceIp"
                placeholder="如 192.168.1.0/24"
              />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="规则描述（可选）"
              />
            </el-form-item>
          </el-form>
          <div class="server-firewall-dialog__form-actions">
            <el-button @click="handleCancel">取消</el-button>
            <el-button
              type="primary"
              :loading="saving"
              @click="handleSave"
            >
              {{ editingIndex !== null ? "更新规则" : "添加规则" }}
            </el-button>
          </div>
        </el-tab-pane>

        <!-- Tab 3：防火墙状态 -->
        <el-tab-pane label="防火墙状态" name="status">
          <div
            class="server-firewall-dialog__status"
            v-loading="statusLoading"
          >
            <template v-if="status">
              <div class="server-firewall-dialog__status-card">
                <div class="server-firewall-dialog__status-item">
                  <span class="server-firewall-dialog__status-label">
                    运行状态
                  </span>
                  <el-tag
                    :type="status.enabled ? 'success' : 'danger'"
                    size="default"
                  >
                    {{ status.enabled ? "已启用" : "已禁用" }}
                  </el-tag>
                </div>
                <div class="server-firewall-dialog__status-item">
                  <span class="server-firewall-dialog__status-label">
                    活跃规则数
                  </span>
                  <span class="server-firewall-dialog__status-value">
                    {{ status.activeRules }}
                  </span>
                </div>
                <div class="server-firewall-dialog__status-item">
                  <span class="server-firewall-dialog__status-label">
                    防火墙类型
                  </span>
                  <span class="server-firewall-dialog__status-value">
                    {{ status.firewallType || "未识别" }}
                  </span>
                </div>
              </div>

              <div class="server-firewall-dialog__status-card">
                <h4 class="server-firewall-dialog__status-title">默认策略</h4>
                <div class="server-firewall-dialog__status-item">
                  <span class="server-firewall-dialog__status-label">
                    入站默认策略
                  </span>
                  <el-tag
                    :type="
                      status.defaultInputPolicy === 'ACCEPT'
                        ? 'success'
                        : 'danger'
                    "
                    size="small"
                  >
                    {{ status.defaultInputPolicy || "未知" }}
                  </el-tag>
                </div>
                <div class="server-firewall-dialog__status-item">
                  <span class="server-firewall-dialog__status-label">
                    出站默认策略
                  </span>
                  <el-tag
                    :type="
                      status.defaultOutputPolicy === 'ACCEPT'
                        ? 'success'
                        : 'danger'
                    "
                    size="small"
                  >
                    {{ status.defaultOutputPolicy || "未知" }}
                  </el-tag>
                </div>
                <div class="server-firewall-dialog__status-item">
                  <span class="server-firewall-dialog__status-label">
                    转发默认策略
                  </span>
                  <el-tag
                    :type="
                      status.defaultForwardPolicy === 'ACCEPT'
                        ? 'success'
                        : 'danger'
                    "
                    size="small"
                  >
                    {{ status.defaultForwardPolicy || "未知" }}
                  </el-tag>
                </div>
              </div>
            </template>
            <el-empty v-else description="无法获取防火墙状态" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </ScDialog>
</template>

<script setup lang="ts">
import { ScDialog } from "@repo/components/ScDialog";
import { ref, reactive, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FirewallRule, FirewallStatus } from "../api/types";
import {
  listFirewallRules,
  createFirewallRule,
  updateFirewallRule,
  deleteFirewallRule,
  toggleFirewallRule,
  getFirewallStatus,
} from "../api";

const props = defineProps<{
  modelValue: boolean;
  hostId: number;
  hostName: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

// ── Tabs ──────────────────────────────────────────────

const activeTab = ref("rules");

// ── Rules list ────────────────────────────────────────

const rules = ref<FirewallRule[]>([]);
const loading = ref(false);

const loadRules = async () => {
  if (!props.hostId) return;
  loading.value = true;
  try {
    const res = await listFirewallRules(props.hostId);
    rules.value = res.data || [];
  } catch {
    ElMessage.error("获取防火墙规则失败");
    rules.value = [];
  } finally {
    loading.value = false;
  }
};

// ── Rule form ─────────────────────────────────────────

const createEmptyForm = (): FirewallRule => ({
  name: "",
  direction: "in",
  action: "allow",
  protocol: "tcp",
  port: "",
  sourceIp: "",
  enabled: true,
  description: "",
});

const form = reactive<FirewallRule>(createEmptyForm());
const editingIndex = ref<number | null>(null);
const saving = ref(false);

const handleAddRule = () => {
  Object.assign(form, createEmptyForm());
  editingIndex.value = null;
  activeTab.value = "form";
};

const handleEditRule = (rule: FirewallRule) => {
  Object.assign(form, {
    name: rule.name,
    direction: rule.direction,
    action: rule.action,
    protocol: rule.protocol,
    port: rule.port,
    sourceIp: rule.sourceIp,
    enabled: rule.enabled,
    description: rule.description,
  });
  editingIndex.value = rule.ruleIndex ?? null;
  activeTab.value = "form";
};

const handleSave = async () => {
  saving.value = true;
  try {
    if (editingIndex.value !== null) {
      await updateFirewallRule(props.hostId, editingIndex.value, { ...form });
      ElMessage.success("规则已更新");
    } else {
      await createFirewallRule(props.hostId, { ...form });
      ElMessage.success("规则已添加");
    }
    activeTab.value = "rules";
    await loadRules();
  } catch {
    ElMessage.error("保存规则失败");
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  activeTab.value = "rules";
};

const handleDeleteRule = async (rule: FirewallRule) => {
  try {
    await ElMessageBox.confirm(
      `确定删除规则「${rule.name || "未命名"}」吗？此操作不可恢复。`,
      "确认删除",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
  } catch {
    return;
  }
  try {
    await deleteFirewallRule(props.hostId, rule.ruleIndex!);
    ElMessage.success("规则已删除");
    await loadRules();
  } catch {
    ElMessage.error("删除规则失败");
  }
};

const handleToggle = async (rule: FirewallRule, enabled: boolean) => {
  try {
    await toggleFirewallRule(props.hostId, rule.ruleIndex!, enabled);
    ElMessage.success(enabled ? "规则已启用" : "规则已禁用");
    await loadRules();
  } catch {
    ElMessage.error("切换规则状态失败");
  }
};

// ── Firewall status ───────────────────────────────────

const status = ref<FirewallStatus | null>(null);
const statusLoading = ref(false);

const loadStatus = async () => {
  if (!props.hostId) return;
  statusLoading.value = true;
  try {
    const res = await getFirewallStatus(props.hostId);
    status.value = res.data || null;
  } catch {
    status.value = null;
  } finally {
    statusLoading.value = false;
  }
};

// ── Watchers ──────────────────────────────────────────

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.hostId) {
      activeTab.value = "rules";
      loadRules();
      loadStatus();
    }
  },
);
</script>

<style scoped lang="scss">
.server-firewall-dialog {
  &__header {
    margin-bottom: 16px;
  }

  &__host-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__tabs {
    min-height: 320px;
  }

  &__toolbar {
    margin-bottom: 12px;
  }

  &__form {
    max-width: 560px;
  }

  &__form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }

  &__status {
    min-height: 200px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__status-card {
    background: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__status-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__status-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__status-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    min-width: 100px;
    flex-shrink: 0;
  }

  &__status-value {
    font-size: 13px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }
}
</style>
