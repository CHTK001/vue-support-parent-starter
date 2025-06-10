<template>
  <div class="online-service-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar-container">
      <div class="toolbar-title">
        <div class="current-category">
          <h2 class="category-title"><IconifyIconOnline icon="ep:monitor" class="mr-2" />在线服务列表</h2>
          <p class="category-desc">查看和管理当前在线的所有服务实例及其状态</p>
        </div>
      </div>

      <div class="refresh-control">
        <el-select v-model="countDownTime" class="refresh-select" size="default" placeholder="刷新间隔">
          <el-option :value="5" label="5秒" />
          <el-option :value="10" label="10秒" />
          <el-option :value="20" label="20秒" />
          <el-option :value="30" label="30秒" />
          <el-option :value="60" label="60秒" />
        </el-select>
        <ScCountDown v-model="countDownTime" :loop="true" class="countdown-display" @finish="refresh">
          <template #default="{ row }">
            <div class="countdown-text">
              <IconifyIconOnline icon="ep:refresh" class="countdown-icon" :class="{ rotating: row.seconds < 3 }" />
              <span>{{ row.seconds }}秒后刷新</span>
            </div>
          </template>
        </ScCountDown>
      </div>
    </div>

    <!-- 服务卡片列表 -->
    <div class="service-list-container">
      <!-- 服务列表 -->
      <ScTable ref="tableRef" :data="data.tableData" layout="card" :loading="loading" :col-size="3" empty-text="暂无在线服务" @refresh="refresh">
        <template #default="{ row }">
          <div class="app-wrapper" :class="getStatusClass(row.metadata?.applicationActive)">
            <div class="media-content">
              <div class="app-logo">
                <IconifyIconOnline :icon="getStatusIcon(row.metadata?.applicationActive)" />
              </div>

              <div class="app-content">
                <h3 class="app-title">{{ row.metadata?.applicationName }}</h3>
                <div class="app-tags">
                  <el-tag :type="row.metadata?.applicationActive === 'UP' ? 'success' : 'warning'" effect="light" size="small" class="status-tag">
                    {{ row.metadata?.applicationActive }}
                  </el-tag>
                  <el-tag v-if="row.metadata?.applicationActiveInclude" size="small" type="info" effect="plain" class="ml-2">
                    {{ row.metadata?.applicationActiveInclude }}
                  </el-tag>
                </div>

                <div class="app-meta">
                  <div class="meta-item">
                    <IconifyIconOnline icon="ep:connection" class="mr-1" />
                    <span>{{ row.metadata?.applicationHost }}:{{ row.metadata?.applicationPort }}</span>
                  </div>
                  <div class="meta-item" v-if="row.metadata?.applicationProfile">
                    <IconifyIconOnline icon="ep:setting" class="mr-1" />
                    <span>{{ row.metadata?.applicationProfile }}</span>
                  </div>
                </div>

                <div class="app-desc">
                  {{ row.metadata?.applicationDesc || `${row.metadata?.applicationName} 服务实例` }}
                </div>

                <div class="app-footer">
                  <div class="app-actions">
                    <el-button size="small" type="primary" @click="doDatav(row)" class="action-btn"> <IconifyIconOnline icon="ep:data-board"  /></el-button>

                    <el-button size="small" type="success" @click="onLog(row)" class="action-btn"> <IconifyIconOnline icon="ep:document" /> </el-button>

                    <el-button size="small" type="warning" @click="onTrace(row)" class="action-btn"> <IconifyIconOnline icon="ep:share"  /> </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ScTable>
    </div>

    <!-- 弹窗组件 -->
    <log ref="detailRef" :form="currentRow" :datav="false" :zIndex="20240925" :overlay="true" />
    <trace ref="detailRef1" :form="currentRow" :datav="false" :zIndex="2001" :overlay="true" />
  </div>
</template>

<script setup>
import { fetchServiceList } from "@/api/monitor/service";
import ScCountDown from "@repo/components/ScCountDown/index.vue";
import ScTable from "@repo/components/ScTable/index.vue";
import { router } from "@repo/core";
import { Base64 } from "js-base64";
import { defineAsyncComponent, markRaw, nextTick, onMounted, reactive, ref } from "vue";

// 异步加载组件
const log = defineAsyncComponent(() => import("../dashboard/portlet/log.vue"));
const trace = defineAsyncComponent(() => import("../dashboard/portlet/urldetail.vue"));

// 当前选中的行数据
const currentRow = ref({});
const tableRef = ref(null);
const loading = ref(false);

// 日志弹窗控制
const detailVisible = ref(false);
const detailRef = ref();
const onLog = async (row) => {
  currentRow.value = row;
  detailVisible.value = true;
  await nextTick();
  detailRef.value?.open();
};

// 链路追踪弹窗控制
const detailVisible1 = ref(false);
const detailRef1 = ref();
const onTrace = async (row) => {
  currentRow.value = row;
  detailVisible1.value = true;
  await nextTick();
  detailRef1.value?.open();
};

// 参数
const params = reactive({
  uriSpec: "monitor",
});

// 表格数据
const data = reactive({
  tableData: markRaw([]),
});

// 倒计时刷新控制
const countDownTime = ref(10);

// 获取服务列表数据
const getData = () => {
  loading.value = true;
  fetchServiceList(params)
    .then((res) => {
      data.tableData = res.data;
      loading.value = false;
    })
    .catch(() => {
      loading.value = false;
    });
};

// 刷新数据
const refresh = () => {
  loading.value = true;
  fetchServiceList(params)
    .then((res) => {
      data.tableData = res.data;
      loading.value = false;
    })
    .catch(() => {
      loading.value = false;
    });
};

// 跳转到数据大屏
const doDatav = (item) => {
  router.push({
    path: "/datav",
    query: {
      data: Base64.encode(JSON.stringify(item)),
      appName: item.metadata.applicationName,
    },
  });
};

// 根据服务状态获取样式类名
const getStatusClass = (status) => {
  return {
    "app-wrapper-active": status === "UP",
    "app-wrapper-warning": status === "DOWN",
  };
};

// 根据状态获取图标
const getStatusIcon = (status) => {
  return status === "UP" ? "ep:connection" : "ep:warning";
};

// 组件挂载时获取数据
onMounted(async () => {
  getData();
});
</script>

<style lang="scss" scoped>
.online-service-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
  padding: 20px;
}

// 顶部工具栏样式
.toolbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .toolbar-title {
    display: flex;
    align-items: center;
    font-size: 22px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .refresh-control {
    display: flex;
    align-items: center;
    gap: 12px;

    .refresh-select {
      width: 120px;
    }

    .countdown-display {
      min-width: 140px;

      .countdown-text {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--el-text-color-secondary);

        .countdown-icon {
          color: var(--el-color-primary);

          &.rotating {
            animation: rotate 1s linear infinite;
          }
        }
      }
    }
  }
}

// 服务列表容器
.service-list-container {
  flex: 1;
  overflow: auto;
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
      content: "";
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

// 应用卡片样式
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
    content: "";
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
    background-color: var(--el-fill-color-light);
    font-size: 40px;
    color: var(--el-color-primary);
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

  .app-desc {
    margin: 12px 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .app-footer {
    display: flex;
    justify-content: flex-end;
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

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
      }
    }
  }
}

// 动画效果
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

// 响应式调整
@media (max-width: 768px) {
  .toolbar-container {
    flex-direction: column;
    align-items: flex-start;

    .toolbar-title {
      margin-bottom: 16px;
    }

    .refresh-control {
      width: 100%;
      justify-content: space-between;
    }
  }
}
</style>
