<template>
  <div class="account-page">
    <section class="hero">
      <div>
        <p class="eyebrow">Account workbench</p>
        <h1>账号管理</h1>
        <p class="lead">管理普通账号与邮箱账号，支持 Outlook Graph API 和 IMAP 协议。</p>
      </div>
      <div class="hero-actions">
        <el-button :icon="RefreshRight" @click="loadAll">刷新</el-button>
        <el-button :icon="Message" @click="openEmailManager">邮箱管理</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增账号</el-button>
      </div>
    </section>

    <section class="stats">
      <article v-for="item in stats" :key="item.label" class="stat">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.hint }}</small>
      </article>
    </section>

    <section class="content">
      <div class="panel panel--list">
        <div class="panel-head">
          <div>
            <h2>账号列表</h2>
            <p>支持搜索、编辑和删除。</p>
          </div>
          <div class="panel-actions">
            <el-input
              v-model="keyword"
              clearable
              class="search"
              placeholder="搜索用户名 / 邮箱 / 来源"
              @keyup.enter="applyFilter"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="statusFilter" clearable class="filter" placeholder="全部状态" @change="applyFilter">
              <el-option label="可用" value="ACTIVE" />
              <el-option label="已禁用" value="DISABLED" />
              <el-option label="注册中" value="REGISTERING" />
              <el-option label="注册失败" value="REGISTER_FAILED" />
              <el-option label="异常" value="ERROR" />
            </el-select>
            <el-button :icon="Search" @click="applyFilter">筛选</el-button>
            <el-button :icon="RefreshRight" @click="resetFilter">重置</el-button>
          </div>
        </div>

        <el-table v-loading="loading" :data="filteredAccounts" row-key="id" border class="table">
          <el-table-column label="账号" min-width="220">
            <template #default="{ row }">
              <div class="cell-main">
                <strong>{{ row.username || "-" }}</strong>
                <span>{{ row.emailAddress || row.email || "-" }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="110">
            <template #default="{ row }">
              <el-tag effect="plain" size="small">{{ accountTypeLabel(row.accountType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)" effect="plain" size="small">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="来源" min-width="120">
            <template #default="{ row }">
              <span>{{ row.registerSource || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="{ row }">{{ formatTime(row.updateTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" :icon="EditPen" @click="openEditDialog(row)">编辑</el-button>
              <el-button text type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
              <template v-if="row.accountType === 'OUTLOOK_GRAPH'">
                <el-button text type="warning" :icon="SwitchButton" :loading="outlookLoading[row.id]" @click="handleOutlookLogin(row)">登录</el-button>
                <el-button text type="success" :icon="CircleCheck" @click="handleOutlookStatus(row.id!)">状态</el-button>
                <el-button text type="info" :icon="Refresh" @click="handleOutlookSync(row.id!)">同步</el-button>
              </template>
              <template v-if="row.accountType === 'IMAP'">
                <el-button text type="warning" :icon="Connection" :loading="outlookLoading[row.id]" @click="handleTestConnection(row)">测试</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <aside class="panel panel--register">
        <div class="panel-head panel-head--stacked">
          <div>
            <h2>GitHub 注册</h2>
            <p>邮箱可留空，后端会按注册器能力处理。</p>
          </div>
          <div class="spi-tags">
            <el-tag
              v-for="spi in spis"
              :key="spi.name"
              :type="spi.name === registerForm.spi ? 'primary' : 'info'"
              effect="plain"
              size="small"
            >
              {{ spi.name }}
            </el-tag>
          </div>
        </div>

        <el-form label-position="top" :model="registerForm" class="register-form">
          <el-form-item label="注册 SPI">
            <el-select v-model="registerForm.spi" class="full-width">
              <el-option v-for="spi in spis" :key="spi.name" :label="spiLabel(spi)" :value="spi.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="registerForm.email" clearable placeholder="留空则自动创建" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="registerForm.username" clearable placeholder="GitHub 用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="registerForm.password" clearable show-password placeholder="登录密码" />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="registerForm.headed">无头模式</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button
              class="full-width"
              type="primary"
              :loading="registerLoading"
              :icon="Promotion"
              @click="handleRegisterGithub"
            >
              开始 GitHub 注册
            </el-button>
          </el-form-item>
        </el-form>

        <div v-if="registerResult" class="result-card">
          <div class="result-card__head">
            <strong>{{ registerResult.success ? "注册结果" : "处理结果" }}</strong>
            <el-tag :type="registerResult.success ? 'success' : 'warning'" size="small">
              {{ registerResult.success ? "成功" : "待处理" }}
            </el-tag>
          </div>
          <p>{{ registerResult.message || "-" }}</p>
          <dl>
            <div><dt>邮箱</dt><dd>{{ registerResult.email || "-" }}</dd></div>
            <div><dt>用户名</dt><dd>{{ registerResult.username || "-" }}</dd></div>
            <div><dt>密码</dt><dd>{{ registerResult.password || "-" }}</dd></div>
            <div><dt>验证码</dt><dd>{{ registerResult.verificationCode || "-" }}</dd></div>
          </dl>
        </div>
      </aside>

      <aside class="panel panel--outlook">
        <div class="panel-head">
          <div>
            <h2>邮箱连接测试</h2>
            <p>选择邮箱账号进行连接测试、登录、邮件同步。</p>
          </div>
        </div>

        <el-form label-position="top" :model="outlookForm" class="outlook-form">
          <el-form-item label="目标账号">
            <el-select v-model="outlookForm.accountId" class="full-width" placeholder="选择邮箱账号" @change="onOutlookAccountChange">
              <el-option
                v-for="acc in emailAccounts"
                :key="acc.id"
                :label="`${acc.emailAddress || acc.email || acc.username || acc.id} (${accountTypeLabel(acc.accountType)})`"
                :value="acc.id!"
              />
            </el-select>
          </el-form-item>

          <!-- Outlook Graph 专用 -->
          <template v-if="selectedEmailAccount?.accountType === 'OUTLOOK_GRAPH'">
            <el-form-item label="登录方式">
              <el-radio-group v-model="outlookForm.loginType" class="full-width">
                <el-radio value="ACCESS_TOKEN">Access Token</el-radio>
                <el-radio value="PASSWORD">密码</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="同步文件夹">
              <el-input v-model="outlookForm.folder" clearable placeholder="默认 INBOX" />
            </el-form-item>
            <el-form-item>
              <div class="outlook-actions">
                <el-button
                  type="primary"
                  :loading="outlookLoading[outlookForm.accountId]"
                  :icon="SwitchButton"
                  @click="handleOutlookLoginByForm"
                >
                  登录
                </el-button>
                <el-button
                  type="success"
                  :icon="CircleCheck"
                  :disabled="!outlookForm.accountId"
                  @click="handleOutlookStatus(outlookForm.accountId)"
                >
                  查询状态
                </el-button>
                <el-button
                  type="info"
                  :icon="Refresh"
                  :disabled="!outlookForm.accountId"
                  @click="handleOutlookSync(outlookForm.accountId)"
                >
                  同步邮件
                </el-button>
                <el-button
                  type="danger"
                  :icon="SwitchButton"
                  :disabled="!outlookForm.accountId"
                  @click="handleOutlookLogout(outlookForm.accountId)"
                >
                  登出
                </el-button>
              </div>
            </el-form-item>
          </template>

          <!-- IMAP 专用 -->
          <template v-if="selectedEmailAccount?.accountType === 'IMAP'">
            <el-form-item>
              <el-button
                class="full-width"
                type="primary"
                :loading="outlookLoading[outlookForm.accountId]"
                :icon="Connection"
                @click="handleTestConnectionByForm"
              >
                测试连接
              </el-button>
            </el-form-item>
          </template>
        </el-form>

        <div v-if="outlookResult" class="result-card">
          <div class="result-card__head">
            <strong>连接测试结果</strong>
            <el-tag :type="outlookResult.success ? 'success' : 'warning'" size="small">
              {{ outlookResult.success ? "成功" : "失败" }}
            </el-tag>
          </div>
          <p>{{ outlookResult.message || "-" }}</p>
          <dl v-if="outlookResult.data">
            <div v-if="outlookResult.data.email"><dt>邮箱</dt><dd>{{ outlookResult.data.email }}</dd></div>
            <div v-if="outlookResult.data.status"><dt>状态</dt><dd>{{ outlookResult.data.status }}</dd></div>
            <div v-if="outlookResult.data.folder"><dt>文件夹</dt><dd>{{ outlookResult.data.folder }}</dd></div>
            <div v-if="outlookResult.data.count !== undefined"><dt>邮件数</dt><dd>{{ outlookResult.data.count }}</dd></div>
            <div v-if="outlookResult.data.tokenExpiresIn"><dt>Token 过期</dt><dd>{{ outlookResult.data.tokenExpiresIn }}s</dd></div>
          </dl>
        </div>
      </aside>
    </section>

    <el-dialog v-model="accountDialogVisible" :title="dialogTitle" width="680px" destroy-on-close>
      <el-form :model="accountForm" label-position="top" class="account-form">
        <el-form-item label="账号类型" required>
          <el-select v-model="accountForm.accountType" class="full-width" @change="onAccountTypeChange">
            <el-option label="普通账号" value="NORMAL" />
            <el-option label="邮箱账号 · Outlook Graph" value="OUTLOOK_GRAPH" />
            <el-option label="邮箱账号 · IMAP" value="IMAP" />
          </el-select>
        </el-form-item>

        <!-- 通用字段 -->
        <div class="account-form__grid">
          <el-form-item label="用户名">
            <el-input v-model="accountForm.username" clearable />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="accountForm.password" clearable show-password />
          </el-form-item>
        </div>

        <!-- 邮箱账号：邮箱地址 -->
        <el-form-item v-if="isEmailType" label="邮箱地址">
          <el-input v-model="accountForm.emailAddress" clearable placeholder="user@example.com" />
        </el-form-item>

        <!-- 普通账号：注册平台 + 注册地址 -->
        <template v-if="accountForm.accountType === 'NORMAL'">
          <el-form-item label="注册平台">
            <el-select v-model="accountForm.registerSource" class="full-width" placeholder="选择注册平台">
              <el-option v-for="spi in spis" :key="spi.name" :label="spiLabel(spi)" :value="spi.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="注册地址">
            <el-input v-model="accountForm.registrationUrl" clearable />
          </el-form-item>
        </template>

        <!-- Outlook Graph：Azure AD 字段 -->
        <template v-if="accountForm.accountType === 'OUTLOOK_GRAPH'">
          <div class="account-form__grid">
            <el-form-item label="Client ID (Azure AD)">
              <el-input v-model="accountForm.clientId" clearable placeholder="Application Client ID" />
            </el-form-item>
            <el-form-item label="Tenant ID (Azure AD)">
              <el-input v-model="accountForm.tenantId" clearable placeholder="Directory Tenant ID" />
            </el-form-item>
          </div>
        </template>

        <!-- IMAP：服务器配置 -->
        <template v-if="accountForm.accountType === 'IMAP'">
          <div class="account-form__grid">
            <el-form-item label="IMAP 服务器">
              <el-input v-model="accountForm.imapHost" clearable placeholder="imap.example.com" />
            </el-form-item>
            <el-form-item label="IMAP 端口">
              <el-input-number v-model="accountForm.imapPort" :min="1" :max="65535" class="full-width" placeholder="993" />
            </el-form-item>
          </div>
          <div class="account-form__grid">
            <el-form-item label="SMTP 服务器">
              <el-input v-model="accountForm.smtpHost" clearable placeholder="smtp.example.com" />
            </el-form-item>
            <el-form-item label="SMTP 端口">
              <el-input-number v-model="accountForm.smtpPort" :min="1" :max="65535" class="full-width" placeholder="587" />
            </el-form-item>
          </div>
          <el-form-item>
            <el-checkbox v-model="accountForm.sslEnabled">启用 SSL</el-checkbox>
          </el-form-item>
        </template>

        <!-- 通用：状态 -->
        <el-form-item label="状态">
          <el-select v-model="accountForm.status" class="full-width">
            <el-option label="可用" value="ACTIVE" />
            <el-option label="已禁用" value="DISABLED" />
            <el-option label="注册中" value="REGISTERING" />
            <el-option label="注册失败" value="REGISTER_FAILED" />
            <el-option label="异常" value="ERROR" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveAccount">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { CircleCheck, Connection, Delete, EditPen, Message, Plus, Promotion, Refresh, RefreshRight, Search, SwitchButton } from "@element-plus/icons-vue";
import {
  createAccount,
  deleteAccount,
  fetchAccountList,
  fetchAccountRegisterSpis,
  outlookLogin,
  outlookLogout,
  outlookStatus,
  outlookSync,
  registerGithubAccount,
  testAccountConnection,
  updateAccount,
} from "../../api/account";
import type { AccountEntity, AccountRegisterResult, AccountRegisterSpiDescriptor, AccountStatus, AccountType, OutlookLoginType } from "../../api/types";

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const registerLoading = ref(false);
const keyword = ref("");
const statusFilter = ref<AccountStatus | "">("");
const spis = ref<AccountRegisterSpiDescriptor[]>([]);
const accounts = ref<AccountEntity[]>([]);
const registerResult = ref<AccountRegisterResult | null>(null);
const accountDialogVisible = ref(false);
const editId = ref("");

const accountForm = reactive<AccountEntity>({
  accountType: "NORMAL",
  username: "",
  password: "",
  emailAddress: "",
  status: "ACTIVE",
  registerSource: "",
  registrationUrl: "",
  clientId: "",
  tenantId: "",
  imapHost: "",
  imapPort: undefined,
  smtpHost: "",
  smtpPort: undefined,
  sslEnabled: false,
});

const registerForm = reactive({
  spi: "github",
  email: "",
  username: "",
  password: "",
  headed: false,
});

// 邮箱账号（Outlook + IMAP）
const emailAccounts = computed(() =>
  accounts.value.filter((item) => item.accountType === "OUTLOOK_GRAPH" || item.accountType === "IMAP")
);
const selectedEmailAccount = computed(() =>
  emailAccounts.value.find((acc) => acc.id === outlookForm.accountId) || null
);
const isEmailType = computed(() =>
  accountForm.accountType === "OUTLOOK_GRAPH" || accountForm.accountType === "IMAP"
);
const outlookLoading = reactive<Record<string, boolean>>({});
const outlookResult = ref<{ success: boolean; message?: string; data?: Record<string, unknown> } | null>(null);
const outlookForm = reactive({
  accountId: "",
  loginType: "ACCESS_TOKEN" as OutlookLoginType,
  folder: "INBOX",
});

const stats = computed(() => {
  const total = accounts.value.length;
  const normal = accounts.value.filter((item) => item.accountType === "NORMAL").length;
  const email = accounts.value.filter((item) => item.accountType === "OUTLOOK_GRAPH" || item.accountType === "IMAP").length;
  const active = accounts.value.filter((item) => item.status === "ACTIVE").length;
  return [
    { label: "账号总数", value: total, hint: "普通 + 邮箱账号" },
    { label: "普通账号", value: normal, hint: "类型为 NORMAL 的记录" },
    { label: "邮箱账号", value: email, hint: "Outlook / IMAP" },
    { label: "可用账号", value: active, hint: "状态为 ACTIVE 的记录" },
  ];
});

const filteredAccounts = computed(() => {
  const key = keyword.value.trim().toLowerCase();
  return [...accounts.value]
    .filter((item) => {
      if (statusFilter.value && item.status !== statusFilter.value) return false;
      if (!key) return true;
      return [item.username, item.emailAddress, item.email, item.registerSource, item.registrationUrl]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(key));
    })
    .sort((a, b) => (b.updateTime || "").localeCompare(a.updateTime || ""));
});

const dialogTitle = computed(() => (editId.value ? "编辑账号" : "新增账号"));

function accountTypeLabel(type?: AccountType) {
  const map: Record<string, string> = { NORMAL: "普通账号", OUTLOOK_GRAPH: "邮箱账号 · Outlook", IMAP: "邮箱账号 · IMAP" };
  return map[type || ""] || type || "-";
}

function statusLabel(status?: AccountStatus) {
  return { ACTIVE: "可用", DISABLED: "已禁用", REGISTERING: "注册中", REGISTER_FAILED: "注册失败", ERROR: "异常" }[status || ""] || status || "-";
}

function statusTag(status?: AccountStatus) {
  return { ACTIVE: "success", DISABLED: "info", REGISTERING: "warning", REGISTER_FAILED: "danger", ERROR: "danger" }[status || ""] || "info";
}

function formatTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}`;
}

function spiLabel(spi: AccountRegisterSpiDescriptor) {
  return spi.default ? `${spi.name} (默认)` : spi.name;
}

function resetAccountForm() {
  editId.value = "";
  accountForm.accountType = "NORMAL";
  accountForm.username = "";
  accountForm.password = "";
  accountForm.emailAddress = "";
  accountForm.status = "ACTIVE";
  accountForm.registerSource = "";
  accountForm.registrationUrl = "";
  accountForm.clientId = "";
  accountForm.tenantId = "";
  accountForm.imapHost = "";
  accountForm.imapPort = undefined;
  accountForm.smtpHost = "";
  accountForm.smtpPort = undefined;
  accountForm.sslEnabled = false;
  registerResult.value = null;
}

function onAccountTypeChange() {
  // 切换类型时清空不相关字段
  if (accountForm.accountType === "NORMAL") {
    accountForm.emailAddress = "";
    accountForm.clientId = "";
    accountForm.tenantId = "";
    accountForm.imapHost = "";
    accountForm.imapPort = undefined;
    accountForm.smtpHost = "";
    accountForm.smtpPort = undefined;
    accountForm.sslEnabled = false;
  } else if (accountForm.accountType === "OUTLOOK_GRAPH") {
    accountForm.registerSource = "";
    accountForm.registrationUrl = "";
    accountForm.imapHost = "";
    accountForm.imapPort = undefined;
    accountForm.smtpHost = "";
    accountForm.smtpPort = undefined;
    accountForm.sslEnabled = false;
  } else if (accountForm.accountType === "IMAP") {
    accountForm.registerSource = "";
    accountForm.registrationUrl = "";
    accountForm.clientId = "";
    accountForm.tenantId = "";
  }
}

function openCreateDialog() {
  resetAccountForm();
  loadRegisterSpis();
  accountDialogVisible.value = true;
}

function openEditDialog(row: AccountEntity) {
  editId.value = row.id || "";
  accountForm.accountType = row.accountType || "NORMAL";
  accountForm.username = row.username || "";
  accountForm.password = row.password || "";
  accountForm.emailAddress = row.emailAddress || row.email || "";
  accountForm.status = row.status || "ACTIVE";
  accountForm.registerSource = row.registerSource || "";
  accountForm.registrationUrl = row.registrationUrl || "";
  accountForm.clientId = row.clientId || "";
  accountForm.tenantId = row.tenantId || "";
  accountForm.imapHost = row.imapHost || "";
  accountForm.imapPort = row.imapPort;
  accountForm.smtpHost = row.smtpHost || "";
  accountForm.smtpPort = row.smtpPort;
  accountForm.sslEnabled = row.sslEnabled ?? false;
  accountDialogVisible.value = true;
}

async function loadAccounts() {
  loading.value = true;
  try {
    const res = await fetchAccountList({ page: 1, size: 200 });
    const data = res.data;
    // 后端返回分页对象 IPage，取 records 字段；兼容旧数组格式
    accounts.value = Array.isArray(data) ? data : (data as any)?.records || [];
  } catch (error) {
    console.error(error);
    ElMessage.error("加载账号列表失败");
  } finally {
    loading.value = false;
  }
}

async function loadRegisterSpis() {
  try {
    const res = await fetchAccountRegisterSpis();
    spis.value = res.data || [];
    if (spis.value.length) {
      const github = spis.value.find((item) => [item.name, ...(item.aliases || [])].some((value) => String(value).toLowerCase() === "github"));
      registerForm.spi = github?.name || spis.value[0].name;
    }
  } catch (error) {
    console.error(error);
  }
}

async function saveAccount() {
  saving.value = true;
  try {
    const payload: AccountEntity = {
      ...accountForm,
      username: accountForm.username || undefined,
      password: accountForm.password || undefined,
      emailAddress: accountForm.emailAddress || undefined,
      registerSource: accountForm.registerSource || undefined,
      registrationUrl: accountForm.registrationUrl || undefined,
      clientId: accountForm.clientId || undefined,
      tenantId: accountForm.tenantId || undefined,
      imapHost: accountForm.imapHost || undefined,
      imapPort: accountForm.imapPort ?? undefined,
      smtpHost: accountForm.smtpHost || undefined,
      smtpPort: accountForm.smtpPort ?? undefined,
      sslEnabled: accountForm.sslEnabled || undefined,
    };
    const res = editId.value ? await updateAccount(editId.value, payload) : await createAccount(payload);
    if (res.success) {
      ElMessage.success(editId.value ? "账号已更新" : "账号已创建");
      accountDialogVisible.value = false;
      await loadAccounts();
    } else {
      ElMessage.error(res.message || "保存失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("保存账号失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: AccountEntity) {
  if (!row.id) return;
  try {
    await ElMessageBox.confirm(`确认删除账号 ${row.username || row.emailAddress || row.email || row.id}？`, "删除确认", { type: "warning" });
    const res = await deleteAccount(row.id);
    if (res.success) {
      ElMessage.success("账号已删除");
      await loadAccounts();
    } else {
      ElMessage.error(res.message || "删除失败");
    }
  } catch {
    // noop
  }
}

async function handleRegisterGithub() {
  registerLoading.value = true;
  try {
    const res = await registerGithubAccount({
      spi: registerForm.spi || "github",
      email: registerForm.email || undefined,
      username: registerForm.username || undefined,
      password: registerForm.password || undefined,
      headed: !registerForm.headed,
      accountType: "EMAIL",
    });
    registerResult.value = res.data || null;
    if (res.success) {
      ElMessage.success(res.message || "已发起 GitHub 注册");
      await loadAccounts();
    } else {
      ElMessage.warning(res.message || "注册流程返回未完成");
      await loadAccounts();
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("GitHub 注册失败");
  } finally {
    registerLoading.value = false;
  }
}

// ==================== Outlook 操作 ====================

function onOutlookAccountChange(_id: string) {
  outlookResult.value = null;
}

async function handleOutlookLogin(row: AccountEntity) {
  if (!row.id) return;
  outlookLoading[row.id] = true;
  try {
    const res = await outlookLogin({ accountId: row.id, loginType: "ACCESS_TOKEN" });
    outlookResult.value = { success: res.success, message: res.message, data: res.data as unknown as Record<string, unknown> };
    if (res.success) {
      ElMessage.success(`Outlook 登录成功: ${row.emailAddress || row.email}`);
    } else {
      ElMessage.warning(res.message || "登录失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("Outlook 登录异常");
  } finally {
    outlookLoading[row.id] = false;
  }
}

async function handleOutlookLoginByForm() {
  if (!outlookForm.accountId) {
    ElMessage.warning("请先选择目标账号");
    return;
  }
  outlookLoading[outlookForm.accountId] = true;
  try {
    const res = await outlookLogin({
      accountId: outlookForm.accountId,
      loginType: outlookForm.loginType,
    });
    outlookResult.value = { success: res.success, message: res.message, data: res.data as unknown as Record<string, unknown> };
    if (res.success) {
      ElMessage.success("Outlook 登录成功");
    } else {
      ElMessage.warning(res.message || "登录失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("Outlook 登录异常");
  } finally {
    outlookLoading[outlookForm.accountId] = false;
  }
}

async function handleOutlookStatus(accountId: string) {
  try {
    const res = await outlookStatus(accountId);
    outlookResult.value = { success: res.success, message: res.message, data: res.data as unknown as Record<string, unknown> };
    ElMessage.info(`Outlook 状态: ${res.data?.status || "未知"}`);
  } catch (error) {
    console.error(error);
    ElMessage.error("查询 Outlook 状态失败");
  }
}

async function handleOutlookSync(accountId: string) {
  try {
    const folder = outlookForm.folder || "INBOX";
    const res = await outlookSync(accountId, folder);
    outlookResult.value = { success: res.success, message: res.message, data: res.data as unknown as Record<string, unknown> };
    if (res.success) {
      ElMessage.success(`同步完成: ${res.data?.count || 0} 封邮件`);
    } else {
      ElMessage.warning(res.message || "同步失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("Outlook 同步失败");
  }
}

async function handleOutlookLogout(accountId: string) {
  try {
    const res = await outlookLogout(accountId);
    outlookResult.value = { success: res.success, message: res.message };
    if (res.success) {
      ElMessage.success("已登出");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("Outlook 登出失败");
  }
}

// ==================== IMAP 连接测试 ====================

async function handleTestConnection(row: AccountEntity) {
  if (!row.id) return;
  outlookLoading[row.id] = true;
  try {
    const res = await testAccountConnection(row);
    outlookResult.value = { success: res.success, message: res.message, data: res.data as unknown as Record<string, unknown> };
    if (res.success) {
      ElMessage.success(`IMAP 连接测试成功: ${row.emailAddress || row.email}`);
    } else {
      ElMessage.warning(res.message || "连接测试失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("IMAP 连接测试异常");
  } finally {
    outlookLoading[row.id] = false;
  }
}

async function handleTestConnectionByForm() {
  if (!outlookForm.accountId || !selectedEmailAccount.value) {
    ElMessage.warning("请先选择邮箱账号");
    return;
  }
  outlookLoading[outlookForm.accountId] = true;
  try {
    const res = await testAccountConnection(selectedEmailAccount.value);
    outlookResult.value = { success: res.success, message: res.message, data: res.data as unknown as Record<string, unknown> };
    if (res.success) {
      ElMessage.success("IMAP 连接测试成功");
    } else {
      ElMessage.warning(res.message || "连接测试失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("IMAP 连接测试异常");
  } finally {
    outlookLoading[outlookForm.accountId] = false;
  }
}

function applyFilter() {}

function resetFilter() {
  keyword.value = "";
  statusFilter.value = "";
}

function openEmailManager() {
  router.push("/email");
}

async function loadAll() {
  await Promise.all([loadAccounts(), loadRegisterSpis()]);
}

onMounted(loadAll);
</script>

<style scoped>
/* ===== Design Tokens ===== */
.account-page {
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-hover: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;
  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-accent: #6366f1;
  --color-accent-hover: #4f46e5;
  --color-accent-soft: #eef2ff;
  --color-success: #10b981;
  --color-success-soft: #ecfdf5;
  --color-warning: #f59e0b;
  --color-warning-soft: #fffbeb;
  --color-danger: #ef4444;
  --color-danger-soft: #fef2f2;
  --color-info: #3b82f6;
  --radius-sm: 10px;
  --radius: 14px;
  --radius-lg: 20px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.04);
  --shadow: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
  --shadow-md: 0 4px 6px rgba(0,0,0,.05), 0 2px 4px rgba(0,0,0,.04);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,.06), 0 4px 6px rgba(0,0,0,.04);
  --transition: 200ms cubic-bezier(.4,0,.2,1);
  display: grid;
  gap: 20px;
  padding: 4px;
}

/* ===== Hero ===== */
.hero {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 24px;
  padding: 28px 32px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(99,102,241,.3);
}
.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 60%, rgba(255,255,255,.08) 0%, transparent 50%);
  pointer-events: none;
}
.hero::after {
  content: "";
  position: absolute;
  right: -60px;
  top: -40px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(255,255,255,.06);
  pointer-events: none;
}
.eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: .75;
  font-weight: 600;
}
.hero h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -.01em;
}
.lead {
  margin: 10px 0 0;
  opacity: .85;
  line-height: 1.7;
  font-size: 14px;
}
.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  position: relative;
  z-index: 1;
}
.hero-actions :deep(.el-button) {
  border-radius: var(--radius-sm);
  font-weight: 500;
}
.hero-actions :deep(.el-button:not(.el-button--primary)) {
  background: rgba(255,255,255,.18);
  border-color: rgba(255,255,255,.25);
  color: #fff;
  backdrop-filter: blur(8px);
}
.hero-actions :deep(.el-button:not(.el-button--primary):hover) {
  background: rgba(255,255,255,.28);
  border-color: rgba(255,255,255,.35);
}
.hero-actions :deep(.el-button--primary) {
  background: #fff;
  border-color: #fff;
  color: #6366f1;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,.12);
}
.hero-actions :deep(.el-button--primary:hover) {
  background: #f8fafc;
  box-shadow: 0 4px 12px rgba(0,0,0,.16);
}

/* ===== Stats ===== */
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.stat {
  padding: 20px 24px;
  border-radius: var(--radius);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition), transform var(--transition);
  position: relative;
  overflow: hidden;
}
.stat:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.stat::after {
  content: "";
  position: absolute;
  right: -16px;
  bottom: -16px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  opacity: .05;
  transition: opacity var(--transition), transform var(--transition);
}
.stat:nth-child(1)::after { background: var(--color-accent); }
.stat:nth-child(2)::after { background: var(--color-success); }
.stat:nth-child(3)::after { background: var(--color-warning); }
.stat:nth-child(4)::after { background: var(--color-danger); }
.stat:hover::after { opacity: .1; transform: scale(1.1); }
.stat span {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: .5px;
}
.stat strong {
  display: block;
  margin-top: 8px;
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -.02em;
  line-height: 1;
}
.stat small {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

/* ===== Content Layout ===== */
.content {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(340px, .95fr);
  gap: 20px;
  align-items: start;
}

/* ===== Panel Base ===== */
.panel {
  border-radius: var(--radius);
  padding: 20px 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}
.panel--list { min-width: 0; }
.panel--register, .panel--outlook {
  display: grid;
  gap: 16px;
}

/* ===== Panel Head ===== */
.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-light);
}
.panel-head--stacked { align-items: start; }
.panel-head h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -.01em;
}
.panel-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
.panel-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* ===== Search & Filter ===== */
.search { width: 240px; }
.search :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid var(--color-border);
  transition: border-color var(--transition), box-shadow var(--transition);
}
.search :deep(.el-input__wrapper:hover) { border-color: var(--color-accent); }
.search :deep(.el-input__wrapper.is-focus) {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(99,102,241,.12);
}
.filter { width: 132px; }
.filter :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid var(--color-border);
}

/* ===== Table ===== */
.table :deep(.el-table__header th) {
  background: var(--color-bg);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--color-text-secondary);
  border-bottom: 2px solid var(--color-border);
  padding: 12px 0;
}
.table :deep(.el-table__body tr) {
  transition: background var(--transition);
}
.table :deep(.el-table__body tr:hover > td) {
  background: rgba(99,102,241,.03);
}
.table :deep(.el-table__body td) {
  padding: 12px 0;
  border-bottom-color: var(--color-border-light);
}
.table :deep(.el-table__body tr:last-child td) {
  border-bottom: none;
}
.table :deep(.el-table--border) {
  border-color: var(--color-border);
}
.cell-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.cell-main strong {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}
.cell-main span {
  color: var(--color-text-muted);
  font-size: 12px;
}
/* table button overrides */
.table :deep(.el-button--text) {
  font-weight: 500;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all var(--transition);
}
.table :deep(.el-button--text:hover) {
  background: var(--color-surface-hover);
}

/* ===== Form ===== */
.full-width { width: 100%; }
.register-form, .outlook-form {
  display: grid;
  gap: 2px;
}
:deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 12px;
  color: var(--color-text-secondary);
  padding-bottom: 2px;
}
:deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none;
  border: 1px solid var(--color-border);
}
:deep(.el-input__wrapper:hover) {
  border-color: var(--color-accent);
}
:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}
:deep(.el-radio-group) {
  display: flex;
  gap: 12px;
}
:deep(.el-radio__label) {
  font-size: 13px;
  font-weight: 500;
}

/* ===== SPI Tags ===== */
.spi-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* ===== Result Card ===== */
.result-card {
  padding: 16px;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  animation: fadeSlideIn .25s ease-out;
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.result-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}
.result-card__head strong {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
}
.result-card p {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}
.result-card dl {
  display: grid;
  gap: 8px;
  margin: 0;
}
.result-card dl div {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 12px;
  align-items: start;
}
.result-card dt {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  padding-top: 1px;
}
.result-card dd {
  margin: 0;
  font-size: 13px;
  color: var(--color-text);
  word-break: break-all;
  font-family: "SF Mono", "Fira Code", monospace;
  font-size: 12px;
}

/* ===== Outline Actions ===== */
.outlook-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.outlook-actions :deep(.el-button) {
  font-weight: 500;
  border-radius: 8px;
  transition: all var(--transition);
}

/* ===== Dialog / Account Form ===== */
:deep(.el-dialog) {
  border-radius: var(--radius-lg);
  overflow: hidden;
}
:deep(.el-dialog__header) {
  padding: 20px 24px 0;
  font-weight: 700;
  font-size: 18px;
  color: var(--color-text);
}
:deep(.el-dialog__body) {
  padding: 16px 24px 8px;
}
:deep(.el-dialog__footer) {
  padding: 12px 24px 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.account-form { margin-top: 2px; }
.account-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
:deep(.el-dialog .el-input__wrapper),
:deep(.el-dialog .el-select .el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid var(--color-border);
  box-shadow: none;
}
:deep(.el-dialog .el-button) {
  border-radius: 8px;
  font-weight: 500;
}
:deep(.el-dialog .el-button--primary) {
  background: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: 0 1px 3px rgba(99,102,241,.3);
}
:deep(.el-dialog .el-button--primary:hover) {
  background: var(--color-accent-hover);
}

/* ===== Buttons Global ===== */
:deep(.el-button--primary) {
  background: var(--color-accent);
  border-color: var(--color-accent);
}
:deep(.el-button--primary:hover) {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}
:deep(.el-button) {
  border-radius: 8px;
  transition: all var(--transition);
}

/* ===== Empty State ===== */
:deep(.el-table__empty-block) {
  padding: 48px 0;
}
:deep(.el-table__empty-text) {
  color: var(--color-text-muted);
  font-size: 14px;
}

/* ===== Scrollbar ===== */
.table :deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}
.table :deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background: var(--color-border);
  border-radius: 3px;
}
.table :deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: transparent;
}

/* ===== Responsive ===== */
@media (max-width: 1400px) {
  .content { grid-template-columns: minmax(0, 1.2fr) minmax(320px, .95fr); }
}
@media (max-width: 1200px) {
  .content, .stats { grid-template-columns: 1fr; }
  .outlook-actions { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 900px) {
  .hero {
    flex-direction: column;
    align-items: start;
    padding: 20px 22px;
  }
  .hero h1 { font-size: 22px; }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .panel-head { flex-direction: column; align-items: start; }
  .search, .filter { width: 100%; }
  .panel-actions { width: 100%; justify-content: stretch; }
  .panel-actions > * { flex: 1; }
  .account-form__grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .stats { grid-template-columns: 1fr; }
  .outlook-actions { grid-template-columns: 1fr; }
  .hero-actions { width: 100%; }
  .hero-actions .el-button { flex: 1; }
}
</style>
