<template>
  <div class="proxy-setting-container">
    <!-- 页面标题 -->
    <div class="setting-header">
      <div class="current-category">
        <h2 class="category-title"><IconifyIconOnline icon="ep:setting" class="mr-2" />代理服务配置</h2>
        <p class="category-desc">管理代理服务的各项配置，包括服务发现、负载均衡和实时日志</p>
      </div>
    </div>

    <!-- 配置卡片区域 -->
    <div class="setting-cards">
      <el-row :gutter="24">
        <el-col v-for="(config, index) in configs" :key="config.proxyConfigName" :xs="24" :sm="12" :md="8">
          <div class="app-wrapper" :class="{ 'app-wrapper-active': activeCard === index }" @click="activeCard = index">
            <div class="media-content">
              <div class="app-logo">
                <IconifyIconOnline :icon="getConfigIcon(config.proxyConfigName)" />
              </div>
              
              <div class="app-content">
                <h3 class="app-title">{{ config.desc }}</h3>
                
                <!-- 服务发现配置 -->
                <template v-if="config.proxyConfigName === 'serviceDiscovery'" title="服务停止之后才可以切换!!">
                  <el-select v-if="form.proxyStatus != 1" v-model="config.proxyConfigValue" :placeholder="'请选择' + config.desc" class="config-select">
                    <el-option v-for="item in serviceDiscoveryList" :key="item.name" :label="item.describe || item.name" :value="item.name">
                      <div class="option-content">
                        <IconifyIconOnline :icon="item.name === 'STATISTIC' ? 'ep:list' : 'ep:connection'"  />
                        <span>{{ item.describe || item.name }}</span>
                      </div>
                    </el-option>
                  </el-select>
                  <el-input v-else v-model="config.proxyConfigValue" readonly disabled class="config-input" />
                </template>

                <!-- 负载均衡配置 -->
                <template v-else-if="config.proxyConfigName === 'balance'">
                  <el-select v-model="config.proxyConfigValue" :placeholder="'请选择' + config.desc" class="config-select">
                    <el-option v-for="item in robinList" :key="item.name" :label="item.describe || item.name" :value="item.name">
                      <div class="option-content">
                        <IconifyIconOnline icon="ep:data-analysis"  />
                        <span>{{ item.describe || item.name }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </template>

                <!-- 实时日志配置 -->
                <template v-else-if="config.proxyConfigName === 'open-log'">
                  <div class="switch-container">
                    <el-switch v-model="config.proxyConfigValue" active-value="true" inactive-value="false" active-text="开启" inactive-text="关闭" class="config-switch" />
                    <span class="switch-status">
                      {{ config.proxyConfigValue === "true" ? "已开启实时日志" : "已关闭实时日志" }}
                    </span>
                  </div>
                </template>
                
                <!-- 操作按钮 -->
                <div class="app-footer">
                  <div class="app-actions">
                    <el-button type="primary" class="action-btn" @click.stop="saveConfigItem(config)">
                      <IconifyIconOnline icon="ep:check"  />
                    </el-button>

                    <el-button v-if="config.proxyConfigValue === 'STATISTIC'" type="info" class="action-btn" @click.stop="openServiceDiscovery()">
                      <IconifyIconOnline icon="ep:setting"  />
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>

  <!-- 静态代理配置组件 -->
  <div>
      <statistic-layout v-if="statisticLayoutVisible" ref="statisticLayoutRef" />
  </div>
</template>

<script setup>
import { fetchProxyConfigList, fetchProxyConfigUpdate, fetchProxyConfigSave } from "@/api/monitor/proxy";
import { fetchOptionGet, fetchOptionObjectsList } from "@/api/spi";
import { defineAsyncComponent, ref, reactive, onMounted, nextTick } from "vue";
import { ElMessage, ElLoading } from "element-plus";
import StatisticLayout from "../statistic/index.vue";
// 接收属性
const props = defineProps({
  // 代理表单数据
  form: {
    type: Object,
    default: () => ({}),
  },
  // 插件ID
  pluginId: {
    type: String,
    default: "",
  },
});

// 组件引用
const statisticLayoutRef = ref(null);

// 状态管理
const activeCard = ref(0);
const statisticLayoutVisible = ref(false);
const statisticLayoutVisible1 = ref(false);
const robinList = ref([]);
const serviceDiscoveryList = ref([]);

// 配置项列表
const configs = reactive([
  {
    proxyConfigName: "serviceDiscovery",
    desc: "服务发现策略",
    proxyConfigValue: "",
    proxyId: props.form.proxyId,
  },
  {
    proxyConfigName: "balance",
    desc: "负载均衡策略",
    proxyConfigValue: "",
    proxyId: props.form.proxyId,
  },
  {
    proxyConfigName: "open-log",
    desc: "实时日志记录",
    proxyConfigValue: "false",
    proxyId: props.form.proxyId,
  },
]);

/**
 * 根据配置类型获取对应图标
 * @param {String} configName - 配置名称
 * @returns {String} - 图标名称
 */
const getConfigIcon = (configName) => {
  const iconMap = {
    serviceDiscovery: "ep:discover",
    balance: "ep:data-line",
    "open-log": "ep:document",
  };

  return iconMap[configName] || "ep:setting";
};

/**
 * 加载代理配置
 */
const loadProxyConfig = () => {
  fetchProxyConfigList(props.form)
    .then((res) => {
      if (res.code === "00000") {
        // 遍历配置项，设置值和ID
        configs.forEach((it) => {
          const matchConfig = res.data.find((it1) => it1.proxyConfigName === it.proxyConfigName);
          if (matchConfig) {
            it.proxyConfigValue = matchConfig.proxyConfigValue;
            it.proxyConfigId = matchConfig.proxyConfigId;
            it.proxyPluginId = matchConfig.proxyPluginId;
          }
        });
      } else {
        ElMessage.error(res.msg || "加载配置失败");
      }
    })
    .catch((err) => {
      console.error("加载代理配置失败:", err);
      ElMessage.error("加载配置失败，请稍后重试");
    });
};

/**
 * 保存配置项
 * @param {Object} config - 配置项
 */
const saveConfigItem = (config) => {
  // 设置默认插件ID
  if (config.proxyPluginId == null) {
    config.proxyPluginId = "0";
  }

  // 显示加载提示
  const loading = ElLoading.service({
    lock: true,
    text: "保存中...",
    background: "rgba(255, 255, 255, 0.7)",
  });

  // 根据是否有ID决定是更新还是新增
  const request = config.proxyConfigId ? fetchProxyConfigUpdate(config) : fetchProxyConfigSave(config);

  request
    .then((res) => {
      if (res.code === "00000") {
        ElMessage.success("配置保存成功");
        // 更新配置ID
        if (!config.proxyConfigId && res.data) {
          config.proxyConfigId = res.data.proxyConfigId;
        }
      } else {
        ElMessage.error(res.msg || "保存失败");
      }
    })
    .catch((err) => {
      console.error("保存配置失败:", err);
      ElMessage.error("保存失败，请稍后重试");
    })
    .finally(() => {
      loading.close();
    });
};

/**
 * 打开静态代理配置
 */
const openServiceDiscovery = () => {
  statisticLayoutVisible.value = true;

  nextTick(() => {
    setTimeout(() => {
      statisticLayoutRef.value.setData(props.form).open();
    }, 300);
  });
};

// 生命周期钩子
onMounted(async () => {
  // 延迟加载静态代理组件
  setTimeout(() => {
    statisticLayoutVisible1.value = true;
  }, 100);

  // 加载服务发现列表
  serviceDiscoveryList.value = (await fetchOptionObjectsList({ type: "serviceDiscovery" }))?.data || [];
  serviceDiscoveryList.value.push({
    name: "STATISTIC",
    describe: "静态代理服务",
  });

  // 加载负载均衡策略列表
  robinList.value = (await fetchOptionGet({ type: "robin" }))?.data || [];

  // 加载当前代理配置
  loadProxyConfig();
});
</script>

<style lang="scss" scoped>
.proxy-setting-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: var(--el-bg-color);
}

.setting-header {
  margin-bottom: 24px;
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

.setting-cards {
  margin-bottom: 24px;
}

.app-wrapper {
  height: 240px;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
  margin-bottom: 20px;
  cursor: pointer;
  
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
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    
    &::before {
      height: 4px;
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
    margin-bottom: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .app-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: auto;
    
    .app-actions {
      display: flex;
      gap: 8px;
      width: 100%;
      justify-content: space-between;
      
      .action-btn {
        flex: 1;
        transition: all 0.3s;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
      }
    }
  }
}

.config-select,
.config-input {
  width: 100%;
  margin-bottom: 16px;
}

.option-content {
  display: flex;
  align-items: center;
}

.switch-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;

  .switch-status {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}
</style>
