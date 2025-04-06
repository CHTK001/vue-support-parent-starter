<template>
  <div>
    <div class="modern-workspace">
      <div class="project-dashboard">
        <el-container class="dashboard-container">
          <!-- 保持原有header结构 -->
          <el-main class="dashboard-main">
            <div class="content-wrapper">
              <ScArticleSlot ref="tableRef" :url="fetchPageProject" :rowClick="handleRowClick" :afterLoadedData="handleAfterLoadedData">
                <template #top="{ row }">
                  <div class="project-card">
                    <div class="project-image">
                      <div class="image-container">
                        <el-image :src="row.sysProjectIcon" fit="cover" lazy class="project-img">
                          <template #error>
                            <div class="image-placeholder">
                              <div class="placeholder-icon-wrapper">
                                <el-icon class="placeholder-icon">
                                  <component :is="useRenderIcon('ri:image-2-line')" />
                                </el-icon>
                              </div>
                              <div class="placeholder-text">{{ row.sysProjectName }}</div>
                            </div>
                          </template>
                        </el-image>
                        <div class="image-overlay" />
                      </div>
                    </div>
                    <div class="project-tags">
                      <el-tag type="primary" effect="plain" class="project-name-tag">{{ row.sysProjectName }}</el-tag>
                    </div>
                    <div class="project-actions">
                      <template v-for="(item, index) in row.sysProjectFunction?.split(',') || []" :key="index">
                        <el-tooltip :content="functionMap[item]?.sysDictItemName" placement="top" effect="light" :offset="8">
                          <el-button
                            v-if="functionMap[item]"
                            type="primary"
                            circle
                            size="small"
                            class="action-button"
                            :icon="useRenderIcon(functionMap[item]?.sysDictItemIcon)"
                            :style="{ animationDelay: index * 0.05 + 's' }"
                          />
                        </el-tooltip>
                      </template>
                    </div>
                    <div class="more" @click.stop>
                      <el-button-group v-if="row.sysProjectFunction" class="ml-[1px] z-[100]">
                        <el-button v-if="row.source?.length > 0" :icon="useRenderIcon('ri:landscape-ai-fill')" title="设置默认" size="small" @click.stop="handleDefault(row)" />
                        <el-dropdown class="!z-[101] border-right-color" trigger="click" placement="right" @command.stop="handleCommand">
                          <el-button :icon="useRenderIcon('ri:more-2-line')" size="small" title="更多" @click.stop />
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item v-if="defer(0) && row.source?.length > 0" class="h-[32px]" :icon="useRenderIcon('ri:settings-5-line')">
                                <el-dropdown class="z-[100]" placement="right">
                                  <el-text class="w-full">设置默认</el-text>
                                  <template #dropdown>
                                    <el-dropdown-menu>
                                      <el-dropdown-item v-for="(item1, index) in row.source" :key="index" @click.prevent="handleUpdateDefault(row, item1)">
                                        {{ item1.name }}
                                        <span v-if="item1.label">√</span>
                                      </el-dropdown-item>
                                    </el-dropdown-menu>
                                  </template>
                                </el-dropdown>
                              </el-dropdown-item>
                              <el-dropdown-item v-for="(item1, index) in row.source" :key="index" class="h-[32px]" :icon="useRenderIcon(item1.icon)" @click="handleEventCustom(row, item1)">
                                {{ item1.name }}
                                <span v-if="item1.name.length < 4">{{ $t("message.manage") }}</span>
                              </el-dropdown-item>
                              <el-dropdown-item v-if="defer(3)" class="h-[32px]" :icon="useRenderIcon('ep:copy-document')" @click.stop="handleCopy(row, 'save')">复制</el-dropdown-item>
                              <el-dropdown-item v-if="defer(2)" class="h-[32px]" :icon="useRenderIcon('ri:delete-bin-6-line')" @click.prevent="handleDelete(row)">删除</el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </el-button-group>
                    </div>
                  </div>
                </template>
              </ScArticleSlot>
            </div>
          </el-main>
        </el-container>
      </div>
    </div>
    <SaveDialog ref="saveDialogRef" class="modern-dialog" @success="handleRefresh" />
    <DefaultSetting ref="defaultSettingRef" class="modern-dialog" @success="handleRefresh" />
  </div>
</template>

<script setup>
import { fetchPageProject, fetchUpdateProjectDefault, fetchDeleteProject } from "@/api/manage/project";
import { defineAsyncComponent, onMounted, reactive, ref, nextTick, computed, watch } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import SaveDialog from "./save.vue";
import { fetchListDictItem, router } from "@repo/core";
import { deepCopy, useDefer } from "@repo/utils";

