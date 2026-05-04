<template>
  <ScDialog
    :model-value="modelValue"
    :title="`用户与 SSH 密钥管理 - ${hostName}`"
    width="920px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="server-user-mgmt-dialog">
      <el-tabs v-model="activeTab" class="server-user-mgmt-dialog__tabs">
        <el-tab-pane label="用户列表" name="users">
          <div class="server-user-mgmt-dialog__toolbar">
            <el-button type="primary" size="small" @click="showAddForm = !showAddForm">
              {{ showAddForm ? "取消" : "添加用户" }}
            </el-button>
            <span class="server-user-mgmt-dialog__hint">共 {{ users.length }} 个用户</span>
          </div>

          <div v-if="showAddForm" class="server-user-mgmt-dialog__form">
            <div class="server-user-mgmt-dialog__form-fields">
              <el-input
                v-model="addForm.username"
                placeholder="用户名"
                size="small"
                clearable
              />
              <el-input
                v-model="addForm.password"
                type="password"
                placeholder="密码"
                size="small"
                clearable
                show-password
              />
              <el-input
                v-model="addForm.groups"
                placeholder="附加组（多个用逗号分隔）"
                size="small"
                clearable
              />
            </div>
            <div class="server-user-mgmt-dialog__form-actions">
              <el-button type="primary" size="small" :loading="addingUser" @click="handleAddUser">
                确认创建
              </el-button>
            </div>
          </div>

          <el-table
            :data="users"
            v-loading="loading"
            stripe
            size="small"
            max-height="420"
            class="server-user-mgmt-dialog__table"
          >
            <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
            <el-table-column label="UID / GID" width="120">
              <template #default="{ row }">
                <span class="server-user-mgmt-dialog__mono">{{ row.uid ?? "-" }}</span>
                /
                <span class="server-user-mgmt-dialog__mono">{{ row.gid ?? "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="homeDir" label="家目录" min-width="160" show-overflow-tooltip />
            <el-table-column prop="shell" label="Shell" width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'danger'" size="small" effect="plain">
                  {{ row.enabled ? "启用" : "禁用" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="上次登录" width="170">
              <template #default="{ row }">
                {{ row.lastLogon ? formatTime(row.lastLogon) : "-" }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="270" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleChangePassword(row.username)">
                  修改密码
                </el-button>
                <el-button link type="success" size="small" @click="switchToSshKeys(row.username)">
                  管理 SSH 密钥
                </el-button>
                <el-button link type="danger" size="small" @click="handleDeleteUser(row.username)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="SSH 密钥管理" name="ssh">
          <div class="server-user-mgmt-dialog__toolbar">
            <div class="server-user-mgmt-dialog__user-select">
              <span class="server-user-mgmt-dialog__label">选择用户：</span>
              <el-select
                v-model="selectedUsername"
                placeholder="选择要管理密钥的用户"
                size="small"
                clearable
                style="width: 220px"
              >
                <el-option
                  v-for="u in users"
                  :key="u.username"
                  :label="u.username"
                  :value="u.username"
                />
              </el-select>
            </div>
            <el-button
              type="primary"
              size="small"
              :disabled="!selectedUsername"
              @click="showAddKeyForm = !showAddKeyForm"
            >
              {{ showAddKeyForm ? "取消" : "添加公钥" }}
            </el-button>
          </div>

          <div v-if="showAddKeyForm" class="server-user-mgmt-dialog__form">
            <el-input
              v-model="newPublicKey"
              type="textarea"
              :rows="4"
              placeholder="粘贴公钥内容（ssh-rsa / ssh-ed25519 / ecdsa-sha2-...）"
            />
            <div class="server-user-mgmt-dialog__form-actions">
              <el-button type="primary" size="small" :loading="addingKey" @click="handleAddSshKey">
                保存公钥
              </el-button>
            </div>
          </div>

          <div v-if="!selectedUsername" class="server-user-mgmt-dialog__empty">
            请先在上方选择一个用户以查看其 SSH 密钥
          </div>

          <el-table
            v-else
            :data="sshKeys"
            v-loading="sshKeysLoading"
            stripe
            size="small"
            max-height="420"
            class="server-user-mgmt-dialog__table"
          >
            <el-table-column prop="keyType" label="密钥类型" width="140" />
            <el-table-column prop="fingerprint" label="指纹" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <code class="server-user-mgmt-dialog__fingerprint">{{ row.fingerprint || "-" }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="comment" label="备注" min-width="140" show-overflow-tooltip />
            <el-table-column label="创建时间" width="170">
              <template #default="{ row }">
                {{ row.createdAt ? formatTime(row.createdAt) : "-" }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeleteSshKey(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </ScDialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { ServerUser, SshPublicKey } from "../api";
import {
  listServerUsers,
  createServerUser,
  deleteServerUser,
  changeUserPassword,
  listUserSshKeys,
  addUserSshKey,
  deleteUserSshKey,
} from "../api";

const props = defineProps<{
  modelValue: boolean;
  hostId: number;
  hostName: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

// ── Tab ──────────────────────────────────────────────────
const activeTab = ref("users");

// ── Users ─────────────────────────────────────────────────
const users = ref<ServerUser[]>([]);
const loading = ref(false);
const showAddForm = ref(false);
const addForm = ref({ username: "", password: "", groups: "" });
const addingUser = ref(false);

const loadUsers = async () => {
  loading.value = true;
  try {
    const res = await listServerUsers(props.hostId);
    users.value = res.data || [];
  } catch (err: any) {
    ElMessage.error(err.message || "加载用户列表失败");
  } finally {
    loading.value = false;
  }
};

// ── SSH Keys ─────────────────────────────────────────────
const selectedUsername = ref("");
const sshKeys = ref<SshPublicKey[]>([]);
const sshKeysLoading = ref(false);
const showAddKeyForm = ref(false);
const newPublicKey = ref("");
const addingKey = ref(false);

const loadSshKeys = async () => {
  if (!selectedUsername.value) {
    sshKeys.value = [];
    return;
  }
  sshKeysLoading.value = true;
  showAddKeyForm.value = false;
  try {
    const res = await listUserSshKeys(props.hostId, selectedUsername.value);
    sshKeys.value = res.data || [];
  } catch (err: any) {
    ElMessage.error(err.message || "加载 SSH 密钥失败");
  } finally {
    sshKeysLoading.value = false;
  }
};

// ── Watchers ─────────────────────────────────────────────
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      activeTab.value = "users";
      showAddForm.value = false;
      showAddKeyForm.value = false;
      selectedUsername.value = "";
      newPublicKey.value = "";
      addForm.value = { username: "", password: "", groups: "" };
      loadUsers();
    }
  },
);

watch(selectedUsername, () => {
  loadSshKeys();
});

// ── Format helper ────────────────────────────────────────
const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

// ── User CRUD ────────────────────────────────────────────
const handleAddUser = async () => {
  const { username, password, groups } = addForm.value;
  if (!username || !password) {
    ElMessage.warning("用户名和密码不能为空");
    return;
  }
  addingUser.value = true;
  try {
    const data: Partial<ServerUser> = {
      username,
      password,
      groups: groups
        ? groups.split(",").map((g) => g.trim()).filter(Boolean)
        : [],
    };
    await createServerUser(props.hostId, data);
    ElMessage.success("用户创建成功");
    showAddForm.value = false;
    addForm.value = { username: "", password: "", groups: "" };
    await loadUsers();
  } catch (err: any) {
    ElMessage.error(err.message || "创建用户失败");
  } finally {
    addingUser.value = false;
  }
};

const handleDeleteUser = (username: string) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${username}" 吗？此操作不可恢复。`,
    "确认删除",
    {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    },
  )
    .then(async () => {
      try {
        await deleteServerUser(props.hostId, username);
        ElMessage.success("用户已删除");
        await loadUsers();
      } catch (err: any) {
        ElMessage.error(err.message || "删除用户失败");
      }
    })
    .catch(() => {});
};

const handleChangePassword = (username: string) => {
  ElMessageBox.prompt(
    `请输入用户 "${username}" 的新密码`,
    "修改密码",
    {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      inputType: "password",
      inputPattern: /^.+$/,
      inputErrorMessage: "密码不能为空",
    },
  )
    .then(async ({ value }) => {
      try {
        await changeUserPassword(props.hostId, username, value);
        ElMessage.success("密码修改成功");
      } catch (err: any) {
        ElMessage.error(err.message || "修改密码失败");
      }
    })
    .catch(() => {});
};

const switchToSshKeys = (username: string) => {
  selectedUsername.value = username;
  activeTab.value = "ssh";
};

// ── SSH Key CRUD ─────────────────────────────────────────
const handleAddSshKey = async () => {
  if (!newPublicKey.value.trim()) {
    ElMessage.warning("公钥内容不能为空");
    return;
  }
  if (!selectedUsername.value) {
    ElMessage.warning("请先选择用户");
    return;
  }
  addingKey.value = true;
  try {
    await addUserSshKey(props.hostId, selectedUsername.value, newPublicKey.value.trim());
    ElMessage.success("公钥添加成功");
    showAddKeyForm.value = false;
    newPublicKey.value = "";
    await loadSshKeys();
  } catch (err: any) {
    ElMessage.error(err.message || "添加公钥失败");
  } finally {
    addingKey.value = false;
  }
};

const handleDeleteSshKey = (key: SshPublicKey) => {
  ElMessageBox.confirm(
    `确定要删除${key.fingerprint ? `指纹为 "${key.fingerprint}" 的` : ""} SSH 密钥吗？`,
    "确认删除",
    {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    },
  )
    .then(async () => {
      try {
        await deleteUserSshKey(props.hostId, selectedUsername.value, key.id);
        ElMessage.success("密钥已删除");
        await loadSshKeys();
      } catch (err: any) {
        ElMessage.error(err.message || "删除密钥失败");
      }
    })
    .catch(() => {});
};
</script>

<style scoped lang="scss">
.server-user-mgmt-dialog {
  display: grid;
  gap: 6px;
}

:deep(.el-dialog) {
  border-radius: 26px;
  overflow: hidden;
}

:deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.el-dialog__header) {
  padding-bottom: 4px;
}

.server-user-mgmt-dialog__tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}

.server-user-mgmt-dialog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.server-user-mgmt-dialog__user-select {
  display: flex;
  align-items: center;
  gap: 8px;
}

.server-user-mgmt-dialog__label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.server-user-mgmt-dialog__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.server-user-mgmt-dialog__form {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, rgba(148, 163, 184, 0.18));
  background:
    radial-gradient(
      circle at top right,
      color-mix(in srgb, var(--el-color-primary) 6%, transparent),
      transparent 24%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 92%, white);
  box-shadow:
    0 12px 20px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.server-user-mgmt-dialog__form-fields {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.server-user-mgmt-dialog__form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.server-user-mgmt-dialog__table {
  border-radius: 14px;
  overflow: hidden;

  :deep(th.el-table__cell) {
    background: color-mix(in srgb, var(--el-fill-color-light) 96%, white);
  }
}

.server-user-mgmt-dialog__mono {
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
  font-size: 12px;
}

.server-user-mgmt-dialog__fingerprint {
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
  font-size: 11px;
  background: color-mix(in srgb, var(--el-fill-color) 80%, white);
  padding: 1px 6px;
  border-radius: 4px;
}

.server-user-mgmt-dialog__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  border-radius: 14px;
  border: 1px dashed rgba(148, 163, 184, 0.25);
  background: color-mix(in srgb, var(--el-fill-color-light) 90%, white);
}

@media (max-width: 860px) {
  .server-user-mgmt-dialog__form-fields {
    grid-template-columns: 1fr;
  }

  .server-user-mgmt-dialog__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
