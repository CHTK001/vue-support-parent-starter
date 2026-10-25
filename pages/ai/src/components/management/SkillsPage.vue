<template>
  <RePage data-page="skills" fill>
    <template #title>
      <el-button link @click="goBack" class="skills-back">
        <el-icon :size="16"><ArrowBackIosFilled /></el-icon>
        <span>返回</span>
      </el-button>
      <span>Skills管理</span>
    </template>
    <template #meta>
      <span class="re-page__subtitle-block">管理本地已安装技能，并从在线技能市场搜索安装</span>
    </template>
    <template #actions>
      <el-button type="primary" @click="openSearch">
        <el-icon><Search /></el-icon>
        搜索技能
      </el-button>
      <el-button @click="loadInstalled">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </template>

    <!-- 内容区已由 RePage(fill) 提供滚动与留白，这里只保留加载态 -->
    <div v-loading="loading">
      <div v-if="installed.length" class="mg-grid">
        <div v-for="row in installed" :key="keyOf(row)" class="mg-cell"
          :class="{ 'mg-cell--off': !row.enabled }"
          @click="openDetail(row)">
          <PluginIcon :icon="row.icon" :name="row.name" size="md" class="mg-cell-icon" />
          <div class="mg-cell-body">
            <div class="mg-cell-title">{{ row.name }}</div>
            <div class="mg-cell-desc">{{ row.description || '（无描述）' }}</div>
          </div>
          <div class="mg-cell-actions" @click.stop>
            <el-tooltip v-if="row.source === 'custom'" content="卸载" placement="top">
              <button type="button" class="mg-cell-uninstall" aria-label="卸载"
                @click="handleUninstall(row)">
                <el-icon><Delete /></el-icon>
              </button>
            </el-tooltip>
            <el-switch
              v-model="row.enabled"

              :loading="toggling === keyOf(row)"
              @change="() => handleToggle(row)"
            />
          </div>
        </div>
      </div>
      <div v-else-if="!loading" class="h-full min-h-[240px] flex flex-col items-center justify-center gap-3">
        <el-icon :size="40" class="text-gray-300"><Files /></el-icon>
        <span class="text-sm text-gray-400">暂无技能，点「搜索技能」从市场安装</span>
      </div>
    </div>

    <!-- 技能搜索弹层：已安装 + 推荐 + 市场结果 -->
    <ReDialog v-model="showSearch" title="技能搜索" width="880px" top="6vh">
      <div class="flex items-center gap-2 mb-3">
        <el-input
          v-model="keyword"
          placeholder="输入关键词搜索市场，留空回车看榜单"
          clearable
          @keyup.enter="handleMarketSearch"
          @clear="handleMarketSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="sortBy" style="width: 130px" @change="handleMarketSearch">
          <el-option label="按 Star" value="stars" />
          <el-option label="按 Fork" value="forks" />
          <el-option label="按更新" value="updated" />
        </el-select>
        <el-button type="primary" :loading="marketLoading" @click="handleMarketSearch">搜索</el-button>
      </div>

      <div v-loading="marketLoading" class="max-h-[62vh] overflow-auto pr-1 flex flex-col">
        <div class="mb-5 order-2">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              已安装（{{ installed.length }}）
            </h3>
            <span class="text-xs text-gray-400">停用后不再注入对话</span>
          </div>
          <el-empty v-if="!installed.length" description="尚未安装技能" :image-size="60" />
          <div v-else class="space-y-2">
            <div v-for="row in installed" :key="keyOf(row)" class="installed-row">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ row.name }}</span>
                  <el-tag :type="row.source === 'custom' ? 'success' : 'info'">
                    {{ row.source === 'custom' ? '已安装' : '内置' }}
                  </el-tag>
                  <el-tag v-if="!row.enabled" type="warning">已停用</el-tag>
                </div>
                <p class="text-xs text-gray-500 mt-1 truncate">{{ row.description || '（无描述）' }}</p>
              </div>
              <el-switch
                v-model="row.enabled"
                :loading="toggling === keyOf(row)"
                @change="handleToggle(row)"
              />
            </div>
          </div>
        </div>

        <div class="order-1 mb-5">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {{ keyword ? '市场结果' : '推荐（市场榜单）' }}
            </h3>
            <span class="text-xs text-gray-400">{{ sourceSummary }}</span>
          </div>
          <el-alert
            v-if="marketEnabled === false"
            type="warning"
            :closable="false"
            show-icon
            title="技能市场总开关已关闭，先到系统设置里开启后再搜索"
            class="mb-2"
          />
          <el-empty
            v-else-if="!marketList.length && !marketLoading"
            description="市场未返回技能（详见上方源状态）"
            :image-size="60"
          />
          <div v-else class="grid grid-cols-2 gap-3">
            <el-card v-for="item in marketList" :key="item.id" shadow="hover" class="market-card market-card-clickable"
              @click="openMarketDetail(item)">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="font-bold truncate hover:text-(--color-primary)">{{ item.name }}</h3>
                    <el-tag v-if="item.installed" type="success">已安装</el-tag>
                  </div>
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2">
                    {{ item.description || '（该源未提供描述）' }}
                  </p>
                  <div class="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <el-tag type="info">{{ item.source }}</el-tag>
                    <span v-if="item.author">{{ item.author }}</span>
                    <span v-if="item.stars">★ {{ item.stars }}</span>
                    <span v-if="item.forks">Fork {{ item.forks }}</span>
                    <span v-if="item.installs">安装 {{ item.installs }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <el-button
                    type="primary"

                    :disabled="!item.url"
                    :loading="installing === item.id"
                    @click.stop="handleInstall(item)"
                  >
                    安装
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </ReDialog>

    <!-- 技能详情：已安装读本地 / 市场远程预览，弹窗内可直接安装 -->
    <SkillDetailDialog v-model="detailVisible" :skill="detailTarget" @install="handleDetailInstall" />
  </RePage>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { Search, Refresh, Files, Delete } from '@element-plus/icons-vue';
import { ArrowBackIosFilled } from '@vicons/material';
import { skillsApi } from '@/services/javaApi';
import PluginIcon from '@/components/ui/PluginIcon.vue';
import RePage from '@/components/re/RePage.vue';
import SkillDetailDialog from '@/components/plugins/SkillDetailDialog.vue';
import ReDialog from '@repo/ui/re-dialog';

const router = useRouter();

/** 返回上一级（入口始终来自技能市场，无历史时回市场页） */
function goBack() {
  if (window.history.state?.back) {
    router.back();
  } else {
    router.push('/plugins/skills');
  }
}

interface InstalledSkill {
  name: string;
  id?: string;
  description?: string;
  icon?: string;
  location?: string;
  source?: string;
  enabled?: boolean;
  contentLength?: number;
}

interface MarketItem {
  id: string;
  source: string;
  name: string;
  description?: string;
  author?: string;
  url?: string;
  path?: string;
  stars?: number;
  forks?: number;
  installs?: number;
  installed?: boolean;
}

const loading = ref(false);
const installed = ref<InstalledSkill[]>([]);
const toggling = ref('');

const showSearch = ref(false);
const keyword = ref('');
const sortBy = ref('stars');
const marketLoading = ref(false);
const marketList = ref<MarketItem[]>([]);
const marketEnabled = ref<boolean | null>(null);
const sourceStates = ref<{ source: string; count: number; queried?: boolean; error?: string }[]>([]);
const installing = ref('');

/** 后端统一信封 {success,data,msg}：失败时抛出带 msg 的错误 */
function unwrap(res: any): any {
  if (res && res.success === false) {
    throw new Error(res.msg || res.error || '后端返回失败');
  }
  return res?.data ?? res;
}

const sourceSummary = computed(() => {
  if (!sourceStates.value.length) return '';
  return sourceStates.value
    .map((s) => `${s.source} ${s.error ? '失败' : s.queried === false ? '未启用' : `${s.count ?? 0} 条`}`)
    .join(' · ');
});

/** 重新读取已安装技能（表格与弹层共用同一份数据） */
async function loadInstalled() {
  loading.value = true;
  try {
    installed.value = unwrap(await skillsApi.installed()) || [];
  } catch (e: any) {
    message.error(`加载已安装技能失败: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

async function openSearch() {
  showSearch.value = true;
  await Promise.all([loadInstalled(), handleMarketSearch()]);
}

async function handleMarketSearch() {
  marketLoading.value = true;
  try {
    const data = unwrap(
      await skillsApi.marketSearch({
        search: keyword.value.trim(),
        page: 1,
        limit: 20,
        sortBy: sortBy.value,
      }),
    );
    marketEnabled.value = data?.enabled ?? null;
    marketList.value = data?.items || [];
    sourceStates.value = data?.sources || [];
  } catch (e: any) {
    marketList.value = [];
    sourceStates.value = [];
    message.error(`市场搜索失败: ${e.message}`);
  } finally {
    marketLoading.value = false;
  }
}

function keyOf(row: InstalledSkill): string {
  return row.id || `${row.source || 'custom'}:${row.name}`;
}

async function handleToggle(row: InstalledSkill) {
  toggling.value = keyOf(row);
  const enabled = Boolean(row.enabled);
  try {
    unwrap(await skillsApi.toggle(row.name, enabled, row.source));
    message.success(enabled ? '已启用' : '已停用');
  } catch (e: any) {
    message.error(`切换失败: ${e.message}`);
    await loadInstalled();
  } finally {
    toggling.value = '';
  }
}

async function handleUninstall(row: InstalledSkill) {
  try {
    await ElMessageBox.confirm(`确定要卸载「${row.name}」吗？`, '卸载确认', { type: 'warning' });
  } catch {
    return;
  }
  try {
    unwrap(await skillsApi.uninstall(row.name));
    message.success('卸载成功');
    await loadInstalled();
  } catch (e: any) {
    message.error(`卸载失败: ${e.message}`);
  }
}

async function handleInstall(item: MarketItem) {
  installing.value = item.id;
  try {
    const data = unwrap(
      await skillsApi.marketInstall({
        source: item.source,
        id: item.id,
        url: item.url || '',
        path: item.path,
      }),
    );
    const names: string[] = data?.installed_skill_names || [];
    const errors: { message?: string }[] = data?.errors || [];
    if (!names.length) {
      message.error(`安装失败: ${errors[0]?.message || '未安装任何技能'}`);
      return;
    }
    item.installed = true;
    message.success(`已安装：${names.join('、')}`);
    await loadInstalled();
  } catch (e: any) {
    message.error(`安装失败: ${e.message}`);
  } finally {
    installing.value = '';
  }
}

/* ───── 技能详情（已安装读本地 / 市场远程预览，复用统一弹窗） ───── */
const detailVisible = ref(false);
const detailTarget = ref<{
  id: string;
  name: string;
  description?: string;
  installed: boolean;
  zipUrl?: string;
  /** 市场条目的仓库地址（已安装技能为空） */
  repoUrl?: string;
  /** 市场条目在仓库内的子目录（已安装技能为空） */
  subdir?: string;
} | null>(null);
/** 详情弹窗当前对应的市场条目（用于在弹窗内直接安装） */
const detailMarketItem = ref<MarketItem | null>(null);

/** 打开已安装技能详情：归一化后交给统一组件读取本地 SKILL.md */
function openDetail(row: InstalledSkill) {
  detailMarketItem.value = null;
  detailTarget.value = {
    id: row.name,
    name: row.name,
    description: row.description,
    installed: true,
  };
  detailVisible.value = true;
}

/** 打开市场结果详情：传 GitHub 仓库地址 + 子目录，弹窗远程拉取 SKILL.md（不落盘） */
function openMarketDetail(item: MarketItem) {
  // 关闭搜索弹层，避免其遮罩层（z-index 更高）盖住详情弹窗
  showSearch.value = false;
  detailMarketItem.value = item;
  detailTarget.value = {
    id: item.id || item.name,
    name: item.name,
    description: item.description,
    installed: !!item.installed,
    repoUrl: item.url,
    subdir: item.path,
  };
  detailVisible.value = true;
}

/** 详情弹窗内点击安装：关闭弹窗并交给统一安装流程 */
function handleDetailInstall() {
  const item = detailMarketItem.value;
  if (item) {
    detailVisible.value = false;
    return handleInstall(item);
  }
}

onMounted(loadInstalled);
</script>

<style scoped>
/* 页面外壳已收口到 RePage；这里只补返回按钮的排版。 */
.skills-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}
.skills-back:hover { color: var(--u-primary, var(--el-color-primary)); }
/* RePage 的 #meta 里放副标题：与标题同一行、字号更小 */
.re-page__subtitle-block {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.market-card {
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  transition: all 0.2s;
}
/* 卡片本体不加投影；仅保留悬浮浮起反馈这一类 */
.market-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}
.market-card-clickable {
  cursor: pointer;
}
.installed-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
}

/* 已安装技能卡片：与技能市场卡片样式一致，右侧多「启用开关 + 卸载」 */
.mg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
  gap: 12px;
}
.mg-cell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 9px;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 var(--mp-radius-lg, 14px)：--mp-* 来自未引入的 modern-polish.css，是空令牌，
     收敛到 --el-radius-lg 档（14px 距 12/16 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  min-width: 0;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.mg-cell:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
}
.mg-cell-icon {
  flex: none;
  align-self: flex-start;
}
.mg-cell-body {
  flex: 1;
  min-width: 0;
}
.mg-cell-title {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--el-text-color-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.mg-cell-desc {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.mg-cell-actions {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
/* 卸载：默认不占位（display:none），hover 卡片才在开关左侧显现，保证开关始终右对齐 */
.mg-cell-uninstall {
  flex: none;
  display: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  /* 原值 7px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-color-danger);
  cursor: pointer;
  transition: background 0.18s ease;
}
.mg-cell:hover .mg-cell-uninstall {
  display: inline-flex;
}
.mg-cell-uninstall:hover {
  background: var(--el-color-danger-light-9);
}
.mg-cell-uninstall .el-icon {
  font-size: 15px;
}
.mg-cell--off {
  opacity: 0.6;
}

/* 动效降级：系统开启「减少动态效果」时，市场卡上浮、单元描边与卸载底色直接到位。
   逐个列出，不写 `*` / `.mg-cell *` 通配，
   避免把 el-switch / el-icon 内部 Element Plus 组件的合法过渡一起掐掉。
   这些都只带 transition（无 animation），hover 态都是静态声明，照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .market-card,
  .mg-cell,
  .mg-cell-uninstall {
    transition: none;
  }
}

/* 键盘焦点可见性：已安装技能单元是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，不重复写。
   环用主色 12% —— 单元底色是令牌化的 --el-bg-color，一档主色描边足够可见。 */
.mg-cell {
  outline: none;
}

.mg-cell:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 注意：B 段清单里的 mg-cell-actions 不是可点元素 —— 它只是 @click.stop 的
   点击拦截壳（防止开关/卸载的点击冒泡到卡片），自身既无 tabindex 也不可聚焦，
   给它写 :focus-visible 规则永远不会命中，属于死代码，因此未在此改动。
   同理 .mg-cell-uninstall 是原生 <button>，自带焦点环，也不需要补。 */
</style>