import { message, stringSplitToNumber } from "@repo/utils";
const ScArticleSlot = defineAsyncComponent(() => import("./layout/index.vue"));
const DefaultSetting = defineAsyncComponent(() => import("./defaultSetting.vue"));
const form = reactive({});
const defer = useDefer(4);

let dictItem = [];
let functionList = [];
let functionMap = {};
const saveDialogRef = ref();
const tableRef = ref();
const defaultSettingRef = ref();

const handleCommand = event => {
  event.stopPropagation();
};

const handleDelete = async row => {
  fetchDeleteProject({
    sysProjectId: row.sysProjectId
  }).then(res => {
    if (res.code === "00000") {
      message("删除成功", { type: "success" });
      tableRef.value?.reload(form);
    }
  });
};

const handleUpdateDefault = async (row, item1) => {
  fetchUpdateProjectDefault({
    sysProjectId: row.sysProjectId,
    sysProjectDefaultType: item1.value,
    sysSetDefault: item1.label ? 0 : 1
  }).then(res => {
    if (res.code === "00000") {
      message(res.msg, { type: "success" });
      tableRef.value.updateData(
        res.data,
        it => it.sysProjectId == row.sysProjectId,
        (element, _updateData) => {
          deepCopy(element, _updateData);
          element.source = getDefaultValueArr(element);
        }
      );
    }
  });
};

const eventMap = {
  DA_YU_YAN: (row, item1) => {
    router.push({
      name: "llm-template",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value
      }
    });
  },
  WEN_SHENG_TU: (row, item1) => {
    router.push({
      name: "aiVincent",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value
      }
    });
  },
  COLORIZATION: (row, item1) => {
    router.push({
      name: "aiColorization",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value
      }
    });
  },
  RESOLUTION: (row, item1) => {
    router.push({
      name: "aiResolution",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value
      }
    });
  },
  WEN_SHENG_SHI_PIN: (row, item1) => {
    router.push({
      name: "aiVideo",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value
      }
    });
  },
  SHE_BEI: (row, item1) => {
    router.push({
      name: "device-template",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value
      }
    });
  },
  DUAN_XIN: (row, item1) => {
    router.push({
      name: "sms-template",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value
      }
    });
  },
  YOU_JIAN: (row, item1) => {
    router.push({
      name: "email-template",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value
      }
    });
  }
};

const handleEventCustom = async (row, item1) => {
  try {
    eventMap[item1.code](row, item1);
  } catch (error) {}
};

const getDefaultValueArr = row => {
  const defaultValue = {};
  const storeValues1 = stringSplitToNumber(row.sysProjectFunctionDefaultIds);
  storeValues1.forEach(element => {
    defaultValue[element] = true;
  });
  const storeValues = stringSplitToNumber(row.sysProjectFunction);
  const rs = storeValues.map(item => {
    return {
      label: !!defaultValue[item],
      value: item,
      name: functionMap[item]?.sysDictItemName,
      code: functionMap[item]?.sysDictItemCode,
      icon: functionMap[item]?.sysDictItemIcon
    };
  });
  return rs.filter(it => it.name);
};

const getLabel = val => {
  return functionMap[val]?.sysDictItemName;
};

const getFunctionLabel = val => {
  const _rs = (val?.split(",") || []).map(item => {
    return `<div type="primary"  class="mx-[2px]">${getLabel(item)}</div>`;
  });
  return _rs.join("");
};
const loading = ref(true);
const handleAfterLoadedData = row => {
  loading.value = false;
  row.forEach(item => {
    item.source = getDefaultValueArr(item);
  });
  return row;
};
const handleAfterPropertieSet = async () => {
  fetchListDictItem({
    sysDictId: 1
  }).then(res => {
    dictItem = res?.data;
  });
  fetchListDictItem({
    sysDictId: 6
  }).then(res => {
    functionList = res?.data;
    functionList.forEach(item => {
      functionMap[item.sysDictItemId] = item;
    });
  });
};

const handleDefault = async data => {
  defaultSettingRef.value.handleType(functionList);
  defaultSettingRef.value.handleOpen(data);
};
const handleSave = async (mode, data) => {
  saveDialogRef.value.handleDictItem(dictItem);
  saveDialogRef.value.handleFunction(functionList);
  saveDialogRef.value.handleOpen(mode, data);
};
const handleCopy = async row => {
  saveDialogRef.value.handleDictItem(dictItem);
  saveDialogRef.value.handleFunction(functionList);
  saveDialogRef.value.handleOpen("add", row);
};
const handleRefresh = async () => {
  tableRef.value?.reload(form);
};

const handleRowClick = async data => {
  handleSave("edit", data);
};

