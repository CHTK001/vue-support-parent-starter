<template>
  <div class="proxy-container">
    <div class="toolbar-container">
      <div class="toolbar-title">
        <div class="current-category">
          <h2 class="category-title"><IconifyIconOnline icon="ep:connection" class="mr-2" />代理服务管理</h2>
          <p class="category-desc">管理和配置所有代理服务，包括HTTP、TCP和WebSocket代理</p>
        </div>
      </div>
      <el-button type="primary" class="add-proxy-btn" @click="doSave">
        <IconifyIconOnline icon="ep:plus"  />
        添加代理
      </el-button>
    </div>

    <div class="proxy-content">
      <ScTable ref="tableRef" layout="card" :data-loaded="handleDataLoaded" :url="fetchProxyPage" :params="form" class="proxy-card" :appendable="false" :col-size="3">
        <template #default="{ row }">
          <div class="app-wrapper" :class="{ 'app-wrapper-active': row?.proxyStatus == 1 }">
            <div class="media-content">
              <div class="app-logo">
                <IconifyIconOnline :icon="getProxyIcon(row.proxyProtocol)" />
              </div>
              
              <div class="app-content">
                <h3 class="app-title" @click="doOpenUrl(row)">
                  {{ row.proxyName }}
                  <IconifyIconOnline icon="ep:link" class="ml-1 open-icon" />
                </h3>
                
                <div class="app-tags">
                  <el-tag size="small" :type="row.proxyStatus == 1 ? 'success' : 'info'" effect="light">
                    {{ row.proxyStatus == 1 ? "运行中" : "已停止" }}
                  </el-tag>
                  <el-tag size="small" type="primary" class="ml-2">{{ row.proxyProtocol }}</el-tag>
                  <el-tag size="small" effect="plain" class="ml-2">{{ row.proxyHost }}:{{ row.proxyPort }}</el-tag>
                </div>
                
                <div class="app-desc">
                  {{ row.proxyDesc || "暂无描述" }}
                </div>
                
                <div class="app-footer">
                  <div class="app-actions">
                    <el-button size="small" type="primary" @click="doSetting(row)" class="action-btn">
                      <IconifyIconOnline icon="ep:setting"  />
                    </el-button>
                    
                    <el-button size="small" type="info" @click="doLog(row)" class="action-btn">
                      <IconifyIconOnline icon="ep:document"  />
                    </el-button>
                    
                    <el-button size="small" type="warning" @click="doTail(row)" class="action-btn">
                      <IconifyIconOnline icon="ep:monitor"  />
                    </el-button>
                    
                    <el-button v-if="row.proxyStatus != 1" size="small" @click="doEdit(row)" class="action-btn">
                      <IconifyIconOnline icon="ep:edit"  />
                    </el-button>
                    
                    <el-popconfirm v-if="row.proxyStatus != 1" :title="$t('message.confimDelete')" confirm-button-type="danger" cancel-button-type="info" @confirm="doDelete(row)">
                      <template #reference>
                        <el-button size="small" type="danger" class="action-btn">
                          <IconifyIconOnline icon="ep:delete"  />
                        </el-button>
                      </template>
                    </el-popconfirm>
                    
                    <el-button
                      size="small"
                      :type="row.proxyStatus != 1 ? 'success' : 'danger'"
                      class="action-btn"
                      @click="row.proxyStatus != 1 ? doStart(row) : doStop(row)"
                    >
                      <IconifyIconOnline :icon="row.proxyStatus != 1 ? 'ep:video-play' : 'ep:video-pause'"  />
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- 使用empty插槽自定义无数据展示 -->
        <template #empty>
          <div class="proxy-empty">
            <IconifyIconOnline icon="ep:connection" class="empty-icon" />
            <p>暂无代理服务</p>
            <el-button type="primary" @click="doSave">
              <IconifyIconOnline icon="ep:plus"  />
              添加代理
            </el-button>
          </div>
        </template>
      </ScTable>

      <save-dialog ref="saveDialog" @success="afterPropertiesSet" />
      <ProxyLog ref="proxyLogRef" />
      <LogDialog ref="proxyTailRef" />
      <setting-dialog ref="settingDialog" />
    </div>
  </div>
</template>

<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchProxyDelete, fetchProxyPage, fetchProxyStart, fetchProxyStop } from "@/api/monitor/proxy";
import { defineAsyncComponent, ref, reactive, nextTick, onMounted } from "vue";
import { ElMessage } from "element-plus";
import SettingDialog from "./setting.vue";
import LogDialog from "./log.vue";
import ProxyLog from "./log/index.vue";
import SaveDialog from "./save.vue";

