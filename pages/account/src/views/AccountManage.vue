<script setup lang="ts">
/**
 * 账号管理页面 — 自动生成/管理临时邮箱账号（Grok 等平台的注册账号）。
 *
 * 对接后端 /api/account/* REST API：
 *   POST /api/account/register/{platformType}       单账号注册
 *   POST /api/account/register-batch/{platformType} 批量注册
 *   GET  /api/account/acquire/{platformType}        获取可用账号
 *   GET  /api/account/list/{platformType}           账号列表
 *   POST /api/account/release/{platformType}/{id}   释放账号
 *   GET  /api/account/stats                         全局统计
 *   POST /api/account/replenish/{platformType}      手动补号
 *   GET  /api/account/settings                      读取配置
 *   POST /api/account/settings                      保存配置
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Delete, Key, Setting } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";

// ============ 类型定义 ============

interface PoolStats {
  [key: string]: { total: number; active: number; inactive: number };
}

interface AccountItem {
  id: string;
  email: string;
  password: string;
  token: string;
  platformType: string;
  active: boolean;
  createdAt: number;
  lastUsedAt: number;
}

interface AccountSettings {
  enable: boolean;
  yescaptchaKey: string;
  emailProvider: string;
  proxy: string;
  autoRegisterCount: number;
}

// ============ 常量 ============

const PLATFORM_TYPES = [
  { label: "Grok (xAI)", value: "GROK" },
  { label: "Twitter/X", value: "TWITTER" },
  { label: "Discord", value: "DISCORD" },
  { label: "Reddit", value: "REDDIT" },
  { label: "Custom", value: "CUSTOM" },
] as const;

const EMAIL_PROVIDERS = [
  { label: "FreeCustom (FCE)", value: "fce" },
  { label: "mail.tm", value: "mail-tm" },
  { label: "MailNest", value: "mailnest" },
  { label: "LuckMail", value: "luckmail" },
] as const;

// ============ 状态 ============

const loading = ref(false);
const registering = ref(false);

// 配置
const settings = ref<AccountSettings>({
  enable: false,
  yescaptchaKey: "",
  emailProvider: "fce",
  proxy: "",
  autoRegisterCount: 0,
});
const settingsLoading = ref(false);
const settingsSaving = ref(false);
const settingsFormRef = ref<FormInstance>();

const settingsRules: FormRules = {
  emailProvider: [{ required: true, message: "请选择邮箱提供商", trigger: "change" }],
};

// 账号列表
const selectedPlatform = ref("GROK");
const accounts = ref<AccountItem[]>([]);
const stats = ref<PoolStats>({});

// ============ API 调用 ============

/** 解析响应 body；后端对写操作（POST）可能返回空 body，直接 res.json() 会抛错 */
async function parseJson<T>(res: Response, fallback: T): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text) return fallback;
  return JSON.parse(text) as T;
}

async function httpGet<T>(url: string, fallback: T): Promise<T> {
  const res = await fetch(`/api${url}`);
  return parseJson<T>(res, fallback);
}

