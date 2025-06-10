<template>
  <div>
    <ScDialog v-model="visible" top="10px" draggable width="80%" :destroy-on-close="true" :close-on-click-modal="false" @closed="$emit('closed')">
      <template #header>
        <div class="dialog-header">
          <IconifyIconOnline icon="ep:setting" class="mr-2" />
          <span>代理插件管理</span>
        </div>
      </template>
      
      <!-- 加载骨架屏 -->
      <el-skeleton :loading="loading" animated :count="6">
        <div class="plugin-container">
          <!-- 插件分类标签 -->
          <div class="plugin-tabs">
            <el-tabs type="border-card">
              <el-tab-pane label="全部插件">
                <div class="toolbar-container">
                  <div class="toolbar-left">
                    <div class="plugin-search">
                      <el-input v-model="searchKeyword" placeholder="搜索插件" clearable>
                        <template #prefix>
                          <IconifyIconOnline icon="ep:search" />
                        </template>
                      </el-input>
                    </div>
                  </div>
                </div>

                <!-- 插件卡片列表 -->
                <ScTable 
                  :data="filteredPlugins" 
                  layout="card" 
                  :loading="loading" 
                  :col-size="4" 
                  empty-text="暂无匹配插件"
                >
                  <template #default="{ row }">
                    <div class="app-wrapper" :class="{ 'app-wrapper-installed': isInstall(row) }">
                      <div class="media-content">
                        <div class="app-logo">
                          <IconifyIconOnline :icon="row.icon || 'ep:setting'" />
                        </div>
                        
                        <div class="app-content">
                          <h3 class="app-title">{{ row.proxyPluginName }}</h3>
                          <div class="app-tags">
                            <el-tag size="small" effect="plain">{{ row.proxyProtocol }}</el-tag>
                            <el-tag size="small" :type="row.type === 'filter' ? 'primary' : 'success'" class="ml-2">
                              {{ row.type === "filter" ? "过滤器" : "配置" }}
                            </el-tag>
                          </div>
                          
                          <div class="app-desc">
                            {{ row.proxyPluginDesc || `${row.proxyPluginName}插件` }}
                          </div>
                          
                          <div class="app-footer">
                            <div class="app-actions">
                              <el-button
                                v-if="row.type === 'filter'"
                                :type="isInstall(row) ? 'danger' : 'success'"
                                size="small"
                                class="action-btn"
                                :loading="startDialogStatus && currentPlugin === row"
                                @click="doInstallOrUninstall(row)"
                              >
                                <IconifyIconOnline :icon="installOrUninstall(row)"  />
                                {{ isInstall(row) ? '卸载' : '安装' }}
                              </el-button>

                              <el-button v-if="(isInstall(row) || row.type === 'config') && row.components" type="primary" size="small" class="action-btn" @click="doOpen(row)">
                                <IconifyIconOnline icon="ep:setting"  />配置
                              </el-button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 安装状态指示器 -->
                      <div v-if="isInstall(row)" class="plugin-status">
                        <IconifyIconOnline icon="ep:check" class="status-icon" />
                        <span>已安装</span>
                      </div>
                    </div>
                  </template>
                </ScTable>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </el-skeleton>
    </ScDialog>

    <!-- 插件设置组件 -->
    <ProxySetting ref="proxySettingRef" @closed="doClose" />
  </div>
</template>

<script setup>
import { fetchProxyPluginDelete, fetchProxyPluginList, fetchProxyPluginSave } from "@/api/monitor/proxy";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import ScTable from "@repo/components/ScTable/index.vue";
import { ElMessage } from "element-plus";
import { computed, defineAsyncComponent, defineEmits, nextTick, onMounted, ref } from "vue";
import ProxySetting from "./proxySetting.vue";

const emit = defineEmits(["success", "closed"]);

// 控制状态
const startDialogStatus = ref(false);
const openDialogStatus = ref(false);
const visible = ref(false);
const loading = ref(true);
const mode = ref("add");

