<template>
  <div class="limit-container">
    <!-- 页面头部 -->
    <div class="limit-header">
      <div class="header-title">
        <IconifyIconOnline icon="ep:data-line" class="header-icon" />
        <span>{{ plugin.proxyPluginSpi !== "ip-limit" ? "路径限流" : "IP限流" }}管理</span>
      </div>
      <div class="header-actions">
        <el-tooltip content="刷新数据" placement="top">
          <el-button type="primary" circle class="action-btn refresh-btn" @click="search">
            <IconifyIconOnline icon="ep:refresh" />
          </el-button>
        </el-tooltip>
        <el-button type="primary" class="action-btn add-btn" @click="doEdit({})">
          <IconifyIconOnline icon="ep:plus" />
          <span>新增限流规则</span>
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="limit-table-wrapper">
      <scTable ref="table" :url="fetchProxyLimitPage" :params="searchParams" row-key="id" stripe border
        highlight-current-row class="limit-table" @selection-change="selectionChange">
        <!-- 序号列 -->
        <el-table-column type="index" width="60" align="center" />

        <!-- 限流地址/IP列 -->
        <el-table-column :label="plugin.proxyPluginSpi !== 'ip-limit' ? '限流路径' : '限流IP地址'"
          prop="proxyConfigLimitPathOrIp" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="limit-path-cell">
              <IconifyIconOnline :icon="plugin.proxyPluginSpi !== 'ip-limit' ? 'ep:link' : 'ep:location'"
                class="cell-icon" />
              <span>{{ row.proxyConfigLimitPathOrIp }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 限流频率列 -->
        <el-table-column label="限流频率" prop="proxyConfigLimitPerSeconds" min-width="150" align="center">
          <template #default="{ row }">
            <el-tag type="info" effect="plain" class="limit-rate-tag">
              {{ row.proxyConfigLimitPerSeconds }} 次/秒
            </el-tag>
          </template>
        </el-table-column>

        <!-- QPS限流列，仅在PATH限流时显示 -->
        <el-table-column v-if="plugin.proxyPluginSpi !== 'ip-limit'" label="QPS限流" prop="proxyConfigLimitQps" min-width="150" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.proxyConfigLimitQps > 0" type="warning" effect="plain" class="limit-rate-tag">
              {{ row.proxyConfigLimitQps }} 查询/秒
            </el-tag>
            <el-tag v-else type="info" effect="plain" class="limit-rate-tag">
              不限制
            </el-tag>
          </template>
        </el-table-column>

        <!-- 状态列 -->
        <el-table-column label="是否禁用" prop="proxyConfigLimitDisabled" width="120" align="center" :filters="statusFilters"
          :filter-method="filterHandler">
          <template #default="{ row }">
            <div class="limit-status-cell">
              <el-switch v-model="row.proxyConfigLimitDisabled" :active-value="1" :inactive-value="0"
                @change="doUpdate(row)" />
              <span class="status-text" :class="row.proxyConfigLimitDisabled ? 'disabled' : 'enabled'">
                {{ row.proxyConfigLimitDisabled ? '已禁用' : '已启用' }}
              </span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" fixed="right" align="center" width="180">
          <template #default="scope">
            <div class="limit-actions">
              <el-tooltip content="编辑" placement="top">
                <el-button type="primary" link @click="doEdit(scope.row, scope.$index)">
                  <IconifyIconOnline icon="ep:edit" />
                </el-button>
              </el-tooltip>

              <el-divider direction="vertical" />

              <el-popconfirm :title="$t('message.confimDelete')" confirm-button-text="确定" cancel-button-text="取消"
                @confirm="doDelete(scope.row, scope.$index)">
                <template #reference>
                  <el-tooltip content="删除" placement="top">
                    <el-button type="danger" link>
                      <IconifyIconOnline icon="ep:delete" />
                    </el-button>
                  </el-tooltip>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </scTable>
    </div>

    <!-- 空状态 -->
    <div v-if="isEmpty" class="limit-empty">
      <IconifyIconOnline icon="ep:data-line" class="empty-icon" />
      <p class="empty-text">暂无限流规则，点击"新增限流规则"按钮添加</p>
      <el-button type="primary" @click="doEdit({})">新增限流规则</el-button>
    </div>

    <!-- 编辑对话框 -->
    <save-layout v-if="saveLayoutVisiable" ref="saveLayoutRef" @success="handleSaveSuccess" />
  </div>
</template>

<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchProxyLimitDelete, fetchProxyLimitPage, fetchProxyLimitUpdate } from "@/api/monitor/proxy";
import SaveLayout from "./save.vue";