// 状态定义
const socket = ref(null);
const data = ref([]);
const total = ref(0);
const loading = ref(false);
const tailDialogVisible = ref(false);
const tailDialogStatus = ref(false);
const logDialogVisible = ref(false);
const logDialogStatus = ref(false);
const saveDialogStatus = ref(false);
const settingDialogStatus = ref(false);
const infoDialogStatus = ref(false);
const deleteStatus = ref(false);
const startDialogStatus = ref(false);
const tableRef = ref(null);
const saveDialog = ref(null);
const proxyLogRef = ref(null);
const proxyTailRef = ref(null);
const settingDialog = ref(null);

// 表单参数
const form = reactive({
  pageSize: 20,
  page: 1
});

// 获取代理图标
const getProxyIcon = (protocol) => {
  switch (protocol) {
    case "websockify":
      return "ep:connection";
    case "http-proxy":
      return "ep:link";
    case "tcp-proxy":
      return "ep:data-line";
    default:
      return "ep:connection";
  }
};

// 处理数据加载
const handleDataLoaded = (loadedData, totalCount) => {
  data.value = loadedData;
  total.value = totalCount;
};

// 打开URL
const doOpenUrl = (row) => {
  window.open(`http://${row.proxyHost}:${row.proxyPort}`);
};

// 刷新数据
const afterPropertiesSet = () => {
  tableRef.value?.reload(form);
};

// 打开应用
const doOpenApps = (item) => {
  infoDialogStatus.value = true;
  nextTick(() => {
    saveDialog.value.open("view").setData(item);
  });
};

// 新增代理
const doSave = () => {
  saveDialogStatus.value = true;
  nextTick(() => {
    saveDialog.value.setData({}).open("add");
  });
};

// 编辑代理
const doEdit = (item) => {
  saveDialogStatus.value = true;
  nextTick(() => {
    saveDialog.value.setData(item).open("edit");
  });
};

// 设置代理
const doSetting = (item) => {
  settingDialogStatus.value = true;
  nextTick(() => {
    settingDialog.value.setData(item).open("edit");
  });
};

// 查看日志
const doLog = (item) => {
  logDialogVisible.value = true;
  setTimeout(() => {
    nextTick(() => {
      proxyLogRef.value.setData(item).open("edit");
    });
  }, 200);
};

// 查看实时日志
const doTail = (item) => {
  tailDialogVisible.value = true;
  setTimeout(() => {
    nextTick(() => {
      proxyTailRef.value.setData(item).open("edit");
    });
  }, 200);
};

// 启动代理
const doStart = (row) => {
  startDialogStatus.value = true;
  fetchProxyStart({ id: row.proxyId })
    .then(res => {
      if (res.code != "00000") {
        ElMessage.error(res.msg);
        row.proxyStatus = 1;
        return;
      }
      ElMessage.success("代理服务启动成功");
      afterPropertiesSet();
    })
    .finally(() => (startDialogStatus.value = false));
};

// 停止代理
const doStop = (row) => {
  startDialogStatus.value = true;
  fetchProxyStop({ id: row.proxyId })
    .then(res => {
      if (res.code != "00000") {
        ElMessage.error(res.msg);
        row.proxyStatus = 0;
        return;
      }
      ElMessage.success("代理服务已停止");
      afterPropertiesSet();
    })
    .finally(() => (startDialogStatus.value = false));
};

// 删除代理
const doDelete = (row) => {
  deleteStatus.value = true;
  fetchProxyDelete({ id: row.proxyId })
    .then(res => {
      if (res.code != "00000") {
        ElMessage.error(res.msg);
        return;
      }
      ElMessage.success("代理服务已删除");
      afterPropertiesSet();
    })
    .finally(() => (deleteStatus.value = false));
};

// 初始化
onMounted(() => {
  setTimeout(() => {
    saveDialogStatus.value = true;
    logDialogStatus.value = true;
    infoDialogStatus.value = true;
    tailDialogStatus.value = true;
    settingDialogStatus.value = true;
  }, 50);
});
</script>

<style lang="scss" scoped>
.proxy-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  padding: 20px;
}

.toolbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.current-category {
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

.add-proxy-btn {
  display: flex;
  align-items: center;
  border-radius: 8px;
}

.proxy-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

.proxy-card {
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

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
  
  .media-content {
    display: flex;
    height: 100%;
    padding: 16px;
  }
  
  .app-logo {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    margin-right: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--el-fill-color-light);
    font-size: 32px;
    color: var(--el-color-primary);
  }
  
  .app-content {
    flex: 1;
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
    cursor: pointer;
    display: flex;
    align-items: center;
    
    .open-icon {
      opacity: 0.5;
      transition: opacity 0.3s;
    }
    
    &:hover .open-icon {
      opacity: 1;
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
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
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
      
      .action-btn {
        transition: all 0.3s;
        border-radius: 6px;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
      }
    }
  }
}

.proxy-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 80px;
  color: var(--el-color-info-light-5);
  margin-bottom: 20px;
}

.proxy-empty p {
  font-size: 16px;
  margin-bottom: 20px;
}
</style>