async function httpPost<T>(url: string, body?: unknown, fallback: T = undefined as T): Promise<T> {
  const res = await fetch(`/api${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseJson<T>(res, fallback);
}

// ============ 配置操作 ============

async function loadSettings() {
  try {
    const res = await httpGet<AccountSettings>("/account/settings", settings.value);
    if (res) Object.assign(settings.value, res);
  } catch {
    // 未配置时使用默认值
  }
}

async function saveSettings() {
  if (!settingsFormRef.value) return;
  try {
    await settingsFormRef.value.validate();
  } catch {
    return;
  }
  settingsSaving.value = true;
  try {
    await httpPost("/account/settings", settings.value);
    ElMessage.success("配置已保存");
  } catch (e) {
    ElMessage.error(`保存失败: ${e}`);
  } finally {
    settingsSaving.value = false;
  }
}

// ============ 账号操作 ============

async function loadAccounts() {
  loading.value = true;
  try {
    const res = await httpGet<AccountItem[]>(`/account/list/${selectedPlatform.value}`, []);
    accounts.value = Array.isArray(res) ? res : [];
  } catch {
    accounts.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadStats() {
  try {
    const res = await httpGet<PoolStats>("/account/stats", {});
    if (res) stats.value = res;
  } catch {
    // ignore
  }
}

async function handleRegister(count: number) {
  registering.value = true;
  try {
      const res = await httpPost<AccountItem[]>(
        `/account/register-batch/${selectedPlatform.value}?count=${count}&emailProvider=${settings.value.emailProvider}`,
        undefined,
        []
      );
    const list = Array.isArray(res) ? res : [];
    if (list.length > 0) {
      accounts.value = [...list, ...accounts.value];
      ElMessage.success(`注册成功 ${list.length} 个账号`);
      await loadStats();
    } else {
      ElMessage.warning("注册未返回账号，请检查日志");
    }
  } catch (e) {
    ElMessage.error(`注册失败: ${e}`);
  } finally {
    registering.value = false;
  }
}

async function handleRelease(account: AccountItem) {
  try {
    await ElMessageBox.confirm(`确认释放账号 ${account.email}？`, "提示", { type: "warning" });
    await httpPost(`/account/release/${selectedPlatform.value}/${account.id}`);
    accounts.value = accounts.value.filter(a => a.id !== account.id);
    ElMessage.success("已释放");
    await loadStats();
  } catch {
    // cancelled or error
  }
}

async function handleReplenish() {
  registering.value = true;
  try {
    const res = await httpPost<AccountItem[]>(`/account/replenish/${selectedPlatform.value}?count=2`);
    const list = Array.isArray(res) ? res : [];
    if (list.length > 0) {
      accounts.value = [...list, ...accounts.value];
      ElMessage.success(`补号成功 ${list.length} 个`);
      await loadStats();
    }
  } catch (e) {
    ElMessage.error(`补号失败: ${e}`);
  } finally {
    registering.value = false;
  }
}

function handleRefresh() {
  Promise.all([loadAccounts(), loadStats()]);
}

function formatTime(ts: number) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("zh-CN", { hour12: false });
}

// ============ 生命周期 ============

onMounted(() => {
  loadSettings();
  loadAccounts();
  loadStats();
});
</script>

<template>
  <div class="account-page">
    <el-row :gutter="16">
      <!-- 左侧：配置面板 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span><el-icon><Setting /></el-icon> 全局配置</span>
            </div>
          </template>
          <el-form
            ref="settingsFormRef"
            :model="settings"
            :rules="settingsRules"
            label-width="120px"
            size="default"
          >
            <el-form-item label="启用自动注册" prop="enable">
              <el-switch v-model="settings.enable" />
            </el-form-item>

            <el-form-item label="YesCaptcha Key" prop="yescaptchaKey">
              <el-input
                v-model="settings.yescaptchaKey"
                type="password"
                show-password
                placeholder="fce_xxxxx..."
                clearable
              />
            </el-form-item>

            <el-form-item label="邮箱提供商" prop="emailProvider">
              <el-select v-model="settings.emailProvider" style="width: 100%">
                <el-option
                  v-for="p in EMAIL_PROVIDERS"
                  :key="p.value"
                  :label="p.label"
                  :value="p.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="代理地址" prop="proxy">
              <el-input v-model="settings.proxy" placeholder="http://127.0.0.1:7897" clearable />
            </el-form-item>

            <el-form-item label="启动预注册">
              <el-input-number v-model="settings.autoRegisterCount" :min="0" :max="20" style="width: 100%" />
              <span style="margin-left: 8px; color: #909399; font-size: 12px">个（启动时自动注册）</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="settingsSaving" @click="saveSettings">
                保存配置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 统计卡片 -->
        <el-card shadow="never" style="margin-top: 16px">
          <template #header>
            <span><el-icon><Key /></el-icon> 账号池统计</span>
          </template>
          <el-row :gutter="12">
            <el-col :span="12" v-for="(s, type) in stats" :key="type">
              <el-statistic :title="type" :value="s.active">
                <template #suffix>
                  <span style="font-size: 12px; color: #909399">/{{ s.total }}</span>
                </template>
              </el-statistic>
            </el-col>
            <el-col :span="24" v-if="Object.keys(stats).length === 0">
              <el-empty description="暂无数据" :image-size="60" />
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 右侧：账号列表 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span><el-icon><UserFilled /></el-icon> 账号管理 — {{ selectedPlatform }}</span>
              <el-space>
                <el-select v-model="selectedPlatform" style="width: 140px" @change="loadAccounts">
                  <el-option
                    v-for="pt in PLATFORM_TYPES"
                    :key="pt.value"
                    :label="pt.label"
                    :value="pt.value"
                  />
                </el-select>
                <el-button :loading="registering" @click="handleRegister(1)" :icon="Plus">
                  注册1个
                </el-button>
                <el-button :loading="registering" @click="handleReplenish" :icon="Refresh">
                  补号
                </el-button>
                <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
              </el-space>
            </div>
          </template>

          <el-table :data="accounts" v-loading="loading" stripe size="small">
            <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
            <el-table-column prop="password" label="密码" width="120" show-overflow-tooltip>
              <template #default="{ row }">
                <span style="font-family: monospace; font-size: 12px">{{ row.password }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="token" label="Token" width="100" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.token" style="font-family: monospace; font-size: 11px; color: #909399">
                  {{ row.token.substring(0, 8) }}...
                </span>
                <span v-else style="color: #c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="70">
              <template #default="{ row }">
                <el-tag :type="row.active ? 'success' : 'danger'" size="small">
                  {{ row.active ? '活跃' : '已释放' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="150">
              <template #default="{ row }">
                <span style="font-size: 11px">{{ formatTime(row.createdAt) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  link
                  size="small"
                  :disabled="!row.active"
                  @click="handleRelease(row)"
                >
                  释放
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="!loading && accounts.length === 0" description="暂无账号，点击「注册」创建" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.account-page {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.el-statistic {
  text-align: center;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}
</style>
