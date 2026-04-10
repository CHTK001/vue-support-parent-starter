<template>
  <div class="system-container menu-container">
    <!-- 保存对话框组件 -->
    <SaveDialog
      v-model:visible="saveDialogParams.visible"
      :mode="saveDialogParams.mode"
      :table-data="tableData"
      :menu-data="saveDialogParams.data"
      :current-engine="menuEngine"
      @success="onSuccess"
    />

    <div class="menu-wrapper">
      <ScContainer>
        <div v-if="showMiniProgramMenu" class="menu-engine-tabs">
          <el-tabs v-model="menuEngineTab" stretch>
            <el-tab-pane label="PC 菜单" name="0" />
            <el-tab-pane label="小程序菜单" name="1" />
          </el-tabs>
        </div>
        <div class="menu-source-note">
          <IconifyIconOnline icon="ri:information-line" />
          <span>{{ currentSourceHint }}</span>
        </div>
        <MiniProgramMenuPanel
          v-if="isMiniProgramEngine"
          :active="isMiniProgramEngine"
        />
        <template v-else>
        <!-- 统计面板 -->
        <div class="menu-stats">
          <div class="stat-item">
            <div class="stat-icon total">
              <IconifyIconOnline icon="ri:menu-line" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">全部菜单</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon directory">
              <IconifyIconOnline icon="ri:folder-line" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.directories }}</span>
              <span class="stat-label">目录</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon menu">
              <IconifyIconOnline icon="ri:file-list-line" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.menus }}</span>
              <span class="stat-label">菜单</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon button">
              <IconifyIconOnline icon="ri:cursor-line" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.buttons }}</span>
              <span class="stat-label">按钮</span>
            </div>
          </div>
        </div>
        <!-- 表格头部 -->
        <ScHeader class="toolbar-section menu-header">
          <div class="toolbar-left header-left">
            <ScInput
              v-model="searchKeyword"
              placeholder="搜索菜单名称/路由"
              clearable
              class="search-input"
              @input="handleSearch"
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" />
              </template>
            </ScInput>
          </div>
          <div class="toolbar-right header-actions">
            <!-- 展开/折叠全部 -->
            <ScTooltip
              :content="isExpanded ? '折叠全部' : '展开全部'"
              placement="top"
            >
              <ScButton
                :title="isExpanded ? '折叠全部菜单' : '展开全部菜单'"
                :aria-label="isExpanded ? '折叠全部菜单' : '展开全部菜单'"
                @click="toggleExpandAll"
              >
                <IconifyIconOnline
                  :icon="
                    isExpanded
                      ? 'ri:collapse-diagonal-line'
                      : 'ri:expand-diagonal-line'
                  "
                />
              </ScButton>
            </ScTooltip>
            <!-- 刷新按钮 -->
            <ScTooltip content="刷新" placement="top">
              <ScButton
                type="primary"
                :loading="loading.query"
                title="刷新菜单"
                aria-label="刷新菜单"
                @click="onSearch"
              >
                <IconifyIconOnline icon="ri:refresh-line" />
              </ScButton>
            </ScTooltip>
            <!-- 添加菜单按钮 -->
            <ScTooltip
              v-if="getConfig().AccountType != 'tenant'"
              content="添加菜单"
              placement="top"
            >
              <ScButton
                type="success"
                title="新增菜单"
                aria-label="新增菜单"
                @click="dialogOpen({ sysMenuType: 0 }, 'save')"
              >
                <IconifyIconOnline icon="ri:add-line" />
              </ScButton>
            </ScTooltip>
          </div>
        </ScHeader>

        <!-- 表格主体 -->
        <ScMain class="menu-main page-table-fill">
          <div class="menu-table-container">
            <!-- 加载骨架屏 -->
            <ScSkeleton v-if="loading.query" animated :rows="6" />

            <!-- 表格 -->
            <ScTable
              v-else
              ref="menuTableRef"
              :data="filteredTableData"
              class="menu-table table-fill"
              row-key="sysMenuId"
              border
              layout="table"
              :expand-row-keys="expandedRowKeys"
              @row-click="getOpenDetail"
            >
              <!-- 菜单名称列 -->
              <ScTableColumn
                prop="sysMenuTitle"
                label="菜单名称"
                min-width="220"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <div class="menu-name-cell flex">
                    <span class="menu-icon">
                      <IconifyIconOnline
                        :icon="row.sysMenuIcon || 'mdi:menu'"
                      />
                    </span>
                    <span v-if="row.sysMenuType !== 3" class="menu-title">
                      {{ transformI18n(row.sysMenuI18n || row.sysMenuTitle) }}
                    </span>
                    <div v-else class="menu-button">
                      <span class="button-title">{{
                        transformI18n(row.sysMenuI18n || row.sysMenuTitle)
                      }}</span>
                      <span class="button-perm">{{ row.sysMenuPerm }}</span>
                    </div>
                  </div>
                </template>
              </ScTableColumn>

              <!-- 菜单类型列 -->
              <ScTableColumn
                prop="sysMenuType"
                label="菜单类型"
                width="120"
                align="center"
              >
                <template #default="{ row }">
                  <ScTag
                    :type="getMenuTypeTag(row.sysMenuType).type"
                    effect="light"
                    class="menu-type-tag"
                  >
                    <IconifyIconOnline
                      :icon="getMenuTypeTag(row.sysMenuType).icon"
                      class="tag-icon"
                    />
                    <span>{{ getMenuTypeTag(row.sysMenuType).label }}</span>
                  </ScTag>
                </template>
              </ScTableColumn>

              <!-- 路由名称列 -->
              <ScTableColumn
                prop="sysMenuPath"
                label="路由名称"
                min-width="150"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <div class="route-name-cell">
                    <span v-if="row.sysMenuName">{{ row.sysMenuName }}</span>
                    <span v-else class="empty-value">-</span>
                    <ScIcon
                      v-if="row.sysMenuName"
                      v-copy:click="row.sysMenuName"
                      class="copy-icon"
                    >
                      <IconifyIconOnline icon="mdi:content-copy" />
                    </ScIcon>
                  </div>
                </template>
              </ScTableColumn>

              <!-- 路由路径列 -->
              <ScTableColumn
                prop="sysMenuPath"
                label="路由路径"
                min-width="150"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <span v-if="row.sysMenuPath">{{ row.sysMenuPath }}</span>
                  <span v-else class="empty-value">-</span>
                </template>
              </ScTableColumn>

              <!-- 组件路径列 -->
              <ScTableColumn
                prop="sysMenuComponent"
                label="组件路径"
                min-width="180"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <span v-if="row.sysMenuComponent">{{
                    row.sysMenuComponent
                  }}</span>
                  <span v-else class="empty-value">-</span>
                </template>
              </ScTableColumn>

              <!-- 排序列 -->
              <ScTableColumn
                prop="sysMenuSort"
                label="排序"
                width="80"
                align="center"
              />

              <!-- 隐藏列 -->
              <ScTableColumn
                v-if="getConfig().AccountType != 'tenant'"
                prop="sysMenuHidden"
                label="隐藏"
                width="80"
                align="center"
              >
                <template #default="{ row }">
                  <ScTag
                    :type="row.sysMenuHidden ? 'danger' : 'success'"
                    effect="light"
                    size="small"
                  >
                    {{ row.sysMenuHidden ? "是" : "否" }}
                  </ScTag>
                </template>
              </ScTableColumn>

              <!-- 操作列 -->
              <ScTableColumn
                v-if="getConfig().AccountType != 'tenant'"
                label="操作"
                width="180"
                fixed="right"
                align="center"
              >
                <template #default="{ row }">
                  <div class="action-buttons">
                    <!-- 编辑按钮 -->
                    <ScTooltip content="编辑菜单" placement="top">
                      <ScButton
                        type="primary"
                        link
                        title="编辑菜单"
                        aria-label="编辑菜单"
                        @click.stop="dialogOpen(row, 'edit')"
                      >
                        <IconifyIconOnline icon="mdi:pencil" />
                      </ScButton>
                    </ScTooltip>

                    <!-- 添加子菜单按钮 -->
                    <ScTooltip content="添加子菜单" placement="top">
                      <ScButton
                        type="success"
                        link
                        title="添加子菜单"
                        aria-label="添加子菜单"
                        @click.stop="
                          dialogOpen(
                            { sysMenuPid: row.sysMenuId, sysMenuType: 0 },
                            'save',
                          )
                        "
                      >
                        <IconifyIconOnline icon="mdi:playlist-plus" />
                      </ScButton>
                    </ScTooltip>

                    <!-- 删除确认框 -->
                    <ScPopconfirm
                      :title="$t('message.confimDelete')"
                      confirm-button-type="danger"
                      cancel-button-type="info"
                      @confirm="onDelete(row)"
                    >
                      <template #reference>
                        <ScButton
                          type="danger"
                          link
                          title="删除菜单"
                          aria-label="删除菜单"
                        >
                          <IconifyIconOnline icon="mdi:delete" />
                        </ScButton>
                      </template>
                    </ScPopconfirm>
                  </div>
                </template>
              </ScTableColumn>
            </ScTable>
          </div>
        </ScMain>
        </template>
      </ScContainer>
    </div>
  </div>
