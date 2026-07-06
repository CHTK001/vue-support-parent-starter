<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from "vue";
import {
  fetchDeleteMiniMenu,
  fetchListMiniMenu,
  type MiniMenu,
} from "@/api/manage/mini-menu";
import MiniSaveDialog from "./mini-save.vue";
import { message } from "@repo/utils";

const props = withDefaults(
  defineProps<{
    active?: boolean;
  }>(),
  {
    active: false,
  },
);

const MINI_MENU_CACHE_KEY = "system.manage.mini-menu.cache";

const loading = reactive({
  query: false,
});

const dialogState = reactive<{
  visible: boolean;
  mode: "save" | "edit";
  data: Record<string, any>;
}>({
  visible: false,
  mode: "save",
  data: {},
});

const searchKeyword = ref("");
const tableData = ref<MiniMenu[]>([]);
const isDark = ref(false);

const cloneList = (value: MiniMenu[] = []) => JSON.parse(JSON.stringify(value));

const normalizeList = (value: MiniMenu[] = []) =>
  [...value].sort((left, right) => {
    const sortDiff =
      Number(left?.sysMiniMenuSort ?? 0) - Number(right?.sysMiniMenuSort ?? 0);
    if (sortDiff !== 0) {
      return sortDiff;
    }
    return Number(left?.sysMiniMenuId ?? 0) - Number(right?.sysMiniMenuId ?? 0);
  });

const readCache = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(MINI_MENU_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const persistCache = (value: MiniMenu[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(MINI_MENU_CACHE_KEY, JSON.stringify(value || []));
};

const clearCache = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(MINI_MENU_CACHE_KEY);
};

const applyData = (value: MiniMenu[] = []) => {
  tableData.value = normalizeList(cloneList(value));
};

const filteredCards = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return tableData.value;
  }
  return tableData.value.filter((item) =>
    [
      item.sysMiniMenuTitle,
      item.sysMiniMenuSubtitle,
      item.sysMiniMenuPath,
      item.sysMiniMenuPerm,
      item.sysMiniMenuCategory,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword)),
  );
});

const stats = computed(() => {
  const cards = tableData.value;
  return {
    total: cards.length,
    visible: cards.filter((item) => Number(item.sysMiniMenuHidden ?? 0) === 0)
      .length,
    cached: cards.filter((item) => Number(item.sysMiniMenuKeepAlive ?? 0) === 1)
      .length,
    protected: cards.filter((item) => !!String(item.sysMiniMenuRole || "").trim())
      .length,
  };
});

const loadCards = async (options: { force?: boolean } = {}) => {
  if (!props.active) {
    return;
  }
  if (!options.force) {
    const cached = readCache();
    if (cached) {
      applyData(cached);
      return;
    }
  }
  loading.query = true;
  try {
    const res = await fetchListMiniMenu();
    const nextData = Array.isArray(res?.data) ? res.data : [];
    persistCache(nextData);
    applyData(nextData);
  } catch {
    applyData([]);
    message("加载小程序菜单失败", { type: "error" });
  } finally {
    loading.query = false;
  }
};

const openDialog = (data: Record<string, any> = {}, mode: "save" | "edit" = "save") => {
  dialogState.mode = mode;
  dialogState.data = data;
  dialogState.visible = true;
};

const onDelete = async (row: MiniMenu) => {
  try {
    await fetchDeleteMiniMenu(row.sysMiniMenuId);
    clearCache();
    await loadCards({ force: true });
    message("删除成功", { type: "success" });
  } catch {
    message("删除失败", { type: "error" });
  }
};

const onSuccess = async () => {
  clearCache();
  await loadCards({ force: true });
};

const resolveBadgeClass = (type?: string) =>
  `mini-card__badge--${type || "primary"}`;

const resolveJumpModeLabel = (value?: number) =>
  value === 1 ? "tabBar" : value === 2 ? "WebView" : "普通页面";

const tooltipEffect = computed(() => (isDark.value ? "dark" : "light"));

const syncThemeState = () => {
  if (typeof document === "undefined") {
    return;
  }
  isDark.value = document.documentElement.classList.contains("dark");
};

let themeObserver: MutationObserver | null = null;

watch(
  () => props.active,
  (active) => {
    if (active) {
      void loadCards();
    }
  },
  { immediate: true },
);