// 当前操作的插件
const currentPlugin = ref(null);

// 搜索关键词
const searchKeyword = ref("");

// 表单数据
const form = ref({});

// 插件列表
const installPluginList = ref([]);
const filterPluginList = ref([]);

// 组件引用
const proxySettingRef = ref(null);

// 预定义插件列表
const pluginList = [
  {
    proxyPluginName: "代理设置",
    proxyPluginSpi: "path-limit",
    proxyProtocol: "http-proxy",
    components: defineAsyncComponent(() => import("./setting/index.vue")),
    type: "config",
    icon: "ep:setting"
  },
  {
    proxyPluginName: "代理设置",
    proxyPluginSpi: "path-limit",
    proxyProtocol: "websockify",
    components: defineAsyncComponent(() => import("./setting/index.vue")),
    type: "config",
    icon: "ep:setting"
  },
  {
    proxyPluginName: "代理设置",
    proxyPluginSpi: "path-limit",
    proxyProtocol: "tcp-proxy",
    components: defineAsyncComponent(() => import("./setting/index.vue")),
    type: "config",
    icon: "ep:setting"
  },
  {
    proxyPluginName: "Http代理",
    proxyPluginSpi: "http-proxy",
    proxyProtocol: "http-proxy",
    type: "filter",
    icon: "ep:link"
  },
  {
    proxyPluginName: "WebSockify代理",
    proxyPluginSpi: "empty",
    proxyProtocol: "websockify",
    type: "filter",
    icon: "ep:connection"
  },
  {
    proxyPluginName: "Tcp代理",
    proxyPluginSpi: "tcp-proxy",
    proxyProtocol: "tcp-proxy",
    type: "filter",
    icon: "ep:data-line"
  },
  {
    proxyPluginName: "websocket代理",
    proxyPluginSpi: "websocket-proxy",
    proxyProtocol: "http-proxy",
    type: "filter",
    icon: "ep:data-analysis"
  },
  {
    proxyPluginName: "白名单",
    proxyPluginSpi: "white",
    proxyProtocol: "http-proxy",
    components: defineAsyncComponent(() => import("./list/index.vue")),
    type: "filter",
    icon: "ep:check"
  },
  {
    proxyPluginName: "黑名单",
    proxyPluginSpi: "black",
    components: defineAsyncComponent(() => import("./list/index.vue")),
    proxyProtocol: "http-proxy",
    type: "filter",
    icon: "ep:close"
  },
  {
    proxyPluginName: "IP限流",
    proxyPluginSpi: "ip-limit",
    components: defineAsyncComponent(() => import("./limit/index.vue")),
    proxyProtocol: "http-proxy",
    type: "filter",
    icon: "ep:data-line"
  },
  {
    proxyPluginName: "路径限流",
    proxyPluginSpi: "path-limit",
    components: defineAsyncComponent(() => import("./limit/index.vue")),
    proxyProtocol: "http-proxy",
    type: "filter",
    icon: "ep:share"
  }
];

