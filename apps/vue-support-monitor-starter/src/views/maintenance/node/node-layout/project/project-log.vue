<template>
  <div class="project-log-container">
    <a-space direction="vertical" style="width: 100%" size="large">
      <!-- 顶部统计卡片 -->
      <div class="stats-row">
        <div class="stats-card log-files-card">
          <div class="stats-icon">
            <FileTextOutlined />
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ logBackList.length }}</div>
            <div class="stats-label">{{ $t("i18n_a17bc8d947") }}</div>
          </div>
        </div>

        <div v-if="project.logSize" class="stats-card log-size-card">
          <div class="stats-icon">
            <DatabaseOutlined />
          </div>
          <div class="stats-content">
            <div class="stats-value">{{ project.logSize }}</div>
            <div class="stats-label">{{ $t("i18n_3402926291") }}</div>
          </div>
        </div>
      </div>

      <!-- 信息卡片 -->
      <div class="log-info-card">
        <div class="log-info-header">
          <InfoCircleOutlined class="info-icon" />
          <span class="info-title">{{ $t("i18n_a17bc8d947") }}</span>
        </div>
        <div class="log-info-content">
          <code>jpom.project.log.auto-backup-to-file: false</code>
        </div>
      </div>

      <!-- 路径卡片 -->
      <div v-if="project.logPath" class="log-path-card">
        <div class="card-header">
          <div class="header-left">
            <FolderOutlined class="folder-icon" />
            <span class="path-title">{{ $t("i18n_32a19ce88b") }}</span>
          </div>
          <div v-if="project.logSize" class="header-right">
            <a-button type="primary" class="download-button" @click="handleDownload">
              <template #icon><DownloadOutlined /></template>
              {{ $t("i18n_55405ea6ff") }}
            </a-button>
          </div>
        </div>

        <div class="path-content">
          <div class="path-display">
            <a-tag color="#108ee9" class="path-segment">{{ project.logPath }}</a-tag>
          </div>
          <div v-if="project.logSize" class="size-display">
            <a-tag color="blue" class="size-tag">{{ project.logSize }}</a-tag>
          </div>
        </div>
      </div>

      <!-- 备份路径卡片 -->
      <div v-if="project.logBackPath" class="log-backup-path">
        <div class="card-header">
          <div class="header-left">
            <FolderOutlined class="folder-icon" />
            <span class="backup-path-title">{{ $t("i18n_c34175dbef") }}</span>
          </div>
        </div>
        <div class="path-content">
          <div class="path-display">
            <a-tag color="#722ed1" class="path-segment">{{ project.logBackPath }}</a-tag>
          </div>
        </div>
      </div>

      <!-- 表格标题 -->
      <div class="table-header">
        <div class="table-title">
          <UnorderedListOutlined />
          <span>{{ $t("i18n_f9f2bd30f6") }}</span>
        </div>
        <div class="table-actions">
          <a-button type="primary" @click="loadData">
            <template #icon><ReloadOutlined /></template>
            {{ $t("i18n_90b5a467c1") }}
          </a-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <a-table
        :data-source="logBackList"
        :loading="loading"
        :columns="columns"
        :pagination="false"
        bordered
        class="log-table"
        :scroll="{
          x: 'max-content'
        }"
      >
        <template #headerCell="{ column }">
          <span class="column-title">{{ column.title }}</span>
        </template>

        <template #bodyCell="{ column, text, record }">
          <template v-if="column.dataIndex === 'filename'">
            <a-tooltip placement="topLeft" :title="text">
              <div class="filename-cell">
                <FileTextOutlined class="file-icon" />
                <span class="filename-text">{{ text }}</span>
              </div>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'fileSizeLong'">
            <a-tooltip placement="topLeft" :title="`${text ? renderSize(text) : record.fileSize}`">
              <a-tag class="size-tag" color="blue">{{ text ? renderSize(text) : record.fileSize }}</a-tag>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'modifyTimeLong'">
            <a-tooltip :title="`${parseTime(record.modifyTimeLong)}`">
              <div class="time-cell">
                <ClockCircleOutlined class="clock-icon" />
                <span>{{ parseTime(record.modifyTimeLong) }}</span>
              </div>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'operation'">
            <div class="operation-buttons">
              <a-button type="primary" class="action-button download-btn" @click="handleDownloadLogback(record)">
                <template #icon><DownloadOutlined /></template>
                {{ $t("i18n_f26ef91424") }}
              </a-button>
              <a-popconfirm :title="$t('i18n_3a6bc88ce0')" :ok-text="$t('i18n_e83a256e4f')" :cancel-text="$t('i18n_625fb26b4b')" @confirm="handleDelete(record)">
                <a-button type="primary" danger class="action-button delete-btn">
                  <template #icon><DeleteOutlined /></template>
                  {{ $t("i18n_2f4aaddde3") }}
                </a-button>
              </a-popconfirm>
            </div>
          </template>
        </template>

        <template #emptyText>
          <div class="empty-container">
            <InboxOutlined class="empty-icon" />
            <p class="empty-text">{{ $t("i18n_f9f2bd30f6") }}</p>
            <a-button type="primary">{{ $t("i18n_90b5a467c1") }}</a-button>
          </div>
        </template>
      </a-table>
    </a-space>
  </div>
