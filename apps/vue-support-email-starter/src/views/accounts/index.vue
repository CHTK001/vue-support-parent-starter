<template>
  <div class="account-management">
    <div class="toolbar">
      <h2>账户管理</h2>
      <div class="toolbar-actions">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加账户
        </el-button>
        <el-dropdown @command="handleExport">
          <el-button>
            <el-icon><Download /></el-icon>
            导出
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="json">
                <el-icon><Document /></el-icon>
                导出为 JSON
              </el-dropdown-item>
              <el-dropdown-item command="csv">
                <el-icon><Tickets /></el-icon>
                导出为 CSV
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown @command="handleImport">
          <el-button>
            <el-icon><Upload /></el-icon>
            导入
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="json">
                <el-icon><Document /></el-icon>
                从 JSON 导入
              </el-dropdown-item>
              <el-dropdown-item command="csv">
                <el-icon><Tickets /></el-icon>
                从 CSV 导入
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-table v-loading="loading" :data="filteredAccounts" style="width: 100%">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="emailAddress" label="邮箱地址" min-width="200" />
      <el-table-column prop="displayName" label="显示名称" min-width="150" />
      <el-table-column prop="protocol" label="协议" width="100">
        <template #default="scope">
          <el-tag size="small">{{ scope.row.protocol?.toUpperCase() }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="SSL" width="80">
        <template #default="scope">
          <el-icon v-if="scope.row.sslEnabled" color="#67C23A"
            ><Check
          /></el-icon>
          <el-icon v-else color="#F56C6C"><Close /></el-icon>
        </template>
      </el-table-column>
      <el-table-column label="默认" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.isDefault" type="success" size="small"
            >是</el-tag
          >
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="testAccount(scope.row)">
            <el-icon><Connection /></el-icon>
            测试
          </el-button>
          <el-button size="small" @click="editAccount(scope.row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="deleteAccount(scope.row)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑账户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑账户' : '添加账户'"
      width="650px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-form-item label="邮箱地址" prop="emailAddress">
              <el-input
                v-model="form.emailAddress"
                placeholder="example@email.com"
              />
            </el-form-item>
            <el-form-item label="显示名称" prop="displayName">
              <el-input v-model="form.displayName" placeholder="我的邮箱" />
            </el-form-item>
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="登录用户名" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="登录密码或授权码"
                show-password
              />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="服务器配置" name="server">
            <el-form-item label="协议" prop="protocol">
              <el-select v-model="form.protocol" placeholder="选择协议">
                <el-option label="IMAP" value="imap" />
                <el-option label="POP3" value="pop3" />
              </el-select>
            </el-form-item>
            <el-form-item label="SMTP主机" prop="smtpHost">
              <el-input
                v-model="form.smtpHost"
                placeholder="smtp.example.com"
              />
            </el-form-item>
            <el-form-item label="SMTP端口" prop="smtpPort">
              <el-input-number v-model="form.smtpPort" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="IMAP主机" prop="imapHost">
              <el-input
                v-model="form.imapHost"
                placeholder="imap.example.com"
              />
            </el-form-item>
            <el-form-item label="IMAP端口" prop="imapPort">
              <el-input-number v-model="form.imapPort" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="启用SSL">
              <el-switch v-model="form.sslEnabled" />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="其他设置" name="other">
            <el-form-item label="设为默认">
              <el-switch v-model="form.isDefault" />
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveAccount">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      style="display: none"
      :accept="importFileType === 'json' ? '.json' : '.csv'"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
} from "element-plus";
import {
  Delete,
} from "@element-plus/icons-vue";
import {
  importExportApi,
} from "../../api/email";
import { useEmailStore } from "../../stores/email";

const emailStore = useEmailStore();
const accounts = ref<EmailAccount[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const activeTab = ref("basic");
const formRef = ref<FormInstance>();
const fileInputRef = ref<HTMLInputElement>();
const importFileType = ref<"json" | "csv">("json");

const form = ref<EmailAccount>({
});

const rules: FormRules = {
  emailAddress: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
  ],
};

