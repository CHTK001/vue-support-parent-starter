<template>
  <div class="proxy-setting-container">
    <!-- 页面标题 -->
    <div class="setting-header">
      <IconifyIconOnline icon="ep:setting" class="header-icon" />
      <span class="header-title">代理服务配置</span>
    </div>

    <!-- 配置卡片区域 -->
    <div class="setting-cards">
      <el-card
        v-for="(config, index) in configs"
        :key="config.proxyConfigName"
        class="setting-card"
        :class="{ active: activeCard === index }"
        :style="{ animationDelay: `${index * 0.1}s` }"
        @click="activeCard = index"
      >
        <template #header>
          <div class="card-header">
            <IconifyIconOnline :icon="getConfigIcon(config.proxyConfigName)" class="config-icon" />
            <span class="config-title">{{ config.desc }}</span>
          </div>
        </template>

        <div class="card-content">
          <!-- 服务发现配置 -->
          <template v-if="config.proxyConfigName === 'serviceDiscovery'">
            <el-select v-if="form.proxyStatus != 1" v-model="config.proxyConfigValue" :placeholder="'请选择' + config.desc" class="config-select">
              <el-option v-for="item in serviceDiscoveryList" :key="item.name" :label="item.describe || item.name" :value="item.name">
                <div class="option-content">
                  <IconifyIconOnline :icon="item.name === 'STATISTIC' ? 'ep:list' : 'ep:connection'" class="option-icon" />
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
                  <IconifyIconOnline icon="ep:data-analysis" class="option-icon" />
                  <span>{{ item.describe || item.name }}</span>
                </div>
              </el-option>
            </el-select>
          </template>

          <!-- 实时日志配置 -->
          <template v-else-if="config.proxyConfigName === 'open-log'">
            <div class="switch-container">
              <el-switch
                v-model="config.proxyConfigValue"
                active-value="true"
                inactive-value="false"
                active-text="开启"
                inactive-text="关闭"
                :active-color="'var(--el-color-success)'"
                :inactive-color="'var(--el-color-danger)'"
                class="config-switch"
              />
              <span class="switch-status">
                {{ config.proxyConfigValue === "true" ? "已开启实时日志" : "已关闭实时日志" }}
              </span>
            </div>
          </template>

          <!-- 操作按钮 -->
          <div class="card-actions">
            <el-button type="primary" class="action-btn save-btn" @click.stop="saveConfigItem(config)">
              <IconifyIconOnline icon="ep:check" />
              <span>保存配置</span>
            </el-button>

            <el-button v-if="config.proxyConfigValue === 'STATISTIC'" type="info" class="action-btn setting-btn" @click.stop="openServiceDiscovery()">
              <IconifyIconOnline icon="ep:setting" />
              <span>静态代理配置</span>
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>

  <!-- 静态代理配置组件 -->
  <div>
    <Suspense v-if="statisticLayoutVisible1">
      <template #default>
        <div>
          <statistic-layout v-if="statisticLayoutVisible" ref="statisticLayoutRef" />
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script>
import { fetchProxyConfigList, fetchProxyConfigUpdate, fetchProxyConfigSave } from "@/api/monitor/proxy";
import { fetchOptionGet, fetchOptionObjectsList } from "@/api/spi";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent } from "vue";

