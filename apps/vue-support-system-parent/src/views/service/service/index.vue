<script setup lang="ts">
import { fetchListServiceModule } from "@/api/service/module";
import { 
  fetchUpdateService, 
  fetchPageService, 
  fetchDeleteService,
  fetchServiceStats,
  type ServiceStats 
} from "@/api/service/service";
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { message } from "@repo/utils";
import { defineAsyncComponent, onMounted, reactive, ref, shallowRef } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

const saveDialogRef = shallowRef(null);
const tableRef = shallowRef(null);
const formRef = ref();

// 统计数据
const stats = reactive<ServiceStats>({
  total: 0,
  enabled: 0,
  disabled: 0
});

const env = reactive({
  params: {
    sysServiceName: '',
    sysServiceStatus: null as number | null
  },
  moduleList: [] as any[],
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

// 加载统计数据
const loadStats = async () => {
  status.statsLoading = true;
  try {
    const res = await fetchServiceStats();
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
  env.params.sysServiceName = '';
  env.params.sysServiceStatus = null;
  loadData();
};

const handleEdit = async (row: any, mode: string) => {
  saveDialogRef.value?.loadModule(env.moduleList);
  saveDialogRef.value?.handleOpen(row, mode);
};

const handleDelete = async (row: any, event?: Event) => {
  event?.stopPropagation();
  status.delete = true;
  fetchDeleteService(row)
    .then(() => {
      message(t("message.deleteSuccess"), { type: "success" });
      loadData();
    })
    .finally(() => {
      status.delete = false;
    });
};

const handleUpdate = async (row: any) => {
  fetchUpdateService(row).then(() => {
    message(t("message.updateSuccess"), { type: "success" });
    loadStats();
  });
};

const handleToggleStatus = async (row: any, event?: Event) => {
  event?.stopPropagation();
  row.sysServiceStatus = row.sysServiceStatus === 0 ? 1 : 0;
  handleUpdate(row);
};

const loadModuleList = async () => {
  fetchListServiceModule({}).then((res) => {
    env.moduleList = res.data || [];
  });
};

const getTagName = (tag: string | number) => {
  return env.moduleList?.find((item) => item.sysServiceModuleId === tag)?.sysServiceModuleName;
};

// 数据加载完成回调
const onDataLoaded = (data: any[], total: number) => {
  stats.total = total || 0;
};

onMounted(async () => {
  loadModuleList();
  loadStats();
});
</script>

<template>
  <div class="service-container">
    <SaveDialog ref="saveDialogRef" @success="loadData" />
    <div class="service-wrapper">
      <el-container>
        <!-- 统计面板 -->
        <div class="service-stats">
          <div class="stat-item">
            <div class="stat-icon total">
              <IconifyIconOnline icon="ri:apps-2-line" :size="28" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">全部服务</span>
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
        </div>

        <!-- 搜索栏 -->
        <el-header class="service-header">
          <div class="left-panel">
            <el-form ref="formRef" :inline="true" :model="env.params" class="search-form">
              <el-form-item label="服务名称" prop="sysServiceName">
                <el-input 
                  v-model="env.params.sysServiceName" 
                  placeholder="请输入服务名称" 
                  clearable 
                  class="!w-[180px]"
                  @keyup.enter="onSearch"
                />
              </el-form-item>
              <el-form-item label="状态" prop="sysServiceStatus">
                <el-select 
                  v-model="env.params.sysServiceStatus" 
                  placeholder="全部" 
                  clearable 
                  class="!w-[120px]"
                >
                  <el-option 
                    v-for="item in statusOptions" 
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

        <!-- 服务卡片列表 -->
        <el-main class="service-main">
          <div class="cards-wrapper">
            <ScTable ref="tableRef" :url="fetchPageService" :params="env.params" @data-loaded="onDataLoaded">
              <template #default="{ row }">
                <div class="service-card" :class="{ 'is-disabled': row.sysServiceStatus === 1 }" @click="handleEdit(row, 'edit')">
                  <!-- 卡片图片 -->
                  <div class="card-image">
                    <el-image 
                      :src="row.sysServiceImage" 
                      fit="cover" 
                      lazy 
                      class="image"
                    >
                      <template #error>
                        <div class="image-placeholder">
                          <IconifyIconOnline icon="ri:image-2-line" :size="48" />
                        </div>
                      </template>
                    </el-image>
                    <!-- 状态标签 -->
                    <div class="status-badge">
                      <el-tag 
                        :type="row.sysServiceStatus === 0 ? 'success' : 'info'" 
                        effect="dark"
                        size="small"
                      >
                        <IconifyIconOnline 
                          :icon="row.sysServiceStatus === 0 ? 'ri:checkbox-circle-fill' : 'ri:forbid-fill'" 
                          :size="12" 
                          class="mr-1" 
                        />
                        {{ row.sysServiceStatus === 0 ? t("message.open") : t("message.close") }}
                      </el-tag>
                    </div>
                  </div>
                  
                  <!-- 卡片内容 -->
                  <div class="card-content">
                    <div class="card-title">
                      <IconifyIconOnline icon="ri:apps-line" :size="18" class="mr-2" />
                      <span>{{ row.sysServiceName }}</span>
                    </div>
                    
                    <!-- 模块标签 -->
                    <div class="card-tags" v-if="row.sysServiceTags?.length">
                      <el-tag 
                        v-for="item in row.sysServiceTags" 
                        :key="item" 
                        size="small" 
                        effect="plain"
                        class="module-tag"
                      >
                        {{ getTagName(item) || '未知模块' }}
                      </el-tag>
                    </div>
                    <div class="card-tags" v-else>
                      <span class="no-tags">暂无关联模块</span>
                    </div>
                    
                    <!-- 创建时间 -->
                    <div class="card-time">
                      <IconifyIconOnline icon="ri:time-line" :size="14" class="mr-1" />
                      <span>{{ row.createTime || '-' }}</span>
                    </div>
                  </div>
                  
                  <!-- 卡片操作 -->
                  <div class="card-actions">
                    <el-tooltip :content="row.sysServiceStatus === 0 ? '禁用' : '启用'" placement="top">
                      <el-button 
                        :type="row.sysServiceStatus === 0 ? 'warning' : 'success'" 
                        link 
                        class="action-btn"
                        @click="handleToggleStatus(row, $event)"
                      >
                        <IconifyIconOnline 
                          :icon="row.sysServiceStatus === 0 ? 'ri:forbid-line' : 'ri:checkbox-circle-line'" 
                          :size="18" 
                        />
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="编辑" placement="top">
                      <el-button 
                        type="primary" 
                        link 
                        class="action-btn"
                        @click.stop="handleEdit(row, 'edit')"
                      >
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
                          <el-button 
                            type="danger" 
                            link 
                            class="action-btn"
                            :loading="status.delete"
                            @click.stop
                          >
                            <IconifyIconOnline icon="ri:delete-bin-line" :size="18" />
                          </el-button>
                        </el-tooltip>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </template>
            </ScTable>
          </div>
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<style scoped lang="scss">
// 服务管理页面美化样式
.service-container {
  height: 100%;
  background-color: var(--el-bg-color);
}

.service-wrapper {
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
.service-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
.service-header {
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
.service-main {
  padding: 16px !important;
  background-color: var(--el-bg-color-page);
}

// 卡片容器
.cards-wrapper {
  height: 100%;
}

// 服务卡片
.service-card {
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-lighter);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);

    .card-image .image {
      transform: scale(1.05);
    }

    .card-actions {
      opacity: 1;
    }
  }

  &.is-disabled {
    opacity: 0.7;

    .card-image {
      filter: grayscale(50%);
    }

    .card-title {
      color: var(--el-text-color-secondary);
    }
  }

  // 卡片图片
  .card-image {
    position: relative;
    height: 140px;
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .image {
      width: 100%;
      height: 100%;
      transition: transform 0.3s ease;
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.6);
    }

    .status-badge {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }

  // 卡片内容
  .card-content {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .card-title {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1.4;
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      min-height: 24px;

      .module-tag {
        border-radius: 4px;
      }

      .no-tags {
        font-size: 12px;
        color: var(--el-text-color-placeholder);
      }
    }

    .card-time {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: auto;
    }
  }

  // 卡片操作
  .card-actions {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
    opacity: 0.8;
    transition: opacity 0.3s ease;

    .action-btn {
      padding: 8px;
      font-size: 18px;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.2);
      }
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

// 响应式适配
@media (max-width: 1200px) {
  .service-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .service-stats {
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

  .service-header {
    flex-direction: column;
    align-items: stretch;

    .right-panel-search {
      justify-content: flex-end;
    }
  }
}

// 暗色主题适配
:root[data-theme='dark'] {
  .service-wrapper {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }

  .service-stats {
    background: var(--el-bg-color-overlay);

    .stat-item {
      background: var(--el-fill-color);
    }
  }

  .service-header {
    background-color: var(--el-bg-color-overlay);
    background-image: linear-gradient(135deg, var(--el-bg-color-overlay) 0%, var(--el-bg-color) 100%);
  }

  .service-card {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);

    .card-actions {
      background: var(--el-fill-color);
    }

    &:hover {
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
    }
  }
}
</style>
