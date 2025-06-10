<template>
  <div class="app-container">
    <el-container>
      <!-- 顶部操作区 -->
      <el-header class="action-bar">
        <div class="left-section">
          <h2 class="page-title">
            <div class="current-category">
              <h2 class="category-title"><IconifyIconOnline icon="ep:monitor" class="mr-2" />应用列表  
                <el-tag type="info" effect="plain" class="app-count">
            共
            <span class="count-num">{{ totalCount }}</span>
            个应用
          </el-tag></h2>
              <p class="category-desc">管理和监控所有应用服务，查看健康状态和性能指标</p>
            </div>
          </h2>
        </div>

        <div class="right-section">
          <!-- 搜索框 -->
          <el-input v-model="params.keyword" placeholder="搜索应用名称" class="search-input" clearable @input="handleSearch">
            <template #prefix>
              <IconifyIconOnline icon="ep:search" />
            </template>
          </el-input>

          <!-- 添加按钮 -->
          <el-button type="primary" class="add-btn" @click="doEdit({}, 'add')">
            <IconifyIconOnline icon="ep:plus" class="mr-1" />
            新增应用
          </el-button>
        </div>
      </el-header>

      <!-- 卡片列表区域 -->
      <el-main class="!p-0 card-container">
        <!-- 空状态展示 -->
        <el-empty v-if="isEmpty" description="暂无应用数据" :image-size="200" class="empty-state">
          <el-button type="primary" @click="doEdit({}, 'add')">
            <IconifyIconOnline icon="ep:plus" class="mr-1" />添加应用
          </el-button>
        </el-empty>

        <!-- 卡片列表 -->
        <ScTable v-if="!isEmpty" ref="dataRef" v-loading="loading" layout="card" :url="fetchAppPageList" :params="params" :col-size="3" :data-loaded="handleDataLoaded">
          <template #default="{ row }">
            <div class="app-wrapper" :class="getStatusClass(row.status)">
              <div class="media-content">
                <div class="app-logo" @click="doOpenApps(row)">
                  <IconifyIconOnline :icon="getAppIcon(row.status)" />
                </div>
                
                <div class="app-content">
                  <h3 class="app-title">{{ row.monitorApplicationName }}</h3>
                  <div class="app-tags">
                    <el-tag :type="getStatusType(row.status)" size="small" effect="light">
                      {{ getStatusText(row.status) }}
                    </el-tag>
                  </div>
                  
                  <div class="app-meta">
                    <div class="meta-item">
                      <IconifyIconOnline icon="ep:connection" class="mr-1" />
                      <span>{{ row?.monitorRequests ? row.monitorRequests?.length : 0 }} 个服务</span>
                    </div>
                    <div class="meta-item" v-if="row.updateTime">
                      <IconifyIconOnline icon="ep:time" class="mr-1" />
                      <span>{{ formatDate(row.updateTime, "MM-dd HH:mm") }}</span>
                    </div>
                  </div>
                  
                  <div class="app-desc">
                    {{ row.monitorName || "暂无说明" }}
                  </div>
                  
                  <div class="app-footer">
                    <div class="app-actions">
                      <el-button size="small" type="primary" @click="doOpenApps(row)" class="action-btn">
                        <IconifyIconOnline icon="ep:view" class="mr-1" />查看
                      </el-button>
                      
                      <el-button size="small" type="success" @click="doDocument(row)" class="action-btn">
                        <IconifyIconOnline icon="ep:document" class="mr-1" />文档
                      </el-button>
                      
                      <el-button size="small" @click="doEdit(row, 'edit')" class="action-btn">
                        <IconifyIconOnline icon="ep:edit" class="mr-1" />编辑
                      </el-button>
                      
                      <el-popconfirm :title="$t('message.confimDelete')" confirm-button-type="danger" cancel-button-type="info" width="220" @confirm="doDelete(row)">
                        <template #reference>
                          <el-button size="small" type="danger" class="action-btn">
                            <IconifyIconOnline icon="ep:delete" class="mr-1" />删除
                          </el-button>
                        </template>
                      </el-popconfirm>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </ScTable>
      </el-main>
    </el-container>

    <!-- 弹窗组件 -->
    <InfoDialog ref="infoDialogRef" />
    <SaveDialog ref="saveDialogRef" @success="handleSuccess" />
  </div>