</template>

<script setup lang="ts">
// 引入 Vue 相关的 API
import { reactive, ref, computed, nextTick, watch } from "vue";
import SaveDialog from "./save.vue";
import MiniProgramMenuPanel from "./mini-program-panel.vue";

// 引入菜单相关的 API
import { fetchDeleteMenu, fetchListMenu } from "@/api/manage/menu";
import { clearRouter } from "@repo/core";
// 引入渲染图标的钩子函数
// 引入配置和国际化相关的工具函数
import { getConfig, transformI18n } from "@repo/config";
// 引入消息提示工具函数
import { message } from "@repo/utils";
// 引入国际化 API
import { useI18n } from "vue-i18n";

const MENU_ENGINE_STORAGE_KEY = "system.manage.menu.engine";
const MENU_CACHE_STORAGE_PREFIX = "system.manage.menu.cache.";

const readCachedEngine = () => {
  if (typeof window === "undefined") {
    return 0;
  }
  return window.localStorage.getItem(MENU_ENGINE_STORAGE_KEY) === "1" ? 1 : 0;
};

const persistMenuEngine = (engine: number) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MENU_ENGINE_STORAGE_KEY, String(engine));
};

const getMenuCacheStorageKey = (engine: number) =>
  `${MENU_CACHE_STORAGE_PREFIX}${engine}`;

