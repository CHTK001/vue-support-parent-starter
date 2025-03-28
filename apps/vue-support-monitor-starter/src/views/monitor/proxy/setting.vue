<template>
  <div>
    <el-dialog v-model="visible" top="10px" draggable width="80%" :destroy-on-close="true" :close-on-click-modal="false"
      title="插件管理" class="plugin-dialog" @closed="$emit('closed')">
      <!-- 加载骨架屏 -->
      <el-skeleton :loading="loadding" animated :count="6">
        <Suspense>
          <template #default>
            <div class="plugin-container">
              <!-- 插件分类标签 -->
              <div class="plugin-tabs">
                <el-tabs type="border-card">
                  <el-tab-pane label="全部插件">
                    <div class="plugin-search mb-4">
                      <el-input v-model="searchKeyword" placeholder="搜索插件" clearable
                        prefix-icon="IconifyIconOnline:ep:search" />
                    </div>

                    <!-- 插件卡片列表 -->
                    <transition-group name="plugin-list" tag="div" class="plugin-list">
                      <el-row :gutter="20">
                        <el-col v-for="(item, index) in filteredPlugins" :key="item.proxyPluginSpi + index" :xs="24"
                          :sm="12" :md="8" :lg="6" class="mb-4">
                          <el-card :body-style="{ padding: '0px' }" shadow="hover" class="plugin-card"
                            :class="{ 'plugin-installed': !isInstall(item) }">
                            <!-- 插件头部 -->
                            <div class="plugin-header">
                              <div class="plugin-icon">
                                <IconifyIconOnline :icon="item.icon" />
                              </div>
                              <div class="plugin-type">{{ item.type === 'filter' ? '过滤器' : '配置' }}</div>
                            </div>

                            <!-- 插件内容 -->
                            <div class="plugin-content">
                              <h3 class="plugin-name">{{ item.proxyPluginName }}</h3>
                              <div class="plugin-protocol">
                                <el-tag size="small" effect="plain">{{ item.proxyProtocol }}</el-tag>
                              </div>
                            </div>

                            <!-- 插件操作 -->
                            <div class="plugin-actions">
                              <el-tooltip :content="isInstall(item) ? '安装插件' : '卸载插件'" placement="top"
                                :show-after="300">
                                <el-button v-if="item.type === 'filter'" :type="isInstall(item) ? 'success' : 'danger'"
                                  :icon="installOrUninstall(item)" circle
                                  :loading="startDialogStatus && currentPlugin === item"
                                  @click="doInstallOrUninstall(item)" />
                              </el-tooltip>

                              <el-tooltip content="配置插件" placement="top" :show-after="300">
                                <el-button v-if="(!isInstall(item) || item.type === 'config') && item.components"
                                  type="primary" circle :icon="useRenderIcon('ep:setting')" @click="doOpen(item)" />
                              </el-tooltip>
                            </div>

                            <!-- 安装状态指示器 -->
                            <div v-if="!isInstall(item)" class="plugin-status">
                              <IconifyIconOnline icon="ep:check" />
                              <span>已安装</span>
                            </div>
                          </el-card>
                        </el-col>
                      </el-row>
                    </transition-group>

                    <!-- 空状态 -->
                    <el-empty v-if="filteredPlugins.length === 0" description="没有找到匹配的插件" />
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </template>
        </Suspense>
      </el-skeleton>
    </el-dialog>

    <!-- 插件设置组件 -->
    <ProxySetting v-if="openDialogStatus" ref="proxySettingRef" @closed="doClose" />
  </div>
</template>

<script>
import { fetchProxyPluginDelete, fetchProxyPluginList, fetchProxyPluginSave } from "@/api/monitor/proxy";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ProxySetting from "./proxySetting.vue";
import { defineAsyncComponent, ref } from "vue";