</template>
<script>
import { getLogBackList, deleteProjectLogBackFile, downloadProjectLogBackFile, getProjectLogSize, downloadProjectLogFile } from "@/api/node-project";
import { renderSize, parseTime } from "@/utils/const";
import {
  DownloadOutlined,
  DeleteOutlined,
  FolderOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  InboxOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  UnorderedListOutlined
} from "@ant-design/icons-vue";

export default {
  components: {
    DownloadOutlined,
    DeleteOutlined,
    FolderOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined,
    InboxOutlined,
    DatabaseOutlined,
    ReloadOutlined,
    UnorderedListOutlined
  },
  props: {
    nodeId: {
      type: String,
      default: ""
    },
    projectId: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      loading: true,
      project: {},
      logBackList: [],
      columns: [
        {
          title: this.$t("i18n_d2e2560089"),
          dataIndex: "filename",
          width: 150,
          ellipsis: true,
          sorter: (a, b) => a.filename.localeCompare(b.filename)
        },
        {
          title: this.$t("i18n_1303e638b5"),
          dataIndex: "modifyTimeLong",
          width: 150,
          ellipsis: true,
          defaultSortOrder: "descend",
          sorter: (a, b) => a.modifyTimeLong - b.modifyTimeLong
        },
        {
          title: this.$t("i18n_396b7d3f91"),
          dataIndex: "fileSizeLong",
          width: 100,
          ellipsis: true,
          sorter: (a, b) => a.fileSizeLong - b.fileSizeLong
        },
        {
          title: this.$t("i18n_2b6bc0f293"),
          dataIndex: "operation",
          align: "center",
          fixed: "right",
          width: "220px"
        }
      ]
    };
  },
  mounted() {
    this.loadFileSize();
    this.loadData();
  },
  methods: {
    renderSize,
    parseTime,
    // 加载日志文件大小
    loadFileSize() {
      const params = {
        nodeId: this.nodeId,
        id: this.projectId
      };
      getProjectLogSize(params).then(res => {
        if (res.code === 200) {
          this.project = { ...this.project, logSize: res.data.logSize };
        }
      });
    },
    loadData() {
      this.loading = true;
      const params = {
        nodeId: this.nodeId,
        id: this.projectId
      };
      getLogBackList(params).then(res => {
        if (res.code === 200) {
          this.logBackList = res.data.array || [];
          this.project = {
            ...this.project,
            logPath: res.data.logPath,
            logBackPath: res.data.logBackPath
          };
        }
        this.loading = false;
      });
    },
    // 下载日志文件
    handleDownload() {
      // 请求参数
      const params = {
        nodeId: this.nodeId,
        id: this.projectId
      };
      // 请求接口拿到 blob
      window.open(downloadProjectLogFile(params), "_blank");
    },
    // 下载日志备份文件
    handleDownloadLogback(record) {
      // 请求参数
      const params = {
        nodeId: this.nodeId,
        id: this.projectId,
        key: record.filename
      };
      // 请求接口拿到 blob
      window.open(downloadProjectLogBackFile(params), "_blank");
    },
    // 删除日志备份文件
    handleDelete(record) {
      deleteProjectLogBackFile({
        nodeId: this.nodeId,
        id: this.projectId,
        name: record.filename
      }).then(res => {
        if (res.code === 200) {
          $notification.success({
            message: res.msg
          });
          this.loadData();
        }
      });
    }
  }
};
</script>
<style lang="less" scoped>
.project-log-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
  border-radius: 8px;
}