const readCachedMenus = (engine: number) => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(getMenuCacheStorageKey(engine));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const persistMenus = (engine: number, data: any[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(
    getMenuCacheStorageKey(engine),
    JSON.stringify(data || []),
  );
};

const clearCachedMenus = (engine: number) => {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(getMenuCacheStorageKey(engine));
};

// 获取国际化实例
const { t } = useI18n();
// 定义表单数据
const form = reactive({
  sysMenuEngine: 0,
});

// 定义加载状态
const loading = reactive({
  query: false,
});

// 搜索关键词
const searchKeyword = ref("");
const menuEngine = ref(readCachedEngine());
const menuEngineTab = computed({
  get: () => String(menuEngine.value),
  set: (value: string) => {
    menuEngine.value = Number(value || 0);
  },
});
const showMiniProgramMenu = computed(() => !!getConfig().OpenMiniProgramMenu);
const isMiniProgramEngine = computed(
  () => showMiniProgramMenu.value && Number(menuEngine.value || 0) === 1,
);
const currentSourceHint = computed(() =>
  Number(menuEngine.value || 0) === 0
    ? "当前管理页读取 /v2/menu/list；左侧运行时导航读取 /v2/user/menu。保存或删除后会自动刷新导航缓存。"
    : "当前为小程序菜单卡片配置，读取 /v2/mini-menu/list，使用独立表 sys_mini_menu，并缓存当前页数据。",
);

// 是否展开全部
const isExpanded = ref(false);

// 表格引用
const menuTableRef = ref();

const collectExpandedRowKeys = (items: any[] = [], keys: number[] = []) => {
  items.forEach((item) => {
    if (item?.children?.length) {
      keys.push(item.sysMenuId);
      collectExpandedRowKeys(item.children, keys);
    }
  });
  return keys;
};

const expandedRowKeys = computed(() => {
  if (searchKeyword.value) {
    return collectExpandedRowKeys(filteredTableData.value, []);
  }
  return isExpanded.value ? collectExpandedRowKeys(tableData.value, []) : [];
});

const syncedExpandedKeys = ref<number[]>([]);

const buildRowMap = (items: any[] = [], map = new Map<number, any>()) => {
  items.forEach((item) => {
    if (!item) {
      return;
    }
    map.set(Number(item.sysMenuId), item);
    if (item.children?.length) {
      buildRowMap(item.children, map);
    }
  });
  return map;
};

const syncExpandedRows = async () => {
  await nextTick();
  const table = menuTableRef.value;
  if (!table?.toggleRowExpansion) {
    return;
  }

  const rowMap = buildRowMap(filteredTableData.value);
  const nextKeys = [
    ...new Set(expandedRowKeys.value.map((key) => Number(key))),
  ];
  const previousKeys = syncedExpandedKeys.value;

  previousKeys
    .filter((key) => !nextKeys.includes(key))
    .forEach((key) => {
      const row = rowMap.get(key);
      if (row) {
        table.toggleRowExpansion(row, false);
      }
    });

  nextKeys.forEach((key) => {
    const row = rowMap.get(key);
    if (row) {
      table.toggleRowExpansion(row, true);
    }
  });

  syncedExpandedKeys.value = nextKeys;
};

/**
 * 切换展开/折叠全部
 */
const toggleExpandAll = () => {
  isExpanded.value = !isExpanded.value;
};

/**
 * 过滤表格数据
 */
const filteredTableData = computed(() => {
  if (!searchKeyword.value) {
    return tableData.value;
  }
  const keyword = searchKeyword.value.toLowerCase();

  const filterTree = (items: any[]): any[] => {
    return items.reduce((acc, item) => {
      const title = (item.sysMenuTitle || "").toLowerCase();
      const name = (item.sysMenuName || "").toLowerCase();
      const path = (item.sysMenuPath || "").toLowerCase();
      const matches =
        title.includes(keyword) ||
        name.includes(keyword) ||
        path.includes(keyword);

      if (item.children?.length) {
        const filteredChildren = filterTree(item.children);
        if (filteredChildren.length > 0 || matches) {
          acc.push({ ...item, children: filteredChildren });
        }
      } else if (matches) {
        acc.push({ ...item });
      }

      return acc;
    }, []);
  };

  return filterTree(tableData.value);
});

/**
 * 处理搜索
 */
const handleSearch = () => {
  // 搜索时自动展开全部
  if (searchKeyword.value) {
    isExpanded.value = true;
  }
};

// 统计数据
const stats = reactive({
  total: 0,
  directories: 0,
  menus: 0,
  iframes: 0,
  links: 0,
  buttons: 0,
});

/**
 * 计算菜单统计数据
 */
const calcStats = (data: any[]) => {
  let total = 0;
  let directories = 0;
  let menus = 0;
  let iframes = 0;
  let links = 0;
  let buttons = 0;

  const countMenus = (items: any[]) => {
    items.forEach((item) => {
      total++;
      switch (item.sysMenuType) {
        case 0:
          if (item.children?.length > 0) {
            directories++;
          } else {
            menus++;
          }
          break;
        case 1:
          iframes++;
          break;
        case 2:
          links++;
          break;
        case 3:
          buttons++;
          break;
      }
      if (item.children?.length) {
        countMenus(item.children);
      }
    });
  };

  countMenus(data);
  stats.total = total;
  stats.directories = directories;
  stats.menus = menus;
  stats.iframes = iframes;
  stats.links = links;
  stats.buttons = buttons;
};

// 定义表格数据
const tableData = ref([]);
const menuCache = new Map<number, any[]>();

const cloneMenuTree = (data: any[] = []) => JSON.parse(JSON.stringify(data));

const normalizeMenuTreeOrder = (items: any[] = []) => {
  return [...items]
    .map((item) => ({
      ...item,
      children: Array.isArray(item?.children)
        ? normalizeMenuTreeOrder(item.children)
        : [],
    }))
    .sort((left, right) => {
      const sortDiff =
        Number(left?.sysMenuSort ?? 0) - Number(right?.sysMenuSort ?? 0);
      if (sortDiff !== 0) {
        return sortDiff;
      }

      const idDiff =
        Number(left?.sysMenuId ?? 0) - Number(right?.sysMenuId ?? 0);
      if (idDiff !== 0) {
        return idDiff;
      }

      return 0;
    });
};

const applyMenuTableData = (data: any[] = []) => {
  tableData.value = normalizeMenuTreeOrder(cloneMenuTree(data));
  calcStats(tableData.value);
};

const syncRuntimeMenus = async () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("async-routes");

  if (Number(menuEngine.value || 0) !== 0) {
    return;
  }

  try {
    await clearRouter();
  } catch {
    message("菜单缓存刷新失败，请手动刷新页面确认最新导航", {
      type: "warning",
    });
  }
};