export default {
  name: "ProxyLimitManager",
  components: {
    SaveLayout
  },
  props: {
    // 表单数据
    form: {
      type: Object,
      default: () => ({})
    },
    // 插件信息
    plugin: {
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
      // 控制编辑对话框显示
      saveLayoutVisiable: false,

      // 控制主页面显示
      visible: false,

      // 表格是否为空
      isEmpty: false,

      // 搜索参数
      searchParams: {
        proxyConfigLimitType: this.plugin.proxyPluginSpi !== "ip-limit" ? "PATH" : "IP",
        proxyId: this.form.proxyId,
        proxyPluginId: this.form.proxyPluginId
      },

      // 状态过滤选项
      statusFilters: [
        { text: "已启用", value: 0 },
        { text: "已禁用", value: 1 }
      ],

      // 限流类型
      limitType: {}
    };
  },
  mounted() {
    // 初始化加载数据
    this.$nextTick(() => {
      this.search();
    });
  },
  methods: {
    useRenderIcon,
    fetchProxyLimitPage,

    /**
     * 关闭页面
     */
    close() {
      this.visible = false;
      this.searchParams = {};
    },

    /**
     * 搜索数据
     */
    search() {
      if (!this.searchParams.configProfile) {
        delete this.searchParams.configProfile;
      }

      // 刷新表格数据
      this.$refs.table.reload(this.searchParams, (data) => {
        // 检查是否有数据
        this.isEmpty = !data || data.length === 0;
      });
    },

    /**
     * 打开编辑对话框
     * @param {Object} row - 行数据
     * @param {Number} index - 行索引
     */
    doEdit(row, index) {
      this.saveLayoutVisiable = true;

      this.$nextTick(() => {
        // 设置代理ID
        row.proxyId = this.form.proxyId;

        // 打开编辑对话框
        this.$refs.saveLayoutRef
          .setData(row, this.plugin.proxyPluginSpi !== "ip-limit" ? "PATH" : "IP")
          .open(row.proxyConfigLimitId ? "edit" : "add");
      });
    },

    /**
     * 更新限流规则状态
     * @param {Object} row - 行数据
     */
    doUpdate(row) {
      // 显示加载提示
      const loading = this.$loading({
        lock: true,
        text: '更新中...',
        spinner: 'el-icon-loading',
        background: 'rgba(255, 255, 255, 0.7)'
      });

      // 设置代理ID
      row.proxyId = this.form.proxyId;

      // 调用更新API
      fetchProxyLimitUpdate(row)
        .then(res => {
          if (res.code === "00000") {
            this.$message.success("状态更新成功");
            return;
          }
          this.$message.error(res.msg || "更新失败");
        })
        .catch(err => {
          console.error("更新限流规则失败:", err);
          this.$message.error("更新失败，请稍后重试");
        })
        .finally(() => {
          loading.close();
        });
    },

    /**
     * 删除限流规则
     * @param {Object} row - 行数据
     */
    async doDelete(row) {
      try {
        // 显示加载提示
        const loading = this.$loading({
          lock: true,
          text: '删除中...',
          spinner: 'el-icon-loading',
          background: 'rgba(255, 255, 255, 0.7)'
        });

        // 调用删除API
        const res = await fetchProxyLimitDelete({ proxyConfigLimitId: row.proxyConfigLimitId });

        if (res.code === "00000") {
          this.$message.success("删除成功");
          this.search();
        } else {
          this.$message.error(res.msg || "删除失败");
        }

        loading.close();
      } catch (error) {
        console.error("删除限流规则失败:", error);
        this.$message.error("删除失败，请稍后重试");
      }
    },

    /**
     * 表格选择变更
     * @param {Array} selection - 选中的行
     */
    selectionChange(selection) {
      this.selection = selection;
    },

    /**
     * 状态过滤方法
     * @param {Number} value - 过滤值
     * @param {Object} row - 行数据
     * @returns {Boolean} - 是否匹配
     */
    filterHandler(value, row) {
      return row.proxyConfigLimitDisabled === value;
    },

    /**
     * 保存成功处理
     */
    handleSaveSuccess() {
      this.search();
    }
  }
};
</script>

<style lang="scss" scoped>
.limit-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
  animation: fadeIn 0.5s ease-out;
}

.limit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-overlay);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .header-icon {
    font-size: 22px;
    color: var(--el-color-primary);
  }
}

.header-actions {
  display: flex;
  gap: 10px;

  .action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .refresh-btn {
    animation: spin 1s linear infinite paused;

    &:active {
      animation-play-state: running;
    }
  }

  .add-btn {
    animation: pulse 2s infinite;
  }
}

.limit-table-wrapper {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.limit-table {
  width: 100%;

  :deep(.el-table__row) {
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1;
    }
  }

  :deep(.el-table__empty-block) {
    display: none;
  }
}

.limit-path-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .cell-icon {
    color: var(--el-color-info);
  }
}

.limit-rate-tag {
  font-weight: 600;
  padding: 4px 8px;
}

.limit-status-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .status-text {
    font-size: 13px;

    &.enabled {
      color: var(--el-color-success);
    }

    &.disabled {
      color: var(--el-color-danger);
    }
  }
}

.limit-actions {
  display: flex;
  align-items: center;
  justify-content: center;

  .el-button {
    margin: 0 5px;
  }
}

.limit-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  animation: fadeIn 0.5s ease-out;

  .empty-icon {
    font-size: 64px;
    color: var(--el-color-info-light-5);
  }

  .empty-text {
    color: var(--el-text-color-secondary);
    font-size: 16px;
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
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
