<template>
  <div class="project-workspace">
    <div class="modern-workspace">
      <div class="project-dashboard">
        <el-container class="dashboard-container">
          <el-main class="dashboard-main">
            <div class="content-wrapper">
              <ScTable
                ref="tableRef"
                layout="card"
                :col-size="6"
                :row-size="2"
                :url="fetchPageProject"
                :rowClick="handleRowClick"
                :afterLoadedData="handleAfterLoadedData"
              >
                <template #default="{ row }">
                  <div
                    class="project-card"
                    :class="{ 'card-loading': loading }"
                    :style="{
                      '--project-icon-url': `url(${row?.sysProjectIcon})`,
                      '--random-hue': Math.floor(Math.random() * 360),
                    }"
                  >
                    <div class="card-glow"></div>
                    <div class="card-header">
                      <div class="project-image">
                        <div class="image-container">
                          <el-image
                            :src="row?.sysProjectIcon"
                            fit="cover"
                            lazy
                            class="project-img"
                          >
                            <template #error>
                              <div class="image-placeholder">
                                <div class="placeholder-icon-wrapper">
                                  <el-icon class="placeholder-icon">
                                    <component
                                      :is="useRenderIcon('ri:image-2-line')"
                                    />
                                  </el-icon>
                                  <div class="icon-ripple"></div>
                                </div>
                                <div class="placeholder-text">
                                  {{ row?.sysProjectName }}
                                </div>
                              </div>
                            </template>
                          </el-image>
                          <div class="image-overlay" />
                          <div class="image-shine"></div>
                        </div>
                      </div>

                      <div class="project-status" :class="getStatusClass(row)">
                        <div class="status-indicator">
                          <div class="status-dot"></div>
                          <div class="status-pulse"></div>
                        </div>
                        <span class="status-text">活跃</span>
                      </div>
                    </div>

                    <div class="project-content">
                      <div class="project-header">
                        <h3 class="project-title" :title="row?.sysProjectName">
                          {{ row?.sysProjectName }}
                        </h3>
                        <div class="project-meta">
                          <span class="project-id"
                            >#{{ row?.sysProjectId || "001" }}</span
                          >
                          <span class="project-date">{{
                            formatDate(row?.createTime)
                          }}</span>
                        </div>
                      </div>

                      <div class="project-description">
                        <p class="description-text">
                          {{
                            row?.sysProjectDescription ||
                            "这是一个精心设计的项目，致力于提供优质的解决方案"
                          }}
                        </p>
                      </div>

                      <div class="project-stats">
                        <div class="stat-item pt-3" />
                      </div>
                    </div>
                    <div class="project-tags">
                      <el-tag
                        type="primary"
                        effect="plain"
                        class="project-name-tag"
                        >{{ row?.sysProjectName }}</el-tag
                      >
                    </div>
                    <div class="project-actions">
                      <template
                        v-for="(item, index) in row?.sysProjectFunction?.split(
                          ','
                        ) || []"
                        :key="index"
                      >
                        <el-tooltip
                          :content="functionMap[item]?.sysDictItemName"
                          placement="top"
                          effect="light"
                          :offset="8"
                        >
                          <el-button
                            v-if="functionMap[item]"
                            type="primary"
                            circle
                            size="small"
                            class="action-button"
                            :icon="
                              useRenderIcon(functionMap[item]?.sysDictItemIcon)
                            "
                            :style="{ animationDelay: index * 0.05 + 's' }"
                          />
                        </el-tooltip>
                      </template>
                    </div>
                    <div class="more" @click.stop>
                      <el-button-group
                        v-if="row?.sysProjectFunction"
                        class="ml-[1px] z-[100]"
                      >
                        <el-button
                          v-if="row?.source?.length > 0"
                          :icon="useRenderIcon('ri:landscape-ai-fill')"
                          title="设置默认"
                          size="small"
                          @click.stop="handleDefault(row)"
                        />
                        <el-dropdown
                          class="!z-[101] border-right-color"
                          trigger="click"
                          placement="right"
                          @command="handleDropdownCommand"
                        >
                          <el-button
                            :icon="useRenderIcon('ri:more-2-line')"
                            size="small"
                            title="更多"
                            @click.stop
                          />
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item
                                v-if="defer(0) && row?.source?.length > 0"
                                class="h-[32px]"
                                :icon="useRenderIcon('ri:settings-5-line')"
                              >
                                <el-dropdown class="z-[100]" placement="right">
                                  <el-text class="w-full">设置默认</el-text>
                                  <template #dropdown>
                                    <el-dropdown-menu>
                                      <el-dropdown-item
                                        v-for="(item1, index) in row.source"
                                        :key="index"
                                        @click="handleUpdateDefault(row, item1)"
                                      >
                                        {{ item1.name }}
                                        <span v-if="item1.label">√</span>
                                      </el-dropdown-item>
                                    </el-dropdown-menu>
                                  </template>
                                </el-dropdown>
                              </el-dropdown-item>
                              <el-dropdown-item
                                v-for="(item1, index) in row.source"
                                :key="index"
                                class="h-[32px]"
                                :icon="useRenderIcon(item1.icon)"
                                @click="handleEventCustom(row, item1, $event)"
                              >
                                {{ item1.name }}
                                <span v-if="item1.name.length < 4">{{
                                  $t("message.manage")
                                }}</span>
                              </el-dropdown-item>
                              <el-dropdown-item
                                v-if="defer(3)"
                                class="h-[32px]"
                                :icon="useRenderIcon('ep:copy-document')"
                                @click.stop="handleCopy(row, 'save')"
                                >复制</el-dropdown-item
                              >
                              <el-dropdown-item
                                v-if="defer(2)"
                                class="h-[32px]"
                                :icon="useRenderIcon('ri:delete-bin-6-line')"
                                @click.prevent="handleDelete(row)"
                                >删除</el-dropdown-item
                              >
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </el-button-group>
                    </div>
                  </div>
                </template>
              </ScTable>
            </div>
          </el-main>
        </el-container>
      </div>
    </div>
    <SaveDialog
      ref="saveDialogRef"
      class="modern-dialog"
      @success="handleRefresh"
    />
    <DefaultSetting
      ref="defaultSettingRef"
      class="modern-dialog"
      @success="handleRefresh"
    />
  </div>
