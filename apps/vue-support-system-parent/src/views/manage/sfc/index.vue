<template>
  <div class="system-container sfc-container">
    <!-- 页面头部 -->
    <div class="sfc-header">
      <div class="header-title">
        <el-icon class="title-icon">
          <component :is="useRenderIcon('ri:plug-line')" />
        </el-icon>
        <span>动态插件管理</span>
        <el-tag type="info" size="small" class="ml-2">SFC</el-tag>
      </div>
      <div class="toolbar-right header-actions">
        <el-form :model="form" :inline="true" class="modern-form search-form">
          <el-form-item>
            <el-input 
              v-model="form.sysSfcName" 
              placeholder="搜索组件名称" 
              clearable
              :prefix-icon="useRenderIcon('ep:search')"
              class="search-input"
              @keyup.enter="onSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-select v-model="form.sysSfcType" placeholder="组件类型" clearable class="type-select">
              <el-option label="文件式" :value="0" />
              <el-option label="代码式" :value="1" />
              <el-option label="远程地址" :value="2" />
              <el-option label="本地地址" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-tooltip content="只显示已安装的组件" placement="top">
              <el-checkbox v-model="form.sysSfcInstall" :true-value="1" :false-value="0" border @change="onSearch">
                <el-icon class="mr-1"><component :is="useRenderIcon('ri:download-2-line')" /></el-icon>
                已安装
              </el-checkbox>
            </el-tooltip>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="onSearch">搜索</el-button>
            <el-button type="success" :icon="useRenderIcon('ep:plus')" @click="doSave({}, 'save')">新增插件</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="sfc-stats">
      <div class="stat-item">
        <el-icon class="stat-icon total"><component :is="useRenderIcon('ri:apps-line')" /></el-icon>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">全部插件</span>
        </div>
      </div>
      <div class="stat-item">
        <el-icon class="stat-icon active"><component :is="useRenderIcon('ri:checkbox-circle-line')" /></el-icon>
        <div class="stat-info">
          <span class="stat-value">{{ stats.active }}</span>
          <span class="stat-label">已激活</span>
        </div>
      </div>
      <div class="stat-item">
        <el-icon class="stat-icon installed"><component :is="useRenderIcon('ri:download-2-line')" /></el-icon>
        <div class="stat-info">
          <span class="stat-value">{{ stats.installed }}</span>
          <span class="stat-label">已安装</span>
        </div>
      </div>
      <div class="stat-item">
        <el-icon class="stat-icon disabled"><component :is="useRenderIcon('ri:close-circle-line')" /></el-icon>
        <div class="stat-info">
          <span class="stat-value">{{ stats.disabled }}</span>
          <span class="stat-label">已禁用</span>
        </div>
      </div>
    </div>

    <!-- 插件卡片列表 -->
    <ScTable 
      ref="scCard" 
      :params="form" 
      :url="fetchPageSfc" 
      :appendable="true" 
      :hiddenAppend="form.sysSfcInstall == 1"
      layout="card"
      :colSize="4"
      :rowSize="3"
      @data-loaded="onDataLoaded"
    >
      <template #default="{ row }">
        <div class="plugin-card" :class="{ 'plugin-disabled': row.sysSfcStatus === 0, 'plugin-installed': row.sysSfcInstall === 1 }">
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="plugin-icon" :class="{ active: row.sysSfcStatus === 1 }">
              <el-icon :size="48">
                <component :is="useRenderIcon(row.sysSfcIcon || 'ri:puzzle-line')" />
              </el-icon>
            </div>
            <div class="plugin-badges">
              <el-tag v-if="row.sysSfcInstall === 1" type="success" size="small" effect="dark" class="badge">
                <el-icon class="mr-1"><component :is="useRenderIcon('ep:check')" /></el-icon>
                已安装
              </el-tag>
              <el-tag :type="getTypeTagType(row.sysSfcType)" size="small" class="badge">
                {{ getTypeName(row.sysSfcType) }}
              </el-tag>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-body" @click="doSave(row, 'edit')">
            <h3 class="plugin-name" :title="row.sysSfcChineseName">
              {{ row.sysSfcChineseName || row.sysSfcName }}
            </h3>
            <p class="plugin-code">{{ row.sysSfcName }}</p>
            <p class="plugin-desc" :title="row.sysSfcDesc">
              {{ row.sysSfcDesc || '暂无描述' }}
            </p>
            <div class="plugin-meta">
              <span class="meta-item" v-if="row.sysSfcVersion">
                <el-icon><component :is="useRenderIcon('ri:price-tag-3-line')" /></el-icon>
                v{{ row.sysSfcVersion }}
              </span>
              <span class="meta-item" v-if="row.sysSfcCategory">
                <el-icon><component :is="useRenderIcon('ri:folder-line')" /></el-icon>
                {{ row.sysSfcCategory }}
              </span>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <div class="status-switch">
              <el-switch 
                v-model="row.sysSfcStatus" 
                :active-value="1" 
                :inactive-value="0"
                active-text="启用"
                inactive-text="禁用"
                inline-prompt
                @change="doChange(row)" 
              />
            </div>
            <div class="action-buttons">
              <!-- 安装/卸载按钮 -->
              <el-tooltip :content="row.sysSfcInstall === 1 ? '卸载插件' : '安装插件'" placement="top">
                <el-popconfirm 
                  :title="row.sysSfcInstall === 1 ? '确定要卸载此插件吗？' : '确定要安装此插件吗？'" 
                  @confirm="row.sysSfcInstall === 1 ? doUninstall(row) : doInstall(row)"
                >
                  <template #reference>
                    <el-button 
                      :type="row.sysSfcInstall === 1 ? 'warning' : 'success'" 
                      :icon="useRenderIcon(row.sysSfcInstall === 1 ? 'ri:uninstall-line' : 'ri:install-line')" 
                      circle 
                      size="small"
                      :loading="startDialogStatus"
                    />
                  </template>
                </el-popconfirm>
              </el-tooltip>

              <!-- 预览按钮 -->
              <el-tooltip content="预览插件" placement="top">
                <el-button 
                  type="primary" 
                  :icon="useRenderIcon('ri:eye-line')" 
                  circle 
                  size="small"
                  @click="doView(row)"
                />
              </el-tooltip>

              <!-- 上传按钮（仅文件式） -->
              <el-tooltip v-if="row.sysSfcType === 0" content="上传组件文件" placement="top">
                <el-button 
                  v-roles="['ADMIN', 'SUPER_ADMIN']"
                  type="info" 
                  :icon="useRenderIcon('ep:upload')" 
                  circle 
                  size="small"
                  @click="doUpload(row)"
                />
              </el-tooltip>

              <!-- 删除按钮 -->
              <el-tooltip content="删除插件" placement="top">
                <el-popconfirm :title="$t('message.confimDelete')" @confirm="doDelete(row)">
                  <template #reference>
                    <el-button 
                      type="danger" 
                      :icon="useRenderIcon('ep:delete')" 
                      circle 
                      size="small"
                    />
                  </template>
                </el-popconfirm>
              </el-tooltip>
            </div>
          </div>
        </div>
      </template>
    </ScTable>

    <!-- 弹窗组件 -->
    <SaveLayout ref="saveRef" @success="onSearch" @close="visible.save = false" />
    <ViewLayout ref="viewRef" @close="visible.view = false" />
    <UploadLayout ref="uploadRef" @close="visible.upload = false" />
  </div>
