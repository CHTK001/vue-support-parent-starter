<template>
  <section class="bot-page system-container modern-bg">
    <!-- Header -->
    <div class="chat-like-header">
      <ScButton circle type="default" class="chat-like-header__back" @click="handleBackPage">
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </ScButton>
      <div class="chat-like-header__title-wrap">
        <span class="chat-like-header__title">Bot 账号管理</span>
        <span class="chat-like-header__subtitle">管理多平台 Bot 账号，配置 AI 模型与提示词</span>
      </div>
      <div class="chat-like-header__actions">
        <el-button type="primary" @click="openCreateDialog">
          <IconifyIconOnline icon="ri:add-line" />
          新建 Bot
        </el-button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="bot-stats">
      <div class="bot-stats__card" v-for="stat in statsCards" :key="stat.label">
        <div class="bot-stats__card-icon" :style="{ background: stat.bg }">
          <IconifyIconOnline :icon="stat.icon" />
        </div>
        <div class="bot-stats__card-body">
          <span class="bot-stats__card-value">{{ stat.count }}</span>
          <span class="bot-stats__card-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="bot-filter">
      <div class="bot-filter__left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名 / 昵称 / 用户 ID"
          clearable
          :prefix-icon="SearchIcon"
          class="bot-filter__search"
          @input="onSearchInput"
        />
        <el-select
          v-model="filterPlatform"
          placeholder="全部平台"
          clearable
          class="bot-filter__platform"
          @change="fetchList"
        >
          <el-option label="iLink" value="ilink" />
          <el-option label="飞书" value="feishu" />
          <el-option label="个人微信" value="personal_wechat" />
          <el-option label="钉钉" value="dingtalk" />
        </el-select>
        <el-select
          v-model="filterAiEnabled"
          placeholder="AI 状态"
          clearable
          class="bot-filter__ai"
          @change="fetchList"
        >
          <el-option label="已开启 AI" :value="true" />
          <el-option label="未开启 AI" :value="false" />
        </el-select>
      </div>
      <div class="bot-filter__right">
        <el-button @click="fetchList" :icon="RefreshIcon" circle />
      </div>
    </div>

    <!-- Table -->
    <div class="bot-table-wrap">
      <el-table
        :data="list"
        v-loading="loading"
        stripe
        style="width: 100%"
        :empty-text="loading ? '加载中...' : '暂无 Bot 账号'"
      >
        <el-table-column label="账号信息" min-width="220">
          <template #default="{ row }">
            <div class="bot-account-cell">
              <div class="bot-avatar" :style="{ backgroundImage: row.avatarUrl ? `url(${row.avatarUrl})` : undefined }">
                <IconifyIconOnline v-if="!row.avatarUrl" icon="ri:robot-3-line" />
              </div>
              <div class="bot-account-cell__info">
                <div class="bot-account-cell__name">
                  {{ row.nickname || row.username || row.userId }}
                  <el-tag
                    v-if="row.nickname && row.username"
                    size="small"
                    effect="plain"
                    class="bot-account-cell__username-tag"
                  >
                    @{{ row.username }}
                  </el-tag>
                </div>
                <div class="bot-account-cell__id">ID: {{ row.userId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="平台" width="110">
          <template #default="{ row }">
            <div class="bot-platform-badge" :class="`bot-platform-badge--${row.platform || 'unknown'}`">
              <IconifyIconOnline :icon="platformIcon(row.platform)" />
              <span>{{ platformLabel(row.platform) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="AI 状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.aiEnabled"
              size="small"
              inline-prompt
              active-text="开"
              inactive-text="关"
              @change="(val: boolean) => handleToggleAi(row, val)"
            />
          </template>
        </el-table-column>

        <el-table-column label="AI 模型" min-width="140">
          <template #default="{ row }">
            <span v-if="row.aiModel" class="bot-model-badge">{{ row.aiModel }}</span>
            <span v-else class="bot-model-badge bot-model-badge--none">默认模型</span>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            <span class="bot-time">{{ row.createTime || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="bot-actions">
              <el-tooltip content="编辑 Bot 信息" placement="top">
                <el-button size="small" circle @click="openEditDialog(row)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="AI 配置" placement="top">
                <el-button size="small" circle class="btn-ai-config" @click="openAiConfigDialog(row)">
                  <IconifyIconOnline icon="ri:sparkling-2-line" />
                </el-button>
              </el-tooltip>
              <el-popconfirm
                title="确认删除该 Bot 账号？"
                confirm-button-text="删除"
                cancel-button-text="取消"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-tooltip content="删除" placement="top">
                    <el-button size="small" circle type="danger" plain>
                      <IconifyIconOnline icon="ri:delete-bin-6-line" />
                    </el-button>
                  </el-tooltip>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Pagination -->
    <div class="bot-pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <!-- Create / Edit Drawer -->
    <el-drawer
      v-model="dialogVisible"
      :title="isEdit ? '编辑 Bot' : '新建 Bot'"
      size="480px"
      destroy-on-close
    >
      <template #default>
        <el-form :model="form" label-position="top" v-loading="saving">
          <el-form-item label="用户 ID" required>
            <el-input v-model="form.userId" placeholder="平台侧 openid / userid" :disabled="isEdit" />
          </el-form-item>
          <el-divider content-position="left">基本信息</el-divider>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="用户名">
                <el-input v-model="form.username" placeholder="用户名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="昵称">
                <el-input v-model="form.nickname" placeholder="昵称" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="头像 URL">
            <el-input v-model="form.avatarUrl" placeholder="头像 URL" clearable>
              <template #prepend>
                <IconifyIconOnline icon="ri:image-line" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="平台">
            <el-select v-model="form.platform" placeholder="选择平台" style="width: 100%">
              <el-option label="iLink" value="ilink">
                <div class="bot-option-label">
                  <IconifyIconOnline icon="ri:links-line" />
                  <span>iLink</span>
                </div>
              </el-option>
              <el-option label="飞书" value="feishu">
                <div class="bot-option-label">
                  <IconifyIconOnline icon="ri:book-open-line" />
                  <span>飞书</span>
                </div>
              </el-option>
              <el-option label="个人微信" value="personal_wechat">
                <div class="bot-option-label">
                  <IconifyIconOnline icon="ri:wechat-2-line" />
                  <span>个人微信</span>
                </div>
              </el-option>
              <el-option label="钉钉" value="dingtalk">
                <div class="bot-option-label">
                  <IconifyIconOnline icon="ri:dingding-line" />
                  <span>钉钉</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-divider content-position="left">AI 默认配置</el-divider>
          <el-form-item label="AI 模型">
            <el-input v-model="form.aiModel" placeholder="留空使用系统默认模型" />
          </el-form-item>
          <el-form-item label="System Prompt">
            <el-input
              v-model="form.aiSystemPrompt"
              type="textarea"
              :rows="4"
              placeholder="系统提示词，定义 Bot 的 AI 行为与角色"
            />
          </el-form-item>
          <el-divider content-position="left">扩展</el-divider>
          <el-form-item label="扩展 JSON">
            <el-input v-model="form.extra" type="textarea" :rows="3" placeholder="扩展 JSON 数据（可选）" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <div class="bot-drawer-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">
            {{ isEdit ? '保存修改' : '创建 Bot' }}
          </el-button>
        </div>
      </template>
    </el-drawer>

    <!-- AI Config Drawer -->
    <el-drawer
      v-model="aiConfigVisible"
      title="AI 配置"
      size="420px"
      destroy-on-close
    >
      <template #default>
        <div class="ai-config-hint">
          <IconifyIconOnline icon="ri:information-line" />
          <span>配置该 Bot 专用的 AI 模型与行为提示词，留空则使用系统默认值。</span>
        </div>
        <el-form :model="aiConfigForm" label-position="top" v-loading="aiConfigSaving">
          <el-form-item label="AI 模型">
            <el-input v-model="aiConfigForm.aiModel" placeholder="模型名称，留空使用默认">
              <template #prepend>
                <IconifyIconOnline icon="ri:brain-line" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="System Prompt">
            <el-input
              v-model="aiConfigForm.aiSystemPrompt"
              type="textarea"
              :rows="8"
              placeholder="系统提示词，定义 Bot 的 AI 行为与角色"
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <div class="bot-drawer-footer">
          <el-button @click="aiConfigVisible = false">取消</el-button>
          <el-button type="primary" :loading="aiConfigSaving" @click="handleSaveAiConfig">
            保存配置
          </el-button>
        </div>
      </template>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from "vue";
import { useRouter } from "vue-router";
import {
  listBotAccounts,
  saveBotAccount,
  updateBotAccount,
  deleteBotAccount,
  toggleBotAi,
  updateBotAiConfig,
  type BotAccount,
} from "@/api/ai/bot";

const router = useRouter();
const list = ref<BotAccount[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const searchKeyword = ref("");
const filterPlatform = ref("");
const filterAiEnabled = ref<boolean | undefined>(undefined);

const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);

// AI config drawer
const aiConfigVisible = ref(false);
const aiConfigSaving = ref(false);
const aiConfigTargetId = ref<number | null>(null);
const aiConfigForm = ref({ aiModel: "", aiSystemPrompt: "" });

// Icons
const SearchIcon = h("span", { class: "bot-search-icon" }, [
  h("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }, [
    h("circle", { cx: "11", cy: "11", r: "8" }),
    h("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }),
  ]),
]);
const RefreshIcon = h("span", { class: "bot-refresh-icon" }, [
  h("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }, [
    h("polyline", { points: "23 4 23 10 17 10" }),
    h("path", { d: "M20.49 15a9 9 0 1 1-2.12-9.36L23 10" }),
  ]),
]);

// Stats
const statsCards = computed(() => [
  { label: "全部 Bot", count: total.value, icon: "ri:robot-3-line", bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { label: "已开启 AI", count: list.value.filter(r => r.aiEnabled).length, icon: "ri:sparkling-2-line", bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { label: "iLink", count: list.value.filter(r => r.platform === "ilink").length, icon: "ri:links-line", bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { label: "飞书", count: list.value.filter(r => r.platform === "feishu").length, icon: "ri:book-open-line", bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
]);

const defaultForm = (): BotAccount => ({
  userId: "",
  username: "",
  nickname: "",
  avatarUrl: "",
  platform: "",
  aiEnabled: false,
  aiModel: "",
  aiSystemPrompt: "",
  extra: "",
});

const form = ref<BotAccount>(defaultForm());

function platformIcon(platform?: string) {
  const map: Record<string, string> = {
    ilink: "ri:links-line",
    feishu: "ri:book-open-line",
    personal_wechat: "ri:wechat-2-line",
    dingtalk: "ri:dingding-line",
  };
  return map[platform || ""] || "ri:question-line";
}

function platformLabel(platform?: string) {
  const map: Record<string, string> = {
    ilink: "iLink",
    feishu: "飞书",
    personal_wechat: "个人微信",
    dingtalk: "钉钉",
  };
  return map[platform || ""] || platform || "未知";
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { pageNum.value = 1; fetchList(); }, 400);
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await listBotAccounts(
      pageNum.value,
      pageSize.value,
      filterPlatform.value || undefined,
      filterAiEnabled.value,
    );
    const page = res.result;
    if (page) {
      list.value = page.records || [];
      total.value = page.total || 0;
    }
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  isEdit.value = false;
  form.value = defaultForm();
  dialogVisible.value = true;
}

function openEditDialog(row: BotAccount) {
  isEdit.value = true;
  form.value = { ...row };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateBotAccount(form.value);
    } else {
      await saveBotAccount(form.value);
    }
    dialogVisible.value = false;
    await fetchList();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: BotAccount) {
  if (row.id) {
    await deleteBotAccount(row.id);
    await fetchList();
  }
}

async function handleToggleAi(row: BotAccount, enabled: boolean) {
  if (row.id) {
    await toggleBotAi(row.id, enabled);
    row.aiEnabled = enabled;
  }
}

function openAiConfigDialog(row: BotAccount) {
  aiConfigTargetId.value = row.id ?? null;
  aiConfigForm.value = {
    aiModel: row.aiModel || "",
    aiSystemPrompt: row.aiSystemPrompt || "",
  };
  aiConfigVisible.value = true;
}

async function handleSaveAiConfig() {
  if (aiConfigTargetId.value == null) return;
  aiConfigSaving.value = true;
  try {
    await updateBotAiConfig(
      aiConfigTargetId.value,
      aiConfigForm.value.aiModel || undefined,
      aiConfigForm.value.aiSystemPrompt || undefined,
    );
    aiConfigVisible.value = false;
    await fetchList();
  } finally {
    aiConfigSaving.value = false;
  }
}

function handleBackPage() {
  router.back();
}

onMounted(fetchList);
</script>

<style scoped lang="scss">
// ─── Layout ───────────────────────────────────────────
.bot-page {
  padding: 24px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ─── Stats Cards ──────────────────────────────────────
.bot-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
}

.bot-stats__card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
}

.bot-stats__card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;
}

.bot-stats__card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bot-stats__card-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.bot-stats__card-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

// ─── Filter Bar ────────────────────────────────────────
.bot-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.bot-filter__left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.bot-filter__search {
  width: 260px;

  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }
}

.bot-filter__platform,
.bot-filter__ai {
  width: 140px;

  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }
}

// ─── Table ─────────────────────────────────────────────
.bot-table-wrap {
  background: var(--el-bg-color);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;

  :deep(.el-table) {
    border: none;
  }

  :deep(.el-table__header th) {
    background: var(--el-fill-color-lighter);
    font-weight: 600;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  :deep(.el-table__body tr:hover td) {
    background: var(--el-fill-color-light);
  }
}

// Account cell
.bot-account-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bot-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #6366f1;
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
}

.bot-account-cell__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.bot-account-cell__name {
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bot-account-cell__username-tag {
  font-size: 11px;
  transform: scale(0.85);
  transform-origin: left center;
}

.bot-account-cell__id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: "JetBrains Mono", "Fira Code", monospace;
}

// Platform badge
.bot-platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);

  &--ilink {
    background: #eef2ff;
    color: #4f46e5;
  }
  &--feishu {
    background: #ecfdf5;
    color: #059669;
  }
  &--personal_wechat {
    background: #fefce8;
    color: #ca8a04;
  }
  &--dingtalk {
    background: #f0f9ff;
    color: #0284c7;
  }
}

// Model badge
.bot-model-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  background: #f3f4f6;
  color: #374151;

  &--none {
    color: var(--el-text-color-placeholder);
    font-family: inherit;
  }
}

