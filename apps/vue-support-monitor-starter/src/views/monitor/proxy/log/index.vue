<template>
  <div>
    <el-dialog v-model="visible" :title="title" width="80%" class="log-dialog " top="10px" destroy-on-close
      @close="close">
      <!-- 顶部工具栏 -->
      <div class="log-toolbar">
        <div class="left-panel">
          <el-date-picker v-model="value" type="datetimerange" range-separator="-" start-placeholder="开始时间"
            end-placeholder="结束时间" value-format="x" class="date-picker" />
          <el-input v-model="searchText" placeholder="搜索日志内容" clearable class="search-input">
            <template #prefix>
              <IconifyIconOnline icon="ep:search" />
            </template>
          </el-input>
        </div>
        <div class="right-panel">
          <el-button type="danger" @click="deleteDialog" class="action-btn">
            <IconifyIconOnline icon="ep:delete" />
            清除日志
          </el-button>
          <el-button type="primary" @click="search" class="action-btn">
            <IconifyIconOnline icon="ep:search" />
            查询
          </el-button>
        </div>
      </div>

      <!-- 日志列表 -->
      <ScTable ref="table" :url="fetchProxyLogPage" row-key="id" :params="searchParams" layout="list" stripe
        class="log-table max-h-[60vh]" @selection-change="selectionChange">
        <!-- 列表项模板 -->
        <template #default="{ row }">
          <div class="log-item" :class="getLogTypeClass(row)">
            <div class="log-item-header">
              <div class="log-item-title">
                <span class="log-app-name">{{ row.proxyName }}</span>
                <el-tag :type="getType(row.monitorProxyLogType)" effect="light" class="log-type-tag">
                  {{ row.monitorProxyLogType || 'unknown' }}
                </el-tag>
                <el-tag type="info" effect="plain" class="log-time">
                  {{ dateFormat(row.monitorProxyLogDate * 1000, 'yyyy-MM-dd') }}
                </el-tag>
              </div>
              <div class="log-actions">
                <el-tooltip content="查看详情" placement="top">
                  <el-button type="primary" link @click="viewLogDetail(row)">
                    <IconifyIconOnline icon="ep:view" />
                  </el-button>
                </el-tooltip>
              </div>
            </div>

            <div class="log-item-content">
              <div class="log-url">
                <span class="log-label">访问地址:</span>
                <span class="log-value truncate w-[200px]" :title="row.monitorProxyLogUrl">{{ row.monitorProxyLogUrl
                  }}</span>
              </div>

              <div class="log-client flex">
                <span class="log-label">客户端:</span>
                <span class="log-value flex clickable" @click="doCharts(row.monitorProxyLogAddress)">
                  <IconifyIconOnline icon="ep:data-analysis" class="chart-icon" />
                  <span>{{ row.monitorProxyLogAddress }}</span>
                  <span v-if="row.monitorProxyLogAddressGeo" class="log-geo">
                    ({{ row.monitorProxyLogAddressGeo }})
                  </span>
                </span>
              </div>

              <div class="log-stats">
                <span class="log-label">统计:</span>
                <div class="log-tags">
                  <el-tag type="success" size="small">允许: {{ row.allowCount || 0 }}</el-tag>
                  <el-tag type="danger" size="small">拒绝: {{ row.denyCount || 0 }}</el-tag>
                  <el-tag type="warning" size="small">警告: {{ row.warnCount || 0 }}</el-tag>
                </div>
              </div>

              <div v-if="row.monitorProxyLogMsg" class="log-message">
                <span class="log-label">失败原因:</span>
                <span class="log-value">{{ row.monitorProxyLogMsg }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <template #empty>
          <div class="log-empty">
            <IconifyIconOnline icon="ep:document" class="empty-icon" />
            <p>暂无日志记录</p>
          </div>
        </template>
      </ScTable>

      <!-- 清除日志对话框 -->
      <el-dialog v-model="deleteStatus" width="500px" title="清除日志" draggable class="delete-dialog" destroy-on-close>
        <div class="delete-content">
          <IconifyIconOnline icon="ep:warning" class="warning-icon" />
          <p class="delete-tip">请选择要清除的日志时间范围</p>
          <el-select v-model="deleteMonth" class="delete-select">
            <el-option :value="0" label="全部" />
            <el-option :value="1" label="近1月">近1月</el-option>
            <el-option :value="2" label="近2月">近2月</el-option>
            <el-option :value="3" label="近3月">近3月</el-option>
            <el-option :value="6" label="近6月">近6月</el-option>
            <el-option :value="12" label="近1年">近1年</el-option>
          </el-select>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="deleteStatus = false">取 消</el-button>
            <el-button type="primary" @click="cleanLog">确 定</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 日志详情对话框 -->
      <el-dialog v-model="detailVisible" title="日志详情" width="60%" class="detail-dialog" destroy-on-close>
        <div v-if="currentLog" class="log-detail">
          <div v-for="(value, key) in formatLogDetail(currentLog)" :key="key" class="detail-item">
            <span class="detail-label">{{ formatLabel(key) }}:</span>
            <span class="detail-value">{{ value }}</span>
          </div>
        </div>
      </el-dialog>

      <!-- 地址统计图表 -->
      <address-charts v-if="AddressChartsVisible" ref="addressChartsRef" />
    </el-dialog>
  </div>
</template>

<script>
import { fetchProxyLogPage, fetchProxyLogDelete } from "@/api/monitor/proxy";
import AddressCharts from "./addressCharts.vue";
import { dateFormat } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

export default {
  name: "ProxyLogList",
  components: {
    AddressCharts
  },
  data() {
    return {
      visible: false,
      title: "",
      AddressChartsVisible: false,
      detailVisible: false,
      currentLog: null,
      searchText: "",
      statusFilters: [
        { text: "启用", value: 0 },
        { text: "禁用", value: 1 }
      ],
      form: {
        mapMethod: []
      },
      searchQuery: {},
      rules: {
        proxyId: [{ required: true, message: "请选择代理", trigger: "blur" }],
        limitUrl: [{ required: true, message: "请输入限流地址", trigger: "blur" }],
        limitPermitsPerSecond: [{ required: true, message: "请输入每秒访问次数", trigger: "blur" }]
      },
      deleteMonth: 3,
      mode: "add",
      isSaveing: false,
      apps: [],
      tableData: [],
      tableDataCopy: [],
      searchParams: {},
      data: [
        {
          title: "环境",
          key: "limitProfile",
          multiple: !1,
          options: []
        }
      ],
      row: {
        limitDisable: 1
      },
      applications: [],
      value: [],
      selection: [],
      deleteStatus: false
    };
  },
  mounted() {
    this.data[0].options = this.profiles;
  },
  methods: {
    fetchProxyLogPage,
    useRenderIcon,
    dateFormat,

    /**
     * 设置代理数据
     * @param {Object} row - 代理数据行
     * @returns {Object} - 当前实例，用于链式调用
     */
    setData(row) {
      this.title = row.proxyName + " 日志记录";
      this.searchParams.monitorProxyLogServerId = row.proxyId;
      return this;
    },

    /**
     * 打开对话框
     */
    open() {
      this.visible = true;
    },

    /**
     * 关闭对话框
     */
    close() {
      this.visible = false;
      this.searchText = "";
      this.value = [];
    },

    /**
     * 获取时间戳
     * @param {Number} i - 索引
     * @returns {Number} - 时间戳
     */
    getTime(i) {
      if (!this.value || !this.value[i]) return undefined;

      try {
        return this.value[i].getTime();
      } catch (error) {
        return this.value[i]?.$d?.getTime();
      }
    },

    /**
     * 打开地址统计图表
     * @param {String} address - IP地址
     */
    doCharts(address) {
      this.AddressChartsVisible = true;
      this.$nextTick(() => {
        this.$refs.addressChartsRef.setData(address).open();
      });
    },

    /**
     * 获取日志类型对应的样式类
     * @param {Object} row - 日志数据行
     * @returns {String} - CSS类名
     */
    getLogTypeClass(row) {
      const type = row.monitorProxyLogType;
      if (type === "allow") return "log-allow";
      if (type === "deny") return "log-deny";
      return "log-warn";
    },

    /**
     * 获取日志类型对应的标签类型
     * @param {String} type - 日志类型
     * @returns {String} - Element Plus标签类型
     */
    getType(type) {
      if (type === "allow") return "success";
      if (type === "deny") return "danger";
      return "warning";
    },

    /**
     * 清除日志
     */
    cleanLog() {
      fetchProxyLogDelete({ limitMonth: this.deleteMonth }).then(res => {
        if (res.code === "00000") {
          this.$message.success("日志清除成功");
          this.deleteStatus = false;
          this.search();
          return;
        }
        this.$message.error(res.msg || "操作失败");
      });
    },

    /**
     * 表格选择回调
     * @param {Array} selection - 选中的行
     */
    selectionChange(selection) {
      this.selection = selection;
    },

    /**
     * 打开删除对话框
     */
    deleteDialog() {
      this.deleteStatus = true;
    },

    /**
     * 查询日志
     */
    search() {
      const params = { ...this.searchParams };

      if (this.value && this.value.length === 2) {
        params.startDate = this.value[0];
        params.endDate = this.value[1];
      }

      if (this.searchText) {
        params.keyword = this.searchText;
      }

      this.$refs.table.reload(params);
    },

    /**
     * 查看日志详情
     * @param {Object} row - 日志数据行
     */
    viewLogDetail(row) {
      this.currentLog = row;
      this.detailVisible = true;
    },

    /**
     * 格式化日志详情
     * @param {Object} log - 日志对象
     * @returns {Object} - 格式化后的日志对象
     */
    formatLogDetail(log) {
      const result = {};
      const skipFields = ['id']; // 跳过不需要显示的字段

      for (const key in log) {
        if (skipFields.includes(key)) continue;
        if (log[key] !== null && log[key] !== undefined) {
          result[key] = log[key];
        }
      }

      return result;
    },

    /**
     * 格式化标签名称
     * @param {String} key - 字段名
     * @returns {String} - 格式化后的标签名
     */
    formatLabel(key) {
      const labelMap = {
        proxyName: '应用名称',
        monitorProxyLogUrl: '访问地址',
        monitorProxyLogAddress: '客户端地址',
        monitorProxyLogAddressGeo: '地理位置',
        monitorProxyLogType: '日志类型',
        monitorProxyLogMsg: '失败原因',
        monitorProxyLogDate: '访问时间',
        allowCount: '允许次数',
        denyCount: '拒绝次数',
        warnCount: '警告次数'
      };

      return labelMap[key] || key;
    },

    /**
     * 删除单条日志
     * @param {Object} row - 日志数据行
     */
    table_del(row) {
      fetchProxyLogDelete({ id: row.limitId }).then(res => {
        if (res.code === "00000") {
          this.$message.success("操作成功");
          this.search();
          return;
        }
        this.$message.error(res.msg);
      });
    },

    /**
     * 批量删除日志
     */
    async batch_del() {
      this.$confirm(`确定删除选中的 ${this.selection.length} 项吗？`, "提示", {
        type: "warning"
      })
        .then(() => {
          const loading = this.$loading();
          const ids = [];
          for (const item of this.selection) {
            ids.push(item.limitId);
          }
          fetchProxyLogDelete({ id: ids.join(",") })
            .then(res => {
              if (res.code === "00000") {
                this.$message.success("操作成功");
                this.search();
                return;
              }
            })
            .finally(() => {
              loading.close();
            });
        })
        .catch(() => { });
    },

    changeRow(row) { },

    filterHandler(value, row, column) {
      const property = column["property"];
      return row[property] === value;
    },

    change(selected) {
      this.searchParams = selected;
      if (!selected.limitProfile) {
        delete selected.limitProfile;
      }
      this.$refs.table.reload(selected);
    }
  }
};
</script>

<style lang="scss" scoped>
.log-dialog {
  --el-dialog-padding-primary: 20px;

  :deep(.el-dialog__body) {
    padding: 0;
    height: calc(100% - 60px);
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__header) {
    margin-bottom: 0;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--el-border-color-light);
  }
}

