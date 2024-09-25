<template>
  <el-row>
    <el-col :span="24">
      <el-table :data="data" border>
        <el-table-column label="序号" type="index" width="120" align="center" />
        <el-table-column prop="filename" label="文件名" show-overflow-tooltip>
          <template #default="{ row }">
            <div :class="row.directory == true ? 'folder' : ''" @click="doDetail(row)">
              <img :src="getIcon(row.suffix)" class="icon" />
              <span class="text">{{ row.filename }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="suffix" label="文件路径" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.absolutePath }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fileSize" label="文件大小" />
        <el-table-column prop="suffix" label="文件类型" width="140px" />
        <el-table-column prop="suffix" label="最后一次修改时间">
          <template #default="{ row }">
            <span v-if="row.userMetadata.lastModified">
              {{ dateFormat(row.userMetadata.lastModified * 1) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-col>
  </el-row>
</template>
<script>
import { getAssetsImages } from "@/utils/Utils";
import { dateFormat } from "@/utils/date";
import { normalizePath } from "@/utils/objects";
export default {
  props: {
    data: {
      type: Array,
      default: () => {
        return [];
      }
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
      if (row.directory != true) {
        return;
      }
      this.$emit("search", row.absolutePath);
    },
    getIcon(name) {
      return getAssetsImages(!name ? "folder" : name);
    }
  }
};
</script>
<style scoped lang="less">
.icon {
  width: 20px;
  height: 20px;
  margin-right: 5px;
  position: relative;
  top: 4px;
}
.text {
  color: blue;
  line-height: 14px;
  font-size: 14px;
}
.folder {
  cursor: pointer;
}
</style>