const filteredAccounts = computed(() => accounts.value);

const loadAccounts = async () => {
  loading.value = true;
  try {
    const res: any = await accountApi.getAccountList();
    if (res.success) {
      accounts.value = res.data || [];
      emailStore.setAccounts(accounts.value);
    }
  } catch (error) {
    ElMessage.error("加载账户列表失败");
  } finally {
    loading.value = false;
  }
};

const showAddDialog = () => {
  isEdit.value = false;
  activeTab.value = "basic";
  form.value = {
    emailAddress: "",
    displayName: "",
    smtpHost: "",
    smtpPort: 465,
    imapHost: "",
    imapPort: 993,
    username: "",
    password: "",
    protocol: "imap",
    sslEnabled: true,
    isDefault: false,
  };
  dialogVisible.value = true;
};

const editAccount = (row: EmailAccount) => {
  isEdit.value = true;
  activeTab.value = "basic";
  form.value = { ...row };
  dialogVisible.value = true;
};

const saveAccount = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true;
      try {
        if (isEdit.value && form.value.id) {
          await accountApi.updateAccount(form.value.id, form.value);
          ElMessage.success("账户更新成功");
        } else {
          await accountApi.addAccount(form.value);
          ElMessage.success("账户添加成功");
        }
        dialogVisible.value = false;
        loadAccounts();
      } catch (error: any) {
        ElMessage.error(error.message || "保存失败");
      } finally {
        saving.value = false;
      }
    }
  });
};

const deleteAccount = async (row: EmailAccount) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除账户 "${row.emailAddress}" 吗？`,
      "提示",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      },
    );
    if (row.id) {
      await accountApi.deleteAccount(row.id);
      ElMessage.success("账户删除成功");
      loadAccounts();
    }
  } catch (error) {
    // 用户取消
  }
};

const testAccount = async (row: EmailAccount) => {
  const loading = ElMessage({
    message: "正在测试连接...",
    type: "info",
    duration: 0,
  });

  try {
    const res: any = await accountApi.testConnection(row);
    loading.close();
    if (res.success) {
      ElMessage.success("连接测试成功");
    } else {
      ElMessage.error(res.message || "连接测试失败");
    }
  } catch (error: any) {
    loading.close();
    ElMessage.error(error.message || "连接测试失败");
  }
};

const handleExport = async (command: string) => {
  if (accounts.value.length === 0) {
    ElMessage.warning("没有可导出的账户");
    return;
  }

  try {
    const loading = ElMessage({
      message: "正在导出...",
      type: "info",
      duration: 0,
    });

    let blob: Blob;
    let filename: string;

    if (command === "json") {
      const res: any = await importExportApi.exportToJson(accounts.value);
      blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      filename = `email-accounts-${Date.now()}.json`;
    } else {
      const res: any = await importExportApi.exportToCsv(accounts.value);
      blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      filename = `email-accounts-${Date.now()}.csv`;
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);

    loading.close();
    ElMessage.success(`成功导出 ${accounts.value.length} 个账户`);
  } catch (error: any) {
    ElMessage.error(error.message || "导出失败");
  }
};

const handleImport = (command: string) => {
  importFileType.value = command as "json" | "csv";
  fileInputRef.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  const loading = ElMessage({
    message: "正在导入...",
    type: "info",
    duration: 0,
  });

  try {
    let res: any;
    if (importFileType.value === "json") {
      res = await importExportApi.importFromJson(file);
    } else {
      res = await importExportApi.importFromCsv(file);
    }

    loading.close();

    if (res.success) {
      ElMessage.success(res.message || "导入成功");
      loadAccounts();
    } else {
      ElMessage.error(res.message || "导入失败");
    }
  } catch (error: any) {
    loading.close();
    ElMessage.error(error.message || "导入失败");
  } finally {
    if (target) {
      target.value = "";
    }
  }
};

onMounted(() => {
  loadAccounts();
});
</script>

<style scoped>
.account-management {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar h2 {
  margin: 0;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-tabs__content) {
  padding-top: 20px;
}
</style>
