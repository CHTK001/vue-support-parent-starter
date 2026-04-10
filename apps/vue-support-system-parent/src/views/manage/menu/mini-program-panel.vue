<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
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

watch(
  () => props.active,
  (active) => {
    if (active) {
      void loadCards();
    }
  },
  { immediate: true },
);
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

    <div v-else-if="filteredCards.length" class="mini-card-grid">
      <article
        v-for="item in filteredCards"
        :key="item.sysMiniMenuId"
        class="mini-card"
      >
        <div class="mini-card__cover">
          <div class="mini-card__cover-mask" />
          <div class="mini-card__icon">
            <IconifyIconOnline :icon="item.sysMiniMenuIcon || 'ri:apps-2-line'" />
          </div>
          <div
            class="mini-card__badge"
            :class="resolveBadgeClass(item.sysMiniMenuBadgeType)"
          >
            {{ item.sysMiniMenuBadge || "CARD" }}
          </div>
          <div class="mini-card__actions">
            <ScButton type="primary" link @click="openDialog(item, 'edit')">
              <IconifyIconOnline icon="mdi:pencil" />
            </ScButton>
            <ScPopconfirm
              :title="$t('message.confimDelete')"
              confirm-button-type="danger"
              cancel-button-type="info"
              @confirm="onDelete(item)"
            >
              <template #reference>
                <ScButton type="danger" link>
                  <IconifyIconOnline icon="mdi:delete" />
                </ScButton>
              </template>
            </ScPopconfirm>
          </div>
        </div>

        <div class="mini-card__body">
          <div class="mini-card__header">
            <div>
              <h4>{{ item.sysMiniMenuTitle || "未命名卡片" }}</h4>
              <p>{{ item.sysMiniMenuSubtitle || "未设置副标题" }}</p>
            </div>
            <span class="mini-card__sort">#{{ item.sysMiniMenuSort || 1 }}</span>
          </div>

          <div class="mini-card__path">{{ item.sysMiniMenuPath || "-" }}</div>

          <div class="mini-card__tags">
            <ScTag size="small" effect="plain">
              {{ item.sysMiniMenuCategory || "未分组" }}
            </ScTag>
            <ScTag
              size="small"
              :type="Number(item.sysMiniMenuKeepAlive ?? 0) === 1 ? 'success' : 'info'"
              effect="light"
            >
              {{ Number(item.sysMiniMenuKeepAlive ?? 0) === 1 ? "缓存" : "不缓存" }}
            </ScTag>
            <ScTag
              size="small"
              :type="Number(item.sysMiniMenuHidden ?? 0) === 1 ? 'warning' : 'primary'"
              effect="light"
            >
              {{
                Number(item.sysMiniMenuHidden ?? 0) === 1 ? "已隐藏" : "显示中"
              }}
            </ScTag>
            <ScTag size="small" type="info" effect="plain">
              {{ resolveJumpModeLabel(Number(item.sysMiniMenuJumpMode ?? 0)) }}
            </ScTag>
          </div>

          <div class="mini-card__meta">
            <div>
              <span>权限</span>
              <strong>{{ item.sysMiniMenuPerm || "未设置" }}</strong>
            </div>
            <div>
              <span>角色</span>
              <strong>{{ item.sysMiniMenuRole || "全部角色" }}</strong>
            </div>
          </div>

          <p v-if="item.sysMiniMenuDescription" class="mini-card__description">
            {{ item.sysMiniMenuDescription }}
          </p>
        </div>
      </article>
    </div>

    <div v-else class="mini-empty-state">
      <IconifyIconOnline icon="ri:apps-2-line" />
      <h3>暂无小程序卡片</h3>
      <p>点击“新增卡片”开始配置独立的小程序菜单。</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mini-menu-panel {
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

.mini-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 18px;
}

.mini-card {
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 24px;
  box-shadow: 0 18px 42px rgb(15 23 42 / 6%);
}

.mini-card__cover {
  position: relative;
  min-height: 128px;
  background:
    radial-gradient(circle at top left, rgb(59 130 246 / 22%), transparent 48%),
    linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
}

.mini-card__cover-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent, rgb(15 23 42 / 6%));
}

.mini-card__icon {
  position: absolute;
  top: 18px;
  left: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  color: var(--el-color-primary);
  font-size: 28px;
  background: rgb(255 255 255 / 88%);
  border-radius: 18px;
}

.mini-card__badge {
  position: absolute;
  top: 18px;
  right: 18px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  border-radius: 999px;
}

.mini-card__badge--primary { background: #3b82f6; }
.mini-card__badge--success { background: #22c55e; }
.mini-card__badge--warning { background: #f59e0b; }
.mini-card__badge--danger { background: #ef4444; }
.mini-card__badge--info { background: #64748b; }

.mini-card__actions {
  position: absolute;
  right: 14px;
  bottom: 12px;
  display: flex;
  gap: 6px;
  padding: 4px 8px;
  background: rgb(255 255 255 / 84%);
  border-radius: 999px;
}

.mini-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
}

.mini-card__header {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.mini-card__header h4 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
}

.mini-card__header p,
.mini-card__description {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.mini-card__sort,
.mini-card__path {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.mini-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mini-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mini-card__meta span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.mini-card__meta strong {
  display: block;
  word-break: break-all;
  color: var(--el-text-color-primary);
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
}

@media (width <= 720px) {
  .mini-menu-stats {
    grid-template-columns: 1fr;
  }

  .mini-card__meta {
    grid-template-columns: 1fr;
  }
}
</style>
