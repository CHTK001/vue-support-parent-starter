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
        <div
          class="menu-engine-layout"
          :class="{ 'has-mini-menu': showMiniProgramMenu }"
        >
          <div class="menu-engine-content">
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
                            {{
                              transformI18n(row.sysMenuI18n || row.sysMenuTitle)
                            }}
                          </span>
                          <div v-else class="menu-button">
                            <span class="button-title">{{
                              transformI18n(row.sysMenuI18n || row.sysMenuTitle)
                            }}</span>
                            <span class="button-perm">{{
                              row.sysMenuPerm
                            }}</span>
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
                          <span>{{
                            getMenuTypeTag(row.sysMenuType).label
                          }}</span>
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
                          <span v-if="row.sysMenuName">{{
                            row.sysMenuName
                          }}</span>
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
                        <span v-if="row.sysMenuPath">{{
                          row.sysMenuPath
                        }}</span>
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
                        <div class="component-path-cell">
                          <span v-if="row.sysMenuComponent">{{
                            row.sysMenuComponent
                          }}</span>
                          <span v-else class="empty-value">-</span>
                          <ScTooltip
                            v-if="getComponentConflictMenu(row)"
                            :content="getComponentConflictMessage(row)"
                            placement="top"
                          >
                            <ScTag
                              type="warning"
                              effect="light"
                              size="small"
                              class="component-warning-tag"
                            >
                              指向
                              {{ getComponentConflictMenu(row)?.sysMenuTitle }}
                            </ScTag>
                          </ScTooltip>
                        </div>
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
                      align="center"
                      fixed="right"
                    >
                      <template #default="{ row }">
                        <div class="action-buttons">
                          <button
                            type="button"
                            class="menu-action-button menu-action-button--primary"
                            title="编辑菜单"
                            aria-label="编辑菜单"
                            @click.stop.prevent="dialogOpen(row, 'edit')"
                          >
                            <IconifyIconOnline icon="mdi:pencil" />
                          </button>

                          <button
                            type="button"
                            class="menu-action-button menu-action-button--success"
                            title="添加子菜单"
                            aria-label="添加子菜单"
                            @click.stop.prevent="
                              dialogOpen(
                                { sysMenuPid: row.sysMenuId, sysMenuType: 0 },
                                'save',
                              )
                            "
                          >
                            <IconifyIconOnline icon="mdi:playlist-plus" />
                          </button>

                          <!-- 删除确认框 -->
                          <ScPopconfirm
                            :title="$t('message.confimDelete')"
                            confirm-button-type="danger"
                            cancel-button-type="info"
                            @confirm="onDelete(row)"
                          >
                            <template #reference>
                              <button
                                type="button"
                                class="menu-action-button menu-action-button--danger"
                                title="删除菜单"
                                aria-label="删除菜单"
                                @click.stop.prevent
                              >
                                <IconifyIconOnline icon="mdi:delete" />
                              </button>
                            </template>
                          </ScPopconfirm>
                        </div>
                      </template>
                    </ScTableColumn>
                  </ScTable>
                </div>
              </ScMain>
            </template>
          </div>

          <aside v-if="showMiniProgramMenu" class="menu-engine-sidebar">
            <ScTooltip
              v-for="item in menuEngineOptions"
              :key="item.value"
              placement="left"
              effect="dark"
            >
              <template #content>
                <div class="menu-engine-tooltip">
                  <strong>{{ item.label }}</strong>
                  <span>{{ item.description }}</span>
                </div>
              </template>

              <button
                type="button"
                class="menu-engine-sidebar__item"
                :class="{ 'is-active': menuEngineTab === item.value }"
                :title="item.label"
                :aria-label="item.label"
                @click="menuEngineTab = item.value"
              >
                <IconifyIconOnline :icon="item.icon" />
              </button>
            </ScTooltip>
          </aside>
        </div>
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
import { localStorageProxy, message } from "@repo/utils";
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
const menuEngineOptions = [
  {
    value: "0",
    label: "PC 菜单",
    description: "管理后台导航、目录和按钮权限",
    icon: "ri:layout-left-line",
  },
  {
    value: "1",
    label: "小程序菜单",
    description: "管理小程序卡片、图标与访问权限",
    icon: "ri:apps-2-line",
  },
];
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