.log-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color-page);
}

.left-panel {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;

  .date-picker {
    width: 380px;
  }

  .search-input {
    width: 250px;
  }
}

.right-panel {
  display: flex;
  gap: 10px;

  .action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.log-table {
  flex: 1;
  overflow: auto;

  :deep(.el-table__body) {
    width: 100% !important;
  }
}

.log-item {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-left: 4px solid var(--el-color-info);
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  }

  &.log-allow {
    border-left-color: var(--el-color-success);
  }

  &.log-deny {
    border-left-color: var(--el-color-danger);
  }

  &.log-warn {
    border-left-color: var(--el-color-warning);
  }
}

.log-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  width: 100%;
}

.log-item-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.log-app-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.log-type-tag {
  text-transform: capitalize;
}

.log-time {
  font-size: 12px;
}

.log-item-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  width: 100%;
}

.log-url,
.log-client,
.log-stats,
.log-message {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.log-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.log-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
  word-break: break-word;
  max-width: 100%;
}

.log-table {
  flex: 1;
  overflow: auto;

  :deep(.el-table__body) {
    width: 100% !important;
  }

  :deep(.el-table__row) {
    width: 100%;
  }

  :deep(.el-table__cell) {
    padding: 8px 0;
  }

  :deep(.el-table .cell) {
    width: 100%;
    padding: 0;
  }
}

.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--el-text-color-secondary);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 15px;
    color: var(--el-color-info-light-5);
  }
}

.delete-dialog {
  .delete-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
  }

  .warning-icon {
    font-size: 48px;
    color: var(--el-color-warning);
    margin-bottom: 15px;
  }

  .delete-tip {
    margin-bottom: 20px;
    font-size: 16px;
  }

  .delete-select {
    width: 100%;
  }
}

.detail-dialog {
  .log-detail {
    max-height: 60vh;
    overflow-y: auto;
    padding: 10px;
  }

  .detail-item {
    display: flex;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--el-border-color-lighter);
  }

  .detail-label {
    width: 120px;
    font-weight: bold;
    color: var(--el-text-color-regular);
  }

  .detail-value {
    flex: 1;
    word-break: break-all;
  }
}

/* 动画效果 */
.log-item {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .log-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .left-panel,
  .right-panel {
    width: 100%;
  }

  .date-picker,
  .search-input {
    width: 100% !important;
  }

  .log-item-content {
    grid-template-columns: 1fr;
  }
}
</style>
