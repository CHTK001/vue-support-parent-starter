<template>
  <div class="system-container sfc-container">
    <!-- 页面头部 -->
    <div class="sfc-header">
      <div class="header-title">
        <ScIcon class="title-icon">
          <component :is="useRenderIcon('ri:plug-line')" />
        </ScIcon>
        <span>动态插件管理</span>
        <ScTag type="info" size="small" class="ml-2">SFC</ScTag>
      </div>
      <div class="toolbar-right header-actions">
        <ScForm :model="form" :inline="true" class="modern-form search-form">
          <ScFormItem>
            <ScInput
              v-model="form.sysSfcName"
              placeholder="搜索组件名称"
              clearable
              :prefix-icon="useRenderIcon('ep:search')"
              class="search-input"
              @keyup.enter="onSearch"
            />
          </ScFormItem>
          <ScFormItem>
            <ScSelect
              v-model="form.sysSfcType"
              placeholder="组件类型"
              clearable
              class="type-select"
            >
              <ScOption label="文件式" :value="0" />
              <ScOption label="代码式" :value="1" />
              <ScOption label="远程地址" :value="2" />
              <ScOption label="本地地址" :value="3" />
            </ScSelect>
          </ScFormItem>
          <ScFormItem>
            <ScTooltip content="只显示已安装的组件" placement="top">
              <ScCheckbox
                v-model="form.sysSfcInstall"
                :true-value="1"
                :false-value="0"
                border
                @change="onSearch"
              >
                <ScIcon class="mr-1"
                  ><component :is="useRenderIcon('ri:download-2-line')"
                /></ScIcon>
                已安装
              </ScCheckbox>
            </ScTooltip>
          </ScFormItem>
          <ScFormItem>
            <ScButton
              type="primary"
              :icon="useRenderIcon('ep:search')"
              @click="onSearch"
              >搜索</el-button
            >
            <ScButton
              type="success"
              :icon="useRenderIcon('ep:plus')"
              @click="doSave({}, 'save')"
              >新增插件</el-button
            >
          </ScFormItem>
        </ScForm>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="sfc-stats">
      <div class="stat-item">
        <ScIcon class="stat-icon total"
          ><component :is="useRenderIcon('ri:apps-line')"
        /></ScIcon>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">全部插件</span>
        </div>
      </div>
      <div class="stat-item">
        <ScIcon class="stat-icon active"
          ><component :is="useRenderIcon('ri:checkbox-circle-line')"
        /></ScIcon>
        <div class="stat-info">
          <span class="stat-value">{{ stats.active }}</span>
          <span class="stat-label">已激活</span>
        </div>
      </div>
      <div class="stat-item">
        <ScIcon class="stat-icon installed"
          ><component :is="useRenderIcon('ri:download-2-line')"
        /></ScIcon>
        <div class="stat-info">
          <span class="stat-value">{{ stats.installed }}</span>
          <span class="stat-label">已安装</span>
        </div>
      </div>
      <div class="stat-item">
        <ScIcon class="stat-icon disabled"
          ><component :is="useRenderIcon('ri:close-circle-line')"
        /></ScIcon>
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
        <div
          class="plugin-card"
          :class="{
            'plugin-disabled': row.sysSfcStatus === 0,
            'plugin-installed': row.sysSfcInstall === 1,
          }"
        >
          <!-- 卡片头部 -->
          <div class="card-header">
            <div
              class="plugin-icon"
              :class="{ active: row.sysSfcStatus === 1 }"
            >
              <ScIcon :size="48">
                <component
                  :is="useRenderIcon(row.sysSfcIcon || 'ri:puzzle-line')"
                />
              </ScIcon>
            </div>
            <div class="plugin-badges">
              <ScTag
                v-if="row.sysSfcInstall === 1"
                type="success"
                size="small"
                effect="dark"
                class="badge"
              >
                <ScIcon class="mr-1"
                  ><component :is="useRenderIcon('ep:check')"
                /></ScIcon>
                已安装
              </ScTag>
              <ScTag
                :type="getTypeTagType(row.sysSfcType)"
                size="small"
                class="badge"
              >
                {{ getTypeName(row.sysSfcType) }}
              </ScTag>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-body" @click="doSave(row, 'edit')">
            <h3 class="plugin-name" :title="row.sysSfcChineseName">
              {{ row.sysSfcChineseName || row.sysSfcName }}
            </h3>
            <p class="plugin-code">{{ row.sysSfcName }}</p>
            <p class="plugin-desc" :title="row.sysSfcDesc">
              {{ row.sysSfcDesc || "暂无描述" }}
            </p>
            <div class="plugin-meta">
              <span v-if="row.sysSfcVersion" class="meta-item">
                <ScIcon
                  ><component :is="useRenderIcon('ri:price-tag-3-line')"
                /></ScIcon>
                v{{ row.sysSfcVersion }}
              </span>
              <span v-if="row.sysSfcCategory" class="meta-item">
                <ScIcon
                  ><component :is="useRenderIcon('ri:folder-line')"
                /></ScIcon>
                {{ row.sysSfcCategory }}
              </span>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="card-footer">
            <div class="status-switch">
              <ScSwitch
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
              <ScTooltip
                :content="row.sysSfcInstall === 1 ? '卸载插件' : '安装插件'"
                placement="top"
              >
                <ScPopconfirm
                  :title="
                    row.sysSfcInstall === 1
                      ? '确定要卸载此插件吗？'
                      : '确定要安装此插件吗？'
                  "
                  @confirm="
                    row.sysSfcInstall === 1 ? doUninstall(row) : doInstall(row)
                  "
                >
                  <template #reference>
                    <ScButton
                      :type="row.sysSfcInstall === 1 ? 'warning' : 'success'"
                      :icon="
                        useRenderIcon(
                          row.sysSfcInstall === 1
                            ? 'ri:uninstall-line'
                            : 'ri:install-line',
                        )
                      "
                      circle
                      size="small"
                      :loading="startDialogStatus"
                    />
                  </template>
                </ScPopconfirm>
              </ScTooltip>

              <!-- 预览按钮 -->
              <ScTooltip content="预览插件" placement="top">
                <ScButton
                  type="primary"
                  :icon="useRenderIcon('ri:eye-line')"
                  circle
                  size="small"
                  @click="doView(row)"
                />
              </ScTooltip>

              <!-- 上传按钮（仅文件式） -->
              <ScTooltip
                v-if="row.sysSfcType === 0"
                content="上传组件文件"
                placement="top"
              >
                <ScButton
                  v-roles="['ADMIN', 'SUPER_ADMIN']"
                  type="info"
                  :icon="useRenderIcon('ep:upload')"
                  circle
                  size="small"
                  @click="doUpload(row)"
                />
              </ScTooltip>

              <!-- 删除按钮 -->
              <ScTooltip content="删除插件" placement="top">
                <ScPopconfirm
                  :title="$t('message.confimDelete')"
                  @confirm="doDelete(row)"
                >
                  <template #reference>
                    <ScButton
                      type="danger"
                      :icon="useRenderIcon('ep:delete')"
                      circle
                      size="small"
                    />
                  </template>
                </ScPopconfirm>
              </ScTooltip>
            </div>
          </div>
        </div>
      </template>
    </ScTable>

    <!-- 弹窗组件 -->
    <SaveLayout
      ref="saveRef"
      @success="onSearch"
      @close="visible.save = false"
    />
    <ViewLayout ref="viewRef" @close="visible.view = false" />
    <UploadLayout ref="uploadRef" @close="visible.upload = false" />
  </div>