const loadMenus = async (options: { force?: boolean } = {}) => {
  const currentEngine = Number(menuEngine.value || 0);
  if (!options.force && menuCache.has(currentEngine)) {
    applyMenuTableData(menuCache.get(currentEngine) || []);
    return;
  }
  if (!options.force) {
    const cachedMenus = readCachedMenus(currentEngine);
    if (cachedMenus) {
      menuCache.set(currentEngine, cloneMenuTree(cachedMenus));
      applyMenuTableData(cachedMenus);
      return;
    }
  }

  loading.query = true;
  try {
    const res = await fetchListMenu({
      ...form,
      sysMenuEngine: currentEngine,
    });
    const nextData = Array.isArray(res?.data) ? res.data : [];
    menuCache.set(currentEngine, cloneMenuTree(nextData));
    persistMenus(currentEngine, nextData);
    applyMenuTableData(nextData);
  } catch {
    applyMenuTableData([]);
    message("加载菜单列表失败", { type: "error" });
  } finally {
    loading.query = false;
  }
};

/**
 * 处理保存成功后的逻辑
 * @param {string} mode - 操作模式，'edit' 或 'save'
 * @param {Object} form - 表单数据
 */
const onSuccess = async () => {
  menuCache.delete(Number(menuEngine.value || 0));
  clearCachedMenus(Number(menuEngine.value || 0));
  await loadMenus({ force: true });
  await syncRuntimeMenus();
};

