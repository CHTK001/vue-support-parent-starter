<script setup lang="ts">
import { 
  feechSyncTenant, 
  fetchDeleteTenant, 
  fetchPageTenant, 
  fetchUpdateTenant,
  fetchTenantStats,
  type TenantStats 
} from "@/api/service/tenant";
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { isTimeExpired, message } from "@repo/utils";
import { computed, defineAsyncComponent, onMounted, reactive, ref, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import { fetchListService } from "@/api/service/service";

const { t } = useI18n();
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

const saveDialogRef = shallowRef(null);
const tableRef = shallowRef(null);
const formRef = ref();

// 统计数据
const stats = reactive<TenantStats>({
  total: 0,
  enabled: 0,
  disabled: 0,
  subscribed: 0
});

const env = reactive({
  params: {
    sysTenantName: '',
    sysTenantStatus: null as number | null
  },
  loading: false,
  serviceList: [] as any[],
});

const status = reactive({
  async: false,
  delete: false,
  statsLoading: false
});

// 状态选项
const statusOptions = [
  { label: '全部', value: null },
  { label: '启用', value: 0 },
  { label: '禁用', value: 1 }
];

const loadingTag = computed(() => env.loading);

// 加载统计数据
const loadStats = async () => {
  status.statsLoading = true;
  try {
    const res = await fetchTenantStats();
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
  env.params.sysTenantName = '';
  env.params.sysTenantStatus = null;
  loadData();
};

const handleEdit = async (row: any, mode: string) => {
  saveDialogRef.value?.handleLoadMenuList(env.serviceList);
  saveDialogRef.value?.handleOpen(row, mode);
};

const handleDelete = async (row: any) => {
  status.delete = true;
  fetchDeleteTenant(row)
    .then(() => {
      message(t("message.deleteSuccess"), { type: "success" });
      loadData();
    })
    .finally(() => {
      status.delete = false;
    });
};

const handleUpdate = async (row: any) => {
  fetchUpdateTenant(row).then(() => {
    message(t("message.updateSuccess"), { type: "success" });
    loadStats();
  });
};

const loadServiceList = async () => {
  env.loading = true;
  fetchListService({})
    .then((res) => {
      env.serviceList = res.data || [];
    })
    .finally(() => {
      env.loading = false;
    });
};

const handleListEquals = (arr: any[], tag: string): any => {
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

const handleRenderTagName = (tag: string) => {
  const find = handleListEquals(env.serviceList, tag);
  return find?.sysMenuTitle;
};

const isValid = (time: string) => {
  return !time ? false : isTimeExpired(time);
};

const getTagName = (tag: string) => {
  return env.serviceList?.find((item) => item.sysServiceId === tag)?.sysServiceName;
};

const getContent = (row: any) => {
  return `<ul class="service-tooltip">
    <li><strong>服务名称:</strong> ${getTagName(row?.sysServiceId) || '-'}</li>
    <li><strong>过期时间:</strong> ${row?.sysTenantServiceValidTime || "-"}</li>
    <li><strong>状态:</strong> ${isValid(row?.sysTenantServiceValidTime) ? '<span style="color:#67c23a">有效</span>' : '<span style="color:#f56c6c">已过期</span>'}</li>
  </ul>`;
};

const handleSync = async (row: any) => {
  status.async = true;
  feechSyncTenant(row)
    .then(() => {
      message(t("message.syncSuccess"), { type: "success" });
    })
    .finally(() => {
      status.async = false;
    });
};

// 数据加载完成回调
const onDataLoaded = (data: any[], total: number) => {
  stats.total = total || 0;
};

onMounted(async () => {
  loadServiceList();
  loadStats();
});
</script>

<template>
  <div class="tenant-container">
    <SaveDialog ref="saveDialogRef" @success="loadData" />
    <div class="tenant-wrapper">
      <el-container>
        <!-- 统计面板 -->
        <div class="tenant-stats">
          <div class="stat-item">
            <div class="stat-icon total">
              <IconifyIconOnline icon="ri:building-4-line" :size="28" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">全部租户</span>
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
            <div class="stat-icon subscribed">
              <IconifyIconOnline icon="ri:vip-crown-line" :size="28" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.subscribed }}</span>
              <span class="stat-label">已订阅</span>
            </div>
          </div>
        </div>

        <!-- 搜索栏 -->
        <el-header class="tenant-header">
          <div class="left-panel">
            <el-form ref="formRef" :inline="true" :model="env.params" class="search-form">
              <el-form-item label="租户名称" prop="sysTenantName">
                <el-input 
                  v-model="env.params.sysTenantName" 
                  placeholder="请输入租户名称" 
                  clearable 
                  class="!w-[180px]"
                  @keyup.enter="onSearch"
                />
              </el-form-item>
              <el-form-item label="状态" prop="sysTenantStatus">
                <el-select 
                  v-model="env.params.sysTenantStatus" 
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

        <!-- 数据表格 -->
        <el-main class="tenant-main">
          <div class="table-wrapper">
            <ScTable ref="tableRef" :url="fetchPageTenant" :params="env.params" @data-loaded="onDataLoaded">
              <el-table-column type="index" label="序号" width="80" align="center">
                <template #default="scope">
                  <el-tag type="primary" size="small" effect="plain">{{ scope.$index + 1 }}</el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="租户信息" min-width="220">
                <template #default="{ row }">
                  <div class="tenant-info-cell">
                    <div class="tenant-avatar">
                      <IconifyIconOnline icon="ri:building-2-fill" :size="22" />
                    </div>
                    <div class="tenant-details">
                      <div class="tenant-name">
                        <span>{{ row.sysTenantName }}</span>
                        <el-tag v-if="row.sysTenantStatus === 0" type="success" size="small" class="ml-2">启用</el-tag>
                        <el-tag v-else type="info" size="small" class="ml-2">禁用</el-tag>
                      </div>
                      <div class="tenant-account">
                        <IconifyIconOnline icon="ri:user-line" :size="12" class="mr-1" />
                        {{ row.sysTenantUsername || '-' }}
                      </div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="联系方式" min-width="140">
                <template #default="{ row }">
                  <div class="contact-cell">
                    <div class="contact-item" v-if="row.sysTenantPhone">
                      <IconifyIconOnline icon="ri:phone-line" :size="14" class="mr-1" />
                      <span>{{ row.sysTenantPhone }}</span>
                    </div>
                    <div class="contact-item text-placeholder" v-else>-</div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column label="订阅服务" min-width="320">
                <template #default="{ row }">
                  <div class="service-tags" v-if="row?.sysTenantService?.length">
                    <el-tooltip 
                      v-for="(item, idx) in row?.sysTenantService" 
                      :key="idx"
                      placement="top" 
                      :raw-content="true" 
                      :content="getContent(item)"
                    >
                      <el-tag 
                        :type="isValid(item?.sysTenantServiceValidTime) ? 'success' : 'info'" 
                        class="service-tag"
                        effect="light"
                      >
                        <IconifyIconOnline 
                          :icon="isValid(item?.sysTenantServiceValidTime) ? 'ri:checkbox-circle-fill' : 'ri:time-line'" 
                          :size="12" 
                          class="mr-1" 
                        />
                        {{ getTagName(item?.sysServiceId) || '未知服务' }}
                      </el-tag>
                    </el-tooltip>
                  </div>
                  <span v-else class="text-placeholder">暂无订阅</span>
                </template>
              </el-table-column>
              
              <el-table-column label="公司信息" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="company-cell" v-if="row.sysTenantCorporation || row.sysTenantAddress">
                    <div class="company-name" v-if="row.sysTenantCorporation">
                      <IconifyIconOnline icon="ri:building-line" :size="14" class="mr-1" />
                      {{ row.sysTenantCorporation }}
                    </div>
                    <div class="company-address" v-if="row.sysTenantAddress">
                      <IconifyIconOnline icon="ri:map-pin-line" :size="12" class="mr-1" />
                      {{ row.sysTenantAddress }}
                    </div>
                  </div>
                  <span v-else class="text-placeholder">-</span>
                </template>
              </el-table-column>
              
              <el-table-column label="状态" width="120" align="center">
                <template #default="{ row }">
                  <el-switch 
                    v-model="row.sysTenantStatus" 
                    :active-value="0" 
                    :inactive-value="1"
                    active-text="启用"
                    inactive-text="禁用"
                    inline-prompt
                    @change="handleUpdate(row)" 
                  />
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="180" fixed="right" align="center">
                <template #default="{ row }">
                  <el-tooltip content="编辑" placement="top">
                    <el-button class="btn-action" type="primary" link @click="handleEdit(row, 'edit')">
                      <IconifyIconOnline icon="ri:edit-line" :size="18" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="同步数据" placement="top">
                    <el-button 
                      class="btn-action" 
                      type="warning" 
                      link 
                      :loading="status.async" 
                      @click="handleSync(row)"
                    >
                      <IconifyIconOnline icon="ri:refresh-line" :size="18" />
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
// 租户管理页面美化样式
.tenant-container {
  height: 100%;
  background-color: var(--el-bg-color);
}

.tenant-wrapper {
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
.tenant-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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

      &.subscribed {
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
.tenant-header {
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
.tenant-main {
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

// 租户信息单元格
.tenant-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .tenant-avatar {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    flex-shrink: 0;
  }

  .tenant-details {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .tenant-name {
      display: flex;
      align-items: center;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .tenant-account {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      display: flex;
      align-items: center;
    }
  }
}

// 联系方式单元格
.contact-cell {
  .contact-item {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}

// 服务标签
.service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .service-tag {
    display: inline-flex;
    align-items: center;
    border-radius: 4px;
  }
}

// 公司信息单元格
.company-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .company-name {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  .company-address {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
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
@media (max-width: 1200px) {
  .tenant-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .tenant-stats {
    grid-template-columns: repeat(2, 1fr);
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

  .tenant-header {
    flex-direction: column;
    align-items: stretch;

    .right-panel-search {
      justify-content: flex-end;
    }
  }
}

// 暗色主题适配
:root[data-theme='dark'] {
  .tenant-wrapper {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }

  .tenant-stats {
    background: var(--el-bg-color-overlay);

    .stat-item {
      background: var(--el-fill-color);
    }
  }

  .tenant-header {
    background-color: var(--el-bg-color-overlay);
    background-image: linear-gradient(135deg, var(--el-bg-color-overlay) 0%, var(--el-bg-color) 100%);
  }

  .table-wrapper {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  .tenant-info-cell .tenant-avatar {
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