onMounted(async () => {
  await handleAfterPropertieSet();
});
</script>
<style lang="scss" scoped>
.project-tags {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  position: absolute;
  top: 28px;
  right: 20px;
  max-width: 70%;

  .project-name-tag {
    border-radius: 12px;
    padding: 8px 16px;
    font-weight: 600;
    font-size: 0.95rem;
    border: none;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    animation: fadeInRight 0.5s ease forwards;
    background: var(--el-color-primary-light-9, rgba(64, 158, 255, 0.12));
    color: #fff;

    &:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 5px 12px rgba(0, 0, 0, 0.12);
    }
  }

  .function-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;

    .function-tag {
      border-radius: 10px;
      padding: 6px 14px;
      font-weight: 500;
      border: none;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
      animation: fadeInUp 0.5s ease forwards;
      opacity: 0;
      transform: translateY(10px);
      background: var(--el-color-success-light-9, rgba(103, 194, 58, 0.12));
      color: var(--el-color-success, #67c23a);

      &:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.content-wrapper {
  height: 100%;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */

  &::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Opera */
    width: 0;
    height: 0;
  }
}

.modern-workspace {
  overflow: hidden;
  background: var(--el-bg-color-page, linear-gradient(135deg, #f8fafc, #f1f5f9, #eef2ff));
  height: 100%;

  .project-dashboard {
    height: 100%;
    padding: 24px;
    overflow: hidden;

    &::before {
      content: "";
      position: fixed;
      inset: 0;
      background:
        radial-gradient(circle at 0% 0%, rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.08), transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(var(--el-color-success-rgb, 103, 194, 58), 0.08), transparent 50%);
      pointer-events: none;
      z-index: -1;
    }

    .dashboard-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .dashboard-main {
      flex: 1;
      overflow: hidden;
      position: relative;
      padding: 0;
    }

    :deep(.scTable-page) {
      background: var(--el-bg-color-overlay, rgba(255, 255, 255, 0.85));
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 12px;
      box-shadow:
        0 -4px 20px rgba(0, 0, 0, 0.1),
        0 2px 6px rgba(0, 0, 0, 0.05);
      z-index: 10;
      padding: 12px 16px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--el-bg-color, rgba(255, 255, 255, 0.95));
        box-shadow:
          0 -4px 24px rgba(0, 0, 0, 0.12),
          0 2px 8px rgba(0, 0, 0, 0.06);
      }
    }
  }
}