/**
 * 刷新菜单数据
 */
const onSearch = async () => loadMenus({ force: true });

/**
 * 处理表格行点击事件，展开子项
 * @param {Object} row - 当前行数据
 * @param {Object} column - 当前列数据
 * @param {Event} event - 点击事件
 */
const getOpenDetail = async (row, column, event) => {
  if (row.children && column?.label != "操作") {
    const expandIcon = event.currentTarget.querySelector(
      ".el-table__expand-icon",
    );
    if (expandIcon) {
      expandIcon.click();
    }
  }
};

// 定义保存对话框的参数
const saveDialogParams = reactive<{
  visible: boolean;
  mode: "save" | "edit" | "show";
  data: Record<string, any>;
}>({
  visible: false,
  mode: "save",
  data: {},
});

/**
 * 删除菜单
 * @param {Object} row - 当前行数据
 */
const onDelete = async (row) => {
  try {
    await fetchDeleteMenu(row.sysMenuId);
    menuCache.delete(Number(menuEngine.value || 0));
    clearCachedMenus(Number(menuEngine.value || 0));
    await loadMenus({ force: true });
    await syncRuntimeMenus();
    message(t("message.deleteSuccess"), { type: "success" });
    return;
  } catch {
    message("删除菜单失败", { type: "error" });
  }
};

