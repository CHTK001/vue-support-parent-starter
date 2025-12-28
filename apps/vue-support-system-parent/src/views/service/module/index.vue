<script setup lang="ts">
import { 
  fetchDeleteServiceModule, 
  fetchPageServiceModule, 
  fetchUpdateServiceModule,
  fetchServiceModuleStats,
  type ServiceModuleStats 
} from "@/api/service/module";
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { message } from "@repo/utils";
import { computed, defineAsyncComponent, onMounted, reactive, ref, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import { fetchListMenu } from "@/api/manage/menu";

const { t } = useI18n();
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

const saveDialogRef = shallowRef(null);
const tableRef = shallowRef(null);
const formRef = ref();

// 统计数据
const stats = reactive<ServiceModuleStats>({
  total: 0,
  enabled: 0,
  disabled: 0,
  apiCount: 0,
  serviceCount: 0
});

const env = reactive({
  params: {
    sysServiceModuleName: '',
    sysServiceModuleStatus: null as number | null,
    sysServiceModuleType: null as string | null
  },
  loading: false,
  menuList: [] as any[],
});

const status = reactive({
  delete: false,
  statsLoading: false
});

// 状态选项
const statusOptions = [
  { label: '全部', value: null },
  { label: '启用', value: 0 },
  { label: '禁用', value: 1 }
];

// 类型选项
const typeOptions = [
  { label: '全部', value: null },
  { label: '接口', value: 'API' },
  { label: '服务', value: 'SERVICE' }
];

const loadingTag = computed(() => env.loading);

// 加载统计数据
const loadStats = async () => {
  status.statsLoading = true;
  try {
    const res = await fetchServiceModuleStats();
    if (res.data) {
      Object.assign(stats, res.data);
    }
  } catch (e) {
    console.error('获取统计数据失败', e);
  } finally {
    status.statsLoading = false;
  }
};

const loadData = () => {
  tableRef.value?.reload(env.params);
  loadStats();
};

const onSearch = debounce(
  async () => {
    loadData();
  },
  500,
  true
);

const resetForm = () => {
  formRef.value?.resetFields();
  env.params.sysServiceModuleName = '';
  env.params.sysServiceModuleStatus = null;
  env.params.sysServiceModuleType = null;
  loadData();
};

const handleEdit = async (row: any, mode: string) => {
  saveDialogRef.value?.handleLoadMenuList(env.menuList);
  saveDialogRef.value?.handleOpen(row, mode);
};

const handleDelete = async (row: any) => {
  status.delete = true;
  fetchDeleteServiceModule(row)
    .then(() => {
      message(t("message.deleteSuccess"), { type: "success" });
      loadData();
    })
    .finally(() => {
      status.delete = false;
    });
};

const handleUpdate = async (row: any) => {
  fetchUpdateServiceModule(row).then(() => {
    message(t("message.updateSuccess"), { type: "success" });
    loadStats();
  });
};

const loadMenuList = async () => {
  env.loading = true;
  fetchListMenu({})
    .then((res) => {
      env.menuList = res.data || [];
    })
    .finally(() => {
      env.loading = false;
    });
};

const handleListEquals = (arr: any[], tag: number): any => {
  const item = arr.find((it) => it.sysMenuId === tag);
  if (item) return item;
  for (const it of arr) {
    if (it.children) {
      const _item = handleListEquals(it.children, tag);
      if (_item) return _item;
    }
  }
  return null;
};

const handleRenderTagName = (tag: number) => {
  const find = handleListEquals(env.menuList, tag);
  return find?.sysMenuTitle;
};

// 数据加载完成回调
const onDataLoaded = (data: any[], total: number) => {
  stats.total = total || 0;
};

onMounted(async () => {
  loadMenuList();
  loadStats();
});
</script>

<template>
  <div class="module-container">
    <SaveDialog ref="saveDialogRef" @success="loadData" />
    <div class="module-wrapper">
      <el-container>
        <!-- 统计面板 -->
        <div class="module-stats">
          <div class="stat-item">
            <div class="stat-icon total">
              <IconifyIconOnline icon="ri:puzzle-line" :size="28" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">全部模块</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon enabled">
              <IconifyIconOnline icon="ri:checkbox-circle-line" :size="28" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.enabled }}</span>
              <span class="stat-label">已启用</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon disabled">
              <IconifyIconOnline icon="ri:forbid-line" :size="28" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.disabled }}</span>
              <span class="stat-label">已禁用</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon api">
              <IconifyIconOnline icon="ri:code-s-slash-line" :size="28" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.apiCount }}</span>
              <span class="stat-label">API接口</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon service">
              <IconifyIconOnline icon="ri:server-line" :size="28" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.serviceCount }}</span>
              <span class="stat-label">服务模块</span>
            </div>
          </div>
        </div>

        <!-- 搜索栏 -->
        <el-header class="module-header">
          <div class="left-panel">
            <el-form ref="formRef" :inline="true" :model="env.params" class="search-form">
              <el-form-item label="模块名称" prop="sysServiceModuleName">
                <el-input 
                  v-model="env.params.sysServiceModuleName" 
                  placeholder="请输入模块名称" 
                  clearable 
                  class="!w-[180px]"
                  @keyup.enter="onSearch"
                />
              </el-form-item>
              <el-form-item label="状态" prop="sysServiceModuleStatus">
                <el-select 
                  v-model="env.params.sysServiceModuleStatus" 
                  placeholder="全部" 
                  clearable 
                  class="!w-[100px]"
                >
                  <el-option 
                    v-for="item in statusOptions" 
                    :key="item.value" 
                    :label="item.label" 
                    :value="item.value" 
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="类型" prop="sysServiceModuleType">
                <el-select 
                  v-model="env.params.sysServiceModuleType" 
                  placeholder="全部" 
                  clearable 
                  class="!w-[100px]"
                >
                  <el-option 
                    v-for="item in typeOptions" 
                    :key="item.value" 
                    :label="item.label" 
                    :value="item.value" 
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
          <div class="right-panel">
            <div class="right-panel-search">
              <el-button type="primary" :icon="useRenderIcon('ri:search-line')" @click="onSearch">
                搜索
              </el-button>
              <el-button :icon="useRenderIcon('ep:refresh')" @click="resetForm">
                重置
              </el-button>
              <el-button type="success" :icon="useRenderIcon('ep:plus')" @click="handleEdit({}, 'save')">
                新增
              </el-button>
            </div>
          </div>
        </el-header>

        <!-- 数据表格 -->
        <el-main class="module-main">
          <div class="table-wrapper">
            <ScTable ref="tableRef" :url="fetchPageServiceModule" :params="env.params" @data-loaded="onDataLoaded" height="auto">
              <el-table-column type="index" label="序号" width="80" align="center">
                <template #default="scope">
                  <el-tag type="primary" size="small" effect="plain">{{ scope.$index + 1 }}</el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="模块信息" min-width="240">
                <template #default="{ row }">
                  <div class="module-info-cell">
                    <div class="module-icon" :class="row.sysServiceModuleType === 'API' ? 'api' : 'service'">
                      <IconifyIconOnline 
                        :icon="row.sysServiceModuleType === 'API' ? 'ri:code-s-slash-fill' : 'ri:server-fill'" 
                        :size="20" 
                      />
                    </div>
                    <div class="module-details">
                      <div class="module-name">
                        <span>{{ row.sysServiceModuleName }}</span>
                        <el-tag 
                          v-if="row.sysServiceModuleVersion" 
                          size="small" 
                          effect="plain" 
                          class="ml-2"
                        >
                          v{{ row.sysServiceModuleVersion }}
                        </el-tag>
                      </div>
                      <div class="module-code">
                        <IconifyIconOnline icon="ri:code-line" :size="12" class="mr-1" />
                        {{ row.sysServiceModuleCode || '-' }}
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="关联菜单" min-width="350">
                <template #default="{ row }">
                  <div class="menu-tags" v-if="row.sysServiceModuleMenuTags">
                    <el-tag 
                      v-for="tag in row.sysServiceModuleMenuTags.split(',')"
                      :key="tag" 
                      size="small"
                      effect="light" 
                      type="success"
                      class="menu-tag"
                    >
                      <IconifyIconOnline icon="ri:menu-line" :size="12" class="mr-1" />
                      {{ handleRenderTagName(~~tag) || '未知菜单' }}
                    </el-tag>
                  </div>
                  <span v-else class="text-placeholder">暂无关联菜单</span>
                </template>
              </el-table-column>
              
              <el-table-column label="类型" width="100" align="center">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.sysServiceModuleType === 'API' ? 'primary' : 'warning'"
                    effect="dark"
                    size="small"
                  >
                    <IconifyIconOnline 
                      :icon="row.sysServiceModuleType === 'API' ? 'ri:code-s-slash-line' : 'ri:server-line'" 
                      :size="12" 
                      class="mr-1" 
                    />
                    {{ row.sysServiceModuleType === 'API' ? '接口' : '服务' }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="状态" width="120" align="center">
                <template #default="{ row }">
                  <el-switch 
                    v-model="row.sysServiceModuleStatus" 
                    :active-value="0" 
                    :inactive-value="1"
                    active-text="启用"
                    inactive-text="禁用"
                    inline-prompt
                    @change="handleUpdate(row)" 
                  />
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="160" fixed="right" align="center">
                <template #default="{ row }">
                  <el-tooltip content="编辑" placement="top">
                    <el-button class="btn-action" type="primary" link @click="handleEdit(row, 'edit')">
                      <IconifyIconOnline icon="ri:edit-line" :size="18" />
                    </el-button>
                  </el-tooltip>
                  <el-popconfirm 
                    :title="$t('message.confimDelete')" 
                    @confirm="handleDelete(row)"
                    width="200"
                  >
                    <template #reference>
                      <el-tooltip content="删除" placement="top">
                        <el-button class="btn-action" type="danger" link :loading="status.delete">
                          <IconifyIconOnline icon="ri:delete-bin-line" :size="18" />
                        </el-button>
                      </el-tooltip>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </ScTable>
          </div>
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<style scoped lang="scss">
// 模块管理页面美化样式
.module-container {
  height: 100%;
  background-color: var(--el-bg-color);
}

.module-wrapper {
  height: 100%;
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--el-box-shadow);
  }
}

