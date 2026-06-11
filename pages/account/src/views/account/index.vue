<template>
  <div class="account-page">
    <section class="hero">
      <div>
        <p class="eyebrow">Account workbench</p>
        <h1>账号管理</h1>
        <p class="lead">维护账号档案，发起 GitHub 注册，查看注册状态。</p>
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
                <span>{{ row.email || "-" }}</span>
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
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" :icon="EditPen" @click="openEditDialog(row)">编辑</el-button>
              <el-button text type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
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
    </section>

    <el-dialog v-model="accountDialogVisible" :title="dialogTitle" width="640px" destroy-on-close>
      <el-form :model="accountForm" label-position="top" class="account-form">
        <el-form-item label="注册平台">
          <el-select v-model="accountForm.registerSource" class="full-width" placeholder="选择注册平台">
            <el-option v-for="spi in spis" :key="spi.name" :label="spiLabel(spi)" :value="spi.name" />
          </el-select>
        </el-form-item>
        <div class="account-form__grid">
          <el-form-item label="用户名">
            <el-input v-model="accountForm.username" clearable />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="accountForm.password" clearable show-password />
          </el-form-item>
        </div>
        <div class="account-form__grid">
          <el-form-item label="邮箱">
            <el-input v-model="accountForm.email" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="accountForm.status" class="full-width">
              <el-option label="可用" value="ACTIVE" />
              <el-option label="已禁用" value="DISABLED" />
              <el-option label="注册中" value="REGISTERING" />
              <el-option label="注册失败" value="REGISTER_FAILED" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="注册地址">
          <el-input v-model="accountForm.registrationUrl" clearable />
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
import { Delete, EditPen, Message, Plus, Promotion, RefreshRight, Search } from "@element-plus/icons-vue";
import {
  createAccount,
  deleteAccount,
  fetchAccountList,
  fetchAccountRegisterSpis,
  registerGithubAccount,
  updateAccount,
} from "../../api/account";
import type { AccountEntity, AccountRegisterResult, AccountRegisterSpiDescriptor, AccountStatus, AccountType } from "../../api/types";

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
  accountType: "EMAIL",
  username: "",
  password: "",
  email: "",
  status: "ACTIVE",
  registerSource: "",
  registrationUrl: "",
});

const registerForm = reactive({
  spi: "github",
  email: "",
  username: "",
  password: "",
  headed: false,
});

const stats = computed(() => {
  const total = accounts.value.length;
  const active = accounts.value.filter((item) => item.status === "ACTIVE").length;
  const registering = accounts.value.filter((item) => item.status === "REGISTERING").length;
  const failed = accounts.value.filter((item) => item.status === "REGISTER_FAILED").length;
  return [
    { label: "账号总数", value: total, hint: "当前本地账号记录数" },
    { label: "可用账号", value: active, hint: "状态为 ACTIVE 的记录" },
    { label: "注册中", value: registering, hint: "正在发起或等待验证" },
    { label: "注册失败", value: failed, hint: "需要重新处理的账号" },
  ];
});

const filteredAccounts = computed(() => {
  const key = keyword.value.trim().toLowerCase();
  return [...accounts.value]
    .filter((item) => {
      if (statusFilter.value && item.status !== statusFilter.value) return false;
      if (!key) return true;
      return [item.username, item.email, item.registerSource, item.registrationUrl]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(key));
    })
    .sort((a, b) => (b.updateTime || "").localeCompare(a.updateTime || ""));
});

const dialogTitle = computed(() => (editId.value ? "编辑账号" : "新增账号"));

function accountTypeLabel(type?: AccountType) {
  return { EMAIL: "邮箱", NORMAL: "普通", PHONE: "手机号" }[type || ""] || type || "-";
}

function statusLabel(status?: AccountStatus) {
  return { ACTIVE: "可用", DISABLED: "已禁用", REGISTERING: "注册中", REGISTER_FAILED: "注册失败" }[status || ""] || status || "-";
}

function statusTag(status?: AccountStatus) {
  return { ACTIVE: "success", DISABLED: "info", REGISTERING: "warning", REGISTER_FAILED: "danger" }[status || ""] || "info";
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
  accountForm.accountType = undefined;
  accountForm.username = "";
  accountForm.password = "";
  accountForm.email = "";
  accountForm.status = "ACTIVE";
  accountForm.registerSource = "";
  accountForm.registrationUrl = "";
  registerResult.value = null;
}