// 过滤后的插件列表
const filteredPlugins = computed(() => {
  if (!searchKeyword.value) return getPluginList();
  return getPluginList().filter(
    plugin => plugin.proxyPluginName.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

// 安装/卸载图标
const installOrUninstall = (item) => {
  return isInstall(item) ? "ep:delete" : "ep:download";
};

// 检查插件是否已安装
const isInstall = (item) => {
  const _isInstall =  installPluginList.value.some(
    it => it.proxyPluginSpi === item.proxyPluginSpi 
  );
  return _isInstall;
};

// 获取插件列表
const getPluginList = () => {
  return filterPluginList.value.filter(
    item => item.proxyProtocol === form.value.proxyProtocol
  );
};

// 设置数据
const setData = (formData) => {
  Object.assign(form.value, formData);
  afterPropertiesSet();
  return {
    open
  };
};

// 打开对话框
const open = () => {
  visible.value = true;
  return { close };
};

// 关闭对话框
const close = () => {
  visible.value = false;
  return { open };
};

// 打开插件配置
const doOpen = (item) => {
  openDialogStatus.value = true;
  currentPlugin.value = item;
  
  nextTick(() => {
    setTimeout(() => {
      if (proxySettingRef.value) {
        proxySettingRef.value.setComponent(item.components);
        proxySettingRef.value.setPluginId(item.proxyPluginId);
        proxySettingRef.value.setPlugin(item);
        proxySettingRef.value.setData({
          ...form.value,
          pluginId: item.proxyPluginId,
          proxyPluginSpi: item.proxyPluginSpi
        }).open();
      }
    }, 300);
  });
};

// 关闭插件配置
const doClose = () => {
  openDialogStatus.value = false;
};

// 安装或卸载插件
const doInstallOrUninstall = async (item) => {
  startDialogStatus.value = true;
  currentPlugin.value = item;
  
  try {
    if (!isInstall(item)) {
      // 安装插件
      const res = await fetchProxyPluginSave({
        proxyId: form.value.proxyId,
        proxyPluginName: item.proxyPluginName,
        proxyPluginSpi: item.proxyPluginSpi,
        proxyProtocol: item.proxyProtocol
      });
      
      if (res.code === "00000") {
        ElMessage.success("插件安装成功");
        afterPropertiesSet();
      } else {
        ElMessage.error(res.msg || "安装失败");
      }
    } else {
      // 卸载插件
      const existing = installPluginList.value.find(
        it => it.proxyPluginSpi === item.proxyPluginSpi && it.proxyProtocol === item.proxyProtocol
      );
      
      if (existing) {
        const res = await fetchProxyPluginDelete({ id: existing.proxyPluginId });
        
        if (res.code === "00000") {
          ElMessage.success("插件卸载成功");
          afterPropertiesSet();
        } else {
          ElMessage.error(res.msg || "卸载失败");
        }
      }
    }
  } catch (error) {
    console.error("操作失败:", error);
    ElMessage.error("操作失败，请稍后重试");
  } finally {
    startDialogStatus.value = false;
    currentPlugin.value = null;
  }
};

// 初始化
const afterPropertiesSet = async () => {
  loading.value = true;
  
  try {
    if (form.value.proxyId) {
      const res = await fetchProxyPluginList({ proxyId: form.value.proxyId });
      if (res.code === "00000") {
        installPluginList.value = res.data || [];
        mergeList();
      } else {
        ElMessage.error(res.msg || "获取插件列表失败");
      }
    } else {
      installPluginList.value = [];
      mergeList();
    }
  } catch (error) {
    console.error("获取数据失败:", error);
    ElMessage.error("获取数据失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

// 合并插件列表
const mergeList = () => {
  filterPluginList.value = pluginList.map(item => {
    const installed = installPluginList.value.find(
      it => it.proxyPluginSpi === item.proxyPluginSpi && it.proxyProtocol === item.proxyProtocol
    );
    
    return installed ? { ...item, ...installed } : item;
  });
};

// 导出方法
defineExpose({
  open,
  close,
  setData
});

// 组件挂载
onMounted(() => {
  afterPropertiesSet();
});
</script>

<style lang="scss" scoped>
.dialog-header {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
}

.plugin-container {
  height: 100%;
  
  .plugin-tabs {
    height: 100%;
    
    :deep(.el-tabs__content) {
      padding: 20px;
    }
  }
}

.toolbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .plugin-search {
      width: 300px;
    }
  }
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
  
  &.app-wrapper-installed {
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
    
    .app-actions {
      display: flex;
      gap: 8px;
      
      .action-btn {
        transition: all 0.3s;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
      }
    }
  }
  
  .plugin-status {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 10px;
    background-color: var(--el-color-success-light-9);
    color: var(--el-color-success);
    border-radius: 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    
    .status-icon {
      font-size: 14px;
    }
  }
}
</style>