</template>

<script setup>
import { fetchDeleteSfc, fetchInstallSfc, fetchPageSfc, fetchUpdateSfc, fetchUninstallSfc } from "@repo/core";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import SaveLayout from "./save.vue";
import ViewLayout from "./view.vue";
import UploadLayout from "./upload.vue";
import { reactive, ref, nextTick, computed } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const saveRef = ref();
const uploadRef = ref();
const viewRef = ref();
const scCard = ref();
const startDialogStatus = ref(false);
const form = reactive({
  sysSfcName: '',
  sysSfcType: null,
  sysSfcInstall: 0
});

const visible = reactive({
  save: false,
  upload: false,
  view: false
});

// 统计数据
const allData = ref([]);
const stats = computed(() => {
  const data = allData.value;
  return {
    total: data.length,
    active: data.filter(item => item.sysSfcStatus === 1).length,
    installed: data.filter(item => item.sysSfcInstall === 1).length,
    disabled: data.filter(item => item.sysSfcStatus === 0).length
  };
});

// 组件类型映射
const typeMap = {
  0: { name: '文件式', type: 'primary' },
  1: { name: '代码式', type: 'success' },
  2: { name: '远程', type: 'warning' },
  3: { name: '本地', type: 'info' }
};

const getTypeName = (type) => typeMap[type]?.name || '未知';
const getTypeTagType = (type) => typeMap[type]?.type || 'info';

const onDataLoaded = (data) => {
  allData.value = data;
};

const onSearch = async () => {
  scCard.value.refresh(form);
};

const doUninstall = async item => {
  startDialogStatus.value = true;
  fetchUninstallSfc(item).then(res => {
    if (res && res.code == "00000") {
      message("卸载成功", { type: "success" });
      onSearch();
    } else {
      message(res?.msg, { type: "error" });
    }
  }).finally(() => {
    startDialogStatus.value = false;
  });
};