</template>

<script setup>
import { useRenderIcon } from "@repo/components";
import { fetchListDictItem, router } from "@repo/core";
import { deepCopy, useDefer } from "@repo/utils";
import { message } from "@repo/utils";
import { defineAsyncComponent, onMounted, reactive, ref } from "vue";
import {
  fetchDeleteProject,
  fetchPageProject,
  fetchUpdateProjectDefault,
} from "../../api/manage/project";
import SaveDialog from "./save.vue";

import { message, stringSplitToNumber } from "@repo/utils";
const DefaultSetting = defineAsyncComponent(
  () => import("./defaultSetting.vue")
);
const form = reactive({});
const defer = useDefer(4);

let dictItem = [];
let functionList = [];
let functionMap = {};
const saveDialogRef = ref();
const tableRef = ref();
const defaultSettingRef = ref();

// 项目统计数据
const projectStats = reactive({
  total: 0,
  active: 0,
  completed: 0,
});

// 粒子动画样式
const getParticleStyle = (index) => {
  const delay = index * 0.5;
  const duration = 3 + Math.random() * 2;
  const size = 2 + Math.random() * 3;
  const x = Math.random() * 100;
  const y = Math.random() * 100;

  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };
};

// 获取项目状态样式类
const getStatusClass = (row) => {
  const status = row?.status || "active";
  return {
    "status-active": status === "active",
    "status-completed": status === "completed",
    "status-paused": status === "paused",
    "status-error": status === "error",
  };
};

// 获取状态文本
const getStatusText = (row) => {
  const status = row?.status || "active";
  const statusMap = {
    active: "活跃",
    completed: "已完成",
    paused: "暂停",
    error: "错误",
  };
  return statusMap[status] || "未知";
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return "最近";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return date.toLocaleDateString();
};

// 获取时间差
const getTimeAgo = (dateStr) => {
  if (!dateStr) return "刚刚";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(dateStr);
};

// 获取项目类型
const getProjectType = (row) => {
  const types = ["Web应用", "API服务", "数据分析", "机器学习", "移动应用"];
  return types[Math.floor(Math.random() * types.length)];
};

// 获取标签类型
const getTagType = (tag) => {
  const typeMap = {
    Vue: "success",
    React: "primary",
    "Node.js": "warning",
    Python: "info",
    AI: "danger",
  };
  return typeMap[tag] || "info";
};

// 获取快速操作
const getQuickActions = (row) => {
  return [
    {
      key: "view",
      type: "primary",
      icon: useRenderIcon("ri:eye-line"),
      title: "查看详情",
      handler: (row) => console.log("查看", row),
    },
    {
      key: "edit",
      type: "success",
      icon: useRenderIcon("ri:edit-line"),
      title: "编辑项目",
      handler: (row) => handleSave("edit", row),
    },
    {
      key: "deploy",
      type: "warning",
      icon: useRenderIcon("ri:rocket-line"),
      title: "部署项目",
      handler: (row) => console.log("部署", row),
    },
  ];
};

// 获取卡片样式类
const getCardClass = (row) => {
  return {
    "card-featured": row?.featured,
    "card-new": isNewProject(row),
    "card-updated": isRecentlyUpdated(row),
  };
};

