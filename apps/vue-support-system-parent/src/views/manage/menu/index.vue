<template>
  <div class="system-container menu-container">
    <!-- 保存对话框组件 -->
    <SaveDialog
      v-if="visible.save"
      ref="saveDialog"
      :mode="saveDialogParams.mode"
      @success="onSuccess"
      @close="dialogClose"
    />

    <div class="menu-wrapper">
      <ScContainer>
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
              <ScButton @click="toggleExpandAll">
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
                @click="dialogOpen({ sysMenuType: 0 }, 'save')"
              >
                <IconifyIconOnline icon="ri:add-line" />
              </ScButton>
            </ScTooltip>
          </div>
        </ScHeader>

        <!-- 表格主体 -->
        <ScMain class="menu-main">
          <div class="menu-table-container">
            <!-- 加载骨架屏 -->
            <ScSkeleton v-if="loading.query" animated :rows="6" />

            <!-- 表格 -->
            <ScTable
              v-else
              ref="menuTableRef"
              :data="filteredTableData"
              row-key="sysMenuId"
              border
              class="modern-table menu-table"
              :default-expand-all="isExpanded"
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
                        <ScTooltip content="删除菜单" placement="top">
                          <ScButton type="danger" link @click.stop>
                            <IconifyIconOnline icon="mdi:delete" />
                          </ScButton>
                        </ScTooltip>
                      </template>
                    </ScPopconfirm>
                  </div>
                </template>
              </ScTableColumn>
            </ScTable>
          </div>
        </ScMain>
      </ScContainer>
    </div>
  </div>
</template>

<script setup lang="ts">
// 引入 Vue 相关的 API
import { nextTick, reactive, ref, computed, defineAsyncComponent } from "vue";

// 异步加载保存对话框组件（对话框类组件适合异步加载）
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

// 引入菜单相关的 API
import { fetchDeleteMenu, fetchListMenu } from "@/api/manage/menu";
// 引入防抖工具函数
import { debounce } from "@pureadmin/utils";
// 引入渲染图标的钩子函数
// 引入配置和国际化相关的工具函数
import { getConfig, transformI18n } from "@repo/config";
// 引入消息提示工具函数
import { message } from "@repo/utils";
// 引入国际化 API
import { useI18n } from "vue-i18n";

// 获取国际化实例
const { t } = useI18n();
// 定义表单数据
const form = reactive({});

// 定义对话框可见状态
const visible = reactive({
  save: false,
});

// 定义加载状态
const loading = reactive({
  query: false,
});

// 搜索关键词
const searchKeyword = ref("");

// 是否展开全部
const isExpanded = ref(false);

// 表格引用
const menuTableRef = ref();

/**
 * 切换展开/折叠全部
 */
const toggleExpandAll = () => {
  isExpanded.value = !isExpanded.value;
  // 刷新表格以应用新的展开状态
  onSearch();
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
// 定义表单引用
const formRef = ref();
// 定义表格引用
const table = ref(null);
// 定义保存对话框引用
const saveDialog = ref(null);

/**
 * 重置表单并重新搜索
 * @param {Object} formRef - 表单引用
 */
const resetForm = async (formRef) => {
  formRef.resetFields();
  onSearch();
};

// 定义表格数据
const tableData = ref([]);

/**
 * 递归修改表格数据中的项
 * @param {Array} data - 表格数据
 * @param {Object} form - 要修改的表单数据
 * @returns {boolean} - 是否修改成功
 */
const doChange = async (data, form) => {
  if (!data) {
    return;
  }
  const item = data.filter((item) => item.sysMenuId === form.sysMenuId);
  if (null != item && item.length > 0) {
    Object.assign(item[0], form);
    return true;
  }
  for (var i = 0; i < data.length; i++) {
    if (doChange(data[i]?.children, form)) {
      break;
    }
  }
  return true;
};

/**
 * 处理保存成功后的逻辑
 * @param {string} mode - 操作模式，'edit' 或 'save'
 * @param {Object} form - 表单数据
 */
const onSuccess = async (mode, form) => {
  if (mode == "edit") {
    const item = tableData.value.filter(
      (item) => item.sysMenuId === form.sysMenuId,
    );
    if (null != item && item.length > 0) {
      Object.assign(item[0], form);
      return;
    }
    for (var i = 0; i < tableData.value.length; i++) {
      if (doChange(tableData[i]?.children, form)) {
        break;
      }
    }
    return;
  }
  onSearch();
};

/**
 * 搜索菜单数据，使用防抖处理
 */
const onSearch = debounce(
  async () => {
    loading.query = true;
    fetchListMenu(form)
      .then((res) => {
        const { data, code } = res;
        tableData.value = data;
        calcStats(data);
        return;
      })
      .finally(() => {
        loading.query = false;
      });
  },
  1000,
  true,
);

// 页面加载时执行搜索
onSearch();

/**
 * 处理表格行点击事件，展开子项
 * @param {Object} row - 当前行数据
 * @param {Object} column - 当前列数据
 * @param {Event} event - 点击事件
 */
const getOpenDetail = async (row, column, event) => {
  if (row.children && column?.label != "操作") {
    if (event.currentTarget.querySelector(".el-table__expand-icon")) {
      event.currentTarget.querySelector(".el-table__expand-icon").click();
    }
  }
};

// 定义保存对话框的参数
const saveDialogParams = reactive({
  mode: "save",
});

/**
 * 删除菜单
 * @param {Object} row - 当前行数据
 */
const onDelete = async (row) => {
  try {
    const { code } = await fetchDeleteMenu(row.sysMenuId);
    onSearch();
    message(t("message.deleteSuccess"), { type: "success" });
    return;
  } catch (error) {}
};

/**
 * 打开保存对话框
 * @param {Object} item - 要编辑或保存的数据
 * @param {string} mode - 操作模式，'edit' 或 'save'
 */
const dialogOpen = async (item, mode) => {
  visible.save = true;
  await nextTick();
  saveDialog.value?.setTableData(tableData.value);
  saveDialog.value?.setData(item);
  saveDialog.value?.open(mode);
};

/**
 * 关闭保存对话框
 */
const dialogClose = async () => {
  visible.save = false;
};

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

.menu-container {
  height: 100%;
  background-color: var(--el-bg-color);

  .menu-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    border-radius: var(--el-border-radius-base);
    box-shadow: none;

    :deep(.sc-container) {
      height: 100%;
      min-height: 0;
    }
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
</style>