export default {
  components: { ProxySetting },
  emits: ["success", "closed"],
  data() {
    return {
      // 控制状态
      startDialogStatus: false,
      openDialogStatus: false,
      visible: false,
      loadding: true,
      mode: "add",

      // 当前操作的插件
      currentPlugin: null,

      // 搜索关键词
      searchKeyword: "",

      // 表单数据
      form: {},

      // 插件列表
      installPluginList: [],
      filterPluginList: [],

      // 预定义插件列表
      pluginList: [
        {
          proxyPluginName: "代理设置",
          proxyPluginSpi: "path-limit",
          proxyProtocol: "http-proxy",
          components: defineAsyncComponent(() => import("./setting/index.vue")),
          type: "config",
          icon: "ri:settings-4-line"
        },
        {
          proxyPluginName: "代理设置",
          proxyPluginSpi: "path-limit",
          proxyProtocol: "websockify",
          components: defineAsyncComponent(() => import("./setting/index.vue")),
          type: "config",
          icon: "ri:settings-4-line"
        },
        {
          proxyPluginName: "代理设置",
          proxyPluginSpi: "path-limit",
          proxyProtocol: "tcp-proxy",
          components: defineAsyncComponent(() => import("./setting/index.vue")),
          type: "config",
          icon: "ri:settings-4-line"
        },
        {
          proxyPluginName: "Http代理",
          proxyPluginSpi: "http-proxy",
          proxyProtocol: "http-proxy",
          type: "filter",
          icon: "ri:parking-box-line"
        },
        {
          proxyPluginName: "WebSockify代理",
          proxyPluginSpi: "empty",
          proxyProtocol: "websockify",
          type: "filter",
          icon: "ri:parking-box-line"
        },
        {
          proxyPluginName: "Tcp代理",
          proxyPluginSpi: "tcp-proxy",
          proxyProtocol: "tcp-proxy",
          type: "filter",
          icon: "simple-icons:trpc"
        },
        {
          proxyPluginName: "websocket代理",
          proxyPluginSpi: "websocket-proxy",
          proxyProtocol: "http-proxy",
          type: "filter",
          icon: "simple-icons:webstorm"
        },
        {
          proxyPluginName: "白名单",
          proxyPluginSpi: "white",
          proxyProtocol: "http-proxy",
          components: defineAsyncComponent(() => import("./list/index.vue")),
          type: "filter",
          icon: "simple-icons:whitesource"
        },
        {
          proxyPluginName: "黑名单",
          proxyPluginSpi: "black",
          components: defineAsyncComponent(() => import("./list/index.vue")),
          proxyProtocol: "http-proxy",
          type: "filter",
          icon: "ri:bubble-chart-line"
        },
        {
          proxyPluginName: "IP限流",
          proxyPluginSpi: "ip-limit",
          components: defineAsyncComponent(() => import("./limit/index.vue")),
          proxyProtocol: "http-proxy",
          type: "filter",
          icon: "ri:input-cursor-move"
        },
        {
          proxyPluginName: "路径限流",
          proxyPluginSpi: "path-limit",
          components: defineAsyncComponent(() => import("./limit/index.vue")),
          proxyProtocol: "http-proxy",
          type: "filter",
          icon: "ri:parentheses-line"
        }
      ]
    };
  },
  computed: {
    /**
     * 根据搜索关键词过滤插件列表
     */
    filteredPlugins() {
      if (!this.searchKeyword) {
        return this.filterPluginList;
      }

      return this.filterPluginList.filter(item =>
        item.proxyPluginName.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        item.proxyProtocol.toLowerCase().includes(this.searchKeyword.toLowerCase())
      );
    }
  },
  methods: {
    useRenderIcon,

    /**
     * 关闭插件设置对话框
     */
    doClose() {
      this.openDialogStatus = false;
    },

    /**
     * 打开插件设置对话框
     * @param {Object} item - 插件项
     */
    doOpen(item) {
      this.openDialogStatus = true;
      this.$nextTick(() => {
        this.$refs.proxySettingRef
          .setData(this.form)
          .setPlugin(item)
          .setComponent(item.components)
          .setPluginId(item.proxyPluginId)
          .open();
      });
    },

    /**
     * 检查插件是否已安装
     * @param {Object} item - 插件项
     * @returns {Boolean} - 是否未安装
     */
    isInstall(item) {
      return !item.proxyPluginId;
    },

    /**
     * 安装或卸载插件
     * @param {Object} item - 插件项
     */
    doInstallOrUninstall(item) {
      this.currentPlugin = item;
      if (item.type === "filter") {
        return this.doInstallOrUninstallFilter(item).then(res => {
          this.initialPlugin(this.form);
        });
      }
    },

    /**
     * 安装或卸载过滤器插件
     * @param {Object} item - 插件项
     * @returns {Promise} - 操作结果
     */
    doInstallOrUninstallFilter(item) {
      this.startDialogStatus = true;

      // 安装插件
      if (this.isInstall(item)) {
        return fetchProxyPluginSave({
          proxyId: this.form.proxyId,
          proxyPluginSpi: item.proxyPluginSpi,
          proxyPluginName: item.proxyPluginName
        })
          .then(res => {
            if (res.code == "00000") {
              this.$message.success("插件安装成功");
              return;
            }
            this.$message.error(res.msg);
          })
          .finally(() => {
            this.startDialogStatus = false;
            this.currentPlugin = null;
          });
      }

      // 卸载插件
      return fetchProxyPluginDelete({
        proxyPluginId: item.proxyPluginId
      })
        .then(res => {
          if (res.code == "00000") {
            this.$message.success("插件卸载成功");
            return;
          }
          this.$message.error(res.msg);
        })
        .finally(() => {
          this.startDialogStatus = false;
          this.currentPlugin = null;
        });
    },

    /**
     * 获取安装/卸载按钮图标
     * @param {Object} item - 插件项
     * @returns {Function} - 渲染图标函数
     */
    installOrUninstall(item) {
      return this.isInstall(item)
        ? this.useRenderIcon("ep:plus")
        : this.useRenderIcon("line-md:remove");
    },

    /**
     * 关闭对话框
     * @returns {Object} - 当前实例，用于链式调用
     */
    close() {
      this.visible = false;
      this.form = {};
      this.loading = true;
      this.searchKeyword = "";
      this.$emit("closed");
      return this;
    },

    /**
     * 初始化插件列表
     * @param {Object} data - 代理数据
     */
    async initialPlugin(data) {
      try {
        // 获取已安装的插件列表
        const res = await fetchProxyPluginList(this.form);
        if (res.code == "00000") {
          this.installPluginList = res.data;
        }

        // 根据代理协议过滤插件
        this.filterPluginList = this.pluginList.filter(it => {
          return it.proxyProtocol == data.proxyProtocol;
        });

        // 标记已安装的插件
        this.filterPluginList.map(it => {
          it.proxyPluginId = this.installPluginList.filter(
            it1 => it1.proxyPluginSpi == it.proxyPluginSpi && it1.proxyPluginName == it.proxyPluginName
          )?.[0]?.proxyPluginId;
        });

        // 重新排序插件列表，已安装的排在前面
        const installList = this.filterPluginList.filter(it => it.proxyPluginId);
        const unInstallList = this.filterPluginList.filter(it => !it.proxyPluginId);
        this.filterPluginList = [...installList, ...unInstallList];

        this.loadding = false;
      } catch (error) {
        console.error("初始化插件列表失败:", error);
        this.loadding = false;
      }
    },

    /**
     * 打开对话框
     * @param {String} mode - 模式，默认为add
     * @returns {Object} - 当前实例，用于链式调用
     */
    open(mode = "add") {
      this.mode = mode;
      this.visible = true;
      this.loadding = false;
      return this;
    },

    /**
     * 设置表单数据
     * @param {Object} data - 要设置的数据
     * @returns {Object} - 当前实例，用于链式调用
     */
    setData(data) {
      Object.assign(this.form, data);
      try {
        this.loadding = true;
        this.initialPlugin(data);
      } catch (error) {
        console.error("设置数据失败:", error);
        this.loadding = false;
      }
      return this;
    }
  }
};
</script>