// 判断是否为新项目
const isNewProject = (row) => {
  if (!row?.createTime) return false;
  const createDate = new Date(row.createTime);
  const now = new Date();
  const daysDiff = (now - createDate) / (1000 * 60 * 60 * 24);
  return daysDiff <= 7;
};

// 判断是否最近更新
const isRecentlyUpdated = (row) => {
  if (!row?.updateTime) return false;
  const updateDate = new Date(row.updateTime);
  const now = new Date();
  const daysDiff = (now - updateDate) / (1000 * 60 * 60 * 24);
  return daysDiff <= 3;
};

// 处理下拉菜单命令
const handleDropdownCommand = (command, row) => {
  switch (command) {
    case "edit":
      handleSave("edit", row);
      break;
    case "clone":
      console.log("克隆项目", row);
      break;
    case "export":
      console.log("导出配置", row);
      break;
    case "delete":
      handleDelete(row);
      break;
  }
};

const handleCommand = (event) => {
  event.stopPropagation();
};

const handleDelete = async (row) => {
  fetchDeleteProject({
    sysProjectId: row.sysProjectId,
  }).then((res) => {
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
    sysSetDefault: item1.label ? 0 : 1,
  }).then((res) => {
    if (res.code === "00000") {
      message(res.msg, { type: "success" });
      tableRef.value.updateData(
        res.data,
        (it) => it.sysProjectId == row.sysProjectId,
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
    return router.push({
      name: "ProjectAiLlm",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  WEN_SHENG_TU: (row, item1) => {
    return router.push({
      name: "ProjectAiVincent",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  COLORIZATION: (row, item1) => {
    return router.push({
      name: "ProjectAiColorization",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  RESOLUTION: (row, item1) => {
    return router.push({
      name: "ProjectAiResolution",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  WEN_SHENG_SHI_PIN: (row, item1) => {
    return router.push({
      name: "ProjectAiVideo",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  SHE_BEI: (row, item1) => {
    return router.push({
      name: "device-template",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  DUAN_XIN: (row, item1) => {
    return router.push({
      name: "sms-template",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  YOU_JIAN: (row, item1) => {
    return router.push({
      name: "email-template",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  // 图像处理相关功能
  REN_XIANG_JIAN_CE: (row, item1) => {
    return router.push({
      name: "ProjectAiImageDetection",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  TU_XIANG_JIAN_CE: (row, item1) => {
    return router.push({
      name: "ProjectAiImageDetection",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  TU_XIANG_SHI_BIE: (row, item1) => {
    return router.push({
      name: "ProjectAiImageRecognition",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  FACE_PIAN_SHI_BIE: (row, item1) => {
    return router.push({
      name: "ProjectAiImageRecognition",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  TU_XIANG_TE_ZHENG_ZHI: (row, item1) => {
    return router.push({
      name: "ProjectAiImageFeature",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  REN_XIANG_TE_ZHENG_ZHI: (row, item1) => {
    return router.push({
      name: "ProjectAiImageFeature",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  OCR: (row, item1) => {
    return router.push({
      name: "ProjectAiImageOcr",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  TU_XIANG_FENG_GE: (row, item1) => {
    return router.push({
      name: "ProjectAiImageStyle",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
};

const handleEventCustom = async (row, item1, event) => {
  // 阻止事件冒泡和默认行为
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  try {
    // 检查eventMap中是否存在对应的处理函数
    if (!eventMap[item1.code]) {
      console.warn(`未找到功能代码 ${item1.code} 对应的处理函数`);
      return;
    }

    // 执行路由跳转
    console.log(`正在跳转到功能: ${item1.code}`, { row, item1 });
    const routeResult = eventMap[item1.code](row, item1);
    // 等待路由跳转完成
    if (routeResult && routeResult.then) {
      await routeResult;
    }
  } catch (error) {
    console.error(`功能 ${item1.code} 跳转失败:`, error);
    message(`页面跳转失败，请重试`, { type: "error" });
  }
};

const getDefaultValueArr = (row) => {
  const defaultValue = {};
  const storeValues1 = stringSplitToNumber(row.sysProjectFunctionDefaultIds);
  storeValues1.forEach((element) => {
    defaultValue[element] = true;
  });
  const storeValues = stringSplitToNumber(row.sysProjectFunction);
  const rs = storeValues.map((item) => {
    return {
      label: !!defaultValue[item],
      value: item,
      name: functionMap[item]?.sysDictItemName,
      code: functionMap[item]?.sysDictItemCode,
      icon: functionMap[item]?.sysDictItemIcon,
    };
  });
  return rs.filter((it) => it.name);
};

const getLabel = (val) => {
  return functionMap[val]?.sysDictItemName;
};

const getFunctionLabel = (val) => {
  const _rs = (val?.split(",") || []).map((item) => {
    return `<div type="primary"  class="mx-[2px]">${getLabel(item)}</div>`;
  });
  return _rs.join("");
};
const loading = ref(true);
const handleAfterLoadedData = (row, total) => {
  loading.value = false;
  row.forEach((item) => {
    item.source = getDefaultValueArr(item);
  });
  // 更新项目统计
  projectStats.total = total;
  projectStats.active = row.filter(
    (item) => item.status !== "completed"
  ).length;
  projectStats.completed = row.filter(
    (item) => item.status === "completed"
  ).length;

  return row;
};
const handleAfterPropertieSet = async () => {
  const res = await fetchListDictItem({
    sysDictId: 1,
  });
  dictItem = res?.data;
  const res1 = await fetchListDictItem({
    sysDictId: 6,
  });

  functionList = res1?.data;
  functionList.forEach((item) => {
    functionMap[item.sysDictItemId] = item;
  });
};

const handleDefault = async (data) => {
  defaultSettingRef.value.handleType(functionList);
  defaultSettingRef.value.handleOpen(data);
};
const handleSave = async (mode, data) => {
  saveDialogRef.value.handleDictItem(dictItem);
  saveDialogRef.value.handleFunction(functionList);
  saveDialogRef.value.handleOpen(mode, data);
};
const handleCopy = async (row) => {
  saveDialogRef.value.handleDictItem(dictItem);
  saveDialogRef.value.handleFunction(functionList);
  saveDialogRef.value.handleOpen("add", row);
};
const handleRefresh = async () => {
  tableRef.value?.reload(form);
};

const handleRowClick = async (data) => {
  handleSave("edit", data);
};

onMounted(async () => {
  await handleAfterPropertieSet();
});
</script>
<style lang="scss" scoped>
// 工作区背景
.project-workspace {
  position: relative;
  overflow: hidden;
}

.workspace-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -2;
  background: linear-gradient(
    135deg,
    var(--app-bg-secondary) 0%,
    var(--app-bg-tertiary) 100%
  );
}

.floating-particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;

  .particle {
    position: absolute;
    background: linear-gradient(
      45deg,
      var(--app-primary-light),
      var(--app-success-light)
    );
    border-radius: 50%;
    animation: float 4s ease-in-out infinite;
    opacity: 0.7;
    filter: blur(1px);
  }
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.6;

  &.orb-1 {
    width: 300px;
    height: 300px;
    background: linear-gradient(
      45deg,
      var(--app-primary-lighter),
      var(--app-success-lighter)
    );
    top: -150px;
    left: -150px;
  }

  &.orb-2 {
    width: 200px;
    height: 200px;
    background: linear-gradient(
      45deg,
      var(--app-success-lighter),
      var(--app-warning-lighter)
    );
    top: 50%;
    right: -100px;
  }

  &.orb-3 {
    width: 250px;
    height: 250px;
    background: linear-gradient(
      45deg,
      var(--app-warning-lighter),
      var(--app-primary-lighter)
    );
    bottom: -125px;
    left: 30%;
  }
}

// 头部样式
.dashboard-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--app-border-primary);
  padding: 0;
  height: auto;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      var(--app-primary-lighter) 50%,
      transparent 100%
    );
    animation: shimmer 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }

    100% {
      transform: translateX(100%);
    }
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .header-title {
    .title-wrapper {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .title-icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 16px;
      background: linear-gradient(
        135deg,
        rgba(64, 158, 255, 0.1),
        rgba(103, 194, 58, 0.1)
      );
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 24px var(--app-primary-lighter);

      .title-icon {
        font-size: 2rem;
        background: linear-gradient(
          135deg,
          var(--el-color-primary),
          var(--el-color-success)
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        z-index: 2;
      }

      .icon-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: linear-gradient(
          135deg,
          var(--el-color-primary),
          var(--el-color-success)
        );
        border-radius: 50%;
        opacity: 0.3;
        filter: blur(8px);
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.3;
        }

        50% {
          transform: translate(-50%, -50%) scale(1.2);
          opacity: 0.5;
        }
      }
    }

    .title-content {
      .title-text {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        background: linear-gradient(
          135deg,
          var(--el-color-primary),
          var(--el-color-success)
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        display: flex;
        align-items: center;
        gap: 12px;

        .title-badge {
          background: linear-gradient(135deg, #ffd700, #ffed4e);
          color: #1a1a1a;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-shadow: none;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from {
            box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
          }

          to {
            box-shadow: 0 4px 16px rgba(255, 215, 0, 0.6);
          }
        }
      }

      .title-subtitle {
        margin: 8px 0 0 0;
        color: var(--el-text-color-secondary);
        font-size: 1rem;
        font-weight: 400;
        display: flex;
        align-items: center;
        gap: 8px;

        .project-count {
          background: rgba(64, 158, 255, 0.1);
          color: var(--el-color-primary);
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-left: 8px;
        }
      }
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 24px;

    .stats-overview {
      display: flex;
      gap: 16px;

      .stat-item {
        text-align: center;
        padding: 12px 16px;
        backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid var(--el-border-color-lighter);
        box-shadow: 0 4px 12px var(--app-shadow-sm);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 6px 16px var(--app-shadow);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--el-color-primary);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--el-text-color-secondary);
          margin-top: 4px;
          font-weight: 500;
        }
      }
    }

    .add-project-btn {
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      background: linear-gradient(
        135deg,
        var(--el-color-primary),
        var(--el-color-primary-light-3)
      );
      border: none;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;

      .btn-text {
        position: relative;
        z-index: 2;
      }

      .btn-glow {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        transition: left 0.6s ease;
      }

      &:hover {
        box-shadow: 0 8px 20px rgba(64, 158, 255, 0.4);
        transform: translateY(-2px);

        .btn-glow {
          left: 100%;
        }
      }
    }
  }
}

.project-tags {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  position: absolute;
  top: 20px;
  right: 20px;
  max-width: 70%;
  z-index: 10;

  .project-name-tag {
    border-radius: 12px;
    padding: 8px 16px;
    font-weight: 600;
    font-size: 0.9rem;
    border: none;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    background: linear-gradient(
      135deg,
      rgba(64, 158, 255, 0.9),
      rgba(64, 158, 255, 0.7)
    );
    color: #fff;
    text-shadow: 0 1px 2px var(--app-shadow-sm);

    &:hover {
      box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
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
      box-shadow: 0 2px 6px var(--app-shadow-sm);
      transition: all 0.3s ease;
      background: var(--el-color-success-light-9, rgba(103, 194, 58, 0.12));
      color: var(--el-color-success, #67c23a);

      &:hover {
        box-shadow: 0 4px 10px var(--app-shadow);
      }
    }
  }
}

.content-wrapper {
  //height: calc(100% - 60px); /* 为分页组件预留60px空间 */
  overflow: hidden;
  /* 改为hidden，让ScTable内部处理滚动 */
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  padding: 16px;
}

.modern-workspace {
  overflow: hidden;
  height: 100%;

  .project-dashboard {
    height: 100%;
    overflow: hidden;

    &::before {
      content: "";
      position: fixed;
      inset: 0;
      background:
        radial-gradient(
          circle at 0% 0%,
          rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.08),
          transparent 50%
        ),
        radial-gradient(
          circle at 100% 100%,
          rgba(var(--el-color-success-rgb, 103, 194, 58), 0.08),
          transparent 50%
        );
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
  min-height: 260px;
  padding: 0;
  border-radius: 20px;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.98),
    rgba(248, 250, 252, 0.95)
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--el-text-color-primary);
  overflow: hidden;
  cursor: pointer;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      135deg,
      hsl(calc(var(--random-hue, 200) + 180), 70%, 85%) 0%,
      hsl(calc(var(--random-hue, 200) + 180), 60%, 75%) 100%
    );
    clip-path: polygon(0% 0%, 60% 0%, 0% 60%);
    border-radius: 24px;
    z-index: -1;
    opacity: 0.9;
    transition: all 0.3s ease;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: var(--project-icon-url);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    clip-path: polygon(0% 0%, 40% 0%, 0% 60%);
    border-radius: 24px;
    z-index: 2;
    opacity: 0.8;
    transition: all 0.3s ease;
    backdrop-filter: blur(1px);
  }

  &:hover::before {
    opacity: 1;
    transform: scale(1.01);
  }

  &:hover::after {
    opacity: 1;
    transform: scale(1.01);
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 1;
  }

  &.card-new {
    border: 2px solid var(--el-color-success);
    box-shadow:
      0 8px 32px var(--app-success-lighter),
      0 2px 8px var(--app-success-light);

    &::after {
      content: "NEW";
      position: absolute;
      top: 12px;
      left: 12px;
      background: linear-gradient(
        135deg,
        var(--el-color-success),
        var(--el-color-success-light-3)
      );
      color: var(--el-text-color-primary);
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
      z-index: 10;
      animation: pulse 2s infinite;
    }
  }

  &.card-featured {
    background: linear-gradient(
      135deg,
      var(--app-warning-lighter),
      var(--app-warning-light)
    );
    border: 2px solid var(--app-warning-light);

    &::after {
      content: "⭐";
      position: absolute;
      top: 12px;
      right: 12px;
      font-size: 1.2rem;
      z-index: 10;
      animation: sparkle 3s ease-in-out infinite;
    }
  }

  &.card-updated {
    border-left: 4px solid var(--el-color-primary);

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, var(--el-color-primary), transparent);
      animation: progress 2s ease-in-out infinite;
    }
  }

  .card-glow {
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary),
      var(--el-color-success),
      var(--el-color-warning)
    );
    border-radius: 26px;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
    filter: blur(8px);
  }

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow:
      0 20px 40px rgba(99, 102, 241, 0.12),
      0 8px 16px var(--app-shadow-md),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);

    &::before {
      opacity: 1;
    }

    .card-glow {
      opacity: 0.1;
    }

    .image-shine {
      transform: translateX(100%);
    }

    .project-image .image-container {
      transform: scale(1.05);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }

    50% {
      transform: scale(1.05);
    }
  }

  @keyframes sparkle {
    0%,
    100% {
      transform: rotate(0deg) scale(1);
    }

    25% {
      transform: rotate(90deg) scale(1.1);
    }

    50% {
      transform: rotate(180deg) scale(1);
    }

    75% {
      transform: rotate(270deg) scale(1.1);
    }
  }

  @keyframes progress {
    0% {
      width: 0%;
    }

    100% {
      width: 100%;
    }
  }

  .project-image {
    aspect-ratio: 9/16;
    border-radius: 19px 19px 0 0;
    overflow: hidden;
    margin-bottom: 0;
    position: relative;
    transition: all 0.4s ease;

    &:hover {
      .image-overlay {
        opacity: 0.6;
      }
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }

    .project-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
      background: linear-gradient(
        135deg,
        var(--app-bg-secondary),
        var(--app-bg-tertiary)
      );
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        transparent 50%,
        rgba(255, 255, 255, 0.9) 100%
      );
      opacity: 1;
      transition: opacity 0.4s ease;
      pointer-events: none;
      z-index: 2;
    }

    .image-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.4) 50%,
        transparent 100%
      );
      transition: transform 0.6s ease;
      z-index: 3;
    }

    .image-placeholder {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.9);
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 32px 20px;

      .placeholder-icon-wrapper {
        width: 80px;
        height: 80px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 12px 24px rgba(255, 255, 255, 0.1);
        box-shadow: 0 12px 24px var(--app-primary-light);
      }

      .placeholder-icon {
        font-size: 2.5rem;
        background: linear-gradient(
          135deg,
          var(--el-color-primary),
          var(--el-color-success)
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .placeholder-text {
        font-size: 1.1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        text-align: center;
        max-width: 90%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }
    }
  }

  .card-header {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0;

    .project-status {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
      z-index: 10;
      transition: all 0.3s ease;

      &.status-active {
        background: rgba(34, 197, 94, 0.9);
        border: none;
        color: #fff;
      }

      &.status-completed {
        background: rgba(99, 102, 241, 0.9);
        border: none;
        color: #fff;
      }

      &.status-paused {
        background: rgba(245, 158, 11, 0.9);
        border: none;
        color: #fff;
      }

      &.status-error {
        background: rgba(239, 68, 68, 0.9);
        border: none;
        color: #fff;
      }

      .status-indicator {
        position: relative;

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
        }

        .status-pulse {
          display: none;
        }
      }

      .status-text {
        font-size: 0.7rem;
        font-weight: 600;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
    }
  }

  // 项目内容区域
  .project-content {
    padding: 12px 20px 18px;
    flex: 1;
    display: flex;
    flex-direction: column;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 1) 20%
    );

    .project-header {
      margin-bottom: 12px;

      .project-title {
        margin: 0 0 6px 0;
        font-size: 1.15rem;
        font-weight: 600;
        color: #1e293b;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: color 0.25s ease;

        &:hover {
          color: #6366f1;
        }
      }

      .project-meta {
        display: flex;
        align-items: center;
        gap: 10px;

        .project-id {
          font-size: 0.75rem;
          color: #6366f1;
          background: rgba(99, 102, 241, 0.08);
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 500;
        }

        .project-date {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 400;
        }
      }
    }

    .project-description {
      margin-bottom: 14px;
      flex: 1;

      .description-text {
        margin: 0;
        font-size: 0.875rem;
        color: #64748b;
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .project-stats {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-top: 1px solid var(--el-border-color-lighter);

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8rem;
        color: var(--el-text-color-secondary);
        transition: color 0.3s ease;

        &:hover {
          color: var(--el-color-primary);
        }

        i {
          font-size: 0.9rem;
        }
      }
    }
  }

  @keyframes statusPulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.6;
    }

    50% {
      transform: translate(-50%, -50%) scale(1.5);
      opacity: 0.2;
    }

    100% {
      transform: translate(-50%, -50%) scale(2);
      opacity: 0;
    }
  }

  .project-tags {
    position: absolute;
    top: 16px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    z-index: 5;

    .primary-tags {
      display: flex;
      gap: 8px;

      .project-name-tag {
        background: linear-gradient(
          135deg,
          rgba(64, 158, 255, 0.15),
          rgba(64, 158, 255, 0.08)
        );
        border: 1px solid rgba(64, 158, 255, 0.2);
        color: var(--el-color-primary);
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.3s ease;

        &:hover {
          background: linear-gradient(
            135deg,
            rgba(64, 158, 255, 0.2),
            rgba(64, 158, 255, 0.1)
          );
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
        }
      }
    }

    .function-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-width: 60%;
      justify-content: flex-end;

      .function-tag {
        padding: 4px 8px;
        border-radius: 8px;
        font-size: 0.7rem;
        font-weight: 500;
        border: none;
        backdrop-filter: blur(8px);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        &[type="primary"] {
          background: rgba(64, 158, 255, 0.12);
          color: var(--el-color-primary);
        }

        &[type="success"] {
          background: rgba(103, 194, 58, 0.12);
          color: var(--el-color-success);
        }

        &[type="warning"] {
          background: rgba(255, 193, 7, 0.12);
          color: var(--el-color-warning);
        }

        &[type="info"] {
          background: rgba(144, 147, 153, 0.12);
          color: var(--el-color-info);
        }

        &[type="danger"] {
          background: rgba(245, 108, 108, 0.12);
          color: var(--el-color-danger);
        }
      }
    }
  }

  .project-actions {
    position: absolute;
    bottom: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 5;

    .quick-actions {
      display: flex;
      gap: 8px;

      .action-button {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        padding: 0;
        transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        border: none;
        backdrop-filter: blur(10px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        position: relative;
        overflow: hidden;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transition: left 0.5s ease;
        }

        &:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);

          &::before {
            left: 100%;
          }
        }

        &[type="primary"] {
          background: linear-gradient(
            135deg,
            rgba(64, 158, 255, 0.15),
            rgba(64, 158, 255, 0.08)
          );
          color: var(--el-color-primary);
          border: 1px solid rgba(64, 158, 255, 0.2);

          &:hover {
            background: linear-gradient(
              135deg,
              rgba(64, 158, 255, 0.25),
              rgba(64, 158, 255, 0.15)
            );
            box-shadow: 0 6px 16px rgba(64, 158, 255, 0.3);
          }
        }

        &[type="success"] {
          background: linear-gradient(
            135deg,
            rgba(103, 194, 58, 0.15),
            rgba(103, 194, 58, 0.08)
          );
          color: var(--el-color-success);
          border: 1px solid rgba(103, 194, 58, 0.2);

          &:hover {
            background: linear-gradient(
              135deg,
              rgba(103, 194, 58, 0.25),
              rgba(103, 194, 58, 0.15)
            );
            box-shadow: 0 6px 16px rgba(103, 194, 58, 0.3);
          }
        }

        &[type="warning"] {
          background: linear-gradient(
            135deg,
            rgba(255, 193, 7, 0.15),
            rgba(255, 193, 7, 0.08)
          );
          color: var(--el-color-warning);
          border: 1px solid rgba(255, 193, 7, 0.2);

          &:hover {
            background: linear-gradient(
              135deg,
              rgba(255, 193, 7, 0.25),
              rgba(255, 193, 7, 0.15)
            );
            box-shadow: 0 6px 16px rgba(255, 193, 7, 0.3);
          }
        }
      }
    }

    .main-actions {
      .more-btn {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.9),
          rgba(255, 255, 255, 0.7)
        );
        border: 1px solid rgba(0, 0, 0, 0.1);
        color: var(--el-text-color-primary);
        backdrop-filter: blur(10px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;

        &:hover {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 1),
            rgba(255, 255, 255, 0.9)
          );
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }
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
      box-shadow: 0 2px 6px var(--app-shadow-sm);
      transition: all 0.3s ease;
      color: var(--el-text-color-primary);

      &:hover {
        background: var(--el-bg-color-overlay, rgba(255, 255, 255, 0.95));
        box-shadow: 0 4px 10px var(--app-shadow);
      }
    }
  }
}

.modern-dialog {
  :deep(.el-dialog) {
    border-radius: 20px;
    overflow: hidden;
    background: var(--el-bg-color-overlay);
    box-shadow:
      0 25px 50px rgba(0, 0, 0, 0.15),
      0 10px 20px rgba(0, 0, 0, 0.08);

    .el-dialog__header {
      margin: 0;
      border-bottom: 1px solid
        var(--el-border-color-lighter, rgba(0, 0, 0, 0.05));
      background: var(--el-bg-color-overlay, rgba(255, 255, 255, 0.95));
    }

    .el-dialog__body {
      padding: 28px;
      background: var(--el-bg-color-overlay);
      color: var(--el-text-color-primary);
    }

    .el-dialog__footer {
      padding: 20px 24px;
      border-top: 1px solid var(--el-border-color-lighter, rgba(0, 0, 0, 0.05));
      background: var(--el-bg-color-overlay, rgba(255, 255, 255, 0.95));
    }
  }
}

// 添加暗色模式特定样式
.dark {
  .project-workspace {
    .workspace-background {
      background: linear-gradient(
        135deg,
        var(--app-bg-primary) 0%,
        var(--app-bg-secondary) 100%
      );
    }

    .gradient-orb {
      &.orb-1 {
        background: linear-gradient(
          45deg,
          var(--app-primary-light),
          var(--app-success-light)
        );
      }

      &.orb-2 {
        background: linear-gradient(
          45deg,
          var(--app-success-light),
          var(--app-warning-light)
        );
      }

      &.orb-3 {
        background: linear-gradient(
          45deg,
          var(--app-warning-light),
          var(--app-primary-light)
        );
      }
    }
  }

  .dashboard-header {
    background: rgba(15, 23, 42, 0.9);
    border-bottom-color: var(--app-border-primary);

    .title-text {
      background: linear-gradient(135deg, #60a5fa, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;

      .title-icon {
        background: linear-gradient(135deg, #60a5fa, #34d399);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }

  .project-card {
    background: rgba(30, 41, 59, 0.9);
    box-shadow:
      0 8px 32px var(--app-shadow-lg),
      0 2px 8px var(--app-shadow-md),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);

    &:hover {
      box-shadow:
        0 20px 40px var(--app-shadow-xl),
        0 8px 16px var(--app-shadow-lg),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    .project-image {
      .image-container {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      }

      .image-placeholder {
        background: linear-gradient(
          135deg,
          var(--app-primary-light) rgba(103, 194, 58, 0.15)
        );
      }
    }

    .project-content {
      .project-title {
        color: var(--el-text-color-primary);
      }

      .project-status {
        background: linear-gradient(
          135deg,
          var(--app-success) rgba(103, 194, 58, 0.1)
        );
        border-color: var(--app-success-light);
      }
    }
  }

  .more .el-button-group .el-button {
    background: rgba(51, 65, 85, 0.8);
    border-color: var(--app-border-primary);
    color: var(--el-text-color-primary);

    &:hover {
      background: rgba(71, 85, 105, 0.9);
      border-color: var(--app-border-secondary);
      color: #fff;
    }
  }

  :deep(.scTable-page) {
    background: rgba(30, 41, 59, 0.85) !important;
    border-color: var(--app-border-primary);

    &:hover {
      background: rgba(51, 65, 85, 0.9) !important;
    }
  }
}

// 添加响应式调整
@media (max-width: 1200px) {
  .dashboard-header {
    .header-content {
      padding: 20px 24px;

      .header-title .title-text {
        font-size: 1.8rem;
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    .header-content {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
      padding: 16px 20px;

      .header-title .title-text {
        font-size: 1.6rem;
      }

      .add-project-btn {
        align-self: stretch;
        justify-content: center;
      }
    }
  }

  .content-wrapper {
    padding: 12px;
  }

  .project-card {
    .project-content {
      padding: 20px;

      .project-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;

        .project-title {
          max-width: 100%;
          font-size: 1.2rem;
        }

        .project-status {
          align-self: flex-end;
        }
      }
    }

    .project-tags {
      top: 16px;
      right: 16px;
      max-width: 80%;

      .project-name-tag {
        font-size: 0.8rem;
        padding: 6px 12px;
      }
    }

    .project-actions {
      bottom: 16px;
      left: 16px;
      flex-wrap: wrap;
      max-width: calc(100% - 80px);

      .action-button {
        width: 28px;
        height: 28px;
      }
    }

    .more {
      bottom: 16px;
      right: 16px;
    }
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    .header-content {
      padding: 12px 16px;

      .header-title {
        .title-text {
          font-size: 1.4rem;

          .title-icon {
            font-size: 1.6rem;
          }
        }

        .title-subtitle {
          font-size: 0.9rem;
        }
      }
    }
  }

  .content-wrapper {
    padding: 8px;
  }

  .project-card {
    .project-content {
      padding: 16px;

      .project-header .project-title {
        font-size: 1.1rem;
      }

      .project-description .description-text {
        font-size: 0.9rem;
        -webkit-line-clamp: 1;
      }
    }
  }
}
</style>