// 顶部统计卡片
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .stats-card {
    flex: 1;
    min-width: 200px;
    background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid rgba(0, 0, 0, 0.06);

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .stats-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      font-size: 24px;

      .anticon {
        font-size: 24px;
      }
    }

    .stats-content {
      flex: 1;

      .stats-value {
        font-size: 24px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.85);
        margin-bottom: 4px;
      }

      .stats-label {
        color: rgba(0, 0, 0, 0.45);
        font-size: 14px;
      }
    }
  }

  .log-files-card {
    .stats-icon {
      background-color: rgba(24, 144, 255, 0.1);
      color: #1677ff;
    }
  }

  .log-size-card {
    .stats-icon {
      background-color: rgba(114, 46, 209, 0.1);
      color: #722ed1;
    }
  }
}

// 信息卡片通用样式
.log-info-card,
.log-path-card,
.log-backup-path {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(0, 0, 0, 0.06);

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    border-color: rgba(24, 144, 255, 0.3);
  }
}

// 信息卡片
.log-info-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .info-icon {
    color: #1677ff;
    font-size: 18px;
    margin-right: 10px;
  }

  .info-title {
    font-weight: 600;
    font-size: 16px;
    color: rgba(0, 0, 0, 0.85);
  }
}

.log-info-content {
  code {
    display: inline-block;
    padding: 10px 16px;
    background-color: #f5f5f5;
    border-radius: 8px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    font-size: 14px;
    color: #d56161;
    width: 100%;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.08);
  }
}

// 卡片头部
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .header-left {
    display: flex;
    align-items: center;

    .folder-icon {
      color: #fa8c16;
      font-size: 18px;
      margin-right: 10px;
    }

    .path-title,
    .backup-path-title {
      font-weight: 600;
      font-size: 16px;
      color: rgba(0, 0, 0, 0.85);
    }
  }

  .header-right {
    .download-button {
      border-radius: 6px;
      height: 32px;
      display: flex;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

// 路径内容
.path-content {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .path-display {
    .path-segment {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      padding: 6px 12px;
      font-size: 14px;
      border-radius: 6px;
    }
  }

  .size-display {
    .size-tag {
      padding: 4px 10px;
      font-weight: 500;
      border-radius: 6px;
    }
  }
}

// 表格标题
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .table-title {
    font-size: 18px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;

    .anticon {
      margin-right: 8px;
      color: #1677ff;
    }
  }
}

// 表格样式
.log-table {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  :deep(.ant-table) {
    border-radius: 12px;
  }

  :deep(.ant-table-thead > tr > th) {
    background-color: #f0f7ff;
    padding: 16px;
    font-weight: 600;

    &:first-child {
      border-top-left-radius: 12px;
    }

    &:last-child {
      border-top-right-radius: 12px;
    }

    .column-title {
      color: rgba(0, 0, 0, 0.85);
      font-size: 14px;
    }
  }

  :deep(.ant-table-tbody > tr) {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      background-color: #f0f7ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
      z-index: 2;
      position: relative;
    }

    td {
      padding: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    &:last-child td {
      border-bottom: none;

      &:first-child {
        border-bottom-left-radius: 12px;
      }

      &:last-child {
        border-bottom-right-radius: 12px;
      }
    }
  }
}

// 文件名单元格
.filename-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .file-icon {
    color: #1677ff;
    font-size: 16px;
  }

  .filename-text {
    color: rgba(0, 0, 0, 0.85);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.3s;

    &:hover {
      color: #1677ff;
    }
  }
}

// 时间单元格
.time-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .clock-icon {
    color: #fa8c16;
    font-size: 16px;
  }
}

// 操作按钮
.operation-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;

  .action-button {
    border-radius: 6px;
    padding: 0 16px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .download-btn {
    background-color: #1677ff;
    border-color: #1677ff;

    &:hover {
      background-color: #4096ff;
      border-color: #4096ff;
    }
  }

  .delete-btn {
    &:hover {
      background-color: #ff7875;
      border-color: #ff7875;
    }
  }
}

// 空状态
.empty-container {
  padding: 48px;
  text-align: center;

  .empty-icon {
    font-size: 64px;
    color: rgba(0, 0, 0, 0.15);
    margin-bottom: 16px;
    animation: float 3s ease-in-out infinite;
  }

  .empty-text {
    color: rgba(0, 0, 0, 0.45);
    font-size: 16px;
    margin: 16px 0 24px;
  }

  .ant-btn {
    border-radius: 6px;
    height: 36px;
    padding: 0 24px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
    }
  }
}

// 动画
@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* 响应式样式 */
@media (max-width: 768px) {
  .project-log-container {
    padding: 16px;
  }

  .stats-row {
    flex-direction: column;

    .stats-card {
      width: 100%;
    }
  }

  .operation-buttons {
    flex-direction: column;

    .action-button {
      width: 100%;
    }
  }

  .path-header,
  .log-size-info,
  .log-backup-path {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