onMounted(() => {
  syncThemeState();
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return;
  }
  themeObserver = new MutationObserver(() => {
    syncThemeState();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
});

onBeforeUnmount(() => {
  themeObserver?.disconnect();
  themeObserver = null;
});
</script>

<template>
  <div class="mini-menu-panel">
    <MiniSaveDialog
      v-model:visible="dialogState.visible"
      :mode="dialogState.mode"
      :menu-data="dialogState.data"
      @success="onSuccess"
    />

    <div class="mini-menu-stats">
      <div class="mini-stat-card">
        <span class="mini-stat-card__label">全部卡片</span>
        <strong>{{ stats.total }}</strong>
      </div>
      <div class="mini-stat-card">
        <span class="mini-stat-card__label">显示中</span>
        <strong>{{ stats.visible }}</strong>
      </div>
      <div class="mini-stat-card">
        <span class="mini-stat-card__label">缓存开启</span>
        <strong>{{ stats.cached }}</strong>
      </div>
      <div class="mini-stat-card">
        <span class="mini-stat-card__label">权限限制</span>
        <strong>{{ stats.protected }}</strong>
      </div>
    </div>

    <ScHeader class="mini-toolbar">
      <div class="mini-toolbar__left">
        <ScInput
          v-model="searchKeyword"
          clearable
          class="mini-toolbar__search"
          placeholder="搜索标题、路径、权限、分组"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </ScInput>
      </div>
      <div class="mini-toolbar__right">
        <ScButton :loading="loading.query" type="primary" @click="loadCards({ force: true })">
          <IconifyIconOnline icon="ri:refresh-line" />
        </ScButton>
        <ScButton type="success" @click="openDialog({}, 'save')">
          <IconifyIconOnline icon="ri:add-line" />
          <span>新增卡片</span>
        </ScButton>
      </div>
    </ScHeader>

    <div v-if="loading.query" class="mini-empty-state">
      <ScSkeleton animated :rows="5" />
    </div>

    <ScTable
      v-else-if="filteredCards.length"
      class="mini-card-table"
      layout="card"
      card-layout="default"
      :data="filteredCards"
      row-key="sysMiniMenuId"
      :hide-pagination="true"
      :border="false"
      :search="false"
      :layout-mode="'flex'"
      :card-min-width="116"
      :col-size="6"
      :height="'auto'"
    >
      <template #default="{ row }">
        <ScTooltip placement="top" :effect="tooltipEffect" :show-after="120">
          <template #content>
            <div class="mini-card-tooltip">
              <div class="mini-card-tooltip__title">
                {{ row.sysMiniMenuTitle || "未命名卡片" }}
              </div>
              <div class="mini-card-tooltip__desc">
                {{ row.sysMiniMenuSubtitle || "未设置副标题" }}
              </div>
              <div class="mini-card-tooltip__meta">
                <span>路径：{{ row.sysMiniMenuPath || "-" }}</span>
                <span>分组：{{ row.sysMiniMenuCategory || "未分组" }}</span>
                <span>权限：{{ row.sysMiniMenuPerm || "未设置" }}</span>
                <span>角色：{{ row.sysMiniMenuRole || "全部角色" }}</span>
                <span>跳转：{{ resolveJumpModeLabel(Number(row.sysMiniMenuJumpMode ?? 0)) }}</span>
                <span>缓存：{{ Number(row.sysMiniMenuKeepAlive ?? 0) === 1 ? "开启" : "关闭" }}</span>
              </div>
            </div>
          </template>

          <div class="mini-launcher-card">
            <span class="mini-launcher-card__sort">#{{ row.sysMiniMenuSort || 1 }}</span>
            <span
              class="mini-launcher-card__status"
              :class="resolveBadgeClass(row.sysMiniMenuBadgeType)"
            >
              {{ row.sysMiniMenuBadge || "卡" }}
            </span>
            <div class="mini-launcher-card__icon">
              <IconifyIconOnline :icon="row.sysMiniMenuIcon || 'ri:apps-2-line'" />
            </div>
            <div class="mini-launcher-card__actions">
              <ScButton type="primary" link @click.stop="openDialog(row, 'edit')">
                <IconifyIconOnline icon="mdi:pencil" />
              </ScButton>
              <ScPopconfirm
                :title="$t('message.confimDelete')"
                confirm-button-type="danger"
                cancel-button-type="info"
                @confirm="onDelete(row)"
              >
                <template #reference>
                  <ScButton type="danger" link @click.stop>
                    <IconifyIconOnline icon="mdi:delete" />
                  </ScButton>
                </template>
              </ScPopconfirm>
            </div>
          </div>
        </ScTooltip>
      </template>
    </ScTable>

    <div v-else class="mini-empty-state">
      <IconifyIconOnline icon="ri:apps-2-line" />
      <h3>暂无小程序卡片</h3>
      <p>点击“新增卡片”开始配置独立的小程序菜单。</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mini-menu-panel {
  --mini-surface: var(--el-bg-color);
  --mini-surface-soft: var(--el-fill-color-lighter);
  --mini-border: var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 20px 20px;
}

.mini-menu-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.mini-stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 92%), rgb(239 246 255 / 92%)),
    var(--el-bg-color);
  border: 1px solid rgb(59 130 246 / 10%);
  border-radius: 18px;
}