/**
 * 打开保存对话框
 * @param {Object} item - 要编辑或保存的数据
 * @param {string} mode - 操作模式，'edit' 或 'save'
 */
const dialogOpen = async (
  item: Record<string, any> | null,
  mode: "save" | "edit" | "show",
) => {
  saveDialogParams.mode = mode;
  saveDialogParams.data = item
    ? { sysMenuEngine: menuEngine.value, ...item }
    : { sysMenuEngine: menuEngine.value };
  saveDialogParams.visible = true;
};

watch(
  menuEngine,
  (value) => {
    const nextEngine = showMiniProgramMenu.value ? value : 0;
    if (nextEngine !== value) {
      menuEngine.value = nextEngine;
      return;
    }
    persistMenuEngine(nextEngine);
    form.sysMenuEngine = nextEngine;
    searchKeyword.value = "";
    syncedExpandedKeys.value = [];
    if (nextEngine === 0) {
      void loadMenus();
      return;
    }
    loading.query = false;
    applyMenuTableData([]);
  },
  { immediate: true },
);

watch(
  showMiniProgramMenu,
  (enabled) => {
    if (!enabled && menuEngine.value !== 0) {
      menuEngine.value = 0;
    }
  },
  { immediate: true },
);

watch(
  [expandedRowKeys, filteredTableData],
  () => {
    void syncExpandedRows();
  },
  { flush: "post" },
);

/**
 * 获取菜单类型标签配置
 * @param {number} type - 菜单类型
 * @returns {Object} - 标签配置
 */
const getMenuTypeTag = (type) => {
  const types = {
    0: { label: "菜单", type: "primary", icon: "mdi:menu" },
    1: { label: "iframe", type: "warning", icon: "mdi:iframe" },
    2: { label: "外链", type: "danger", icon: "mdi:link-variant" },
    3: { label: "按钮", type: "info", icon: "mdi:button-cursor" },
  };
  return types[type] || types[0];
};
</script>

<style scoped lang="scss">
// 响应式适配
@media (width <= 1200px) {
  .menu-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width <= 768px) {
  .menu-stats {
    grid-template-columns: 1fr;
    padding: 12px;

    .stat-item {
      padding: 12px;
    }
  }
}

:deep(.cell:first-child) {
  display: flex;
  align-items: center;
}