const flattenMenuTree = (items: any[] = [], list: any[] = []) => {
  items.forEach((item) => {
    if (!item) {
      return;
    }
    list.push(item);
    if (Array.isArray(item.children) && item.children.length > 0) {
      flattenMenuTree(item.children, list);
    }
  });
  return list;
};

const normalizeComparablePath = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/[?#].*$/, "")
    .replace(/^@repo\/pages\//, "")
    .replace(/^@pages\/common\//, "")
    .replace(/^@pages\//, "")
    .replace(/^\/?src\/views\//, "")
    .replace(/^\/?views\//, "")
    .replace(/^\/+/, "")
    .replace(/\.vue$/i, "")
    .replace(/\/index$/i, "")
    .replace(/\/+$/, "");

const routeMenuPathMap = computed(() => {
  return flattenMenuTree(tableData.value)
    .filter((item) => Number(item?.sysMenuType) === 0)
    .reduce((map, item) => {
      const normalizedPath = normalizeComparablePath(item?.sysMenuPath);
      if (normalizedPath) {
        map.set(normalizedPath, item);
      }
      return map;
    }, new Map<string, any>());
});

const getComponentConflictMenu = (row: any) => {
  if (!row || Number(row?.sysMenuType) !== 0) {
    return null;
  }

  const rowPath = normalizeComparablePath(row?.sysMenuPath);
  const componentPath = normalizeComparablePath(row?.sysMenuComponent);
  if (!rowPath || !componentPath) {
    return null;
  }

  const linkedMenu = routeMenuPathMap.value.get(componentPath);
  if (!linkedMenu || Number(linkedMenu?.sysMenuId) === Number(row?.sysMenuId)) {
    return null;
  }

  return normalizeComparablePath(linkedMenu?.sysMenuPath) !== rowPath
    ? linkedMenu
    : null;
};

const getComponentConflictMessage = (row: any) => {
  const conflictMenu = getComponentConflictMenu(row);
  if (!conflictMenu) {
    return "";
  }
  return `当前组件会命中已有菜单「${transformI18n(conflictMenu.sysMenuI18n || conflictMenu.sysMenuTitle)}」(${conflictMenu.sysMenuPath})，点击后会直接打开该页面。`;
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

  localStorageProxy().removeItem("async-routes");
  window.localStorage.removeItem("async-routes");
  window.localStorage.removeItem("systemasync-routes");
  clearCachedMenus(0);
  menuCache.delete(0);

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
.menu-container {
  --menu-surface: var(--el-bg-color);
  --menu-surface-alt: var(--el-fill-color-light);
  --menu-surface-soft: var(--el-fill-color-lighter);
  --menu-border: var(--el-border-color-lighter);
  --menu-text-muted: var(--el-text-color-secondary);
  --menu-shadow: 0 12px 28px rgb(15 23 42 / 6%);
  --menu-shadow-strong: 0 18px 36px rgb(15 23 42 / 8%);
  --menu-accent-soft: rgb(var(--el-color-primary-rgb) / 8%);
  --menu-accent-strong: rgb(var(--el-color-primary-rgb) / 12%);
  --menu-accent-border: rgb(var(--el-color-primary-rgb) / 24%);
}

:deep(.cell:first-child) {
  display: flex;
  align-items: center;
}

.menu-engine-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 18px;
  padding: 18px 20px 20px;
}

.menu-engine-sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  order: 2;
  width: 74px;
  flex-shrink: 0;
  align-self: flex-start;
  padding: 8px;
  background: var(--menu-surface-soft);
  border: 1px solid var(--menu-border);
  border-radius: 22px;
  box-shadow: var(--menu-shadow);
}

.menu-engine-sidebar__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  min-height: 56px;
  padding: 0;
  border-radius: 16px;
  border: 1px solid var(--menu-border);
  background: linear-gradient(
    180deg,
    rgb(255 255 255 / 92%),
    rgb(248 250 252 / 88%)
  );
  color: var(--el-text-color-regular);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;

  .iconify {
    font-size: 20px;
    color: var(--el-color-primary);
  }

  &:hover {
    transform: translateY(-1px);
    border-color: var(--menu-accent-border);
    background: var(--menu-accent-soft);
    box-shadow: var(--menu-shadow);
  }

  &.is-active {
    color: var(--el-color-primary);
    border-color: rgb(var(--el-color-primary-rgb) / 30%);
    background: var(--menu-accent-strong);
    box-shadow: 0 10px 22px rgb(var(--el-color-primary-rgb) / 12%);
  }
}

.menu-engine-tooltip {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 13px;
    font-weight: 700;
    color: #fff;
  }

  span {
    max-width: 220px;
    font-size: 12px;
    line-height: 1.5;
    color: rgb(226 232 240 / 88%);
  }
}

.menu-engine-content {
  display: flex;
  flex: 1;
  order: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.menu-source-note {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 14px;
  color: var(--menu-text-muted);
  font-size: 13px;
  background: var(--menu-surface-soft);
  border: 1px solid var(--menu-border);
  border-radius: 14px;
  box-shadow: var(--menu-shadow);

  .iconify {
    color: var(--el-color-primary);
    font-size: 16px;
    flex-shrink: 0;
  }
}

.menu-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px;
  background: var(--menu-surface);
  border-bottom: 1px solid var(--menu-border);

  .stat-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 16px;
    background: var(--menu-surface-soft);
    border: 1px solid rgb(226 232 240 / 80%);
    border-radius: 12px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background-color 0.2s ease;

    &:hover {
      border-color: var(--menu-accent-border);
      box-shadow: var(--menu-shadow);
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
        color: var(--menu-text-muted);
      }
    }
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

    :deep(.sc-container) {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;
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
    background-color: var(--menu-surface);
    border-bottom: 1px solid var(--menu-border);

    .header-left {
      flex: 1;
      max-width: 300px;

      .search-input {
        :deep(.el-input__wrapper) {
          border-radius: 8px;
          box-shadow: none;
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
          box-shadow: var(--menu-shadow);
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
    min-block-size: clamp(280px, 46vh, 420px);
    padding: 0;
    background-color: transparent;
    overflow: hidden;

    .menu-table-container {
      display: flex;
      flex: 1;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      min-block-size: inherit;
      overflow: hidden;
      background-color: var(--menu-surface);
      border: 1px solid var(--menu-border);
      border-radius: var(--el-border-radius-base);
      box-shadow: var(--menu-shadow);
    }

    .menu-table {
      flex: 1;
      min-height: 0;

      :deep(.sc-table-container),
      :deep(.sc-table-wrapper),
      :deep(.sc-table-auto-height),
      :deep(.table-container),
      :deep(.sc-table-content-wrapper) {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }

      :deep(.el-table),
      :deep(.el-table__inner-wrapper),
      :deep(.el-table__header-wrapper),
      :deep(.el-table__body-wrapper) {
        background: transparent;
      }

      :deep(.el-table) {
        height: 100%;
      }

      :deep(.el-table__inner-wrapper) {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-height: 0;
      }

      :deep(.el-table__body-wrapper) {
        flex: 1;
        min-height: 0;
      }

      :deep(.sc-table-pagination-wrapper) {
        flex-shrink: 0;
      }

      :deep(.el-table td.el-table__cell),
      :deep(.el-table th.el-table__cell) {
        border-bottom-color: var(--menu-border);
      }

      :deep(.el-table__inner-wrapper::before) {
        background-color: transparent;
      }

      :deep(.el-table__header) {
        background-color: var(--menu-surface);

        th {
          font-weight: 600;
          color: var(--el-text-color-primary);
          background-color: var(--menu-surface-alt);
        }
      }

      :deep(.el-table__row) {
        cursor: pointer;
        transition: background-color 0.2s ease;
        background-color: var(--menu-surface);

        &:hover {
          background-color: var(--menu-surface-alt);
        }

        &:nth-child(even) {
          background-color: var(--menu-surface-soft);
        }
      }

      :deep(.el-table__row:hover > td.el-table__cell) {
        background-color: var(--menu-surface-alt);
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
        background-color: var(--el-color-primary-light-9);
        border-radius: 6px;
        transition: background-color 0.2s ease;

        &:hover {
          background-color: var(--el-color-primary-light-8);
        }
      }

      .menu-title,
      .button-title {
        font-weight: 500;
      }

      .menu-button {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;

        .button-perm {
          padding: 2px 6px;
          font-size: 12px;
          color: var(--menu-text-muted);
          background-color: var(--menu-surface-soft);
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
      border-radius: 4px;

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
        opacity: 0.7;
        transition: all 0.2s ease;

        &:hover {
          opacity: 1;
          transform: scale(1.14);
        }
      }
    }

    .component-path-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .component-warning-tag {
      border-color: rgb(var(--el-color-warning-rgb) / 26%);
      background: rgb(var(--el-color-warning-rgb) / 14%);
      color: var(--el-color-warning);
    }

    .empty-value {
      font-style: italic;
      color: var(--menu-text-muted);
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;

      .menu-action-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 0;
        border-radius: 6px;
        background: transparent;
        transition:
          opacity 0.2s ease,
          background-color 0.2s ease,
          color 0.2s ease;

        &:hover {
          opacity: 0.9;
        }

        .iconify {
          font-size: 18px;
        }
      }

      .menu-action-button--primary {
        color: var(--el-color-primary);

        &:hover {
          background: rgb(var(--el-color-primary-rgb) / 10%);
        }
      }

      .menu-action-button--success {
        color: var(--el-color-success);

        &:hover {
          background: rgb(var(--el-color-success-rgb) / 10%);
        }
      }

      .menu-action-button--danger {
        color: var(--el-color-danger);

        &:hover {
          background: rgb(var(--el-color-danger-rgb) / 10%);
        }
      }
    }
  }
}

.menu-wrapper,
.menu-main,
.menu-table-container,
.menu-stats,
.menu-type-tag {
  box-shadow: none !important;
}

@media (width <= 1200px) {
  .menu-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width <= 960px) {
  .menu-engine-layout {
    flex-direction: column;
    padding: 16px;
  }

  .menu-engine-sidebar {
    width: 100%;
    flex-direction: row;
    order: 1;
    align-self: stretch;
    justify-content: flex-end;
  }

  .menu-engine-sidebar__item {
    flex: 1;
    width: auto;
  }

  .menu-engine-content {
    order: 2;
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

html.dark {
  .menu-container {
    --menu-surface: rgb(15 23 42 / 88%);
    --menu-surface-alt: rgb(30 41 59 / 88%);
    --menu-surface-soft: rgb(15 23 42 / 72%);
    --menu-border: rgb(148 163 184 / 16%);
    --menu-text-muted: #94a3b8;
    --menu-shadow: 0 18px 34px rgb(2 8 23 / 24%);
    --menu-shadow-strong: 0 22px 42px rgb(2 8 23 / 30%);
    --menu-accent-soft: rgb(var(--el-color-primary-rgb) / 16%);
    --menu-accent-strong: rgb(var(--el-color-primary-rgb) / 22%);
    --menu-accent-border: rgb(var(--el-color-primary-rgb) / 26%);
  }

  .menu-stats .stat-item {
    border-color: rgb(71 85 105 / 55%);
  }

  .menu-engine-sidebar__item {
    background: linear-gradient(
      180deg,
      rgb(15 23 42 / 92%),
      rgb(30 41 59 / 84%)
    );
    color: #cbd5e1;

    &:hover {
      background: var(--menu-accent-soft);
    }

    &.is-active {
      color: #ffffff;
      box-shadow: var(--menu-shadow-strong);
    }
  }

  .menu-name-cell {
    .menu-icon {
      background: rgb(var(--el-color-primary-rgb) / 16%);
    }

    .menu-button .button-perm {
      background: rgb(15 23 42 / 76%);
      color: #cbd5e1;
    }
  }

  .route-name-cell .copy-icon {
    color: #93c5fd;
  }
}
</style>