.mini-stat-card__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.mini-stat-card strong {
  font-size: 30px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.mini-toolbar {
  padding: 0;
  background: transparent;
  border: 0;

  :deep(.el-input__wrapper) {
    box-shadow: none;
    border-radius: 14px;
    background: var(--mini-surface);
    border: 1px solid var(--mini-border);
  }
}

.mini-toolbar__left,
.mini-toolbar__right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.mini-toolbar__search {
  width: 320px;
}

.mini-card__badge--primary,
.mini-launcher-card__status.mini-card__badge--primary { background: #3b82f6; }
.mini-card__badge--success,
.mini-launcher-card__status.mini-card__badge--success { background: #22c55e; }
.mini-card__badge--warning,
.mini-launcher-card__status.mini-card__badge--warning { background: #f59e0b; }
.mini-card__badge--danger,
.mini-launcher-card__status.mini-card__badge--danger { background: #ef4444; }
.mini-card__badge--info,
.mini-launcher-card__status.mini-card__badge--info { background: #64748b; }

.mini-card-table {
  :deep(.card-view-container) {
    padding: 0;
    background: transparent;
    max-height: none;
  }

  :deep(.card-grid) {
    gap: 14px !important;
  }

  :deep(.card-item-wrapper) {
    max-width: 128px;
    min-width: 116px;
  }

  :deep(.card-inner.card-default) {
    padding: 0;
    background: transparent;
  }
}

.mini-launcher-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 116px;
  height: 116px;
  border-radius: 28px;
  border: 1px solid rgba(59, 130, 246, 0.12);
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.2), transparent 50%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  box-shadow:
    0 20px 36px rgba(15, 23, 42, 0.08),
    0 6px 14px rgba(15, 23, 42, 0.04);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.mini-launcher-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--el-color-primary-rgb), 0.26);
  box-shadow:
    0 24px 42px rgba(15, 23, 42, 0.1),
    0 10px 18px rgba(15, 23, 42, 0.06);
}

.mini-launcher-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--el-color-primary);
  font-size: 34px;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
}

.mini-launcher-card__sort {
  position: absolute;
  top: 10px;
  left: 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
}

.mini-launcher-card__status {
  position: absolute;
  top: 10px;
  right: 10px;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.mini-launcher-card__actions {
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  opacity: 0;
  transition: opacity 0.18s ease;
}

.mini-launcher-card:hover .mini-launcher-card__actions {
  opacity: 1;
}

.mini-card-tooltip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 280px;
}

.mini-card-tooltip__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.mini-card-tooltip__desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.mini-card-tooltip__meta {
  display: grid;
  gap: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.mini-empty-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--el-border-color);
  border-radius: 20px;
}

.mini-empty-state .iconify {
  font-size: 42px;
  color: var(--el-color-primary);
}

@media (width <= 960px) {
  .mini-menu-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mini-toolbar__search {
    width: 100%;
  }

  .mini-card-table :deep(.card-item-wrapper) {
    max-width: 116px;
  }
}

@media (width <= 720px) {
  .mini-menu-stats {
    grid-template-columns: 1fr;
  }

  .mini-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .mini-toolbar__left,
  .mini-toolbar__right {
    width: 100%;
  }
}

html.dark {
  .mini-menu-panel {
    --mini-surface: rgb(15 23 42 / 88%);
    --mini-surface-soft: rgb(15 23 42 / 72%);
    --mini-border: rgb(148 163 184 / 16%);
  }

  .mini-stat-card {
    background:
      linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.9)),
      var(--el-bg-color);
    border-color: rgba(59, 130, 246, 0.14);
  }

  .mini-launcher-card {
    border-color: rgba(148, 163, 184, 0.16);
    background:
      radial-gradient(circle at top left, rgba(var(--el-color-primary-rgb), 0.22), transparent 50%),
      linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92));
    box-shadow:
      0 20px 36px rgba(2, 8, 23, 0.26),
      0 6px 14px rgba(2, 8, 23, 0.18);
  }

  .mini-launcher-card__icon {
    background: rgba(15, 23, 42, 0.84);
    color: #bfdbfe;
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
  }

  .mini-launcher-card__sort {
    color: #94a3b8;
  }

  .mini-launcher-card__actions {
    background: rgba(15, 23, 42, 0.92);
  }

  .mini-card-tooltip__title {
    color: #f8fafc;
  }

  .mini-card-tooltip__desc,
  .mini-card-tooltip__meta {
    color: #cbd5e1;
  }

  .mini-empty-state {
    border-color: var(--mini-border);
    background: var(--mini-surface-soft);
  }

  .mini-toolbar {
    :deep(.el-input__wrapper) {
      background: var(--mini-surface-soft);
      border-color: var(--mini-border);
    }
  }
}
</style>
