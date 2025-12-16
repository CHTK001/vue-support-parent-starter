<template>
  <div class="menu-container">
    <!-- 保存对话框组件 -->
    <SaveDialog v-if="visible.save" ref="saveDialog" :mode="saveDialogParams.mode" @success="onSuccess"
      @close="dialogClose" />

    <div class="menu-wrapper">
      <el-container>
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
        <el-header class="menu-header">
          <div class="header-title">
            <IconifyIconOnline icon="mdi:menu" />
          </div>
          <div class="header-actions">
            <!-- 刷新按钮 -->
            <el-button type="primary" :loading="loading.query" class="refresh-btn" @click="onSearch">
              <IconifyIconOnline icon="mdi:refresh" />
            </el-button>

            <!-- 添加菜单按钮 -->
            <el-button v-if="getConfig().AccountType != 'tenant'" type="default" class="add-btn"
              @click="dialogOpen({ sysMenuType: 0 }, 'save')">
              <IconifyIconOnline icon="mdi:plus" />
            </el-button>
          </div>
        </el-header>

        <!-- 表格主体 -->
        <el-main class="menu-main">
          <div class="menu-table-container">
            <!-- 加载骨架屏 -->
            <el-skeleton v-if="loading.query" animated :rows="6" />

            <!-- 表格 -->
            <el-table v-else :data="tableData" row-key="sysMenuId" border class="menu-table" @row-click="getOpenDetail">
              <!-- 菜单名称列 -->
              <el-table-column prop="sysMenuTitle" label="菜单名称" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="menu-name-cell flex">
                    <span class="menu-icon">
                      <IconifyIconOnline :icon="row.sysMenuIcon || 'mdi:menu'" />
                    </span>
                    <span v-if="row.sysMenuType !== 3" class="menu-title">
                      {{ transformI18n(row.sysMenuI18n || row.sysMenuTitle) }}
                    </span>
                    <div v-else class="menu-button">
                      <span class="button-title">{{ transformI18n(row.sysMenuI18n || row.sysMenuTitle) }}</span>
                      <span class="button-perm">{{ row.sysMenuPerm }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <!-- 菜单类型列 -->
              <el-table-column prop="sysMenuType" label="菜单类型" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="getMenuTypeTag(row.sysMenuType).type" effect="light" class="menu-type-tag">
                    <IconifyIconOnline :icon="getMenuTypeTag(row.sysMenuType).icon" class="tag-icon" />
                    <span>{{ getMenuTypeTag(row.sysMenuType).label }}</span>
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 路由名称列 -->
              <el-table-column prop="sysMenuPath" label="路由名称" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="route-name-cell">
                    <span v-if="row.sysMenuName">{{ row.sysMenuName }}</span>
                    <span v-else class="empty-value">-</span>
                    <el-icon v-if="row.sysMenuName" v-copy:click="row.sysMenuName" class="copy-icon">
                      <IconifyIconOnline icon="mdi:content-copy" />
                    </el-icon>
                  </div>
                </template>
              </el-table-column>

              <!-- 路由路径列 -->
              <el-table-column prop="sysMenuPath" label="路由路径" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.sysMenuPath">{{ row.sysMenuPath }}</span>
                  <span v-else class="empty-value">-</span>
                </template>
              </el-table-column>

              <!-- 组件路径列 -->
              <el-table-column prop="sysMenuComponent" label="组件路径" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.sysMenuComponent">{{ row.sysMenuComponent }}</span>
                  <span v-else class="empty-value">-</span>
                </template>
              </el-table-column>

              <!-- 排序列 -->
              <el-table-column prop="sysMenuSort" label="排序" width="80" align="center" />

              <!-- 隐藏列 -->
              <el-table-column v-if="getConfig().AccountType != 'tenant'" prop="sysMenuHidden" label="隐藏" width="80"
                align="center">
                <template #default="{ row }">
                  <el-tag :type="row.sysMenuHidden ? 'danger' : 'success'" effect="light" size="small">
                    {{ row.sysMenuHidden ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 操作列 -->
              <el-table-column v-if="getConfig().AccountType != 'tenant'" label="操作" width="180" fixed="right"
                align="center">
                <template #default="{ row }">
                  <div class="action-buttons">
                    <!-- 编辑按钮 -->
                    <el-tooltip content="编辑菜单" placement="top">
                      <el-button type="primary" link @click.stop="dialogOpen(row, 'edit')">
                        <IconifyIconOnline icon="mdi:pencil" />
                      </el-button>
                    </el-tooltip>

                    <!-- 添加子菜单按钮 -->
                    <el-tooltip content="添加子菜单" placement="top">
                      <el-button type="success" link
                        @click.stop="dialogOpen({ sysMenuPid: row.sysMenuId, sysMenuType: 0 }, 'save')">
                        <IconifyIconOnline icon="mdi:playlist-plus" />
                      </el-button>
                    </el-tooltip>

                    <!-- 删除确认框 -->
                    <el-popconfirm :title="$t('message.confimDelete')" @confirm="onDelete(row)"
                      confirm-button-type="danger" cancel-button-type="info">
                      <template #reference>
                        <el-tooltip content="删除菜单" placement="top">
                          <el-button type="danger" link @click.stop>
                            <IconifyIconOnline icon="mdi:delete" />
                          </el-button>
                        </el-tooltip>
                      </template>
                    </el-popconfirm>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<script setup lang="ts">
// 引入 Vue 相关的 API
import { nextTick, reactive, ref } from "vue";

// 引入图标
// 引入保存对话框组件
import SaveDialog from "./save.vue";

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

// 统计数据
const stats = reactive({
  total: 0,
  directories: 0,
  menus: 0,
  iframes: 0,
  links: 0,
  buttons: 0
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
    items.forEach(item => {
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
    const item = tableData.value.filter((item) => item.sysMenuId === form.sysMenuId);
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
  true
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
  } catch (error) { }
};

/**
 * 打开保存对话框
 * @param {Object} item - 要编辑或保存的数据
 * @param {string} mode - 操作模式，'edit' 或 'save'
 */
const dialogOpen = async (item, mode) => {
  visible.save = true;
  await nextTick();
  saveDialog.value.setTableData(tableData.value).setData(item).open(mode);
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
    0: { label: '菜单', type: 'primary', icon: 'mdi:menu' },
    1: { label: 'iframe', type: 'warning', icon: 'mdi:iframe' },
    2: { label: '外链', type: 'danger', icon: 'mdi:link-variant' },
    3: { label: '按钮', type: 'info', icon: 'mdi:button-cursor' }
  };
  return types[type] || types[0];
};
</script>

<style scoped lang="scss">
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
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      color: #fff;

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
        color: var(--el-text-color-primary);
        line-height: 1.2;
      }

      .stat-label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .menu-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .menu-stats {
    grid-template-columns: 1fr;
    padding: 12px;

    .stat-item {
      padding: 12px;
    }
  }
}

.menu-container {
  height: 100%;
  background-color: var(--el-bg-color);

  .menu-wrapper {
    height: 100%;
    border-radius: var(--el-border-radius-base);
    overflow: hidden;
    box-shadow: var(--el-box-shadow-light);

    // 添加卡片悬浮效果
    transition: all 0.3s ease;

    &:hover {
      box-shadow: var(--el-box-shadow);
    }
  }

  .menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 20px;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
    // 添加渐变背景
    background-image: linear-gradient(to right, var(--el-bg-color), var(--el-bg-color-page));

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .iconify {
        font-size: 24px;
        color: var(--el-color-primary);
        // 添加图标悬浮效果
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.1);
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .el-button {
        display: flex;
        align-items: center;
        gap: 4px;
        // 添加按钮悬浮效果
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .iconify {
          font-size: 16px;
        }
      }
    }
  }

  .menu-main {
    padding: 0px;
    background-color: var(--el-bg-color-page);

    .menu-table-container {
      height: 100%;
      overflow: hidden;
      // 添加圆角和阴影
      border-radius: var(--el-border-radius-base);
      box-shadow: var(--el-box-shadow-lighter);
      background-color: var(--el-bg-color);
    }

    .menu-table {
      :deep(.el-table__header) {
        background-color: var(--el-bg-color);

        // 美化表头
        th {
          background-color: var(--el-fill-color-light);
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }

      :deep(.el-table__row) {
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background-color: var(--el-fill-color-light);
          transform: translateY(-1px);
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
      align-items: center;
      gap: 8px;

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
        transition: all 0.3s;

        &:hover {
          transform: scale(1.1);
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
          color: var(--el-text-color-secondary);
          font-size: 12px;
          // 添加权限标签样式
          background-color: var(--el-fill-color-lighter);
          padding: 2px 6px;
          border-radius: 4px;
        }
      }
    }

    .menu-type-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      // 改进标签样式
      border-radius: 4px;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

      .tag-icon {
        font-size: 14px;
      }
    }

    .route-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .copy-icon {
        cursor: pointer;
        color: var(--el-color-primary);
        font-size: 14px;
        opacity: 0.6;
        transition: all 0.3s;

        &:hover {
          opacity: 1;
          transform: scale(1.2);
        }
      }
    }

    .empty-value {
      color: var(--el-text-color-secondary);
      font-style: italic;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .el-button {
        // 改进操作按钮样式
        border-radius: 6px;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
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
:root[data-theme='dark'] {
  .menu-stats {
    background: var(--el-bg-color-overlay);

    .stat-item {
      background: var(--el-fill-color);
    }
  }

  .menu-container {
    .menu-wrapper {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }

    .menu-header {
      background-color: var(--el-bg-color-overlay);
      background-image: linear-gradient(to right, var(--el-bg-color-overlay), var(--el-bg-color));
    }

    .menu-table-container {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
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
        background-color: rgba(64, 158, 255, 0.1);
      }
    }
  }
}
</style>