</template>

<script setup>
import {
  fetchDeleteSfc,
  fetchInstallSfc,
  fetchPageSfc,
  fetchUpdateSfc,
  fetchUninstallSfc,
} from "@repo/core";
import { useRenderIcon } from "@repo/components";
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
  sysSfcName: "",
  sysSfcType: null,
  sysSfcInstall: 0,
});

const visible = reactive({
  save: false,
  upload: false,
  view: false,
});

// 统计数据
const allData = ref([]);
const stats = computed(() => {
  const data = allData.value;
  return {
    total: data.length,
    active: data.filter((item) => item.sysSfcStatus === 1).length,
    installed: data.filter((item) => item.sysSfcInstall === 1).length,
    disabled: data.filter((item) => item.sysSfcStatus === 0).length,
  };
});

// 组件类型映射
const typeMap = {
  0: { name: "文件式", type: "primary" },
  1: { name: "代码式", type: "success" },
  2: { name: "远程", type: "warning" },
  3: { name: "本地", type: "info" },
};

const getTypeName = (type) => typeMap[type]?.name || "未知";
const getTypeTagType = (type) => typeMap[type]?.type || "info";

const onDataLoaded = (data) => {
  allData.value = data;
};

const onSearch = async () => {
  scCard.value.refresh(form);
};