export default {
  components: {
    StatisticLayout: defineAsyncComponent(() => import("../statistic/index.vue"))
  },
  props: {
    // 代理表单数据
    form: {
      type: Object,
      default: () => ({})
    },
    // 插件ID
    pluginId: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      // 当前激活的卡片索引
      activeCard: 0,

      // 静态代理配置组件控制
      statisticLayoutVisible: false,
      statisticLayoutVisible1: false,

      // 负载均衡策略列表
      robinList: [],

      // 服务发现列表
      serviceDiscoveryList: [],

      // 配置项列表
      configs: [
        {
          proxyConfigName: "serviceDiscovery",
          desc: "服务发现策略",
          proxyConfigValue: "",
          proxyId: this.form.proxyId
        },
        {
          proxyConfigName: "balance",
          desc: "负载均衡策略",
          proxyConfigValue: "",
          proxyId: this.form.proxyId
        },
        {
          proxyConfigName: "open-log",
          desc: "实时日志记录",
          proxyConfigValue: "false",
          proxyId: this.form.proxyId
        }
      ]
    };
  },
  async mounted() {
    // 延迟加载静态代理组件
    setTimeout(() => {
      this.statisticLayoutVisible1 = true;
    }, 100);

    // 加载服务发现列表
    this.serviceDiscoveryList = (await fetchOptionObjectsList({ type: "serviceDiscovery" }))?.data || [];
    this.serviceDiscoveryList.push({
      name: "STATISTIC",
      describe: "静态代理服务"
    });

    // 加载负载均衡策略列表
    this.robinList = (await fetchOptionGet({ type: "robin" }))?.data || [];

    // 加载当前代理配置
    this.loadProxyConfig();
  },
  methods: {
    useRenderIcon,

    /**
     * 根据配置类型获取对应图标
     * @param {String} configName - 配置名称
     * @returns {String} - 图标名称
     */
    getConfigIcon(configName) {
      const iconMap = {
        serviceDiscovery: "ep:discover",
        balance: "ep:data-line",
        "open-log": "ep:document"
      };

      return iconMap[configName] || "ep:setting";
    },

    /**
     * 加载代理配置
     */
    loadProxyConfig() {
      fetchProxyConfigList(this.form)
        .then(res => {
          if (res.code === "00000") {
            // 遍历配置项，设置值和ID
            this.configs.forEach(it => {
              const matchConfig = res.data.find(it1 => it1.proxyConfigName === it.proxyConfigName);
              if (matchConfig) {
                it.proxyConfigValue = matchConfig.proxyConfigValue;
                it.proxyConfigId = matchConfig.proxyConfigId;
                it.proxyPluginId = matchConfig.proxyPluginId;
              }
            });
          } else {
            this.$message.error(res.msg || "加载配置失败");
          }
        })
        .catch(err => {
          console.error("加载代理配置失败:", err);
          this.$message.error("加载配置失败，请稍后重试");
        });
    },

    /**
     * 保存配置项
     * @param {Object} config - 配置项
     */
    saveConfigItem(config) {
      // 设置默认插件ID
      if (config.proxyPluginId == null) {
        config.proxyPluginId = "0";
      }

      // 显示加载提示
      const loading = this.$loading({
        lock: true,
        text: "保存中...",
        spinner: "el-icon-loading",
        background: "rgba(255, 255, 255, 0.7)"
      });

      // 根据是否有ID决定是更新还是新增
      const request = config.proxyConfigId ? fetchProxyConfigUpdate(config) : fetchProxyConfigSave(config);

      request
        .then(res => {
          if (res.code === "00000") {
            this.$message.success("配置保存成功");
            // 更新配置ID
            if (!config.proxyConfigId && res.data) {
              config.proxyConfigId = res.data.proxyConfigId;
            }
          } else {
            this.$message.error(res.msg || "保存失败");
          }
        })
        .catch(err => {
          console.error("保存配置失败:", err);
          this.$message.error("保存失败，请稍后重试");
        })
        .finally(() => {
          loading.close();
        });
    },

    /**
     * 打开静态代理配置
     */
    openServiceDiscovery() {
      this.statisticLayoutVisible = true;

      this.$nextTick(() => {
        setTimeout(() => {
          this.$refs.statisticLayoutRef.setData(this.form).open();
        }, 300);
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.proxy-setting-container {
  padding: 20px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease-out;
}

.setting-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;

  .header-icon {
    font-size: 24px;
    color: var(--el-color-primary);
  }

  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.setting-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.setting-card {
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease-out both;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 1px var(--el-color-primary);
  }

  :deep(.el-card__header) {
    padding: 15px;
    background-color: var(--el-bg-color-overlay);
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;

  .config-icon {
    font-size: 20px;
    color: var(--el-color-primary);
  }

  .config-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.config-select,
.config-input {
  width: 100%;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;

  .option-icon {
    font-size: 16px;
    color: var(--el-color-primary);
  }
}

.switch-container {
  display: flex;
  align-items: center;
  gap: 10px;

  .switch-status {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;

  .action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 1;
    justify-content: center;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .save-btn {
    animation: pulse 2s infinite;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.4);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(var(--el-color-primary-rgb), 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
  }
}
</style>