// 统计面板样式
.module-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .stat-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    background: var(--el-fill-color-lighter);
    border-radius: 10px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
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

      &.enabled {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }

      &.disabled {
        background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
      }

      &.api {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &.service {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
        margin-top: 2px;
      }
    }
  }
}

// 搜索栏样式
.module-header {
  padding: 16px 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-image: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-bg-color-page) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  height: auto !important;
}

.left-panel {
  flex: 1;
}

.right-panel {
  display: flex;
  align-items: center;
  gap: 8px;

  .right-panel-search {
    display: flex;
    gap: 8px;
  }
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-input) {
    transition: all 0.3s ease;

    &:focus-within {
      transform: translateY(-1px);
    }
  }
}

// 主体区域
.module-main {
  padding: 16px !important;
  background-color: var(--el-bg-color-page);
}

// 表格容器
.table-wrapper {
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-lighter);
  overflow: hidden;
}

// 模块信息单元格
.module-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .module-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;

    &.api {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    &.service {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
  }

  .module-details {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .module-name {
      display: flex;
      align-items: center;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .module-code {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      display: flex;
      align-items: center;
    }
  }
}

// 菜单标签
.menu-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .menu-tag {
    display: inline-flex;
    align-items: center;
    border-radius: 4px;
  }
}

// 占位符文本
.text-placeholder {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

// 操作按钮
.btn-action {
  padding: 6px;
  transition: all 0.3s ease;
  font-size: 18px;

  &:hover {
    transform: scale(1.15);
  }
}

// 表格美化
:deep(.el-table) {
  .el-table__header {
    th {
      background-color: var(--el-fill-color-light) !important;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .el-table__row {
    transition: all 0.3s;

    &:hover {
      background-color: var(--el-fill-color-light) !important;
    }

    &:nth-child(even) {
      background-color: var(--el-fill-color-lighter);
    }
  }
}

// 按钮悬浮效果
:deep(.el-button) {
  transition: all 0.3s ease;

  &:not(.is-link):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

// 标签美化
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

// 开关美化
:deep(.el-switch) {
  --el-switch-on-color: #13ce66;
  --el-switch-off-color: #ff4949;
}

// 响应式适配
@media (max-width: 1400px) {
  .module-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .module-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .module-stats {
    grid-template-columns: 1fr;
    padding: 12px;
    gap: 12px;

    .stat-item {
      padding: 12px;

      .stat-icon {
        width: 40px;
        height: 40px;
      }

      .stat-info .stat-value {
        font-size: 18px;
      }
    }
  }

  .module-header {
    flex-direction: column;
    align-items: stretch;

    .right-panel-search {
      justify-content: flex-end;
    }
  }
}

// 暗色主题适配
:root[data-theme='dark'] {
  .module-wrapper {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }

  .module-stats {
    background: var(--el-bg-color-overlay);

    .stat-item {
      background: var(--el-fill-color);
    }
  }

  .module-header {
    background-color: var(--el-bg-color-overlay);
    background-image: linear-gradient(135deg, var(--el-bg-color-overlay) 0%, var(--el-bg-color) 100%);
  }

  .table-wrapper {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  .module-info-cell .module-icon {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  :deep(.el-table) {
    .el-table__header {
      th {
        background-color: var(--el-fill-color) !important;
      }
    }

    .el-table__row {
      &:nth-child(even) {
        background-color: var(--el-fill-color);
      }
    }
  }
}
</style>