<style lang="scss" scoped>
.plugin-dialog {
  --el-dialog-padding-primary: 20px;
  --el-dialog-bg-color: var(--el-bg-color);

  :deep(.el-dialog__header) {
    margin-bottom: 0;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.el-dialog__body) {
    padding-top: 20px;
  }
}

.plugin-container {
  min-height: 400px;
}

.plugin-tabs {
  :deep(.el-tabs__content) {
    padding: 15px;
  }
}

.plugin-search {
  max-width: 300px;
}

.plugin-list {
  margin-top: 20px;
}

.plugin-card {
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
  height: 100%;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }

  &.plugin-installed {
    border: 1px solid var(--el-color-success-light-5);
  }
}

.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
}

.plugin-icon {
  font-size: 24px;
  color: var(--el-color-primary);

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

.plugin-type {
  font-size: 12px;
  background-color: var(--el-color-info-light-9);
  color: var(--el-color-info-dark-2);
  padding: 2px 8px;
  border-radius: 12px;
}

.plugin-content {
  padding: 15px;
}

.plugin-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: var(--el-text-color-primary);
}

.plugin-protocol {
  margin-bottom: 10px;
}

.plugin-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 15px 15px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.plugin-status {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: var(--el-color-success);
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;

  :deep(svg) {
    width: 14px;
    height: 14px;
  }
}

/* 列表动画 */
.plugin-list-enter-active,
.plugin-list-leave-active {
  transition: all 0.5s ease;
}

.plugin-list-enter-from,
.plugin-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.plugin-list-move {
  transition: transform 0.5s ease;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .plugin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .plugin-type {
    align-self: flex-start;
  }
}
</style>