.project-card {
  position: relative;
  height: 100%;
  padding: 20px;
  border-radius: 18px;
  background: var(--el-bg-color-overlay, rgba(255, 255, 255, 0.9));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  color: var(--el-text-color-primary);

  &:hover {
    transform: translateY(-6px);
    box-shadow:
      0 16px 30px rgba(0, 0, 0, 0.1),
      0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .project-image {
    aspect-ratio: 16/9;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 24px;
    position: relative;
    box-shadow:
      0 10px 25px rgba(0, 0, 0, 0.06),
      inset 0 0 0 1px var(--el-border-color-lighter, rgba(0, 0, 0, 0.03));
    transition: all 0.4s ease;

    &:hover {
      transform: scale(1.01);
      box-shadow:
        0 15px 30px rgba(0, 0, 0, 0.1),
        inset 0 0 0 1px var(--el-border-color-light, rgba(0, 0, 0, 0.05));

      .image-overlay {
        opacity: 0.4;
      }

      .project-img {
        transform: scale(1.04);
      }
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--el-fill-color-light, rgba(64, 158, 255, 0.05));
    }

    .project-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
      background-color: #f5f7fa;
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, transparent 60%, rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.15) 100%);
      opacity: 0.2;
      transition: opacity 0.4s ease;
      pointer-events: none;
      z-index: 1;
    }

    .image-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--el-color-primary, #409eff);
      background: linear-gradient(135deg, var(--el-bg-color, #ffffff), var(--el-fill-color-lighter, #f5f7fa));
      padding: 20px;

      .placeholder-icon-wrapper {
        width: 70px;
        height: 70px;
        border-radius: 16px;
        background: rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 8px 16px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.1);
      }

      .placeholder-icon {
        font-size: 2.2rem;
        color: var(--el-color-primary, #409eff);
      }

      .placeholder-text {
        font-size: 1rem;
        font-weight: 500;
        color: var(--el-text-color-secondary);
        margin-top: 8px;
        text-align: center;
        max-width: 90%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .el-tag {
      border-radius: 10px;
      padding: 6px 14px;
      font-weight: 500;
      border: none;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      &[type="primary"] {
        background: var(--el-color-primary-light-9, rgba(64, 158, 255, 0.12));
        color: var(--el-color-primary, #409eff);
      }

      &[type="success"] {
        background: var(--el-color-success-light-9, rgba(103, 194, 58, 0.12));
        color: var(--el-color-success, #67c23a);
      }
    }
  }

  .project-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    position: absolute;
    top: 28px;
    right: 20px;
    max-width: 70%;

    .el-tag {
      border-radius: 10px;
      padding: 6px 14px;
      font-weight: 500;
      border: none;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      &[type="primary"] {
        background: var(--el-color-primary-light-9, rgba(64, 158, 255, 0.12));
        color: var(--el-color-primary, #409eff);
      }

      &[type="success"] {
        background: var(--el-color-success-light-9, rgba(103, 194, 58, 0.12));
        color: var(--el-color-success, #67c23a);
      }
    }
  }

  .project-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    position: absolute;
    bottom: 20px;
    left: 20px;

    .action-button {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      padding: 0;
      transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      background: var(--el-color-primary-light-9, rgba(64, 158, 255, 0.12));
      border: none;
      color: var(--el-color-primary, #409eff);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      animation: fadeInUp 0.5s ease forwards;
      opacity: 0;
      transform: translateY(10px);

      :deep(i) {
        font-size: 14px;
      }

      &:hover {
        transform: translateY(-3px) scale(1.05);
        background: var(--el-color-primary-light-8, rgba(64, 158, 255, 0.18));
        box-shadow: 0 6px 12px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.15);
      }
    }
  }
}

.more {
  display: flex;
  gap: 8px;
  z-index: 1001;
  position: absolute;
  bottom: 20px;
  right: 20px;

  .el-button-group {
    .el-button {
      border-radius: 10px;
      background: var(--el-bg-color, rgba(255, 255, 255, 0.8));
      border: 1px solid var(--el-border-color-lighter, rgba(0, 0, 0, 0.05));
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
      color: var(--el-text-color-primary);

      &:hover {
        background: var(--el-bg-color-overlay, rgba(255, 255, 255, 0.95));
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.modern-dialog {
  :deep(.el-dialog) {
    border-radius: 20px;
    overflow: hidden;
    background: var(--el-bg-color);
    box-shadow:
      0 25px 50px rgba(0, 0, 0, 0.15),
      0 10px 20px rgba(0, 0, 0, 0.08);

    .el-dialog__header {
      margin: 0;
      border-bottom: 1px solid var(--el-border-color-lighter, rgba(0, 0, 0, 0.05));
      background: var(--el-bg-color-overlay, rgba(255, 255, 255, 0.95));
    }

    .el-dialog__body {
      padding: 28px;
      background: var(--el-bg-color);
      color: var(--el-text-color-primary);
    }

    .el-dialog__footer {
      padding: 20px 24px;
      border-top: 1px solid var(--el-border-color-lighter, rgba(0, 0, 0, 0.05));
      background: var(--el-bg-color-overlay, rgba(255, 255, 255, 0.95));
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 添加暗色模式特定样式
.dark {
  .modern-workspace {
    background: var(--el-bg-color-page, linear-gradient(135deg, #1a1c23, #111827, #0f172a));

    .project-dashboard::before {
      background:
        radial-gradient(circle at 0% 0%, rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.15), transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(var(--el-color-success-rgb, 103, 194, 58), 0.15), transparent 50%);
    }
  }

  .project-card {
    background: var(--el-bg-color-overlay, rgba(30, 30, 35, 0.8));
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.2),
      0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
      box-shadow:
        0 16px 30px rgba(0, 0, 0, 0.25),
        0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .project-image {
      box-shadow: inset 0 0 0 1px var(--el-border-color, rgba(255, 255, 255, 0.1));

      .image-placeholder {
        background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.15), rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.05));
      }
    }
  }

  .more .el-button-group .el-button {
    background: var(--el-bg-color-overlay, rgba(50, 50, 55, 0.8));
    border-color: var(--el-border-color, rgba(255, 255, 255, 0.1));

    &:hover {
      background: var(--el-bg-color, rgba(60, 60, 65, 0.9));
    }
  }

  :deep(.scTable-page) {
    background: var(--el-bg-color-overlay, rgba(30, 30, 35, 0.85)) !important;

    &:hover {
      background: var(--el-bg-color, rgba(40, 40, 45, 0.95)) !important;
    }
  }
}

// 添加响应式调整
@media (max-width: 768px) {
  .project-card {
    padding: 16px;

    .project-tags {
      top: 20px;
      right: 16px;
    }

    .project-actions,
    .more {
      position: relative;
      bottom: auto;
      left: auto;
      right: auto;
      margin-top: 16px;
    }
  }
}
</style>