</template>

<script setup>
import { fetchAppPageList, fetchAppDelete } from "@/api/monitor/app";
import ScTable from "@repo/components/ScTable/index.vue";
import { reactive, ref, nextTick, onMounted, defineAsyncComponent, computed, shallowRef } from "vue";
import { message } from "@repo/utils";
import { useRouter } from "vue-router";
import SaveDialog from "./save.vue";
import InfoDialog from "./info.vue";

// 响应式状态管理
const params = reactive({
  page: 1,
  pageSize: 12,
  keyword: ""
});

// 引用和状态
const router = useRouter();
const dataRef = shallowRef();
const loading = ref(false);
const infoDialogStatus = ref(false);
const infoDialogStatusSync = ref(false);
const infoDialogRef = shallowRef();
const saveDialogStatus = ref(false);
const saveDialogRef = shallowRef();
const isEmpty = ref(false); // 空状态标记
const totalCount = ref(0); // 应用总数

// 进度条颜色计算
const progressColor = computed(() => {
  return [
    { color: "#f56c6c", percentage: 20 },
    { color: "#e6a23c", percentage: 40 },
    { color: "#5cb87a", percentage: 60 },
    { color: "#1989fa", percentage: 80 },
    { color: "#6f7ad3", percentage: 100 }
  ];
});

/**
 * 格式化日期
 */
const formatDate = (date, format = "yyyy-MM-dd HH:mm") => {
  if (!date) return "暂无数据";
  try {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");

    return format.replace("yyyy", year).replace("MM", month).replace("dd", day).replace("HH", hours).replace("mm", minutes);
  } catch (e) {
    console.error("日期格式化错误:", e);
    return date;
  }
};

/**
 * 获取状态类型
 */
const getStatusType = status => {
  const statusMap = {
    1: "success",
    0: "info",
    2: "warning",
    3: "danger"
  };
  return statusMap[status] || "info";
};

/**
 * 获取状态文本
 */
const getStatusText = status => {
  const statusMap = {
    1: "运行中",
    0: "未运行",
    2: "警告",
    3: "异常"
  };
  return statusMap[status] || "未知状态";
};

/**
 * 获取状态类名
 */
const getStatusClass = status => {
  return {
    "app-wrapper-active": status === 1,
    "app-wrapper-warning": status === 2,
    "app-wrapper-danger": status === 3
  };
};

/**
 * 获取应用图标
 */
const getAppIcon = status => {
  const iconMap = {
    1: "ep:monitor",
    0: "ep:loading",
    2: "ep:warning",
    3: "ep:close-bold"
  };
  return iconMap[status] || "ep:monitor";
};

/**
 * 处理搜索
 */
const handleSearch = (() => {
  let timer = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (dataRef.value) {
        dataRef.value.refresh();
      }
    }, 300);
  };
})();

/**
 * 处理数据加载完成
 */
const handleDataLoaded = (data, total) => {
  isEmpty.value = !data || data.length === 0;
  totalCount.value = total || 0;
};

/**
 * 打开应用详情
 */
const doOpenApps = async item => {
  infoDialogStatus.value = true;
  nextTick(async () => {
    infoDialogRef.value.setData(item);
    infoDialogRef.value.open("view");
  });
};

/**
 * 编辑或新增应用
 */
const doEdit = async (item, mode) => {
  saveDialogStatus.value = true;
  await nextTick();
  saveDialogRef.value.setData(item);
  saveDialogRef.value.open(mode);
};

/**
 * 查看文档
 */
const doDocument = async (item) => {
  router.push(`/service/document/${item.monitorId}`);
};

/**
 * 删除应用
 */
