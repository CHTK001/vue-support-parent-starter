<template>
  <div class="list-layout-container animate__animated animate__fadeIn">
    <el-row>
      <el-col :span="24">
        <el-table :data="data" :border="false" stripe class="modern-table animate__animated animate__fadeInUp"
          :row-class-name="tableRowClassName">
          <!-- 序号列 -->
          <el-table-column type="index" label="序号" width="80" align="center" fixed="left" />

          <!-- 文件名列 -->
          <el-table-column prop="filename" label="文件名" min-width="200" show-overflow-tooltip fixed="left">
            <template #default="{ row }">
              <div :class="['file-item', row.directory ? 'folder-item' : '']" @click="doDetail(row)">
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
                <span>{{ row.fileSize || '-' }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 文件类型列 -->
          <el-table-column prop="suffix" label="文件类型" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.directory ? 'primary' : 'info'" size="small" effect="light">
                {{ row.suffix || '文件夹' }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 最后修改时间列 -->
          <el-table-column label="最后修改时间" width="180" align="center">
            <template #default="{ row }">
              <div class="time-cell" v-if="row.userMetadata.lastModified">
                <IconifyIconOnline icon="ep:calendar" class="time-icon" />
                <span>{{ dateFormat(row.userMetadata.lastModified * 1) }}</span>
              </div>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <div class="action-cell">
                <el-tooltip v-if="canPreview && !row.directory" content="预览" placement="top">
                  <el-button link type="primary" @click="$emit('preview', row.absolutePath, row)">
                    <IconifyIconOnline icon="ep:view" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="canDownload && !row.directory" content="下载" placement="top">
                  <el-button link type="primary" @click="$emit('download', row.absolutePath, row)">
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
  name: 'ListLayout',

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
      return row.directory ? 'folder-row' : 'file-row';
    }
  }
};
</script>

<style scoped lang="scss">
@import 'animate.css';

.list-layout-container {
  padding: 16px;

  :deep(.modern-table) {
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    .el-table__header-wrapper {
      th {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    .folder-row {
      background-color: rgba(var(--el-color-primary-rgb), 0.02);

      &:hover {
        background-color: rgba(var(--el-color-primary-rgb), 0.05) !important;
      }
    }
  }
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;

  &.folder-item {
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .file-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 20px;
      height: 20px;
      object-fit: contain;
    }
  }

  .file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.path-cell,
.size-cell,
.time-cell {
  display: flex;
  align-items: center;
  gap: 4px;

  .path-icon,
  .size-icon,
  .time-icon {
    font-size: 16px;
    color: var(--el-text-color-secondary);
  }
}

.action-cell {
  display: flex;
  justify-content: center;
  gap: 8px;

  .el-button {
    padding: 4px 8px;

    &:hover {
      transform: translateY(-2px);
    }
  }
}

// 动画过渡效果
.el-table {
  .el-table__body tr {
    transition: all 0.3s ease;

    &:hover>td {
      transition: background-color 0.3s ease;
    }
  }
}
</style>
