<template>
  <div>
    <el-row class="h-full">
      <div v-for="row in data" :key="row" :offset="0" :span="4" style="height: 250px; width: 13.5%; border-radius: 10px" class="item relative h-full m-[5px] shadow-lg rounded-md">
        <el-card class="h-full" shadow="never" :title="dateFormat(row.userMetadata.lastModified * 1)" @click="doDetail(row)">
          <div class="h-full relative">
            <!-- <el-tag
              v-if="row.suffix"
              :title="sizeFormat(row.fileSize)"
              class="absolute top-0 right-0 z-[99] truncate width-50 overflow-hidden text-ellipsis text-slate-500 text-sm font-medium dark:text-slate-400"
            >
              {{ row.fileSize == 0 ? "0KB" : sizeFormat(row.fileSize) }}
            </el-tag> -->
            <el-tag class="h-full absolute top-0 right-0 z-[99] truncate" :title="row.filename">
              <strong v-if="row.userMetadata.lastModified" class="text-slate-900 truncate text-sm font-medium dark:text-slate-200">{{ row.filename }}</strong>
            </el-tag>
            <div class="h-full m-0 p-0 relative z-[10]">
              <img v-if="!row.suffix" class="absolute z-10 top-2 p-0 m-0 w-[150px] h-[150px]" :src="getIcon(row.suffix)" style="left: calc(50% - 75px)" />
              <img v-else-if="row.mediaType.image" class="absolute z-10 p-0 m-0 w-full h-full" :src="getImageUrl(row)" />
              <!-- <iframe v-else class="absolute z-10 p-0 left-0 m-0 w-full h-full" :src="getUrl(row)" /> -->
              <img v-else class="absolute z-10 top-2 p-0 m-0 w-[150px] h-[150px]" :src="getIcon(row.suffix)" style="left: calc(50% - 75px)" />

              <div
                v-if="!row.directory"
                class="flex justify-between pt-[4px] absolute bottom-0 h-[26px] min-w-[80px] right-0 z-[100] w-1/3"
                style="background-color: #3c3c3cad; backdrop-filter: blur(10px); border-top-left-radius: 10px"
              >
                <div v-if="canPreview" title="复制地址" class="cursor-pointer" @click.prevent="doCopy(row)">
                  <el-icon color="#fff" :size="18">
                    <component :is="useRenderIcon('ri:file-copy-2-line')" />
                  </el-icon>
                </div>
                <div v-if="canPreview" title="预览" class="cursor-pointer" @click.prevent="doOpen(row)">
                  <el-icon color="#fff" :size="18">
                    <component :is="useRenderIcon('ri:folder-open-line')" />
                  </el-icon>
                </div>
                <div v-if="canDownload" title="下载" class="cursor-pointer" @click.prevent="doDownload(row)">
                  <el-icon color="#fff" :size="18">
                    <component :is="useRenderIcon('ri:download-2-fill')" />
                  </el-icon>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-row>
  </div>
</template>
<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { getAssetsImages } from "@repo/config";
import { dateFormat } from "@repo/utils";
import { sizeFormat, normalizePath } from "@repo/config";
export default {
  props: {
    data: {
      type: Array,
      default: () => {
        return [];
      }
    },
    menu: {
      type: Array,
      default: () => {
        return [];
      }
    },
    form: {
      type: Object,
      default: () => {
        return {};
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
    useRenderIcon,
    sizeFormat,
    dateFormat,
    normalizePath,
    getPath(path) {
      return this.normalizePath(path);
    },
    doCopy(row) {
      event.stopPropagation();
      event.preventDefault();
      if (row.directory === true) {
        return;
      }
      if (this.canPreview) {
        this.$emit("copy", row.absolutePath, row);
      }
    },
    doDownload(row) {
      event.stopPropagation();
      event.preventDefault();
      if (row.directory === true) {
        return;
      }
      if (this.canDownload) {
        this.$emit("download", row.absolutePath, row);
      }
    },
    getImageUrl(row) {
      let url = this.form.fileStorageProtocolName === "HTTP" ? "http://" : "https://";
      url += this.form.fileStorageProtocolHost + ":" + this.form.fileStorageProtocolPort;
      url += "/" + normalizePath(this.menu.fileStorageBucket + "/" + row.absolutePath);
      url += "?preview";
      if (row.suffix == "avif" || row.suffix == "heic" || row.suffix == "nef") {
        url += "/format/jpeg";
      }
      return url;
    },
    doOpen(row) {
      event.stopPropagation();
      event.preventDefault();
      if (row.mediaType.image) {
        window.open(this.getImageUrl(row));
        return;
      }
      window.open(this.getUrl(row));
    },
    getUrl(row) {
      let url = this.form.fileStorageProtocolName === "HTTP" ? "http://" : "https://";
      url += this.form.fileStorageProtocolHost + ":" + this.form.fileStorageProtocolPort;
      url += "/" + normalizePath(this.menu.fileStorageBucket + "/" + row.absolutePath);
      url += "?preview";
      if (row.suffix === "csv") {
        url += "/can/deny";
      } else {
        url += "/can/html";
      }
      if (row.suffix == "vsdx" || row.suffix == "vsd") {
        url += "/format/jpeg";
      } else if (row.suffix == "doc" || row.suffix == "docx") {
        url += "/format/pdf";
      }
      return url;
    },
    doDetail(row) {
      if (row.directory !== true) {
        if (this.canPreview) {
          this.$emit("preview", row.absolutePath, row);
        }
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
<style scoped lang="scss">
:deep(.el-card__body) {
  padding: 0px !important;
  height: 100% !important;
}
:deep(.el-card) {
  padding: 0px !important;
  border: 0px;
  border-radius: 10px !important;
}

.icon {
  width: 20px;
  height: 20px;
  margin-right: 5px;
  position: relative;
  top: 4px;
}

.title {
  cursor: default;
}

.text {
  color: blue;
  line-height: 16px;
  font-size: 16px;
}

.width-50 {
  width: 50px;
}
.width-100 {
  width: 100px;
}
.folder {
  cursor: pointer;
}
.item {
  cursor: pointer;
}
</style>