const doDelete = async item => {
  loading.value = true;
  try {
    const res = await fetchAppDelete({ id: item.monitorId });
    if (res.code === "00000") {
      message.success("删除成功");
      dataRef.value.refresh();
    } else {
      message.error(res.msg || "删除失败");
    }
  } catch (error) {
    message.error("操作异常，请稍后重试");
    console.error("删除应用出错:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 处理保存成功后的回调
 */
const handleSuccess = () => {
  dataRef.value.refresh();
};

// 生命周期钩子
onMounted(() => {
  infoDialogStatusSync.value = true;
});
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
  background-color: var(--el-bg-color);
  height: 100%;
}

/* 顶部操作区样式 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 20px 0;
  height: auto !important;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 20px;

  .left-section {
    display: flex;
    align-items: center;

    .page-title {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-right: 16px;
      display: flex;
      align-items: center;
    }

    .app-count {
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 20px;

      .count-num {
        font-weight: bold;
        color: var(--el-color-primary);
      }
    }
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 16px;

    .search-input {
      width: 240px;
      border-radius: 8px;
      
      :deep(.el-input__wrapper) {
        border-radius: 8px;
      }
    }

    .add-btn {
      display: flex;
      align-items: center;
      border-radius: 8px;
      padding: 8px 16px;
    }
  }
}

/* 卡片容器样式 */
.card-container {
  position: relative;

  .empty-state {
    margin-top: 60px;
  }
}

.current-category {
  margin-bottom: 20px;
  
  .category-title {
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 12px;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    
    &::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 20px;
      background-color: var(--el-color-primary);
      margin-right: 12px;
      border-radius: 2px;
    }
  }
  
  .category-desc {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0 0 0 16px;
    line-height: 1.6;
  }
}

/* 应用卡片样式 */
.app-wrapper {
  height: 200px;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary);
    
    &::before {
      height: 4px;
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0;
    background-color: var(--el-color-primary);
    transition: height 0.3s ease;
    z-index: 1;
  }
  
  &.app-wrapper-active {
    &::before {
      background-color: var(--el-color-success);
    }
  }
  
  &.app-wrapper-warning {
    &::before {
      background-color: var(--el-color-warning);
    }
  }
  
  &.app-wrapper-danger {
    &::before {
      background-color: var(--el-color-danger);
    }
  }
  
  .media-content {
    display: flex;
    height: 100%;
  }
  
  .app-logo {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    margin: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .app-content {
    flex: 1;
    padding: 20px 20px 20px 0;
    display: flex;
    flex-direction: column;
  }
  
  .app-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .app-desc {
    margin: 12px 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  
  .app-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
    margin-bottom: 8px;
    
    .meta-item {
      display: flex;
      align-items: center;
      font-size: 13px;
      color: var(--el-text-color-secondary);
      padding: 4px 10px;
      background-color: var(--el-fill-color-light);
      border-radius: 12px;
      
      &:hover {
        background-color: var(--el-fill-color);
        color: var(--el-color-primary);
      }
    }
  }
  
  .app-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    .app-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      
      .el-button {
        border-radius: 6px;
      }
      
      .action-btn {
        transition: all 0.3s;
      }
    }
  }
}

/* 响应式样式 */
@media (max-width: 992px) {
  .action-bar {
    flex-direction: column;
    align-items: flex-start;

    .left-section {
      margin-bottom: 16px;
    }

    .right-section {
      width: 100%;
      
      .search-input {
        flex: 1;
      }
    }
  }
}

@media (max-width: 768px) {
  .app-wrapper {
    height: auto;
    
    .media-content {
      flex-direction: column;
    }
    
    .app-logo {
      width: 100%;
      margin: 20px auto 0;
    }
    
    .app-content {
      padding: 20px;
    }
    
    .app-actions {
      justify-content: center;
    }
  }
  
  .right-section {
    flex-direction: column;
    align-items: stretch;

    .search-input {
      width: 100% !important;
      margin-bottom: 12px;
    }

    .add-btn {
      width: 100%;
    }
  }
}
</style>

