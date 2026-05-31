<template>
  <div class="space-y-6 p-6">
    <!-- 统计卡片 -->
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card class="shadow-sm rounded-xl" shadow="never">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-el-text-secondary">账号总数</div>
              <div class="text-2xl font-semibold text-el-text mt-1">{{ accounts.length }}</div>
            </div>
            <el-icon :size="32" color="var(--el-color-primary)"><User /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="shadow-sm rounded-xl" shadow="never">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-el-text-secondary">活跃邮箱</div>
              <div class="text-2xl font-semibold text-el-text mt-1">{{ tempEmails.length }}</div>
            </div>
            <el-icon :size="32" color="var(--el-color-primary)"><Message /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="shadow-sm rounded-xl" shadow="never">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-el-text-secondary">注册 SPI</div>
              <div class="text-2xl font-semibold text-el-text mt-1">{{ spiList.length }}</div>
            </div>
            <el-icon :size="32" color="var(--el-color-primary)"><Connection /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="shadow-sm rounded-xl" shadow="never">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-el-text-secondary">活跃账号</div>
              <div class="text-2xl font-semibold text-el-text mt-1">{{ activeCount }}</div>
            </div>
            <el-icon :size="32" color="var(--el-color-primary)"><CircleCheck /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作栏 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon class="mr-1"><Plus /></el-icon>
          添加账号
        </el-button>
        <el-button @click="showTempEmailDialog = true">
          <el-icon class="mr-1"><Message /></el-icon>
          创建临时邮箱
        </el-button>
        <el-button @click="showRegisterDialog = true">
          <el-icon class="mr-1"><Connection /></el-icon>
          自动注册
        </el-button>
      </div>
      <el-button @click="refreshAll">
        <el-icon class="mr-1"><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <!-- 账号列表 -->
    <el-card class="shadow-sm rounded-xl" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold text-el-text">账号列表</span>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索账号..."
            class="w-64"
            clearable
            :prefix-icon="Search"
          />
        </div>
      </template>
      <el-table :data="filteredAccounts" stripe class="w-full" v-loading="loading">
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.accountType === 'EMAIL' ? '' : 'info'" size="small">
              {{ row.accountType === 'EMAIL' ? '邮箱' : row.accountType === 'PHONE' ? '手机' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="statusTagType(row.status)"
              size="small"
            >
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registerSource" label="注册来源" width="120">
          <template #default="{ row }">
            <span v-if="row.registerSource" class="text-el-text-secondary text-sm">
              {{ row.registerSource }}
            </span>
            <span v-else class="text-el-text-secondary text-sm">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            <span class="text-el-text-secondary text-sm">{{ row.createTime || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-1">
              <el-button link type="primary" size="small" @click="viewAccount(row)">详情</el-button>
              <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
                <template #reference>
                  <el-button link type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 临时邮箱列表 -->
    <el-card v-if="tempEmails.length > 0" class="shadow-sm rounded-xl" shadow="never">
      <template #header>
        <span class="font-semibold text-el-text">临时邮箱 ({{ tempEmails.length }})</span>
      </template>
      <div class="space-y-3">
        <div
          v-for="item in tempEmails"
          :key="item.address"
          class="flex items-center justify-between p-3 rounded-lg border border-el-bg"
        >
          <div class="flex items-center gap-3">
            <el-icon :size="18" color="var(--el-color-primary)"><Message /></el-icon>
            <span class="text-el-text text-sm font-medium">{{ item.address }}</span>
            <el-tag size="small" round>{{ item.messageCount }} 封邮件</el-tag>
          </div>
          <div class="flex items-center gap-2">
            <el-button link size="small" @click="checkEmailMessages(item.address)">
              查看邮件
            </el-button>
            <el-button link type="danger" size="small" @click="removeTempEmail(item.address)">
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 创建账号对话框 -->
    <el-dialog v-model="showCreateDialog" title="添加账号" width="480px" :close-on-click-modal="false">
      <el-form :model="createForm" label-position="top">
        <el-form-item label="账号类型">
          <el-select v-model="createForm.accountType" class="w-full">
            <el-option label="邮箱账号" value="EMAIL" />
            <el-option label="普通账号" value="NORMAL" />
            <el-option label="手机号" value="PHONE" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="createForm.username" placeholder="请输入用户名..." />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="createForm.password" type="password" placeholder="请输入密码..." show-password />
        </el-form-item>
        <el-form-item label="邮箱地址">
          <el-input v-model="createForm.email" placeholder="请输入邮箱..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确认</el-button>
      </template>
    </el-dialog>

    <!-- 临时邮箱对话框 -->
    <el-dialog v-model="showTempEmailDialog" title="创建临时邮箱" width="520px">
      <div v-if="!latestTempEmail" class="flex items-center justify-center py-8">
        <el-button type="primary" @click="handleCreateTempEmail" :loading="tempEmailLoading">
          <el-icon class="mr-1"><Message /></el-icon>
          生成临时邮箱
        </el-button>
      </div>
      <div v-else class="space-y-4">
        <div class="flex items-center gap-2 p-4 rounded-lg bg-el-bg">
          <el-icon :size="20" color="var(--el-color-primary)"><Message /></el-icon>
          <span class="text-el-text font-mono text-base">{{ latestTempEmail }}</span>
          <el-button link size="small" @click="copyEmail">复制</el-button>
        </div>
        <div v-if="emailMessages.length > 0" class="space-y-2 max-h-64 overflow-auto">
          <div
            v-for="msg in emailMessages"
            :key="msg.id"
            class="p-3 rounded-lg border cursor-pointer hover:border-el-primary"
            @click="selectedMessage = msg"
          >
            <div class="text-el-text text-sm font-medium">{{ msg.title }}</div>
            <div class="text-el-text-secondary text-xs mt-1">{{ msg.to }}</div>
          </div>
        </div>
        <div v-else class="text-center text-el-text-secondary text-sm py-4">
          暂无邮件，等待收件...
        </div>
      </div>
      <template #footer>
        <el-button @click="showTempEmailDialog = false">关闭</el-button>
        <el-button @click="handleRefreshMessages" :loading="tempEmailLoading">刷新邮件</el-button>
      </template>
    </el-dialog>

    <!-- 自动注册对话框 -->
    <el-dialog v-model="showRegisterDialog" title="自动注册账号" width="560px" :close-on-click-modal="false">
      <el-form :model="registerForm" label-position="top">
        <el-form-item label="注册 SPI">
          <el-select v-model="registerForm.spi" class="w-full" placeholder="选择注册源...">
            <el-option
              v-for="spi in spiList"
              :key="spi.name"
              :label="`${spi.name}${spi.default ? ' (默认)' : ''}`"
              :value="spi.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱（留空自动生成）">
          <el-input v-model="registerForm.email" placeholder="自动生成临时邮箱..." />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="registerForm.username" placeholder="留空随机生成..." />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="registerForm.password" type="password" placeholder="留空随机生成..." show-password />
        </el-form-item>
        <el-form-item>
          <el-switch v-model="registerForm.headed" active-text="有头模式" inactive-text="无头模式" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegisterDialog = false">取消</el-button>
        <el-button type="primary" @click="handleRegister" :loading="registerLoading">
          开始注册
        </el-button>
      </template>
    </el-dialog>

    <!-- 注册结果 -->
    <el-dialog v-model="showRegisterResult" title="注册结果" width="480px">
      <el-result
        :icon="registerResult?.success ? 'success' : 'error'"
        :title="registerResult?.success ? '注册成功' : '注册失败'"
        :sub-title="registerResult?.message"
      >
        <template v-if="registerResult?.success" #extra>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="用户名">{{ registerResult.username }}</el-descriptions-item>
            <el-descriptions-item label="密码">{{ registerResult.password }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ registerResult.email }}</el-descriptions-item>
            <el-descriptions-item v-if="registerResult.verificationCode" label="验证码">
              {{ registerResult.verificationCode }}
            </el-descriptions-item>
          </el-descriptions>
        </template>
      </el-result>
      <template #footer>
        <el-button @click="showRegisterResult = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 邮件详情对话框 -->
    <el-dialog v-model="showMessageDetail" title="邮件详情" width="640px">
      <div v-if="selectedMessage" class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-el-text-secondary text-sm">{{ selectedMessage.to }}</span>
          <span class="text-el-text-secondary text-sm">{{ selectedMessage.id }}</span>
        </div>
        <div class="text-el-text font-semibold">{{ selectedMessage.title }}</div>
        <div class="p-4 rounded-lg bg-el-bg max-h-96 overflow-auto text-el-text text-sm" v-html="selectedMessage.content" />
      </div>
      <template #footer>
        <el-button @click="showMessageDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, shallowRef } from "vue";
import { ElMessage } from "element-plus";
import { Search, User, Message, Connection, CircleCheck, Plus, Refresh } from "@element-plus/icons-vue";
import {
  fetchAccountList, createAccount, deleteAccount,
  createTempEmail, getTempEmailMessages, deleteTempEmail,
  registerAccount, fetchRegisterSpiList,
  type AccountEntity, type TempEmailMessage,
  type RegisterResult, type SpiDescriptor
} from "./api";

const accounts = shallowRef<AccountEntity[]>([]);
const loading = ref(false);
const searchKeyword = ref("");

const showCreateDialog = ref(false);
const showTempEmailDialog = ref(false);
const showRegisterDialog = ref(false);
const showRegisterResult = ref(false);
const showMessageDetail = ref(false);

const createForm = ref({ accountType: "EMAIL", username: "", password: "", email: "" });
const registerForm = ref({ spi: "", email: "", username: "", password: "", headed: false });
const registerLoading = ref(false);
const registerResult = ref<RegisterResult | null>(null);

const tempEmails = ref<{ address: string; messageCount: number }[]>([]);
const latestTempEmail = ref("");
const emailMessages = ref<TempEmailMessage[]>([]);
const selectedMessage = ref<TempEmailMessage | null>(null);
const tempEmailLoading = ref(false);

const spiList = ref<SpiDescriptor[]>([]);

const activeCount = computed(() => accounts.value.filter(a => a.status === "ACTIVE").length);
const filteredAccounts = computed(() => {
  if (!searchKeyword.value) return accounts.value;
  const kw = searchKeyword.value.toLowerCase();
  return accounts.value.filter(a =>
    a.username?.toLowerCase().includes(kw) ||
    a.email?.toLowerCase().includes(kw) ||
    a.registerSource?.toLowerCase().includes(kw)
  );
});

function statusTagType(status: string) {
  return status === "ACTIVE" ? "success" : status === "REGISTERING" ? "warning" : status === "DISABLED" ? "info" : "danger";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "可用", DISABLED: "禁用", REGISTERING: "注册中", REGISTER_FAILED: "失败"
  };
  return map[status] || status;
}

async function refreshAll() {
  loading.value = true;
  try {
    const res = await fetchAccountList();
    accounts.value = res.data || [];
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  await createAccount(createForm.value);
  ElMessage.success("账号创建成功");
  showCreateDialog.value = false;
  createForm.value = { accountType: "EMAIL", username: "", password: "", email: "" };
  refreshAll();
}

async function handleDelete(id: string) {
  await deleteAccount(id);
  ElMessage.success("删除成功");
  refreshAll();
}

function viewAccount(row: AccountEntity) {
  ElMessage.info(`账号: ${row.username} / ${row.email}`);
}

async function handleCreateTempEmail() {
  tempEmailLoading.value = true;
  try {
    const res = await createTempEmail();
    latestTempEmail.value = res.data?.email || "";
    if (latestTempEmail.value) {
      tempEmails.value.push({ address: latestTempEmail.value, messageCount: 0 });
      ElMessage.success("临时邮箱创建成功");
    }
  } finally {
    tempEmailLoading.value = false;
  }
}

async function checkEmailMessages(email: string) {
  latestTempEmail.value = email;
  showTempEmailDialog.value = true;
  await handleRefreshMessages();
}

async function handleRefreshMessages() {
  if (!latestTempEmail.value) return;
  tempEmailLoading.value = true;
  try {
    const res = await getTempEmailMessages(latestTempEmail.value);
    emailMessages.value = res.data || [];
    const idx = tempEmails.value.findIndex(e => e.address === latestTempEmail.value);
    if (idx >= 0) tempEmails.value[idx].messageCount = emailMessages.value.length;
  } finally {
    tempEmailLoading.value = false;
  }
}

async function removeTempEmail(email: string) {
  await deleteTempEmail(email);
  tempEmails.value = tempEmails.value.filter(e => e.address !== email);
  if (latestTempEmail.value === email) {
    latestTempEmail.value = "";
    emailMessages.value = [];
  }
  ElMessage.success("已删除");
}

function copyEmail() {
  if (latestTempEmail.value) {
    navigator.clipboard.writeText(latestTempEmail.value);
    ElMessage.success("已复制到剪贴板");
  }
}

async function handleRegister() {
  registerLoading.value = true;
  try {
    const res = await registerAccount(registerForm.value);
    registerResult.value = res.data || null;
    showRegisterDialog.value = false;
    showRegisterResult.value = true;
    if (registerResult.value?.success) {
      ElMessage.success("注册成功！");
      refreshAll();
    }
  } catch {
    ElMessage.error("注册请求失败");
  } finally {
    registerLoading.value = false;
  }
}

onMounted(async () => {
  await refreshAll();
  try {
    const res = await fetchRegisterSpiList();
    spiList.value = res.data || [];
  } catch {
    // SPI 列表加载失败时静默处理
  }
});
</script>

<style scoped>
.el-card {
  border: 1px solid var(--el-border-color-lighter);
}
</style>