// 统计面板
.menu-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .stat-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 12px;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 6px 14px rgb(15 23 42 / 6%);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      color: #fff;
      border-radius: 10px;

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.directory {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.menu {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &.button {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 22px;
        font-weight: 700;
        line-height: 1.2;
        color: var(--el-text-color-primary);
      }

      .stat-label {
        margin-top: 4px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.menu-source-note {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 20px 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;

  .iconify {
    color: var(--el-color-primary);
    font-size: 16px;
    flex-shrink: 0;
  }
}

.menu-engine-tabs {
  padding: 16px 20px 0;

  :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 4px;
    background: var(--el-fill-color-light);
    border-radius: 14px;
  }

  :deep(.el-tabs__item) {
    height: 42px;
    font-weight: 600;
  }
}

.menu-container {
  .menu-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    border-radius: var(--el-border-radius-base);
    box-shadow: none;

    :deep(.sc-container) {
      display: flex;
      flex: 1;
      flex-direction: column;
    }
  }

  .page-table-fill {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }

  .menu-header {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    height: auto !important;
    padding: 16px 20px;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-left {
      flex: 1;
      max-width: 300px;

      .search-input {
        :deep(.el-input__wrapper) {
          border-radius: 8px;
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;

      .el-button {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: box-shadow 0.2s ease;

        &:hover {
          box-shadow: 0 4px 10px rgb(15 23 42 / 8%);
        }

        .iconify {
          font-size: 16px;
        }
      }
    }
  }

  .menu-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    padding: 0;
    background-color: var(--el-bg-color-page);

    .menu-table-container {
      display: flex;
      flex: 1;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      background-color: var(--el-bg-color);
      // 添加圆角和阴影
      border-radius: var(--el-border-radius-base);
      box-shadow: none;
    }

    .menu-table {
      flex: 1;
      min-height: 0;

      :deep(.sc-table-container),
      :deep(.sc-table-wrapper),
      :deep(.sc-table-content-wrapper) {
        flex: 1;
        min-height: 0;
      }

      :deep(.el-table) {
        height: 100%;
      }

      :deep(.el-table__header) {
        background-color: var(--el-bg-color);

        // 美化表头
        th {
          font-weight: 600;
          color: var(--el-text-color-primary);
          background-color: var(--el-fill-color-light);
        }
      }

      :deep(.el-table__row) {
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
          background-color: var(--el-fill-color-light);
        }

        // 添加斑马纹效果
        &:nth-child(even) {
          background-color: var(--el-fill-color-lighter);
        }
      }

      :deep(.el-table__expand-icon) {
        &.el-table__expand-icon--expanded {
          transform: rotate(90deg);
        }
      }
    }

    .menu-name-cell {
      display: flex;
      gap: 8px;
      align-items: center;

      .menu-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        font-size: 16px;
        color: var(--el-color-primary);
        // 添加图标背景
        background-color: var(--el-color-primary-light-9);
        border-radius: 6px;
        transition: background-color 0.2s ease;

        &:hover {
          background-color: var(--el-color-primary-light-8);
        }
      }

      .menu-title {
        font-weight: 500;
      }

      .menu-button {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;

        .button-title {
          font-weight: 500;
        }

        .button-perm {
          padding: 2px 6px;
          font-size: 12px;
          color: var(--el-text-color-secondary);
          // 添加权限标签样式
          background-color: var(--el-fill-color-lighter);
          border-radius: 4px;
        }
      }
    }

    .menu-type-tag {
      display: inline-flex;
      gap: 4px;
      align-items: center;
      padding: 4px 8px;
      font-weight: 500;
      // 改进标签样式
      border-radius: 4px;
      box-shadow: 0 2px 4px rgb(0 0 0 / 5%);

      .tag-icon {
        font-size: 14px;
      }
    }

    .route-name-cell {
      display: flex;
      gap: 8px;
      align-items: center;

      .copy-icon {
        font-size: 14px;
        color: var(--el-color-primary);
        cursor: pointer;
        opacity: 0.6;
        transition: all 0.3s;

        &:hover {
          opacity: 1;
          transform: scale(1.2);
        }
      }
    }

    .empty-value {
      font-style: italic;
      color: var(--el-text-color-secondary);
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;

      .el-button {
        // 改进操作按钮样式
        border-radius: 6px;
        transition: opacity 0.2s ease;

        &:hover {
          opacity: 0.9;
        }

        .iconify {
          font-size: 18px;
        }
      }
    }
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .menu-stats {
    background: var(--el-bg-color-overlay);

    .stat-item {
      background: var(--el-fill-color);
    }
  }

  .menu-container {
    .menu-wrapper {
      box-shadow: none;
    }

    .menu-header {
      background-color: var(--el-bg-color-overlay);
      background-image: linear-gradient(
        to right,
        var(--el-bg-color-overlay),
        var(--el-bg-color)
      );
    }

    .menu-table-container {
      box-shadow: none;
    }

    .menu-table {
      :deep(.el-table__header) {
        background-color: var(--el-bg-color-overlay);

        th {
          background-color: var(--el-fill-color);
        }
      }

      :deep(.el-table__row) {
        &:nth-child(even) {
          background-color: var(--el-fill-color);
        }
      }
    }

    .menu-name-cell {
      .menu-icon {
        background-color: rgb(64 158 255 / 10%);
      }
    }
  }
}

.menu-wrapper,
.menu-main,
.menu-table-container {
  box-shadow: none !important;
}

.menu-stats {
  box-shadow: none !important;

  .stat-item {
    border: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: none !important;
  }
}

.menu-type-tag {
  box-shadow: none !important;
}

html.dark {
  .menu-stats .stat-item {
    border-color: rgba(71, 85, 105, 0.55);
  }
}
</style>
