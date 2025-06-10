<template>
  <div class="list-layout-container animate__animated animate__fadeIn">
    <el-row>
      <el-col :span="24">
        <el-table
          :data="data"
          :border="false"
          stripe
          class="modern-table animate__animated animate__fadeInUp"
          :row-class-name="tableRowClassName"
          :header-cell-style="{
            background: 'var(--el-color-primary-light-9)',
            color: 'var(--el-color-primary)',
            fontWeight: '600',
            fontSize: '14px',
            height: '50px'
          }"
          @row-click="handleRowClick"
        >
          <!-- 序号列 -->
          <el-table-column type="index" label="序号" width="80" align="center" fixed="left" />

          <!-- 文件名列 -->
          <el-table-column prop="filename" label="文件名" min-width="200" show-overflow-tooltip fixed="left">
            <template #default="{ row }">
              <div :class="['file-item', row.directory ? 'folder-item' : '']">
                <el-tooltip :content="row.directory ? '文件夹' : '文件'" placement="top">
                  <div class="file-icon">
                    <img :src="getIcon(row.suffix)" :alt="row.filename" />
                  </div>
                </el-tooltip>
                <span class="file-name">{{ row.filename }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 文件路径列 -->
          <el-table-column prop="absolutePath" label="文件路径" min-width="300" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tooltip :content="row.absolutePath" placement="top">
                <div class="path-cell">
                  <IconifyIconOnline icon="ep:folder" class="path-icon" />
                  <span>{{ row.absolutePath }}</span>
                </div>
              </el-tooltip>
            </template>
          </el-table-column>

          <!-- 文件大小列 -->
          <el-table-column prop="fileSize" label="文件大小" width="120" align="right">
            <template #default="{ row }">
              <div class="size-cell">
                <IconifyIconOnline icon="ep:data-line" class="size-icon" />
                <span>{{ row.fileSize || "-" }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 文件类型列 -->
          <el-table-column prop="suffix" label="文件类型" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getTagType(row)" size="small" effect="light" class="file-type-tag">
                {{ row.suffix || "文件夹" }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 最后修改时间列 -->
          <el-table-column label="最后修改时间" width="180" align="center">
            <template #default="{ row }">
              <div v-if="row.userMetadata.lastModified" class="time-cell">
                <IconifyIconOnline icon="ep:calendar" class="time-icon" />
                <span>{{ dateFormat(row.userMetadata.lastModified * 1) }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column label="操作" width="140" align="center" fixed="right">
            <template #default="{ row }">
              <div class="action-cell">
                <el-tooltip v-if="canPreview && !row.directory" content="预览" placement="top">
                  <el-button circle size="small" type="primary" @click.stop="$emit('preview', row.absolutePath, row)">
                    <IconifyIconOnline icon="ep:view" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="canPreview && !row.directory" content="复制链接" placement="top">
                  <el-button circle size="small" type="info" @click.stop="$emit('copy', row.absolutePath, row)">
                    <IconifyIconOnline icon="ep:copy-document" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="canDownload && !row.directory" content="下载" placement="top">
                  <el-button circle size="small" type="success" @click.stop="$emit('download', row.absolutePath, row)">
                    <IconifyIconOnline icon="ep:download" />
                  </el-button>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getAssetsImages, normalizePath } from "@repo/config";
import { dateFormat } from "@repo/utils";

export default {
  name: "ListLayout",

  props: {
    data: {
      type: Array,
      default: () => []
    },
    parentPath: {
      type: String,
      default: ""
    },
    canPreview: {
      type: Boolean,
      default: false
    },
    canDownload: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    dateFormat,

    getPath(path) {
      return normalizePath(path);
    },

    doDetail(row) {
      if (row.directory !== true) {
        return;
      }
      this.$emit("search", row.absolutePath);
    },

    getIcon(name) {
      return getAssetsImages(!name ? "folder" : name);
    },

    tableRowClassName({ row }) {
      return row.directory ? "folder-row" : "file-row";
    },

    handleRowClick(row) {
      if (row.directory) {
        this.doDetail(row);
      } else if (this.canPreview) {
        this.$emit("preview", row.absolutePath, row);
      }
    },

    getTagType(row) {
      if (row.directory) return "primary";

      // 根据文件类型返回不同的标签类型
      const fileTypeMap = {
        pdf: "danger",
        doc: "danger",
        docx: "danger",
        xls: "success",
        xlsx: "success",
        ppt: "warning",
        pptx: "warning",
        jpg: "info",
        jpeg: "info",
        png: "info",
        gif: "info",
        mp4: "warning",
        mp3: "warning",
        zip: "info",
        rar: "info"
      };

      return fileTypeMap[row.suffix] || "info";
    }
  }
};
</script>

<style scoped lang="scss">
@import "animate.css";

.list-layout-container {
  padding: 0;

  :deep(.modern-table) {
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    overflow: hidden;

    .el-table__inner-wrapper {
      border-radius: 12px;
    }

    .el-table__row {
      cursor: pointer;
      transition: all 0.25s ease;

      &:hover {
        background-color: var(--el-color-primary-light-9) !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      td {
        padding: 12px 0;
        transition: all 0.25s ease;
      }
    }

    .folder-row {
      background-color: rgba(var(--el-color-primary-rgb), 0.03);

      &:hover {
        background-color: rgba(var(--el-color-primary-rgb), 0.08) !important;
      }
    }
  }
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  transition: all 0.3s;

  &.folder-item {
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
      transform: translateX(4px);
    }
  }

  .file-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--el-color-primary-light-9);
    border-radius: 8px;
    padding: 4px;
    transition: all 0.3s;

    img {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }

    &:hover {
      transform: scale(1.1);
      background-color: var(--el-color-primary-light-7);
    }
  }

  .file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }
}

.path-cell,
.size-cell,
.time-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .path-icon,
  .size-icon,
  .time-icon {
    font-size: 18px;
    color: var(--el-color-primary);
    transition: all 0.3s;
  }
}

.file-type-tag {
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.05);
  }
}

.action-cell {
  display: flex;
  justify-content: center;
  gap: 8px;

  .el-button {
    padding: 6px;
    transition: all 0.3s;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}

// 动画过渡效果
.el-table {
  .el-table__body tr {
    transition: all 0.3s ease;

    &:hover > td {
      transition: background-color 0.3s ease;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .file-item {
    gap: 8px;

    .file-icon {
      width: 28px;
      height: 28px;

      img {
        width: 20px;
        height: 20px;
      }
    }
  }

  .action-cell {
    gap: 4px;

    .el-button {
      padding: 4px;
    }
  }
}
</style>