// Time
.bot-time {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

// Actions
.bot-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-ai-config {
  color: #8b5cf6;
  border-color: #ddd6fe;

  &:hover {
    background: #f5f3ff;
    color: #7c3aed;
    border-color: #c4b5fd;
  }
}

// ─── Pagination ────────────────────────────────────────
.bot-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 4px 0;
}

// ─── Drawer / Form ─────────────────────────────────────
.bot-drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.bot-option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.ai-config-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
  font-size: 13px;
  color: #0369a1;
  line-height: 1.5;

  .iconify {
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 1px;
  }
}

// ─── Dark mode adjustments ─────────────────────────────
:root .dark .bot-avatar {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  color: #818cf8;
}

:root .dark .bot-stats__card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

:root .dark .bot-platform-badge {
  &--ilink {
    background: #1e1b4b;
    color: #818cf8;
  }
  &--feishu {
    background: #064e3b;
    color: #34d399;
  }
  &--personal_wechat {
    background: #422006;
    color: #eab308;
  }
  &--dingtalk {
    background: #0c4a6e;
    color: #38bdf8;
  }
}

:root .dark .bot-model-badge {
  background: #374151;
  color: #d1d5db;
}

:root .dark .btn-ai-config {
  color: #a78bfa;
  border-color: #4c1d95;

  &:hover {
    background: #2e1065;
    color: #c4b5fd;
    border-color: #6d28d9;
  }
}

:root .dark .ai-config-hint {
  background: #0c4a6e;
  border-color: #0369a1;
  color: #bae6fd;
}
</style>