const doInstall = async item => {
  startDialogStatus.value = true;
  fetchInstallSfc(item).then(res => {
    if (res && res.code == "00000") {
      message("安装成功", { type: "success" });
      onSearch();
    } else {
      message(res?.msg, { type: "error" });
    }
  }).finally(() => {
    startDialogStatus.value = false;
  });
};

const doDelete = async item => {
  fetchDeleteSfc({ sysSfcId: item.sysSfcId }).then(res => {
    if (res && res.code == "00000") {
      message("删除成功", { type: "success" });
      onSearch();
    } else {
      message(res?.msg, { type: "error" });
    }
  });
};

const doChange = async item => {
  fetchUpdateSfc(item).then(res => {
    if (res && res.code == "00000") {
      message("状态更新成功", { type: "success" });
    } else {
      message(res?.msg, { type: "error" });
    }
  });
};

const doUpload = async item => {
  visible.upload = true;
  await nextTick();
  uploadRef.value.setData(item);
  uploadRef.value.open();
};

const doView = async item => {
  visible.view = true;
  await nextTick();
  viewRef.value.setData(item);
  viewRef.value.open();
};

const doSave = async (item, mode) => {
  visible.save = true;
  await nextTick();
  saveRef.value.setData(item);
  saveRef.value.open(mode);
};
</script>

<style lang="scss" scoped>
.sfc-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
  padding: 20px;
  gap: 16px;
}

// 头部样式
.sfc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--el-bg-color);
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
  gap: 16px;

  .header-title {
    display: flex;
    align-items: center;
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    gap: 8px;

    .title-icon {
      font-size: 24px;
      color: var(--el-color-primary);
    }
  }

  .header-actions {
    .search-form {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }

      .search-input {
        width: 200px;
      }

      .type-select {
        width: 120px;
      }
    }
  }
}

// 统计信息样式
.sfc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--el-bg-color);
    padding: 20px 24px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    .stat-icon {
      font-size: 40px;
      padding: 12px;
      border-radius: 12px;

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
      }

      &.active {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: #fff;
      }

      &.installed {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: #fff;
      }

      &.disabled {
        background: linear-gradient(135deg, #868f96 0%, #596164 100%);
        color: #fff;
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.2;
      }

      .stat-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }
  }
}

// 插件卡片样式
.plugin-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-lighter);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary-light-5);

    .card-header .plugin-icon {
      transform: scale(1.1);
    }
  }

  &.plugin-disabled {
    opacity: 0.7;

    .card-header {
      background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
    }

    .plugin-icon {
      color: var(--el-text-color-disabled);
    }
  }

  &.plugin-installed {
    border-color: var(--el-color-success-light-5);
  }

  .card-header {
    position: relative;
    padding: 24px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    .plugin-icon {
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-bg-color);
      border-radius: 16px;
      color: var(--el-text-color-secondary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;

      &.active {
        color: var(--el-color-primary);
        box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.3);
      }
    }

    .plugin-badges {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: flex-end;

      .badge {
        border-radius: 6px;
      }
    }
  }

  .card-body {
    flex: 1;
    padding: 16px 20px;
    cursor: pointer;

    .plugin-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 4px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .plugin-code {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin: 0 0 8px 0;
      font-family: monospace;
    }

    .plugin-desc {
      font-size: 13px;
      color: var(--el-text-color-regular);
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 40px;
    }

    .plugin-meta {
      display: flex;
      gap: 16px;
      margin-top: 12px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        .el-icon {
          font-size: 14px;
        }
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);

    .status-switch {
      :deep(.el-switch) {
        --el-switch-on-color: var(--el-color-success);
        --el-switch-off-color: var(--el-color-info-light-3);
      }
    }

    .action-buttons {
      display: flex;
      gap: 8px;

      .el-button {
        transition: all 0.3s ease;

        &:hover {
          transform: scale(1.1);
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .sfc-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .sfc-header {
    flex-direction: column;
    align-items: flex-start;

    .header-actions .search-form {
      flex-direction: column;
      align-items: flex-start;

      .search-input,
      .type-select {
        width: 100%;
      }
    }
  }

  .sfc-stats {
    grid-template-columns: repeat(2, 1fr);

    .stat-item {
      padding: 16px;

      .stat-icon {
        font-size: 32px;
        padding: 10px;
      }

      .stat-info .stat-value {
        font-size: 24px;
      }
    }
  }
}

// 暗色主题适配
:root[data-theme='dark'] {
  .sfc-header,
  .stat-item,
  .plugin-card {
    background: var(--el-bg-color-overlay);
  }

  .plugin-card {
    .card-header {
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.2) 0%, rgba(var(--el-color-primary-rgb), 0.1) 100%);
    }

    &.plugin-disabled .card-header {
      background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    }

    .card-footer {
      background: var(--el-fill-color);
    }
  }
}
</style>