const doUninstall = async (item) => {
  startDialogStatus.value = true;
  fetchUninstallSfc(item)
    .then((res) => {
      if (res && res.code == "00000") {
        message("卸载成功", { type: "success" });
        onSearch();
      } else {
        message(res?.msg, { type: "error" });
      }
    })
    .finally(() => {
      startDialogStatus.value = false;
    });
};

const doInstall = async (item) => {
  startDialogStatus.value = true;
  fetchInstallSfc(item)
    .then((res) => {
      if (res && res.code == "00000") {
        message("安装成功", { type: "success" });
        onSearch();
      } else {
        message(res?.msg, { type: "error" });
      }
    })
    .finally(() => {
      startDialogStatus.value = false;
    });
};

const doDelete = async (item) => {
  fetchDeleteSfc({ sysSfcId: item.sysSfcId }).then((res) => {
    if (res && res.code == "00000") {
      message("删除成功", { type: "success" });
      onSearch();
    } else {
      message(res?.msg, { type: "error" });
    }
  });
};

const doChange = async (item) => {
  fetchUpdateSfc(item).then((res) => {
    if (res && res.code == "00000") {
      message("状态更新成功", { type: "success" });
    } else {
      message(res?.msg, { type: "error" });
    }
  });
};

const doUpload = async (item) => {
  visible.upload = true;
  await nextTick();
  uploadRef.value.setData(item);
  uploadRef.value.open();
};

const doView = async (item) => {
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
// 响应式适配
@media (width <= 1200px) {
  .sfc-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width <= 768px) {
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
        padding: 10px;
        font-size: 32px;
      }

      .stat-info .stat-value {
        font-size: 24px;
      }
    }
  }
}

.sfc-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  padding: 20px;
  background: var(--el-bg-color-page);
}

// 头部样式
.sfc-header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 4%);

  .header-title {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .title-icon {
      font-size: 24px;
      color: var(--el-color-primary);
    }
  }

  .header-actions {
    .search-form {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;

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
    gap: 16px;
    align-items: center;
    padding: 20px 24px;
    background: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgb(0 0 0 / 4%);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
      transform: translateY(-2px);
    }

    .stat-icon {
      padding: 12px;
      font-size: 40px;
      border-radius: 12px;

      &.total {
        color: #fff;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.active {
        color: #fff;
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }

      &.installed {
        color: #fff;
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &.disabled {
        color: #fff;
        background: linear-gradient(135deg, #868f96 0%, #596164 100%);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        line-height: 1.2;
        color: var(--el-text-color-primary);
      }

      .stat-label {
        margin-top: 4px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// 插件卡片样式
.plugin-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 12px 32px rgb(0 0 0 / 10%);
    transform: translateY(-4px);

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
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-color-primary-light-8) 100%
    );

    .plugin-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      color: var(--el-text-color-secondary);
      background: var(--el-bg-color);
      border-radius: 16px;
      box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
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
      margin: 0 0 4px;
      overflow: hidden;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .plugin-code {
      margin: 0 0 8px;
      font-family: monospace;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .plugin-desc {
      display: -webkit-box;
      min-height: 40px;
      margin: 0;
      overflow: hidden;
      font-size: 13px;
      line-height: 1.5;
      color: var(--el-text-color-regular);
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .plugin-meta {
      display: flex;
      gap: 16px;
      margin-top: 12px;

      .meta-item {
        display: flex;
        gap: 4px;
        align-items: center;
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
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: var(--el-fill-color-lighter);
    border-top: 1px solid var(--el-border-color-lighter);

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

// 暗色主题适配
:root[data-theme="dark"] {
  .sfc-header,
  .stat-item,
  .plugin-card {
    background: var(--el-bg-color-overlay);
  }

  .plugin-card {
    .card-header {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.2) 0%,
        rgba(var(--el-color-primary-rgb), 0.1) 100%
      );
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