function openCreateDialog() {
  resetAccountForm();
  loadRegisterSpis();
  accountDialogVisible.value = true;
}

function openEditDialog(row: AccountEntity) {
  editId.value = row.id || "";
  accountForm.accountType = row.accountType || "EMAIL";
  accountForm.username = row.username || "";
  accountForm.password = row.password || "";
  accountForm.email = row.email || "";
  accountForm.status = row.status || "ACTIVE";
  accountForm.registerSource = row.registerSource || "";
  accountForm.registrationUrl = row.registrationUrl || "";
  accountDialogVisible.value = true;
}

async function loadAccounts() {
  loading.value = true;
  try {
    const res = await fetchAccountList();
    accounts.value = res.data || [];
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
      email: accountForm.email || undefined,
      registerSource: accountForm.registerSource || undefined,
      registrationUrl: accountForm.registrationUrl || undefined,
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
    await ElMessageBox.confirm(`确认删除账号 ${row.username || row.email || row.id}？`, "删除确认", { type: "warning" });
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
.account-page { display: grid; gap: 16px; }
.hero, .panel, .stat, .result-card { border: 1px solid rgba(148,163,184,.22); background: rgba(255,255,255,.88); backdrop-filter: blur(10px); box-shadow: 0 1px 2px rgba(15,23,42,.04); }
.hero { display:flex; justify-content:space-between; gap:20px; align-items:end; padding:20px 22px; border-radius:18px; }
.eyebrow { margin:0 0 8px; color:#64748b; font-size:12px; text-transform:uppercase; }
.hero h1 { margin:0; font-size:24px; line-height:1.15; color:#0f172a; }
.lead, .panel-head p { margin:8px 0 0; color:#64748b; line-height:1.7; }
.hero-actions { display:flex; gap:8px; flex-wrap:wrap; }
.stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
.stat { padding:16px; border-radius:16px; }
.stat span, .stat small { display:block; color:#64748b; }
.stat strong { display:block; margin-top:8px; font-size:28px; color:#0f172a; }
.stat small { margin-top:8px; color:#94a3b8; line-height:1.6; }
.content { display:grid; grid-template-columns:minmax(0,1.4fr) minmax(340px,.95fr); gap:16px; align-items:start; }
.panel { border-radius:18px; padding:16px; }
.panel--list { min-width:0; }
.panel--register { display:grid; gap:14px; }
.panel-head { display:flex; justify-content:space-between; gap:16px; align-items:center; margin-bottom:14px; }
.panel-head--stacked { align-items:start; }
.panel-head h2 { margin:0; font-size:18px; color:#0f172a; }
.panel-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
.search { width:240px; }
.filter { width:132px; }
.table :deep(th) { background: rgba(248,250,252,.9); }
.cell-main { display:flex; flex-direction:column; gap:4px; }
.cell-main span { color:#94a3b8; font-size:12px; }
.full-width { width:100%; }
.register-form { display:grid; gap:2px; }
.spi-tags { display:flex; gap:6px; flex-wrap:wrap; }
.result-card { padding:14px; border-radius:14px; background: rgba(248,250,252,.95); }
.result-card__head { display:flex; justify-content:space-between; gap:10px; align-items:center; }
.result-card p { margin:10px 0 12px; color:#334155; }
.result-card dl { display:grid; gap:10px; }
.result-card dl div { display:grid; grid-template-columns:88px 1fr; gap:10px; }
.result-card dt { color:#64748b; }
.result-card dd { margin:0; color:#0f172a; word-break:break-all; }
.account-form { margin-top:2px; }
.account-form__grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
@media (max-width: 1200px) { .content, .stats { grid-template-columns:1fr; } }
@media (max-width: 900px) {
  .hero { flex-direction:column; align-items:start; }
  .panel-head { flex-direction:column; align-items:start; }
  .search, .filter { width:100%; }
  .panel-actions { width:100%; justify-content:stretch; }
  .panel-actions > * { flex:1; }
  .account-form__grid { grid-template-columns:1fr; }
}
</style>
